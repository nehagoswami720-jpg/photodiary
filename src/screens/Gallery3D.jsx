import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import MomentPlane from '../components/MomentPlane.jsx';
import Wordmark from '../components/Wordmark.jsx';
import { PlusIcon } from '../components/icons.jsx';
import { formatDate, formatTime } from '../lib/format.js';

// The 3D gallery — a sphere of memories. Photos sit on the inside surface of a
// sphere facing the center; the camera sits AT the center and rotates with the
// cursor, so you look around the inside like a planetarium. Curvature at the
// edges is automatic (perspective on inward-facing photos), movement is
// infinite (rotation wraps), and every cursor direction steers continuously.
// Same data as before; "Upload a moment" runs the same upload flow.
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const BG = '#ffffff';
const RADIUS = 9; // sphere radius
const GOLDEN = Math.PI * (3 - Math.sqrt(5)); // for even Fibonacci distribution

// deterministic pseudo-random in [-1,1] from a string + salt
function rand(str, salt) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return (((h >>> 0) % 10000) / 10000) * 2 - 1;
}

export default function Gallery3D({ entries, onAddMoment }) {
  const [focusedId, setFocusedId] = useState(null);
  const mouse = useRef({ x: 0, y: 0 }); // cursor position, -1..1 from center

  const urlById = useMemo(() => {
    const m = new Map();
    for (const e of entries) m.set(e.id, URL.createObjectURL(e.photoBlob));
    return m;
  }, [entries]);
  useEffect(() => () => urlById.forEach((u) => URL.revokeObjectURL(u)), [urlById]);

  // distribute photos over the inside of the sphere (Fibonacci = even coverage)
  const cards = useMemo(() => {
    const n = entries.length;
    return entries.map((e, i) => {
      const y = (n > 1 ? 1 - (i / (n - 1)) * 2 : 0) * 0.82; // -0.82..0.82 (avoid poles)
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = i * GOLDEN;
      const radius = RADIUS * (0.9 + Math.abs(rand(e.id, 4)) * 0.22); // slight variety
      return {
        id: e.id,
        position: [Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius],
      };
    });
  }, [entries]);

  const focused = focusedId ? entries.find((e) => e.id === focusedId) : null;

  function onMove(e) {
    mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
  }

  return (
    <div
      className="fixed inset-0"
      style={{ background: BG, width: '100vw', height: '100vh' }}
      onPointerMove={onMove}
    >
      <Canvas
        camera={{ position: [0, 0, 0], fov: 62 }}
        onPointerMissed={() => setFocusedId(null)}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <color attach="background" args={[BG]} />
        <RotateRig mouse={mouse} />
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

// Cursor steers the camera's rotation from the sphere's center: further from
// center = faster spin. Yaw wraps infinitely; pitch is softly limited so you
// never flip over the poles. Photos glide opposite to the cursor.
const ROT_SPEED = 1.2; // rad/sec at full cursor deflection
const DEAD_ZONE = 0.04;
const MAX_PITCH = 1.15; // ~66°
function RotateRig({ mouse }) {
  const rot = useRef({ yaw: 0, pitch: 0 });
  useFrame((state, dt) => {
    const m = mouse.current;
    const ax = Math.abs(m.x) > DEAD_ZONE ? m.x : 0;
    const ay = Math.abs(m.y) > DEAD_ZONE ? m.y : 0;
    rot.current.yaw -= ax * ROT_SPEED * dt; // infinite (wraps)
    rot.current.pitch -= ay * ROT_SPEED * dt;
    rot.current.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, rot.current.pitch));
    state.camera.rotation.order = 'YXZ';
    easing.damp(state.camera.rotation, 'y', rot.current.yaw, 0.25, dt);
    easing.damp(state.camera.rotation, 'x', rot.current.pitch, 0.25, dt);
  });
  return null;
}
