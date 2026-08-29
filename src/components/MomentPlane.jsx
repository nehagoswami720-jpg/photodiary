import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Image } from '@react-three/drei';
import { easing } from 'maath';
import * as THREE from 'three';

// One moment as a photo plane floating in 3D space. Natural aspect (never
// cropped), a gentle idle drift, a subtle tilt that straightens on hover, and
// a click that eases it in front of the camera (from whatever angle you've
// orbited to) to "focus". Double-sided so the cloud reads from any direction.
const _dir = new THREE.Vector3();
const _target = new THREE.Vector3();

// small deterministic tilt per card so photos feel placed in space
function tilt(id, salt) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return (((h >>> 0) % 1000) / 1000 - 0.5) * 0.5; // ~±0.25 rad
}

export default function MomentPlane({ id, url, position, focused, onFocus }) {
  const ref = useRef();
  const imgRef = useRef();
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

  // double-sided so the photo is visible from any orbit angle
  useEffect(() => {
    if (imgRef.current?.material) imgRef.current.material.side = THREE.DoubleSide;
  });

  const baseH = 2.7;
  const baseW = baseH * aspect;

  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    if (focused) {
      // ease to a point in front of the camera and face it, wherever we've orbited
      state.camera.getWorldDirection(_dir);
      _target.copy(state.camera.position).addScaledVector(_dir, 4.2);
      easing.damp3(g.position, _target.toArray(), 0.25, dt);
      g.lookAt(state.camera.position);
      easing.damp3(g.scale, [1.5, 1.5, 1.5], 0.2, dt);
    } else {
      const t = state.clock.elapsedTime + phase.current;
      const dx = Math.sin(t * 0.4) * 0.08;
      const dy = Math.cos(t * 0.33) * 0.08;
      easing.damp3(g.position, [position[0] + dx, position[1] + dy, position[2]], 0.5, dt);
      easing.dampE(g.rotation, hovered ? [0, 0, 0] : baseRot.current, 0.3, dt);
      easing.damp3(g.scale, hovered ? [1.18, 1.18, 1.18] : [1, 1, 1], 0.2, dt);
    }
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
      <Image ref={imgRef} url={url} transparent scale={[baseW, baseH]} radius={0.03} />
    </group>
  );
}
