import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import MomentPlane from '../components/MomentPlane.jsx';
import Wordmark from '../components/Wordmark.jsx';
import { PlusIcon } from '../components/icons.jsx';
import { formatDate, formatTime } from '../lib/format.js';

// The 3D gallery — a dense field of memories on a gentle dome. Photos fill a
// grid from the center outward (tight, even, never overlapping, no big gaps),
// curved onto a shallow dome so they angle at the edges in both axes. Move the
// cursor to pan across the field (photos glide opposite); it stops when the
// cursor stops and rubber-bands at the edges (bounded — no infinite void).
// "Upload a moment" unchanged.
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const BG = '#0a0a0c'; // near-black: translucency & atmospheric fade read as depth, not wash
const DENSE_CELL = 1.45; // tightest spacing — smaller than a photo, so they overlap
                         // (the Z-depth scatter turns that overlap into layered depth)
const DEPTH = 3.6; // how far photos scatter toward/away from the camera in Z — wider
                   // spread = stronger near/far/furthest variance (size, brightness, opacity)
const FOV = 46; // must match the <Canvas> camera fov
const CAM_Z = 8; // must match the <Canvas> camera z

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

  // Photos fill a centered, viewport-proportioned rectangle. Cells are ordered from
  // the CENTER OUTWARD in aspect-matched rectangular rings — so as moments are added
  // they ring out on all four sides evenly (not piling at the top), the interior stays
  // uniformly dense, and corners fill in (a rectangle, not a circle → no empty corners).
  // Cell size adapts so the field always at least fills the screen; pan bounds =
  // (field − viewport) so the view never leaves the filled area. Depth is per-photo
  // random so any photo is reachable/clear when you pan to it.
  const { cards, bound } = useMemo(() => {
    const n = entries.length;

    // how much world-space the camera sees at the photos' plane (z ≈ 0)
    const aspect = typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 1.78;
    const viewH = 2 * CAM_Z * Math.tan(((FOV / 2) * Math.PI) / 180);
    const viewW = viewH * aspect;

    // build grid cells and order them by aspect-weighted rings from the center
    // (primary: which rectangular ring; secondary: distance within it, for a smooth spiral)
    const R = Math.ceil(Math.sqrt(n)) + 2;
    const cells = [];
    for (let gx = -Math.ceil(R * aspect); gx <= Math.ceil(R * aspect); gx++)
      for (let gy = -R; gy <= R; gy++)
        cells.push({ gx, gy, ring: Math.max(Math.abs(gx) / aspect, Math.abs(gy)), rad: (gx / aspect) ** 2 + gy ** 2 });
    cells.sort((a, b) => a.ring - b.ring || a.rad - b.rad);
    const used = cells.slice(0, n);

    // grid extent (in cells) of what's actually filled, so the field is proportioned
    const spanX = Math.max(1, ...used.map((c) => Math.abs(c.gx))) * 2 + 1;
    const spanY = Math.max(1, ...used.map((c) => Math.abs(c.gy))) * 2 + 1;

    // spacing: never looser than DENSE_CELL, but wide enough to cover the viewport
    const FILL = 1.2;
    const cell = Math.max(DENSE_CELL, (viewW * FILL) / spanX, (viewH * FILL) / spanY);

    const maxGx = (spanX - 1) / 2 || 1;
    const maxGy = (spanY - 1) / 2 || 1;
    let maxX = 0;
    let maxY = 0;
    const cards = entries.map((e, i) => {
      const c = used[i];
      const x = c.gx * cell + rand(e.id, 1) * cell * 0.16;
      const y = c.gy * cell + rand(e.id, 2) * cell * 0.16;
      let z = rand(e.id, 3) * DEPTH; // per-photo depth (some in front, some behind)
      // NEAR photos (z > 0) project further past the screen edge, so a near photo
      // at the field edge would hang mostly off-view. Ease its nearness toward the
      // edge (0 = center, 1 = edge) so the outer ring holds the farther, smaller
      // photos that stay on-screen; far photos (z < 0) project inward and are fine.
      const r = Math.min(1, Math.hypot(Math.abs(c.gx) / maxGx, Math.abs(c.gy) / maxGy));
      if (z > 0) z *= 1 - 0.75 * r;
      maxX = Math.max(maxX, Math.abs(x));
      maxY = Math.max(maxY, Math.abs(y));
      // depth 0..1 (0 = furthest/small/dim/translucent, 1 = nearest/big/bright/solid)
      const depth = (z + DEPTH) / (2 * DEPTH);
      return { id: e.id, position: [x, y, z], depth };
    });

    // Pan bounds: let the view reach the edge photos, but no further. Near photos
    // (high depth) sit closer to the camera, so they project further past the screen
    // edge — the margin scales with that so top/bottom/side photos aren't clipped.
    // Any black beyond the field is covered by the dark edge-fade gradients.
    const nearAmp = CAM_Z / (CAM_Z - DEPTH); // how much the nearest photos stick out
    const margin = 0.8 * nearAmp + 0.3; // ~half a photo, amplified for near ones
    const bx = Math.max(0, maxX - viewW / 2 + margin);
    const by = Math.max(0, maxY - viewH / 2 + margin);
    return { cards, bound: { x: bx, y: by } };
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
        {/* fog fades photos into the black by distance: near ones crisp, far
            ones sink toward the background — strong atmospheric depth */}
        <fog attach="fog" args={[BG, 7, 14]} />
        <PanRig vel={vel} offset={offset} bound={bound} />
        {/* each photo in its own Suspense so they stream in as they decode,
            instead of the whole field blocking until every texture is ready */}
        {cards.map((c) => (
          <Suspense key={c.id} fallback={null}>
            <MomentPlane
              id={c.id}
              url={urlById.get(c.id)}
              position={c.position}
              depth={c.depth}
              focused={focusedId === c.id}
              onFocus={setFocusedId}
            />
          </Suspense>
        ))}
      </Canvas>

      {/* soft dark boundaries on all four sides (fade to the near-black bg) */}
      <div className="pointer-events-none fixed inset-0 z-10">
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#0a0a0c] via-[#0a0a0c]/85 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#0a0a0c] to-transparent" />
        <div className="absolute inset-y-0 left-0 w-36 bg-gradient-to-r from-[#0a0a0c] to-transparent" />
        <div className="absolute inset-y-0 right-0 w-36 bg-gradient-to-l from-[#0a0a0c] to-transparent" />
      </div>

      <div className="pointer-events-none fixed inset-0 z-20 flex flex-col items-center">
        <Wordmark color="#f4f4f4" />
      </div>

      {focused && (
        <div className="pointer-events-none fixed inset-x-0 bottom-28 z-20 flex flex-col items-center text-center">
          {focused.place && (
            <p className="text-[22px] text-[#eaeaea]" style={{ fontFamily: '"Mulish", sans-serif', fontWeight: 500 }}>
              {focused.place}
            </p>
          )}
          {focused.capturedAt instanceof Date && (
            <p className="text-[16px] italic text-[#9a9a9a]" style={{ fontFamily: '"Newsreader", serif' }}>
              {formatDate(focused.capturedAt)}
              {focused.showTime ? ` · ${formatTime(focused.capturedAt)}` : ''}
            </p>
          )}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-10 z-20 flex justify-center">
        <label
          className="pointer-events-auto flex cursor-pointer items-center gap-2 bg-white px-[22px] py-3 text-[18px] tracking-[-0.9px] text-[#0a0a0c] shadow-[0_6px_24px_rgba(0,0,0,0.5)] transition-colors hover:bg-[#e8e8e8]"
          style={{ fontFamily: HELVETICA, fontWeight: 400 }}
        >
          <PlusIcon /> Upload a moment
          <input type="file" accept="image/*,.heic,.heif" multiple className="hidden" onChange={(e) => onAddMoment(e.target.files)} />
        </label>
      </div>
    </div>
  );
}

// Cursor movement pans the camera across the field; velocity decays (stops when
// the cursor stops). At the field edge the offset is hard-clamped and its velocity
// killed — so it eases to a smooth, buttery stop with no rubber-band bounce.
function PanRig({ vel, offset, bound }) {
  useFrame((state, dt) => {
    const v = vel.current;
    const o = offset.current;
    o.x += v.x;
    o.y += v.y;
    v.x *= 0.82;
    v.y *= 0.82;
    // hard stop at the edge (no overshoot, no spring-back → no bounce)
    if (o.x <= -bound.x) { o.x = -bound.x; if (v.x < 0) v.x = 0; }
    else if (o.x >= bound.x) { o.x = bound.x; if (v.x > 0) v.x = 0; }
    if (o.y <= -bound.y) { o.y = -bound.y; if (v.y < 0) v.y = 0; }
    else if (o.y >= bound.y) { o.y = bound.y; if (v.y > 0) v.y = 0; }
    easing.damp3(state.camera.position, [o.x, o.y, CAM_Z], 0.15, dt);
    state.camera.lookAt(o.x, o.y, -5);
  });
  return null;
}
