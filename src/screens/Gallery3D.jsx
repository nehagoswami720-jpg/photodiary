import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import MomentPlane from '../components/MomentPlane.jsx';
import Wordmark from '../components/Wordmark.jsx';
import { PlusIcon } from '../components/icons.jsx';
import { formatDate, formatTime } from '../lib/format.js';

// The 3D gallery — a cylinder of memories (a lampshade). Photos sit on the
// inside wall, upright, facing the central axis; the camera sits at the center
// and rotates with cursor MOVEMENT (stops when the cursor stops). Horizontal
// rotation wraps infinitely; a little vertical look is allowed. Edge curvature
// is subtle and automatic. Same data as before; "Upload a moment" unchanged.
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const BG = '#ffffff';
const RADIUS = 7; // sphere radius
const GOLDEN = Math.PI * (3 - Math.sqrt(5)); // golden angle for the spiral
const SPREAD = 0.26; // angular spacing between photos (smaller = denser cluster)

// deterministic pseudo-random in [-1,1] from a string + salt
function rand(str, salt) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return (((h >>> 0) % 10000) / 10000) * 2 - 1;
}

export default function Gallery3D({ entries, onAddMoment }) {
  const [focusedId, setFocusedId] = useState(null);
  const vel = useRef({ yaw: 0, pitch: 0 }); // angular velocity from cursor movement
  const last = useRef(null); // last cursor position (px)

  const urlById = useMemo(() => {
    const m = new Map();
    for (const e of entries) m.set(e.id, URL.createObjectURL(e.photoBlob));
    return m;
  }, [entries]);
  useEffect(() => () => urlById.forEach((u) => URL.revokeObjectURL(u)), [urlById]);

  // pack photos in a tight spiral cluster on the front of the sphere (constant
  // density — dense even with few photos), growing outward as photos are added.
  // Because they stay near the front they barely twist, yet you can still rotate
  // any direction to explore the growing cluster.
  const cards = useMemo(() => {
    return entries.map((e, i) => {
      const phi = SPREAD * Math.sqrt(i); // angular distance from the front pole (-z)
      const a = i * GOLDEN; // azimuth around the spiral
      const rr = RADIUS * (0.96 + Math.abs(rand(e.id, 4)) * 0.07);
      const sp = Math.sin(phi);
      return {
        id: e.id,
        position: [sp * Math.cos(a) * rr, sp * Math.sin(a) * rr, -Math.cos(phi) * rr],
      };
    });
  }, [entries]);

  const focused = focusedId ? entries.find((e) => e.id === focusedId) : null;

  // cursor MOVEMENT (delta) rotates the view → stops when the cursor stops.
  function onMove(e) {
    if (last.current) {
      vel.current.yaw -= (e.clientX - last.current.x) * 0.00045;
      vel.current.pitch += (e.clientY - last.current.y) * 0.0004;
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
        camera={{ position: [0, 0, 0], fov: 52 }}
        onPointerMissed={() => setFocusedId(null)}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <color attach="background" args={[BG]} />
        <RotateRig vel={vel} />
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

// Cursor movement adds angular velocity; it decays each frame, so the view
// glides briefly and then STOPS when the cursor stops. Yaw wraps infinitely;
// pitch is softly limited to the height of the photo band.
const MAX_PITCH = 1.1; // ~63° up/down (reach the sphere's top & bottom)
function RotateRig({ vel }) {
  const rot = useRef({ yaw: 0, pitch: 0 });
  useFrame((state, dt) => {
    rot.current.yaw += vel.current.yaw;
    rot.current.pitch += vel.current.pitch;
    rot.current.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, rot.current.pitch));
    vel.current.yaw *= 0.8; // decay → stops shortly after the cursor stops
    vel.current.pitch *= 0.8;
    state.camera.rotation.order = 'YXZ';
    easing.damp(state.camera.rotation, 'y', rot.current.yaw, 0.1, dt);
    easing.damp(state.camera.rotation, 'x', rot.current.pitch, 0.1, dt);
  });
  return null;
}
