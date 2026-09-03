import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { easing } from 'maath';
import * as THREE from 'three';

// One moment as a FLAT photo, angled toward the screen center to fake a concave
// fish-eye anchored to the camera (see the tilt math below). Natural aspect
// (never cropped), hover lift, and a click that eases it in front of the camera
// to "focus".
const _dir = new THREE.Vector3();
const _target = new THREE.Vector3();
const _pt = [0, 0, 0]; // reusable position target (avoids per-frame allocations)
const ANGLE = 0.11; // base radians of tilt per unit of distance from center
const EDGE = 0.06; // extra tilt that ramps up with distance (edges bend more)
// Focused-photo geometry (shared with Gallery3D so it can project the photo's
// on-screen bounds and place the wordmark / caption at exact pixel gaps).
export const FOCUS_DIST = 5; // distance from camera when spotlit
export const FOCUS_SCALE = 1.35; // scale when spotlit
export const PHOTO_H = 1.5; // base plane height (before focus scale)

export default function MomentPlane({ id, url, position, depth = 0.5, focused, dimmed, focusUp = 0.5, onFocus }) {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);

  const tex = useTexture(url);
  useEffect(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
  }, [tex]);

  const aspect = tex.image ? tex.image.width / tex.image.height : 1;
  const baseH = PHOTO_H; // small photos, like the reference
  const baseW = baseH * aspect;

  const geo = useMemo(() => new THREE.PlaneGeometry(baseW, baseH), [baseW]);
  useEffect(() => () => geo.dispose(), [geo]);

  // Depth tiers (depth: 1 = nearest, 0 = furthest) drive three cues together so
  // the field reads as near / far / furthest:
  //   size       — nearest full, furthest shrinks to ~0.55 (on top of perspective)
  //   brightness — nearest full-bright, furthest dimmed to ~0.6 (stable, not just fog)
  //   opacity    — nearest solid/vivid, furthest more translucent (melts into black)
  const depthScale = 0.55 + 0.45 * depth;
  const brightness = 0.6 + 0.3 * depth;
  const depthOpacity = 0.68 + 0.25 * depth;

  // "wind" strength (0..1) eases up while the cursor is over the photo and back
  // down when it leaves; a per-photo phase keeps the sways out of sync.
  const windRef = useRef(0);
  const phase = useMemo(() => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (Math.imul(h, 31) + id.charCodeAt(i)) >>> 0;
    return ((h % 1000) / 1000) * Math.PI * 2;
  }, [id]);

  // seed the material at its depth values on mount so it doesn't flash bright
  // before useFrame takes over the animation
  useEffect(() => {
    const m = ref.current?.material;
    if (m) {
      m.color.setScalar(brightness);
      m.opacity = depthOpacity;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;

    // "hot" = the cute cursor reaction is live (only while browsing — not the
    // focused photo, and not one dimmed behind a spotlight).
    const hot = hovered && !focused && !dimmed;

    // Spotlight: focused → full bright/opaque; another focused → this one dims &
    // fades back; else its depth values. (No hover brightness change — the cursor
    // reaction is pure motion, below.)
    const targetBright = focused ? 1 : dimmed ? 0.04 : brightness;
    const targetOpacity = focused ? 1 : dimmed ? 0.22 : depthOpacity;
    easing.dampC(g.material.color, [targetBright, targetBright, targetBright], 0.2, dt);
    easing.damp(g.material, 'opacity', targetOpacity, 0.2, dt);

    if (focused) {
      state.camera.getWorldDirection(_dir);
      _target.copy(state.camera.position).addScaledVector(_dir, FOCUS_DIST);
      _target.y += focusUp; // vertical offset chosen by Gallery3D for exact caption spacing
      easing.damp3(g.position, _target.toArray(), 0.3, dt);
      g.lookAt(state.camera.position);
      easing.damp3(g.scale, [FOCUS_SCALE, FOCUS_SCALE, FOCUS_SCALE], 0.26, dt);
    } else {
      // Cursor reaction = WIND: while hovered, the photo rocks and drifts on its
      // axes like a sheet of paper caught in a breeze, then settles as the cursor
      // moves on. `w` eases the gust in/out; sines on different periods (offset by
      // the per-photo phase) make it flutter rather than tilt uniformly.
      easing.damp(windRef, 'current', hot ? 1 : 0, 0.16, dt);
      const w = windRef.current;
      const t = state.clock.elapsedTime;

      // base concave fish-eye tilt (camera-anchored), same as before
      const dx = position[0] - state.camera.position.x;
      const dy = position[1] - state.camera.position.y;
      const tilt = ANGLE * (1 + EDGE * Math.hypot(dx, dy));
      const swayX = Math.sin(t * 2.6 + phase) * 0.1 * w;
      const swayY = Math.sin(t * 2.0 + phase * 1.6) * 0.12 * w;
      const swayZ = Math.sin(t * 2.3 + phase * 0.7) * 0.07 * w;
      g.rotation.set(dy * tilt + swayX, -dx * tilt + swayY, swayZ, 'YXZ');

      // a little positional drift so it lifts and settles in the gust too
      _pt[0] = position[0] + Math.sin(t * 1.7 + phase * 1.3) * 0.12 * w;
      _pt[1] = position[1] + Math.sin(t * 2.1 + phase) * 0.1 * w;
      _pt[2] = position[2] + Math.sin(t * 2.4 + phase * 0.5) * 0.18 * w;
      easing.damp3(g.position, _pt, w > 0.02 ? 0.12 : 0.4, dt);

      easing.damp3(g.scale, [depthScale, depthScale, depthScale], 0.22, dt);
    }
  });

  return (
    <mesh
      ref={ref}
      position={position}
      geometry={geo}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onFocus(focused ? null : id);
      }}
    >
      {/* color + opacity are animated imperatively in useFrame (depth dim, spotlight,
          and the focused/dimmed transitions); initialized on mount below */}
      <meshBasicMaterial map={tex} side={THREE.DoubleSide} transparent toneMapped={false} />
    </mesh>
  );
}
