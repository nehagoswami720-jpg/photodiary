import { useRef, useState } from 'react';
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

export default function App() {
  const [screen, setScreen] = useState('empty'); // 'empty' | 'loading'
  const [percent, setPercent] = useState(0);
  const [status, setStatus] = useState('');
  const [, setCard] = useState(null); // held for the card screen (built next)
  const runIdRef = useRef(0); // lets a newer upload cancel an in-flight one

  async function handleFile(file) {
    if (!file) return;
    const runId = ++runIdRef.current;
    const live = () => runId === runIdRef.current;
    const setPct = (v) => live() && setPercent(v);

    setScreen('loading');
    setPercent(0);
    setStatus('reading your photo');

    // Start the real work immediately; we pace the display so each real step is
    // readable rather than flashing past.
    const dataPromise = readPhotoData(file);

    // Reading steps (near-instant in reality) — shown briefly so they register.
    const readingSteps = [
      { label: 'reading your photo', pct: 22 },
      { label: 'reading the date', pct: 40 },
      { label: 'reading the time', pct: 56 },
      { label: 'finding the weekday', pct: 70 },
    ];
    let from = 0;
    for (const step of readingSteps) {
      if (!live()) return;
      setStatus(step.label);
      await tween(from, step.pct, 850, setPct); // each step readable, not flashing
      from = step.pct;
    }

    const data = await dataPromise;
    if (!live()) return;

    // "Fetching place name" is the one genuinely variable wait — only show it
    // when there are coordinates to look up, and let the bar honestly hold here
    // until the network call resolves.
    let card;
    if (data.lat != null && data.lon != null) {
      setStatus('fetching place name');
      const cardPromise = buildCard(data, { homeCountry: HOME_COUNTRY });
      await tween(from, 90, 520, setPct);
      card = await cardPromise;
    } else {
      card = await buildCard(data, { homeCountry: HOME_COUNTRY });
    }
    if (!live()) return;

    await tween(90, 100, 420, setPct);
    if (!live()) return;
    setPercent(100);
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
