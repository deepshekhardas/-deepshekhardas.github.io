import { Stars } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

export function StarsBackground() {
  const groupRef = useRef<THREE.Group>(null)
  const { camera } = useThree()

  useFrame(() => {
    if (!groupRef.current) return
    const parallax = 0.02
    const target = new THREE.Vector3().copy(camera.position).multiplyScalar(parallax)
    groupRef.current.position.lerp(target, 0.05)
  })

  return (
    <group ref={groupRef}>
      <Stars
        radius={200}
        depth={60}
        count={10000}
        factor={2}
        saturation={0}
        fade
        speed={0.2}
      />
    </group>
  )
}

