import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import MomentPlane from '../components/MomentPlane.jsx';
import Wordmark from '../components/Wordmark.jsx';
import { PlusIcon } from '../components/icons.jsx';
import { formatDate, formatTime } from '../lib/format.js';

// The 3D gallery — moments as photo cards floating in depth on a clean white
// field. Scroll (wheel/trackpad) to drift through; hover to lift + straighten;
// click to focus. Same data as the 2D gallery; "Upload a moment" runs the same
// upload flow. (No album grouping labels here — pure floating photos.)
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const BG = '#ffffff';
const SPACING = 5.2; // z distance between successive photos (depth density)

// deterministic pseudo-random in [-1,1] from a string + salt (stable per card)
function rand(str, salt) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return (((h >>> 0) % 10000) / 10000) * 2 - 1;
}

export default function Gallery3D({ entries, onAddMoment }) {
  const [focusedId, setFocusedId] = useState(null);

  const urlById = useMemo(() => {
    const m = new Map();
    for (const e of entries) m.set(e.id, URL.createObjectURL(e.photoBlob));
    return m;
  }, [entries]);
  useEffect(() => () => urlById.forEach((u) => URL.revokeObjectURL(u)), [urlById]);

  // scatter every moment through depth (newest nearest the camera)
  const { cards, depth } = useMemo(() => {
    const cards = entries.map((e, i) => ({
      id: e.id,
      // tighter, slightly-lowered cloud so it stays clear of the MOMENTS title
      position: [rand(e.id, 1) * 4.8, rand(e.id, 2) * 2.5 - 0.4, -i * SPACING + rand(e.id, 3) * 2],
    }));
    return { cards, depth: Math.max(1, entries.length - 1) * SPACING };
  }, [entries]);

  const focused = focusedId ? entries.find((e) => e.id === focusedId) : null;

  return (
    <div
      className="fixed inset-0"
      style={{ background: BG, width: '100vw', height: '100vh' }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 70 }}
        onPointerMissed={() => setFocusedId(null)}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <color attach="background" args={[BG]} />
        <fog attach="fog" args={[BG, 20, 70]} />
        {/* drag = orbit from any direction · right-drag / two-finger = pan ·
            scroll = zoom in/out through the depth */}
        <OrbitControls
          makeDefault
          enablePan
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.6}
          panSpeed={0.7}
          zoomSpeed={0.8}
          minDistance={3}
          maxDistance={48}
          screenSpacePanning
          target={[0, -0.4, -depth * 0.35]}
        />
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
      </Canvas>

      {/* soft white boundaries on all four sides — photos dissolve at the edges
          so nothing overlaps the title or spills off harshly */}
      <div className="pointer-events-none fixed inset-0 z-10">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white via-white/85 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent" />
        <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-white to-transparent" />
        <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-white to-transparent" />
      </div>

      {/* 2D overlay — dark on the white field */}
      <div className="pointer-events-none fixed inset-0 z-20 flex flex-col items-center">
        <Wordmark color="#1a1a1a" />
      </div>

      {focused && (
        <div className="pointer-events-none fixed inset-x-0 bottom-28 z-20 flex flex-col items-center text-center">
          {focused.place && (
            <p className="text-[22px] text-[#2f2f2f]" style={{ fontFamily: '"Mulish", sans-serif', fontWeight: 500 }}>
              {focused.place}
            </p>
          )}
          {focused.capturedAt instanceof Date && (
            <p className="text-[16px] italic text-[#959595]" style={{ fontFamily: '"Newsreader", serif' }}>
              {formatDate(focused.capturedAt)}
              {focused.showTime ? ` · ${formatTime(focused.capturedAt)}` : ''}
            </p>
          )}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-10 z-20 flex justify-center">
        <label
          className="pointer-events-auto flex cursor-pointer items-center gap-2 bg-[#111] px-[22px] py-3 text-[18px] tracking-[-0.9px] text-white shadow-[0_6px_24px_rgba(0,0,0,0.16)] transition-colors hover:bg-black"
          style={{ fontFamily: HELVETICA, fontWeight: 400 }}
        >
          <PlusIcon /> Upload a moment
          <input type="file" accept="image/*,.heic,.heif" className="hidden" onChange={(e) => onAddMoment(e.target.files?.[0])} />
        </label>
      </div>
    </div>
  );
}
