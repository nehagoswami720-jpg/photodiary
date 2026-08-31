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
const ANGLE = 0.11; // base radians of tilt per unit of distance from center
const EDGE = 0.06; // extra tilt that ramps up with distance (edges bend more)

export default function MomentPlane({ id, url, position, depth = 0.5, focused, onFocus }) {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);

  const tex = useTexture(url);
  useEffect(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
  }, [tex]);

  const aspect = tex.image ? tex.image.width / tex.image.height : 1;
  const baseH = 1.5; // small photos, like the reference
  const baseW = baseH * aspect;

  const geo = useMemo(() => new THREE.PlaneGeometry(baseW, baseH), [baseW]);
  useEffect(() => () => geo.dispose(), [geo]);

  // Depth tiers (depth: 1 = nearest, 0 = furthest) drive three cues together so
  // the field reads as near / far / furthest:
  //   size       — nearest full, furthest shrinks to ~0.55 (on top of perspective)
  //   brightness — nearest full-bright, furthest dimmed to ~0.6 (stable, not just fog)
  //   opacity    — nearest solid/vivid, furthest more translucent (melts into black)
  const depthScale = 0.55 + 0.45 * depth;
  const brightness = 0.6 + 0.4 * depth;
  const depthOpacity = 0.62 + 0.26 * depth;

  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    if (focused) {
      state.camera.getWorldDirection(_dir);
      _target.copy(state.camera.position).addScaledVector(_dir, 4);
      easing.damp3(g.position, _target.toArray(), 0.25, dt);
      g.lookAt(state.camera.position);
      easing.damp3(g.scale, [2, 2, 2], 0.2, dt);
    } else {
      easing.damp3(g.position, position, 0.5, dt);
      // Concave fish-eye anchored to the CAMERA, not the world: tilt is based on
      // where this photo sits relative to the screen center (the camera's x/y),
      // recomputed every frame so the lens follows you as you pan. The photo in
      // the middle of the view faces you flat; the farther toward the screen
      // edge, the more it angles inward. No Z roll — a perspective tilt.
      const dx = position[0] - state.camera.position.x;
      const dy = position[1] - state.camera.position.y;
      const tilt = ANGLE * (1 + EDGE * Math.hypot(dx, dy));
      g.rotation.set(dy * tilt, -dx * tilt, 0, 'YXZ');
      const s = hovered ? depthScale * 1.1 : depthScale;
      easing.damp3(g.scale, [s, s, s], 0.2, dt);
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
      {/* depth-driven dim + translucency (near = bright/solid, far = dim/see-through);
          a focused photo snaps to full brightness and opacity */}
      <meshBasicMaterial
        map={tex}
        side={THREE.DoubleSide}
        transparent
        color={focused ? [1, 1, 1] : [brightness, brightness, brightness]}
        opacity={focused ? 1 : depthOpacity}
        toneMapped={false}
      />
    </mesh>
  );
}
