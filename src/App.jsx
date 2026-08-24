import { useEffect, useRef, useState } from 'react';
import Wordmark from './components/Wordmark.jsx';
import EmptyState from './screens/EmptyState.jsx';
import Loading from './screens/Loading.jsx';
import Success from './screens/Success.jsx';
import ErrorState from './screens/ErrorState.jsx';
import { readPhotoData } from './lib/exif.js';
import { buildCard } from './lib/card.js';

// Preview hook: open with ?state=error (or =success) to jump straight to a
// screen for design review, since these states are otherwise hard to reach.
const PREVIEW = (() => {
  try {
    const s = new URLSearchParams(window.location.search).get('state');
    return s === 'error' || s === 'success' ? s : null;
  } catch {
    return null;
  }
})();

function isImageFile(file) {
  return (file.type && file.type.startsWith('image/')) || /\.(heic|heif)$/i.test(file.name);
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
  const [, setCard] = useState(null); // held for the card screen (built next)
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

    // A file that isn't a photo can't be read — fail honestly, before loading.
    if (!isImageFile(file)) {
      setFailPercent(25);
      setScreen('error');
      return;
    }

    setScreen('loading');
    setPercent(0);
    setBusy(true); // starts the phrase loop

    try {
      // Real work runs alongside the progress animation.
      const data = await readPhotoData(file);
      if (!live()) return;
      await tween(0, 40, 1000, setPct);
      if (!live()) return;

      // The geocode is the one genuine wait — ease toward 90 while it runs.
      const cardPromise = buildCard(data, { homeCountry: HOME_COUNTRY });
      await tween(40, 90, 1300, setPct);
      const card = await cardPromise;
      if (!live()) return;

      await tween(90, 100, 400, setPct);
      if (!live()) return;
      setPercent(100);
      setBusy(false); // stops the phrase loop
      setCard(card);
      setScreen('success');
      // The card screen gets wired in from here next.
    } catch {
      if (!live()) return;
      setBusy(false);
      setFailPercent(at > 8 ? at : 25);
      setScreen('error');
    }
  }

  function reset() {
    runIdRef.current++; // cancel any in-flight run
    setBusy(false);
    setPercent(0);
    setScreen('empty');
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-white">
      <Wordmark />
      <div className="flex w-full flex-1 items-center justify-center">
        {screen === 'empty' && <EmptyState onFile={handleFile} />}
        {screen === 'loading' && <Loading percent={percent} status={status} />}
        {screen === 'success' && <Success />}
        {screen === 'error' && <ErrorState percent={failPercent} onRetry={reset} />}
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
