import { useEffect, useRef, useState } from 'react';
import Wordmark from './components/Wordmark.jsx';
import EmptyState from './screens/EmptyState.jsx';
import Loading from './screens/Loading.jsx';
import Success from './screens/Success.jsx';
import ErrorState from './screens/ErrorState.jsx';
import Card from './screens/Card.jsx';
import ManualIntro from './screens/ManualIntro.jsx';
import ManualForm from './screens/ManualForm.jsx';
import Gallery from './screens/Gallery.jsx';
import { readPhotoData } from './lib/exif.js';
import { buildCard } from './lib/card.js';
import { toDisplayBlob } from './lib/heic.js';
import { saveEntry, getAllEntries, requestPersistence } from './lib/db.js';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';

// Preview hook: open with ?state=error|success|card to jump straight to a
// screen for design review, since these states are otherwise hard to reach.
const PREVIEW = (() => {
  try {
    const s = new URLSearchParams(window.location.search).get('state');
    return ['error', 'success', 'card', 'manual', 'form'].includes(s) ? s : null;
  } catch {
    return null;
  }
})();

// Sample data so ?state=card renders a full card without a real GPS photo.
const SAMPLE_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="520" height="340">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#4a6b78"/><stop offset="1" stop-color="#16242b"/>' +
      '</linearGradient></defs><rect width="520" height="340" fill="url(#g)"/></svg>',
  );
const SAMPLE_CARD = {
  place: 'Chicago, Illinois',
  capturedAt: new Date(2026, 6, 26, 16, 0),
  imageUrl: SAMPLE_IMG,
};

// Genuinely check whether the file can be read as an image. Returns false for
// non-images (PDFs, text, corrupt files); true for real photos. HEIC often
// can't be decoded by the browser but is still a valid photo we read metadata
// from, so we don't fail it.
async function isReadableImage(file) {
  const isHeic = /\.(heic|heif)$/i.test(file.name) || (file.type || '').includes('hei');
  if (file.type && !file.type.startsWith('image/') && !isHeic) return false;
  try {
    const bmp = await createImageBitmap(file);
    bmp.close?.();
    return true;
  } catch {
    return isHeic; // HEIC can't decode here but is still a real photo
  }
}

// The viewer's home country (for the smart place format, D14). Derived from the
// browser locale; null if unknown, in which case place-format falls back to
// "City, Country".
const HOME_COUNTRY = (() => {
  try {
    return new Intl.Locale(navigator.language).maximize().region || null;
  } catch {
    return null;
  }
})();

// Status phrases shown while loading. They cycle on their own slow loop and are
// intentionally NOT tied to the exact progress stage — just calm, changing text.
const PHRASES = [
  'reading your photo',
  'reading the date',
  'reading the time',
  'finding the weekday',
  'fetching place name',
  'almost there',
];

export default function App() {
  const [screen, setScreen] = useState(PREVIEW || null); // null until the diary loads
  const [entries, setEntries] = useState([]); // all saved moments (for the gallery)
  const [percent, setPercent] = useState(0);
  const [status, setStatus] = useState(PHRASES[0]);
  const [busy, setBusy] = useState(false);
  const [failPercent, setFailPercent] = useState(25);
  const [result, setResult] = useState(() => {
    if (PREVIEW === 'card') return SAMPLE_CARD;
    if (PREVIEW === 'manual' || PREVIEW === 'form') return { place: null, capturedAt: null, imageUrl: SAMPLE_IMG };
    return null;
  }); // { place, capturedAt, imageUrl, showTime }
  const runIdRef = useRef(0); // lets a newer upload cancel an in-flight one
  const pendingRef = useRef(null); // the current photo blob + coords, for saving

  // On load, open the gallery of saved moments (or the drop zone if empty).
  useEffect(() => {
    if (PREVIEW) return;
    getAllEntries()
      .then((all) => {
        setEntries(all);
        setScreen(all.length ? 'gallery' : 'empty');
      })
      .catch(() => setScreen('empty'));
  }, []);

  // Return to the gallery (reloading moments); the drop zone if the diary is empty.
  async function goHome() {
    runIdRef.current++; // cancel any in-flight run
    setBusy(false);
    setPercent(0);
    pendingRef.current = null;
    if (result?.imageUrl) URL.revokeObjectURL(result.imageUrl);
    setResult(null);
    const all = await getAllEntries().catch(() => []);
    setEntries(all);
    setScreen(all.length ? 'gallery' : 'empty');
  }

  // Persist the current photo + card facts (best-effort). photoBlob is what lets
  // the card come back on reload; lat/lon are kept for v2 albums.
  async function saveCurrent({ place, capturedAt, showTime, source }) {
    const p = pendingRef.current;
    if (!p) return;
    try {
      await saveEntry({
        id: crypto.randomUUID(),
        photoBlob: p.file,
        place: place ?? null,
        capturedAt: capturedAt ?? null,
        showTime: !!showTime,
        lat: p.lat ?? null,
        lon: p.lon ?? null,
        source,
        createdAt: new Date(),
      });
      requestPersistence();
    } catch {
      /* keep working even if saving fails */
    }
  }

  // Cycle the status phrases on a slow loop while busy (random, no repeats).
  useEffect(() => {
    if (!busy) return;
    let last = 0;
    setStatus(PHRASES[0]);
    const id = setInterval(() => {
      let next = last;
      while (next === last) next = Math.floor(Math.random() * PHRASES.length);
      last = next;
      setStatus(PHRASES[next]);
    }, 1200);
    return () => clearInterval(id);
  }, [busy]);

  async function handleFile(file) {
    if (!file) return;
    const runId = ++runIdRef.current;
    const live = () => runId === runIdRef.current;
    let at = 0; // remembers how far we got, for the error state
    const setPct = (v) => {
      at = v;
      if (live()) setPercent(v);
    };

    setScreen('loading');
    setPercent(0);
    setBusy(true); // starts the phrase loop

    try {
      // Start reading the file; the bar climbs through the "reading" beat while
      // we genuinely check whether it can be read as an image.
      const validPromise = isReadableImage(file);
      const readTarget = 30 + Math.floor(Math.random() * 16); // ~30–45%
      await tween(0, readTarget, 1100, setPct);
      if (!live()) return;

      // Detection point: if it isn't a readable image, stop the bar right here
      // and turn it red — no fixed number, wherever the bar reached.
      if (!(await validPromise)) throw new Error('unreadable');
      if (!live()) return;

      // EXIF is read from the original (works for HEIC too).
      const data = await readPhotoData(file);
      if (!live()) return;

      // Convert HEIC -> displayable JPEG on-device (no-op for other formats),
      // in parallel with the geocode wait. This blob is what we show AND store.
      const displayPromise = toDisplayBlob(file);

      // The geocode is the one genuine wait — ease toward 90 while it runs.
      const cardPromise = buildCard(data, { homeCountry: HOME_COUNTRY });
      await tween(readTarget, 90, 1300, setPct);
      const [card, displayBlob] = await Promise.all([cardPromise, displayPromise]);
      if (!live()) return;
      pendingRef.current = { file: displayBlob, lat: data.lat, lon: data.lon };

      await tween(90, 100, 400, setPct);
      if (!live()) return;
      setPercent(100);
      setBusy(false); // stops the phrase loop
      setResult({ place: card.place, capturedAt: data.capturedAt, imageUrl: URL.createObjectURL(displayBlob), showTime: true });
      setScreen('success');

      // Let the success beat breathe, then reveal the card — or, when the place
      // couldn't be detected, invite manual entry instead.
      await delay(1800);
      if (!live()) return;
      if (card.place) {
        // place detected → save and drop straight into the updated gallery
        await saveCurrent({ place: card.place, capturedAt: data.capturedAt, showTime: true, source: 'exif' });
        if (!live()) return;
        goHome();
      } else {
        setScreen('manual'); // no place → offer manual entry first
      }
    } catch {
      if (!live()) return;
      setBusy(false);
      setFailPercent(at); // the % the bar actually reached at detection
      setScreen('error');
    }
  }

  // Build the moment from manually-entered fields (all optional; only what was
  // entered is shown). Date & time come from custom pickers, so no guesswork.
  // Save, then drop into the updated gallery.
  async function submitManual({ place, date, time }) {
    let capturedAt = null;
    let showTime = false;
    if (date) {
      const [y, m, d] = date.split('-').map(Number);
      if (time) {
        const [hh, mm] = time.split(':').map(Number);
        capturedAt = new Date(y, m - 1, d, hh, mm);
        showTime = true;
      } else {
        capturedAt = new Date(y, m - 1, d);
      }
    }
    await saveCurrent({ place, capturedAt, showTime, source: 'manual' });
    goHome();
  }

  // "Skip" on the manual invitation → keep the photo (and any EXIF date), no place.
  async function skipManual() {
    await saveCurrent({
      place: null,
      capturedAt: result?.capturedAt ?? null,
      showTime: result?.showTime ?? false,
      source: 'exif',
    });
    goHome();
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-white">
      <Wordmark />
      {screen === 'gallery' ? (
        <Gallery entries={entries} onAddMoment={handleFile} />
      ) : (
        <div className="flex w-full flex-1 items-center justify-center py-10">
          {screen === 'empty' && <EmptyState onFile={handleFile} />}
        {screen === 'loading' && <Loading percent={percent} status={status} />}
        {screen === 'success' && <Success />}
        {screen === 'error' && <ErrorState percent={failPercent} onRetry={goHome} />}
        {/* the single hero card is now only used for the ?state=card preview
            (and, later, a detail view when tapping a grid moment) */}
        {screen === 'card' && result && (
          <Card
            place={result.place}
            capturedAt={result.capturedAt}
            imageUrl={result.imageUrl}
            showTime={result.showTime}
          />
        )}
        {screen === 'manual' && result && (
          <ManualIntro
            imageUrl={result.imageUrl}
            onAddDetails={() => setScreen('form')}
            onSkip={skipManual}
          />
        )}
        {screen === 'form' && result && (
          <ManualForm imageUrl={result.imageUrl} onSubmit={submitManual} />
        )}
        </div>
      )}
    </div>
  );
}

// Animate a number from -> to over `ms`, easing in/out, via requestAnimationFrame.
function tween(from, to, ms, onUpdate) {
  return new Promise((resolve) => {
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / ms);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      onUpdate(Math.round(from + (to - from) * eased));
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
}
