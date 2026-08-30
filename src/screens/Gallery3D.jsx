import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import MomentPlane from '../components/MomentPlane.jsx';
import Wordmark from '../components/Wordmark.jsx';
import { PlusIcon } from '../components/icons.jsx';
import { formatDate, formatTime } from '../lib/format.js';

// The 3D gallery — a flowing "river" of memories on a clean white field. Photos
// are composed along a gently curving path that recedes into depth; scrolling
// glides the camera along the path with smooth inertia (on rails, not a free
// camera), each photo turned toward you and gently alive, with a subtle
// mouse-parallax. Same data as the 2D gallery; "Upload a moment" runs the same
// upload flow.
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const BG = '#ffffff';
const SPACING = 4.6; // depth between successive photos along the path

export default function Gallery3D({ entries, onAddMoment }) {
  const [focusedId, setFocusedId] = useState(null);
  const scrollTarget = useRef(0); // 0..1, where the user wants to be
  const mouse = useRef({ x: 0, y: 0 }); // -1..1 for parallax

  const urlById = useMemo(() => {
    const m = new Map();
    for (const e of entries) m.set(e.id, URL.createObjectURL(e.photoBlob));
    return m;
  }, [entries]);
  useEffect(() => () => urlById.forEach((u) => URL.revokeObjectURL(u)), [urlById]);

  // compose photos along a smooth curving path (sway + undulation), receding
  const { cards, depth } = useMemo(() => {
    const cards = entries.map((e, i) => ({
      id: e.id,
      position: [
        Math.sin(i * 0.55) * 4.2, // gentle horizontal sway (the curve)
        Math.cos(i * 0.42) * 1.4 - 0.2, // gentle vertical undulation
        -i * SPACING,
      ],
    }));
    return { cards, depth: Math.max(1, entries.length - 1) * SPACING };
  }, [entries]);

  const focused = focusedId ? entries.find((e) => e.id === focusedId) : null;

  function onWheel(e) {
    scrollTarget.current = Math.max(0, Math.min(1, scrollTarget.current + e.deltaY * 0.0006));
  }
  function onMove(e) {
    mouse.current = { x: (e.clientX / window.innerWidth) * 2 - 1, y: -((e.clientY / window.innerHeight) * 2 - 1) };
  }

  return (
    <div
      className="fixed inset-0"
      style={{ background: BG, width: '100vw', height: '100vh' }}
      onWheel={onWheel}
      onPointerMove={onMove}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 68 }}
        onPointerMissed={() => setFocusedId(null)}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <color attach="background" args={[BG]} />
        <fog attach="fog" args={[BG, 18, 66]} />
        <CameraRig scrollTarget={scrollTarget} mouse={mouse} depth={depth} />
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

// Glides the camera along the path with smooth inertia; a light mouse-parallax
// adds depth. On rails — the camera is choreographed, never free-orbited.
function CameraRig({ scrollTarget, mouse, depth }) {
  const smooth = useRef(0); // eased scroll position (0..1)
  useFrame((state, dt) => {
    easing.damp(smooth, 'current', scrollTarget.current, 0.5, dt);
    const z = 8 - smooth.current * depth;
    const px = mouse.current.x * 1.3; // parallax sway
    const py = mouse.current.y * 0.8;
    easing.damp3(state.camera.position, [px, py, z], 0.35, dt);
    state.camera.lookAt(px * 0.35, py * 0.35, z - 7);
  });
  return null;
}
