import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import MomentPlane from '../components/MomentPlane.jsx';
import Wordmark from '../components/Wordmark.jsx';
import { PlusIcon } from '../components/icons.jsx';
import { formatDate, formatTime } from '../lib/format.js';

// The 3D gallery — a dense field of memories on a gentle dome. Photos are packed
// from the center outward (constant density, no big gaps), on a shallow curved
// surface so they angle subtly at the edges in both axes. Move the cursor to
// pan across the field (photos glide opposite); it stops when the cursor stops
// and rubber-bands at the edges (bounded — no infinite void). "Upload a moment"
// unchanged.
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const BG = '#ffffff';
const GOLDEN = Math.PI * (3 - Math.sqrt(5)); // golden angle for the spiral
const SPREAD = 1.3; // spacing between photos (smaller = denser)
const DOME = 0.02; // dome curvature (edges recede a little)

// deterministic pseudo-random in [-1,1] from a string + salt
function rand(str, salt) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return (((h >>> 0) % 10000) / 10000) * 2 - 1;
}

export default function Gallery3D({ entries, onAddMoment }) {
  const [focusedId, setFocusedId] = useState(null);
  const vel = useRef({ x: 0, y: 0 }); // pan velocity from cursor movement
  const offset = useRef({ x: 0, y: 0 }); // current camera pan
  const last = useRef(null); // last cursor position (px)

  const urlById = useMemo(() => {
    const m = new Map();
    for (const e of entries) m.set(e.id, URL.createObjectURL(e.photoBlob));
    return m;
  }, [entries]);
  useEffect(() => () => urlById.forEach((u) => URL.revokeObjectURL(u)), [urlById]);

  // dense phyllotaxis spiral from the center out, curved onto a shallow dome
  const { cards, bound } = useMemo(() => {
    const cards = entries.map((e, i) => {
      const r = SPREAD * Math.sqrt(i);
      const a = i * GOLDEN;
      const x = r * Math.cos(a) + rand(e.id, 1) * 0.25;
      const y = r * Math.sin(a) + rand(e.id, 2) * 0.25;
      const z = -DOME * (x * x + y * y); // dome: center near 0, edges recede
      return { id: e.id, position: [x, y, z] };
    });
    const maxR = SPREAD * Math.sqrt(entries.length) + 1;
    return { cards, bound: { x: maxR, y: maxR } };
  }, [entries]);

  const focused = focusedId ? entries.find((e) => e.id === focusedId) : null;

  // cursor MOVEMENT pans the field opposite; stops when the cursor stops.
  function onMove(e) {
    if (last.current) {
      vel.current.x += (e.clientX - last.current.x) * 0.0022;
      vel.current.y -= (e.clientY - last.current.y) * 0.0022;
    }
    last.current = { x: e.clientX, y: e.clientY };
  }

  return (
    <div
      className="fixed inset-0"
      style={{ background: BG, width: '100vw', height: '100vh' }}
      onPointerMove={onMove}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 46 }}
        onPointerMissed={() => setFocusedId(null)}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <color attach="background" args={[BG]} />
        <fog attach="fog" args={[BG, 14, 34]} />
        <PanRig vel={vel} offset={offset} bound={bound} />
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

// Cursor movement pans the camera across the field; velocity decays (stops when
// the cursor stops) and rubber-bands within the field bounds (stops at edges).
function PanRig({ vel, offset, bound }) {
  useFrame((state, dt) => {
    const v = vel.current;
    const o = offset.current;
    o.x += v.x;
    o.y += v.y;
    v.x *= 0.82;
    v.y *= 0.82;
    const cx = Math.max(-bound.x, Math.min(bound.x, o.x));
    const cy = Math.max(-bound.y, Math.min(bound.y, o.y));
    o.x += (cx - o.x) * 0.12;
    o.y += (cy - o.y) * 0.12;
    easing.damp3(state.camera.position, [o.x, o.y, 8], 0.15, dt);
    state.camera.lookAt(o.x, o.y, -5);
  });
  return null;
}
