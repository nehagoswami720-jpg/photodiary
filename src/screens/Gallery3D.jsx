import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, Stars } from '@react-three/drei';
import { easing } from 'maath';
import MomentPlane from '../components/MomentPlane.jsx';
import Wordmark from '../components/Wordmark.jsx';
import { PlusIcon } from '../components/icons.jsx';
import { groupIntoAlbums } from '../lib/albums.js';
import { formatDate, formatTime } from '../lib/format.js';

// The 3D gallery — moments as photo cards floating in deep space, grouped by
// album (location) into clusters that recede into the distance. Scroll (wheel)
// to drift through; hover to lift; click to focus. Same data as the 2D gallery;
// "Upload a moment" runs the same upload flow.
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const BG = '#0a0b10';
const ALBUM_GAP = 15;

// deterministic pseudo-random in [-1,1] from a string + salt (stable per card)
function rand(str, salt) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return (((h >>> 0) % 10000) / 10000) * 2 - 1;
}

export default function Gallery3D({ entries, onAddMoment }) {
  const [focusedId, setFocusedId] = useState(null);
  const scrollRef = useRef(0); // 0..1 progress through the gallery depth

  const urlById = useMemo(() => {
    const m = new Map();
    for (const e of entries) m.set(e.id, URL.createObjectURL(e.photoBlob));
    return m;
  }, [entries]);
  useEffect(() => () => urlById.forEach((u) => URL.revokeObjectURL(u)), [urlById]);

  const albums = useMemo(() => groupIntoAlbums(entries), [entries]);

  const { cards, labels, depth } = useMemo(() => {
    const cards = [];
    const labels = [];
    albums.forEach((album, ai) => {
      const cz = -ai * ALBUM_GAP;
      labels.push({ id: album.id, text: album.place || album.title, position: [-4.6, 3.1, cz + 5] });
      album.moments.forEach((m) => {
        cards.push({
          id: m.id,
          position: [rand(m.id, 1) * 4.4, rand(m.id, 2) * 2.7, cz + rand(m.id, 3) * 4],
        });
      });
    });
    return { cards, labels, depth: (albums.length - 1) * ALBUM_GAP };
  }, [albums]);

  const focused = focusedId ? entries.find((e) => e.id === focusedId) : null;

  function onWheel(e) {
    const next = scrollRef.current + e.deltaY * 0.0009;
    scrollRef.current = Math.max(0, Math.min(1, next));
  }

  return (
    <div
      className="fixed inset-0"
      style={{ background: BG, width: '100vw', height: '100vh' }}
      onWheel={onWheel}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 55 }}
        onPointerMissed={() => setFocusedId(null)}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <color attach="background" args={[BG]} />
        <fog attach="fog" args={[BG, 14, 60]} />
        <Stars radius={60} depth={30} count={1200} factor={3} saturation={0} fade speed={0.4} />
        <CameraRig scrollRef={scrollRef} depth={depth} />
        <Suspense fallback={null}>
          {cards.map((c) => (
            <MomentPlane
              key={c.id}
              id={c.id}
              url={urlById.get(c.id)}
              position={c.position}
              focused={focusedId === c.id}
              onFocus={setFocusedId}
            />
          ))}
        </Suspense>
        {labels.map((l) => (
          <Html key={l.id} position={l.position} transform distanceFactor={12} pointerEvents="none">
            <div
              className="select-none whitespace-nowrap text-[44px] text-white/90"
              style={{ fontFamily: '"DM Serif Text", serif' }}
            >
              {l.text}
            </div>
          </Html>
        ))}
      </Canvas>

      {/* 2D overlay */}
      <div className="pointer-events-none fixed inset-0 flex flex-col items-center">
        <Wordmark color="#ffffff" />
      </div>

      {focused && (
        <div className="pointer-events-none fixed inset-x-0 bottom-28 z-20 flex flex-col items-center text-center">
          {focused.place && (
            <p className="text-[22px] text-white" style={{ fontFamily: '"Mulish", sans-serif', fontWeight: 500 }}>
              {focused.place}
            </p>
          )}
          {focused.capturedAt instanceof Date && (
            <p className="text-[16px] italic text-white/70" style={{ fontFamily: '"Newsreader", serif' }}>
              {formatDate(focused.capturedAt)}
              {focused.showTime ? ` · ${formatTime(focused.capturedAt)}` : ''}
            </p>
          )}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-10 z-20 flex justify-center">
        <label
          className="pointer-events-auto flex cursor-pointer items-center gap-2 bg-white px-[22px] py-3 text-[18px] tracking-[-0.9px] text-[#111] shadow-[0_6px_24px_rgba(0,0,0,0.4)] transition-colors hover:bg-white/90"
          style={{ fontFamily: HELVETICA, fontWeight: 400 }}
        >
          <PlusIcon /> Upload a moment
          <input type="file" accept="image/*,.heic,.heif" className="hidden" onChange={(e) => onAddMoment(e.target.files?.[0])} />
        </label>
      </div>
    </div>
  );
}

// Eases the camera through the clusters toward the current scroll target.
function CameraRig({ scrollRef, depth }) {
  useFrame((state, dt) => {
    const targetZ = 8 - scrollRef.current * depth;
    easing.damp(state.camera.position, 'z', targetZ, 0.3, dt);
  });
  return null;
}
