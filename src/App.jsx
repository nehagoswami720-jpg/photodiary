import { useEffect, useRef, useState } from 'react';
import Wordmark from './components/Wordmark.jsx';
import EmptyState from './screens/EmptyState.jsx';
import Loading from './screens/Loading.jsx';
import Success from './screens/Success.jsx';
import ErrorState from './screens/ErrorState.jsx';
import Card from './screens/Card.jsx';
import ManualIntro from './screens/ManualIntro.jsx';
import { readPhotoData } from './lib/exif.js';
import { buildCard } from './lib/card.js';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Preview hook: open with ?state=error|success|card to jump straight to a
// screen for design review, since these states are otherwise hard to reach.
const PREVIEW = (() => {
  try {
    const s = new URLSearchParams(window.location.search).get('state');
    return ['error', 'success', 'card', 'manual'].includes(s) ? s : null;
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
  const [screen, setScreen] = useState(PREVIEW || 'empty'); // 'empty' | 'loading' | 'success' | 'error'
  const [percent, setPercent] = useState(0);
  const [status, setStatus] = useState(PHRASES[0]);
  const [busy, setBusy] = useState(false);
  const [failPercent, setFailPercent] = useState(25);
  const [result, setResult] = useState(() => {
    if (PREVIEW === 'card') return SAMPLE_CARD;
    if (PREVIEW === 'manual') return { place: null, capturedAt: null, imageUrl: SAMPLE_IMG };
    return null;
  }); // { place, capturedAt, imageUrl }
  const runIdRef = useRef(0); // lets a newer upload cancel an in-flight one

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

      const data = await readPhotoData(file);
      if (!live()) return;

      // The geocode is the one genuine wait — ease toward 90 while it runs.
      const cardPromise = buildCard(data, { homeCountry: HOME_COUNTRY });
      await tween(readTarget, 90, 1300, setPct);
      const card = await cardPromise;
      if (!live()) return;

      await tween(90, 100, 400, setPct);
      if (!live()) return;
      setPercent(100);
      setBusy(false); // stops the phrase loop
      setResult({ place: card.place, capturedAt: data.capturedAt, imageUrl: URL.createObjectURL(file) });
      setScreen('success');

      // Let the success beat breathe, then reveal the card — or, when the place
      // couldn't be detected, invite manual entry instead.
      await delay(1800);
      if (!live()) return;
      setScreen(card.place ? 'card' : 'manual');
    } catch {
      if (!live()) return;
      setBusy(false);
      setFailPercent(at); // the % the bar actually reached at detection
      setScreen('error');
    }
  }

  function reset() {
    runIdRef.current++; // cancel any in-flight run
    setBusy(false);
    setPercent(0);
    if (result?.imageUrl) URL.revokeObjectURL(result.imageUrl);
    setResult(null);
    setScreen('empty');
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-white">
      <Wordmark />
      <div className="flex w-full flex-1 items-center justify-center py-10">
        {screen === 'empty' && <EmptyState onFile={handleFile} />}
        {screen === 'loading' && <Loading percent={percent} status={status} />}
        {screen === 'success' && <Success />}
        {screen === 'error' && <ErrorState percent={failPercent} onRetry={reset} />}
        {screen === 'card' && result && (
          <Card place={result.place} capturedAt={result.capturedAt} imageUrl={result.imageUrl} />
        )}
        {screen === 'manual' && result && (
          <ManualIntro
            imageUrl={result.imageUrl}
            onAddDetails={() => {}} // → the entry form (screen 2), built next
            onSkip={() => setScreen('card')}
          />
        )}
      </div>
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
