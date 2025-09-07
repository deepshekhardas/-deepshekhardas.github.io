import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMemo, useRef } from 'react'

const SunMaterial = shaderMaterial(
  // uniforms
  { uTime: 0, uColor: new THREE.Color(1.0, 0.65, 0.2) },
  // vertex shader
  `
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vNormal = normalMatrix * normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // fragment shader
  `
  varying vec3 vNormal;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColor;

  // Simple hash noise
  float hash(vec2 p){ p = 50.0 * fract(p * 0.3183099 + vec2(0.1,0.7)); return -1.0 + 2.0 * fract(p.x * p.y * (p.x + p.y)); }
  float noise(in vec2 p){ vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f); return mix( mix( hash( i + vec2(0.0,0.0) ), hash( i + vec2(1.0,0.0) ), u.x), mix( hash( i + vec2(0.0,1.0) ), hash( i + vec2(1.0,1.0) ), u.x), u.y ); }

  void main(){
    float n = 0.0;
    vec2 uv = vUv * 8.0;
    n += noise(uv + uTime * 0.05);
    n += 0.5 * noise(uv * 2.0 - uTime * 0.08);
    n += 0.25 * noise(uv * 4.0 + uTime * 0.12);
    n = clamp(n, 0.0, 1.0);

    // Rim glow
    float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0,0.0,1.0)), 0.0), 2.0);
    vec3 color = uColor * (1.2 + 1.2 * n) + rim * 0.6 * vec3(1.0,0.6,0.2);
    gl_FragColor = vec4(color, 1.0);
  }
  `
)

extend({ SunMaterial })

export function Sun({ position = [0,0,0], intensity = 2.5, distance = 200, decay = 2, onDoubleClick }: {
  position?: [number, number, number]
  intensity?: number
  distance?: number
  decay?: number
  onDoubleClick?: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<any>(null)

  useFrame((_s, delta) => {
    if (matRef.current) matRef.current.uTime += delta * 60.0
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.02
  })

  const geom = useMemo(() => new THREE.SphereGeometry(1.8, 64, 64), [])

  return (
    <group position={position as unknown as THREE.Vector3} name="Sun">
      <pointLight position={[0,0,0]} intensity={intensity} distance={distance} decay={decay} color={0xffee88} />
      {/* Emissive core */}
      <mesh ref={meshRef} onDoubleClick={onDoubleClick} geometry={geom}>
        {/* @ts-ignore jsx-intrinsic */}
        <sunMaterial ref={matRef} attach="material" transparent={false} />
      </mesh>
    </group>
  )
}

