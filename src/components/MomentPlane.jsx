import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { easing } from 'maath';
import * as THREE from 'three';

// One moment as a gently CURVED, waved panel on the inside of the cylinder —
// it bends to the wall (fluid, paper-like, not a stiff rectangle) and faces the
// central axis. Natural aspect (never cropped), subtle roll, hover lift, and a
// click that eases it in front of the camera to "focus".
const _dir = new THREE.Vector3();
const _target = new THREE.Vector3();
const SEG_X = 26;
const SEG_Y = 18;
const CURVE_R = 3.4; // how tightly the panel curves (smaller = more bend)

// build a plane that curves around the cylinder + a soft static wave (paper feel)
function curvedGeometry(w, h) {
  const g = new THREE.PlaneGeometry(w, h, SEG_X, SEG_Y);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const a = x / CURVE_R;
    const nx = CURVE_R * Math.sin(a);
    const nz = CURVE_R * Math.cos(a) - CURVE_R; // edges recede (conform to wall)
    const wave = Math.sin(x * 1.7 + y * 1.2) * 0.05 + Math.sin(y * 2.3) * 0.03;
    p.setXYZ(i, nx, y, nz + wave);
  }
  p.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

function rollOf(id) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return (((h >>> 0) % 1000) / 1000 - 0.5) * 0.18;
}

export default function MomentPlane({ id, url, position, focused, onFocus }) {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);
  const roll = useRef(rollOf(id));

  const tex = useTexture(url);
  useEffect(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
  }, [tex]);

  const aspect = tex.image ? tex.image.width / tex.image.height : 1;
  const baseH = 1.6; // smaller photos
  const baseW = baseH * aspect;

  const geo = useMemo(() => curvedGeometry(baseW, baseH), [baseW]);
  useEffect(() => () => geo.dispose(), [geo]);

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
      // face the sphere's center with NO roll (yaw + pitch only) so photos never
      // twist awkwardly, wherever they sit on the sphere
      const [px, py, pz] = position;
      const d = Math.hypot(px, py, pz) || 1;
      g.rotation.set(Math.asin(py / d), Math.atan2(-px, -pz), roll.current, 'YXZ');
      easing.damp3(g.scale, hovered ? [1.1, 1.1, 1.1] : [1, 1, 1], 0.2, dt);
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
      <meshBasicMaterial map={tex} side={THREE.DoubleSide} transparent toneMapped={false} />
    </mesh>
  );
}
