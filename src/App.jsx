import { useEffect, useRef, useState } from 'react';
import Wordmark from './components/Wordmark.jsx';
import EmptyState from './screens/EmptyState.jsx';
import Loading from './screens/Loading.jsx';
import { readPhotoData } from './lib/exif.js';
import { buildCard } from './lib/card.js';

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
  const [screen, setScreen] = useState('empty'); // 'empty' | 'loading'
  const [percent, setPercent] = useState(0);
  const [status, setStatus] = useState(PHRASES[0]);
  const [busy, setBusy] = useState(false);
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
    const setPct = (v) => live() && setPercent(v);

    setScreen('loading');
    setPercent(0);
    setBusy(true); // starts the phrase loop

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
    setStatus('ready');
    setCard(card);
    // Next screen (success / the card) gets wired in here.
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-white">
      <Wordmark />
      <div className="flex w-full flex-1 items-center justify-center">
        {screen === 'empty' && <EmptyState onFile={handleFile} />}
        {screen === 'loading' && <Loading percent={percent} status={status} />}
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
