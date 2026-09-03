import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import MomentPlane, { FOCUS_DIST, FOCUS_SCALE, PHOTO_H } from '../components/MomentPlane.jsx';
import SparkleCursor from '../components/SparkleCursor.jsx';
import MomentsMark from '../components/MomentsMark.jsx';
import CanvasMenu from '../components/CanvasMenu.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import { formatDate, formatTime } from '../lib/format.js';

// The 3D gallery — a dense field of memories on a gentle dome. Photos fill a
// grid from the center outward (tight, even, never overlapping, no big gaps),
// curved onto a shallow dome so they angle at the edges in both axes. Move the
// cursor to pan across the field (photos glide opposite); it stops when the
// cursor stops and rubber-bands at the edges (bounded — no infinite void).
// "Upload a moment" unchanged.
const HELVETICA = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const BG = '#050506'; // near-black: translucency & atmospheric fade read as depth, not wash
const DENSE_CELL = 1.6; // tightest spacing — smaller than a photo, so they overlap
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

// deterministic [0,1) hash of a grid cell — used only to break exact fill-order
// ties so mirror cells don't systematically favor one side
function cellJitter(gx, gy) {
  let h = Math.imul(gx ^ 0x9e3779b1, 2654435761) ^ Math.imul(gy ^ 0x85ebca6b, 40503);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  return ((h >>> 0) % 100000) / 100000;
}

export default function Gallery3D({ entries: rawEntries, onAddMoment, coverId, onSetCover, onDeletePhoto, onDeleteAlbum }) {
  // Only entries with a real image blob reach the canvas — a missing/invalid blob
  // would crash URL.createObjectURL and blank the whole screen. (Undecodable-but-
  // valid blobs, e.g. legacy HEIC, still slip through here and are caught per-card
  // by the ErrorBoundary around each MomentPlane.)
  const entries = useMemo(() => rawEntries.filter((e) => e.photoBlob instanceof Blob), [rawEntries]);
  const [focusedId, setFocusedId] = useState(null);
  const vel = useRef({ x: 0, y: 0 }); // pan velocity from cursor movement
  const offset = useRef({ x: 0, y: 0 }); // current camera pan
  const last = useRef(null); // last cursor position (px)
  const wordmarkRef = useRef(null); // measured to place the focused photo 48px below it
  const [focusLayout, setFocusLayout] = useState({ up: 0.5, captionTop: null });

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

    // how much world-space the camera sees at the photos' plane (z ≈ 0).
    // Guard the aspect: a hidden/zero-size viewport would make it 0/NaN/Infinity,
    // which would empty the cell grid below and crash — fall back to a sane 16:10.
    let aspect = typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 1.6;
    if (!(aspect > 0.2 && aspect < 6)) aspect = 1.6;
    const viewH = 2 * CAM_Z * Math.tan(((FOV / 2) * Math.PI) / 180);
    const viewW = viewH * aspect;

    // build grid cells and order them by aspect-weighted rings from the center
    // (primary: which rectangular ring; secondary: distance within it, for a smooth
    // spiral). The final `jit` tiebreak is a deterministic per-cell hash so that
    // mirror cells (e.g. left vs right) fill in an unbiased order — otherwise the
    // stable sort keeps generation order and the field leans to one side.
    const R = Math.ceil(Math.sqrt(n)) + 2;
    const cells = [];
    for (let gx = -Math.ceil(R * aspect); gx <= Math.ceil(R * aspect); gx++)
      for (let gy = -R; gy <= R; gy++)
        cells.push({
          gx,
          gy,
          ring: Math.max(Math.abs(gx) / aspect, Math.abs(gy)),
          rad: (gx / aspect) ** 2 + gy ** 2,
          jit: cellJitter(gx, gy),
        });
    cells.sort((a, b) => a.ring - b.ring || a.rad - b.rad || a.jit - b.jit);
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

  // When a photo is spotlit, project its on-screen bounds so the wordmark sits 48px
  // above it and the caption 24px below it (the photo's screen HEIGHT is constant,
  // so this holds for any photo). Recomputed on focus and on resize.
  useLayoutEffect(() => {
    if (focusedId === null) return;
    function compute() {
      const vh = window.innerHeight;
      const viewHalf = FOCUS_DIST * Math.tan(((FOV / 2) * Math.PI) / 180); // world half-height at the photo plane
      const halfH = (PHOTO_H * FOCUS_SCALE) / 2;
      const wm = wordmarkRef.current?.getBoundingClientRect();
      const wordBottom = wm ? wm.bottom : 112;
      const topPx = wordBottom + 48; // photo TOP sits 48px below MOMENTS
      // world up-offset so the photo's top edge projects to topPx
      const up = viewHalf * (1 - (2 * topPx) / vh) - halfH;
      // caption sits 24px below the photo's bottom edge
      const captionTop = (vh / 2) * (1 - (up - halfH) / viewHalf) + 24;
      setFocusLayout({ up, captionTop });
    }
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [focusedId]);

  // cursor MOVEMENT pans the field opposite; stops when the cursor stops. While a
  // photo is focused the field is frozen, so the spotlit photo stays put.
  function onMove(e) {
    if (focusedId !== null) {
      last.current = { x: e.clientX, y: e.clientY };
      return;
    }
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
        <PanRig vel={vel} offset={offset} bound={bound} frozen={focusedId !== null} />
        {/* each photo in its own Suspense so they stream in as they decode,
            instead of the whole field blocking until every texture is ready */}
        {cards.map((c) => (
          // per-photo boundary: a texture that fails to decode is skipped, not fatal
          <ErrorBoundary key={c.id} fallback={null}>
            <Suspense fallback={null}>
              <MomentPlane
                id={c.id}
                url={urlById.get(c.id)}
                position={c.position}
                depth={c.depth}
                focused={focusedId === c.id}
                dimmed={focusedId !== null && focusedId !== c.id}
                focusUp={focusLayout.up}
                onFocus={setFocusedId}
              />
            </Suspense>
          </ErrorBoundary>
        ))}
      </Canvas>

      {/* soft dark boundaries on all four sides (fade to the near-black bg) */}
      <div className="pointer-events-none fixed inset-0 z-10">
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#050506] via-[#050506]/85 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#050506] to-transparent" />
        <div className="absolute inset-y-0 left-0 w-36 bg-gradient-to-r from-[#050506] to-transparent" />
        <div className="absolute inset-y-0 right-0 w-36 bg-gradient-to-l from-[#050506] to-transparent" />
      </div>

      <SparkleCursor />

      {/* top-right menu (custom icon → Upload a moment · Delete album), aligned
          with the "moments" wordmark on the left */}
      <CanvasMenu
        onUpload={onAddMoment}
        onDeleteAlbum={onDeleteAlbum}
        rightInset="40px"
        top="40px"
      />

      {/* wordmark: left-aligned, top-left (browser Back returns to the shelf) */}
      <div ref={wordmarkRef} className="pointer-events-none fixed left-7 top-[44px] z-20">
        <MomentsMark />
      </div>

      {/* caption for the focused moment — sits BELOW the spotlit photo, in the
          dimmed space, styled like the reference: an airy letter-spaced title with
          a smaller tracked subtitle beneath */}
      {focused && focusLayout.captionTop != null && (
        <div
          key={focused.id}
          className="caption-in pointer-events-none fixed inset-x-0 z-20 flex flex-col items-center gap-2 px-8 text-center"
          style={{ top: focusLayout.captionTop }}
        >
          {focused.place && (
            <p
              className="uppercase leading-[1.2] text-[24px] tracking-[0.08em] text-white/95"
              style={{ fontFamily: '"Newsreader", serif', fontWeight: 300 }}
            >
              {focused.place}
            </p>
          )}
          {focused.capturedAt instanceof Date && (
            <p
              className="uppercase text-[16px] tracking-[0.18em] text-white/55"
              style={{ fontFamily: '"Newsreader", serif', fontWeight: 300 }}
            >
              {formatDate(focused.capturedAt)}
              {focused.showTime ? `  ·  ${formatTime(focused.capturedAt)}` : ''}
            </p>
          )}

          {/* per-photo actions (Figma "delete photo UI" 283:466): set this moment
              as the album cover · delete this moment */}
          <div className="mt-4 flex items-center gap-4" style={{ fontFamily: HELVETICA }}>
            {onSetCover && (
              <button
                type="button"
                onClick={() => onSetCover(focused.id)}
                disabled={focused.id === coverId}
                className="pointer-events-auto cursor-pointer border border-white bg-white px-4 py-2 text-[16px] leading-none tracking-[-0.8px] text-[#2c2c2c] transition-colors hover:bg-[#e6e6e6] disabled:cursor-default disabled:opacity-55"
              >
                {focused.id === coverId ? 'Album cover ✓' : 'Set as album cover'}
              </button>
            )}
            {onDeletePhoto && (
              <button
                type="button"
                onClick={() => {
                  const id = focused.id;
                  setFocusedId(null); // return to the live canvas
                  onDeletePhoto(id);
                }}
                className="pointer-events-auto cursor-pointer border-[0.5px] border-white px-4 py-2 text-[16px] leading-none tracking-[-0.8px] text-white transition-colors hover:bg-white/10"
              >
                Delete photo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Cursor movement pans the camera across the field; velocity decays (stops when
// the cursor stops). At the field edge the offset is hard-clamped and its velocity
// killed — so it eases to a smooth, buttery stop with no rubber-band bounce.
function PanRig({ vel, offset, bound, frozen }) {
  useFrame((state, dt) => {
    const v = vel.current;
    const o = offset.current;
    if (frozen) {
      // a photo is spotlit — hold the camera perfectly still so it stays stationary
      v.x = 0;
      v.y = 0;
      return;
    }
    o.x += v.x;
    o.y += v.y;
    v.x *= 0.9; // more inertia → buttery gliding after the cursor eases off
    v.y *= 0.9;
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
