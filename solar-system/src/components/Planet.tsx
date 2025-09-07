import { useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState } from 'react'

export type PlanetInfo = {
  name: string
  worldPosition: THREE.Vector3
  diameterKm?: number
  distanceFromSunAU?: number
  orbitDays?: number
}

export type PlanetHandle = {
  object3D: THREE.Object3D
}

type RingProps = { map: string; inner: number; outer: number }

type PlanetProps = {
  name: string
  radius: number
  distance: number
  orbitSpeed: number
  rotationSpeed: number
  tilt?: number
  texture: string
  normal?: string
  clouds?: string
  ring?: RingProps
  register?: (name: string, handle: PlanetHandle | null) => void
  onDoubleClick?: (info: PlanetInfo) => void
  onHover?: (info: PlanetInfo | null) => void
  onClick?: (info: PlanetInfo) => void
}

const PLANET_FACTS: Record<string, { diameterKm: number; distanceFromSunAU: number; orbitDays: number }> = {
  Mercury: { diameterKm: 4879, distanceFromSunAU: 0.39, orbitDays: 88 },
  Venus: { diameterKm: 12104, distanceFromSunAU: 0.72, orbitDays: 225 },
  Earth: { diameterKm: 12742, distanceFromSunAU: 1.0, orbitDays: 365 },
  Mars: { diameterKm: 6779, distanceFromSunAU: 1.52, orbitDays: 687 },
  Jupiter: { diameterKm: 139820, distanceFromSunAU: 5.2, orbitDays: 4333 },
  Saturn: { diameterKm: 116460, distanceFromSunAU: 9.58, orbitDays: 10759 },
  Uranus: { diameterKm: 50724, distanceFromSunAU: 19.2, orbitDays: 30687 },
  Neptune: { diameterKm: 49244, distanceFromSunAU: 30.1, orbitDays: 60190 },
  Moon: { diameterKm: 3474, distanceFromSunAU: 1.0, orbitDays: 27 },
}

const TRANSPARENT_PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='

function PlanetImpl(props: PlanetProps) {
  const { name, radius, distance, orbitSpeed, rotationSpeed, texture, normal, clouds, tilt = 0, ring, register, onDoubleClick, onHover, onClick } = props
  const groupRef = useRef<THREE.Group>(null)
  const tiltRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const [isHovered, setIsHovered] = useState(false)
  const colorMap = useTexture(texture)
  const normalMap = useTexture(normal ?? TRANSPARENT_PX)
  const cloudsMap = useTexture(clouds ?? TRANSPARENT_PX)
  const ringMap = useTexture(ring?.map ?? TRANSPARENT_PX)

  const facts = PLANET_FACTS[name]

  useEffect(() => {
    if (groupRef.current) groupRef.current.name = name
  }, [name])

  useEffect(() => {
    if (!register) return
    if (groupRef.current) register(name, { object3D: groupRef.current })
    return () => register(name, null)
  }, [name, register])

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(radius, 64, 64), [radius])
  const cloudsRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (groupRef.current) {
      const a = t * orbitSpeed
      groupRef.current.position.set(Math.cos(a) * distance, 0, Math.sin(a) * distance)
    }
    if (tiltRef.current) tiltRef.current.rotation.z = tilt
    if (meshRef.current) meshRef.current.rotation.y += rotationSpeed
    if (cloudsRef.current) cloudsRef.current.rotation.y += rotationSpeed * 1.15

    if (isHovered && onHover) {
      const wp = new THREE.Vector3()
      meshRef.current?.getWorldPosition(wp)
      onHover({ name, worldPosition: wp, ...facts })
    }
  })

  const handlePointerOver = () => {
    setIsHovered(true)
    if (onHover) {
      const wp = new THREE.Vector3()
      meshRef.current?.getWorldPosition(wp)
      onHover({ name, worldPosition: wp, ...facts })
    }
  }
  const handlePointerOut = () => {
    setIsHovered(false)
    onHover?.(null)
  }
  const handleDoubleClick = () => {
    const wp = new THREE.Vector3()
    meshRef.current?.getWorldPosition(wp)
    onDoubleClick?.({ name, worldPosition: wp, ...facts })
  }
  const handleClick = () => {
    const wp = new THREE.Vector3()
    meshRef.current?.getWorldPosition(wp)
    onClick?.({ name, worldPosition: wp, ...facts })
  }

  return (
    <group ref={groupRef}>
      <group ref={tiltRef}>
        <mesh
          ref={meshRef}
          geometry={sphereGeo}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onDoubleClick={handleDoubleClick}
          onClick={handleClick}
        >
          <meshStandardMaterial map={colorMap} normalMap={normal ? normalMap : undefined} metalness={0} roughness={1} emissiveIntensity={0.0} />
        </mesh>

        {/* Clouds */}
        {clouds && (
          <mesh ref={cloudsRef}>
            <sphereGeometry args={[radius * 1.02, 64, 64]} />
            <meshStandardMaterial map={cloudsMap} transparent opacity={0.8} depthWrite={false} />
          </mesh>
        )}

        {/* Rings */}
        {ring && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[ring.inner, ring.outer, 128]} />
            <meshBasicMaterial map={ringMap} alphaMap={ringMap} transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        )}
      </group>
    </group>
  )
}

type MoonProps = {
  parentName: string
  name: string
  radius: number
  distance: number
  orbitSpeed: number
  texture: string
  register?: (name: string, handle: PlanetHandle | null) => void
  onDoubleClick?: (info: PlanetInfo) => void
  onHover?: (info: PlanetInfo | null) => void
  onClick?: (info: PlanetInfo) => void
}

function MoonImpl({ parentName, name, radius, distance, orbitSpeed, texture, register, onDoubleClick, onHover, onClick }: MoonProps) {
  const { scene } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const map = useTexture(texture)
  const facts = PLANET_FACTS[name]
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(radius, 64, 64), [radius])
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (groupRef.current) groupRef.current.name = name
  }, [name])

  useEffect(() => {
    if (!register) return
    if (groupRef.current) register(name, { object3D: groupRef.current })
    return () => register(name, null)
  }, [name, register])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const parent = scene.getObjectByName(parentName)
    if (groupRef.current && parent) {
      const a = t * orbitSpeed
      const px = Math.cos(a) * distance
      const pz = Math.sin(a) * distance
      const world = new THREE.Vector3()
      parent.getWorldPosition(world)
      groupRef.current.position.set(world.x + px, world.y, world.z + pz)
    }
    meshRef.current && (meshRef.current.rotation.y += 0.01)

    if (isHovered && onHover) {
      const wp = new THREE.Vector3()
      meshRef.current?.getWorldPosition(wp)
      onHover({ name, worldPosition: wp, ...facts })
    }
  })

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        geometry={sphereGeo}
        onPointerOver={() => {
          setIsHovered(true)
          if (onHover) {
            const wp = new THREE.Vector3(); meshRef.current?.getWorldPosition(wp)
            onHover({ name, worldPosition: wp, ...facts })
          }
        }}
        onPointerOut={() => { setIsHovered(false); onHover?.(null) }}
        onDoubleClick={() => { const wp = new THREE.Vector3(); meshRef.current?.getWorldPosition(wp); onDoubleClick?.({ name, worldPosition: wp, ...facts }) }}
        onClick={() => { const wp = new THREE.Vector3(); meshRef.current?.getWorldPosition(wp); onClick?.({ name, worldPosition: wp, ...facts }) }}
      >
        <meshStandardMaterial map={map} metalness={0} roughness={1} />
      </mesh>
    </group>
  )
}

export const Planet = Object.assign(PlanetImpl, { Moon: MoonImpl })

