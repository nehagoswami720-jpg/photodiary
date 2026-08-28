import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Image } from '@react-three/drei';
import { easing } from 'maath';

// One moment as a photo plane floating in 3D space. Natural aspect (never
// cropped), a gentle idle drift, hover-lift, and a click that eases it toward
// the camera to "focus". Purely presentational — it just shows the entry's
// already-prepared image URL (HEIC is converted upstream).
// small deterministic tilt per card so photos feel placed in space (not a flat wall)
function tilt(id, salt) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return (((h >>> 0) % 1000) / 1000 - 0.5) * 0.5; // ~±0.25 rad
}

export default function MomentPlane({ id, url, position, focused, onFocus }) {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);
  const [aspect, setAspect] = useState(1); // real photo aspect, loaded below
  const phase = useRef(Math.random() * Math.PI * 2); // each card drifts differently
  const baseRot = useRef([tilt(id, 7), tilt(id, 11), tilt(id, 13) * 0.3]);

  // read the photo's natural aspect so the plane matches it (no crop)
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => img.naturalHeight && setAspect(img.naturalWidth / img.naturalHeight);
    img.src = url;
  }, [url]);

  const baseH = 2.7;
  const baseW = baseH * aspect;

  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime + phase.current;
    const driftX = Math.sin(t * 0.4) * 0.08;
    const driftY = Math.cos(t * 0.33) * 0.08;
    const lift = focused || hovered;
    const target = focused
      ? [state.camera.position.x, state.camera.position.y, state.camera.position.z - 3.6]
      : [position[0] + driftX, position[1] + driftY, position[2]];
    easing.damp3(g.position, target, focused ? 0.25 : 0.5, dt);
    const s = focused ? 1.5 : hovered ? 1.18 : 1;
    easing.damp3(g.scale, [s, s, s], 0.2, dt);
    // straighten toward the camera when lifted/focused, else rest at the tilt
    const rot = lift ? [0, 0, 0] : baseRot.current;
    easing.dampE(g.rotation, rot, 0.3, dt);
  });

  return (
    <group
      ref={ref}
      position={position}
      rotation={baseRot.current}
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
      <Image url={url} transparent scale={[baseW, baseH]} radius={0.03} />
    </group>
  );
}
