import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Image } from '@react-three/drei';
import { easing } from 'maath';
import * as THREE from 'three';

// One moment as a photo plane on the inside of the sphere, facing the center
// (the camera). Natural aspect (never cropped), a subtle organic roll, hover
// lift, and a click that eases it in front of the camera to "focus" (from
// whatever angle you've rotated to). Double-sided as a safety net.
const _dir = new THREE.Vector3();
const _target = new THREE.Vector3();

function rollOf(id) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return (((h >>> 0) % 1000) / 1000 - 0.5) * 0.22; // small ±roll
}

export default function MomentPlane({ id, url, position, focused, onFocus }) {
  const ref = useRef();
  const imgRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [aspect, setAspect] = useState(1); // real photo aspect, loaded below
  const roll = useRef(rollOf(id));

  // read the photo's natural aspect so the plane matches it (no crop)
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => img.naturalHeight && setAspect(img.naturalWidth / img.naturalHeight);
    img.src = url;
  }, [url]);

  // double-sided so it's visible from any angle
  useEffect(() => {
    if (imgRef.current?.material) imgRef.current.material.side = THREE.DoubleSide;
  });

  const baseH = 2.7;
  const baseW = baseH * aspect;

  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    if (focused) {
      // ease to a point in front of the camera and face it
      state.camera.getWorldDirection(_dir);
      _target.copy(state.camera.position).addScaledVector(_dir, 4.5);
      easing.damp3(g.position, _target.toArray(), 0.25, dt);
      g.lookAt(state.camera.position);
      easing.damp3(g.scale, [1.5, 1.5, 1.5], 0.2, dt);
    } else {
      easing.damp3(g.position, position, 0.5, dt);
      g.lookAt(0, position[1], 0); // face the cylinder axis at its own height (upright)
      g.rotateZ(roll.current); // a touch of organic roll
      easing.damp3(g.scale, hovered ? [1.12, 1.12, 1.12] : [1, 1, 1], 0.2, dt);
    }
  });

  return (
    <group
      ref={ref}
      position={position}
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
