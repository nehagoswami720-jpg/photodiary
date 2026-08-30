import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import MomentPlane from '../components/MomentPlane.jsx';
import Wordmark from '../components/Wordmark.jsx';
import { PlusIcon } from '../components/icons.jsx';
import { formatDate, formatTime } from '../lib/format.js';

// The 3D gallery — a distributed field of memories on a clean white field.
// Photos are laid out on a jittered grid (well-spaced so none is ever fully
// hidden — only corners overlap), at shallow depth. There is ONE control: the
// gesture. Every scroll/trackpad movement pans the view so the photos glide the
// OPPOSITE direction (up→down, left→right, diagonals too), with inertia. Same
// data as the 2D gallery; "Upload a moment" runs the same upload flow.
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const BG = '#ffffff';
const CELL = 3.2; // grid cell size (world units) — spacing between photo centers

// deterministic pseudo-random in [-1,1] from a string + salt (stable per card)
function rand(str, salt) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return (((h >>> 0) % 10000) / 10000) * 2 - 1;
}

export default function Gallery3D({ entries, onAddMoment }) {
  const [focusedId, setFocusedId] = useState(null);
  const velocity = useRef({ x: 0, y: 0 }); // momentum from gestures
  const offset = useRef({ x: 0, y: 0 }); // current camera pan

  const urlById = useMemo(() => {
    const m = new Map();
    for (const e of entries) m.set(e.id, URL.createObjectURL(e.photoBlob));
    return m;
  }, [entries]);
  useEffect(() => () => urlById.forEach((u) => URL.revokeObjectURL(u)), [urlById]);

  // lay photos on a jittered grid (aspect-ish), shallow depth. Grid keeps
  // centers spaced (no full overlap); jitter + varied widths let corners touch.
  const { cards, bound } = useMemo(() => {
    const n = entries.length;
    const cols = Math.max(1, Math.round(Math.sqrt(n * 1.7)));
    const rows = Math.ceil(n / cols);
    const cards = entries.map((e, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        id: e.id,
        position: [
          (col - (cols - 1) / 2) * CELL + rand(e.id, 1) * CELL * 0.28,
          ((rows - 1) / 2 - row) * CELL + rand(e.id, 2) * CELL * 0.28,
          -0.4 - Math.abs(rand(e.id, 3)) * 2.6, // shallow depth
        ],
      };
    });
    // soft pan range — how far you can drift before the field rubber-bands back
    const bound = {
      x: Math.max(0.5, (cols * CELL) / 2 - 3),
      y: Math.max(0.5, (rows * CELL) / 2 - 2.5),
    };
    return { cards, bound };
  }, [entries]);

  const focused = focusedId ? entries.find((e) => e.id === focusedId) : null;

  // pan the camera WITH the gesture → photos appear to move the opposite way
  function onWheel(e) {
    velocity.current.x += e.deltaX * 0.0025;
    velocity.current.y -= e.deltaY * 0.0025;
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
        <fog attach="fog" args={[BG, 12, 30]} />
        <PanRig velocity={velocity} offset={offset} bound={bound} />
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

      {/* soft white boundaries on all four sides */}
      <div className="pointer-events-none fixed inset-0 z-10">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white via-white/85 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent" />
        <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-white to-transparent" />
        <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-white to-transparent" />
      </div>

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

// Applies gesture momentum to the camera pan, with decay + soft bounds, and
// eases the camera there — so the photo field glides opposite to the gesture.
function PanRig({ velocity, offset, bound }) {
  useFrame((state, dt) => {
    const v = velocity.current;
    const o = offset.current;
    // gesture momentum always moves the field (so it always responds)...
    o.x += v.x;
    o.y += v.y;
    v.x *= 0.88; // decay
    v.y *= 0.88;
    // ...then rubber-band back within the soft bounds (springs home past the edge)
    const cx = Math.max(-bound.x, Math.min(bound.x, o.x));
    const cy = Math.max(-bound.y, Math.min(bound.y, o.y));
    o.x += (cx - o.x) * 0.1;
    o.y += (cy - o.y) * 0.1;
    easing.damp3(state.camera.position, [o.x, o.y, 8], 0.18, dt);
    state.camera.lookAt(o.x, o.y, -6);
  });
  return null;
}
