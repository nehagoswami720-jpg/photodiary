import { useEffect, useMemo, useRef, useState } from 'react';
import Wordmark from './components/Wordmark.jsx';
import EmptyState from './screens/EmptyState.jsx';
import Loading from './screens/Loading.jsx';
import Success from './screens/Success.jsx';
import ErrorState from './screens/ErrorState.jsx';
import Card from './screens/Card.jsx';
import ManualIntro from './screens/ManualIntro.jsx';
import ManualForm from './screens/ManualForm.jsx';
import ManualDeck from './screens/ManualDeck.jsx';
import Gallery from './screens/Gallery.jsx';
import Gallery3D from './screens/Gallery3D.jsx';
import AlbumShelf from './screens/AlbumShelf.jsx';
import { groupIntoAlbums } from './lib/albums.js';
import { readPhotoData } from './lib/exif.js';
import { buildCard } from './lib/card.js';
import { toDisplayBlob } from './lib/heic.js';
import { saveEntry, deleteEntries, getAllEntries, requestPersistence, getCoverMap, setCover } from './lib/db.js';

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
  const batchRef = useRef([]); // auto-detected photos from a batch, held until the deck is done
  const [deck, setDeck] = useState([]); // undetected photos from a batch, awaiting manual details
  const [activeAlbumId, setActiveAlbumId] = useState(null); // null = album shelf; else the open album's canvas
  const [coverMap, setCoverMap] = useState({}); // albumId -> chosen cover entry id (user-picked)
  const activeAlbumRef = useRef(null); // mirror of activeAlbumId, for the history helpers
  useEffect(() => {
    activeAlbumRef.current = activeAlbumId;
  }, [activeAlbumId]);

  // Browser Back navigates the album canvas → shelf. Opening an album pushes a
  // history entry; the browser Back button (or a programmatic returnToShelf) pops
  // it, and popstate drops us back to the shelf.
  useEffect(() => {
    function onPop() {
      setActiveAlbumId(null);
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  function openAlbum(id) {
    window.history.pushState({ albumId: id }, '');
    setActiveAlbumId(id);
  }
  function returnToShelf() {
    if (activeAlbumRef.current != null) window.history.back(); // pop the album entry → popstate → shelf
    else setActiveAlbumId(null);
  }

  // Albums for the home shelf: an "All moments" cover (opens the full canvas) plus
  // one per location (groupIntoAlbums, honest place-only grouping). Each album's
  // `cover` is the user-chosen moment if set, else its most recent.
  const albums = useMemo(() => {
    const list = [{ id: '__all__', title: 'All moments', place: null, moments: entries }, ...groupIntoAlbums(entries)];
    return list.map((a) => ({
      ...a,
      cover: a.moments.find((m) => m.id === coverMap[a.id]) || a.moments[0] || null,
    }));
  }, [entries, coverMap]);

  // On load, open the gallery of saved moments (or the drop zone if empty).
  useEffect(() => {
    if (PREVIEW) return;
    getAllEntries()
      .then((all) => {
        setEntries(all);
        setScreen(all.length ? 'gallery' : 'empty');
      })
      .catch(() => setScreen('empty'));
    getCoverMap().then(setCoverMap).catch(() => {});
  }, []);

  // Persist a user-chosen album cover, then reflect it on the shelf.
  async function chooseCover(albumId, entryId) {
    setCoverMap((m) => ({ ...m, [albumId]: entryId }));
    try {
      await setCover(albumId, entryId);
    } catch {
      /* keep working even if saving fails */
    }
  }

  // Permanently delete one moment (the user's own photo). Updates the diary in
  // place; if the open album empties out, fall back to the shelf, and if the whole
  // diary is now empty, show the drop zone.
  async function deletePhoto(id) {
    try {
      await deleteEntries([id]);
    } catch {
      /* keep working even if the delete fails to persist */
    }
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    if (!next.length) {
      returnToShelf();
      setScreen('empty');
    } else if (activeAlbumId && activeAlbumId !== '__all__') {
      // a location album disappears once its last photo is gone
      const stillExists = groupIntoAlbums(next).some((a) => a.id === activeAlbumId);
      if (!stillExists) returnToShelf();
    }
  }

  // Permanently delete a whole album (every photo in that place). Always returns
  // to the shelf afterwards.
  async function deleteAlbum(albumId) {
    const album = albums.find((a) => a.id === albumId);
    if (!album) return;
    const ids = album.moments.map((m) => m.id);
    try {
      await deleteEntries(ids);
    } catch {
      /* keep working even if the delete fails to persist */
    }
    const gone = new Set(ids);
    const next = entries.filter((e) => !gone.has(e.id));
    setEntries(next);
    returnToShelf();
    if (!next.length) setScreen('empty');
  }

  // Return to the gallery (reloading moments); the drop zone if the diary is empty.
  async function goHome() {
    runIdRef.current++; // cancel any in-flight run
    setBusy(false);
    setPercent(0);
    pendingRef.current = null;
    if (result?.imageUrl) URL.revokeObjectURL(result.imageUrl);
    setResult(null);
    returnToShelf(); // land back on the album shelf
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

  // Entry point for the file input(s): one photo keeps the existing single flow;
  // several photos run the batch flow (combined progress → deck for undetected).
  function handleUpload(fileList) {
    const list = Array.from(fileList || []);
    if (!list.length) return;
    if (list.length === 1) return handleFile(list[0]);
    return handleBatch(list);
  }

  // Turn one manually-entered {place,date,time} into { capturedAt, showTime },
  // falling back to the photo's own EXIF date when nothing was typed.
  function resolveManual({ place, date, time }, exifCapturedAt) {
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
    } else if (exifCapturedAt instanceof Date) {
      capturedAt = exifCapturedAt;
      showTime = true;
    }
    const source = place || date ? 'manual' : 'exif';
    return { place: place?.trim() || null, capturedAt, showTime, source };
  }

  // Process several photos with one combined progress bar. Detected photos are
  // held in memory; undetected ones open the deck. NOTHING is saved until the
  // whole flow finishes (Done in the deck, or the success beat when all detected).
  async function handleBatch(list) {
    const runId = ++runIdRef.current;
    const live = () => runId === runIdRef.current;

    setScreen('loading');
    setBusy(false); // batch drives its own "X of N" status, not the phrase loop
    setPercent(0);
    setStatus(`reading your photos — 0 of ${list.length}`);

    const results = [];
    for (let i = 0; i < list.length; i++) {
      if (!live()) return;
      setStatus(`reading your photos — ${i} of ${list.length}`);
      const file = list[i];
      try {
        if (!(await isReadableImage(file))) continue; // silently skip non-images
        const data = await readPhotoData(file);
        const [card, displayBlob] = await Promise.all([
          buildCard(data, { homeCountry: HOME_COUNTRY }),
          toDisplayBlob(file),
        ]);
        results.push({ file: displayBlob, place: card.place, capturedAt: data.capturedAt, lat: data.lat, lon: data.lon });
      } catch {
        /* skip a photo that fails to read */
      }
      if (!live()) return;
      setPercent(Math.round(((i + 1) / list.length) * 100));
    }
    if (!live()) return;
    setStatus(`reading your photos — ${list.length} of ${list.length}`);
    setPercent(100);

    const detected = results.filter((r) => r.place);
    const undetected = results.filter((r) => !r.place);
    batchRef.current = detected;

    if (undetected.length === 0) {
      // everything found a place → success beat, then save the batch → gallery
      setScreen('success');
      await delay(1600);
      if (!live()) return;
      await saveBatch(detected, [], []);
      goHome();
    } else {
      // hold the detected ones; open the deck for the rest
      setDeck(undetected.map((u) => ({ ...u, imageUrl: URL.createObjectURL(u.file) })));
      setScreen('deck');
    }
  }

  // Save the whole batch at once: the auto-detected photos plus the deck photos
  // with whatever details were entered (deckValues aligns with deckItems).
  async function saveBatch(detectedItems, deckItems, deckValues) {
    for (const d of detectedItems) {
      await saveOne({ file: d.file, place: d.place, capturedAt: d.capturedAt, showTime: d.capturedAt instanceof Date, lat: d.lat, lon: d.lon, source: 'exif' });
    }
    for (let i = 0; i < deckItems.length; i++) {
      const it = deckItems[i];
      const r = resolveManual(deckValues[i] || {}, it.capturedAt);
      await saveOne({ file: it.file, place: r.place, capturedAt: r.capturedAt, showTime: r.showTime, lat: it.lat, lon: it.lon, source: r.source });
    }
    requestPersistence();
  }

  // Persist one entry (best-effort), same shape as saveCurrent.
  async function saveOne({ file, place, capturedAt, showTime, lat, lon, source }) {
    try {
      await saveEntry({
        id: crypto.randomUUID(),
        photoBlob: file,
        place: place ?? null,
        capturedAt: capturedAt ?? null,
        showTime: !!showTime,
        lat: lat ?? null,
        lon: lon ?? null,
        source,
        createdAt: new Date(),
      });
    } catch {
      /* keep going even if one fails */
    }
  }

  // Deck "Add to diary" → save the batch → gallery.
  async function finishDeck(deckValues) {
    await saveBatch(batchRef.current, deck, deckValues);
    deck.forEach((it) => it.imageUrl && URL.revokeObjectURL(it.imageUrl));
    setDeck([]);
    batchRef.current = [];
    goHome();
  }

  // Deck "Cancel" → discard the whole batch (nothing was saved yet).
  function cancelDeck() {
    runIdRef.current++;
    deck.forEach((it) => it.imageUrl && URL.revokeObjectURL(it.imageUrl));
    setDeck([]);
    batchRef.current = [];
    goHome();
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

  // Home is the album shelf; opening an album takes over with the 3D canvas
  // filtered to that album's moments (dark scene, its own wordmark).
  if (screen === 'gallery') {
    if (activeAlbumId == null) {
      return <AlbumShelf albums={albums} onOpen={openAlbum} onUpload={handleUpload} />;
    }
    const album = albums.find((a) => a.id === activeAlbumId) || albums[0];
    return (
      <Gallery3D
        entries={album.moments}
        onAddMoment={handleUpload}
        coverId={coverMap[album.id] ?? album.moments[0]?.id}
        onSetCover={(entryId) => chooseCover(album.id, entryId)}
        onDeletePhoto={deletePhoto}
        onDeleteAlbum={album.id === '__all__' ? null : () => deleteAlbum(album.id)}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-white">
      <Wordmark />
      <div className="flex w-full flex-1 items-center justify-center py-10">
        {screen === 'empty' && <EmptyState onFiles={handleUpload} />}
        {screen === 'loading' && <Loading percent={percent} status={status} />}
        {screen === 'success' && <Success />}
        {screen === 'deck' && deck.length > 0 && (
          <ManualDeck items={deck} onDone={finishDeck} onCancel={cancelDeck} />
        )}
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
