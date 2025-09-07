import './App.css'
import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'

type PlanetSpec = {
  name: string
  radius: number
  distance: number
  orbitSpeed: number
  rotationSpeed: number
  tilt?: number
  textureUrl?: string
  ring?: { inner: number; outer: number; textureUrl?: string; opacity?: number }
}

function Sun() {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffcc66') }), [])
  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime()
    meshRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.02)
  })
  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[3.5, 64, 64]} />
        <meshStandardMaterial emissive={'#ffbb33'} emissiveIntensity={2.5} color={'#ffdd88'} />
      </mesh>
      <mesh scale={1.6}>
        <sphereGeometry args={[3.5, 64, 64]} />
        <primitive attach="material" object={glowMaterial} />
      </mesh>
      <pointLight args={[0xffffff, 3.5, 0, 2]} position={[0, 0, 0]} />
    </group>
  )
}

function Planet({ spec, onHover, groupRef, onUpdatePosition }: { spec: PlanetSpec; onHover: (name: string | null) => void; groupRef: React.RefObject<THREE.Group>; onUpdatePosition?: (name: string, pos: THREE.Vector3) => void }) {
  const ref = useRef<THREE.Mesh>(null)
  const texture = useMemo(() => (spec.textureUrl ? new THREE.TextureLoader().load(spec.textureUrl) : undefined), [spec.textureUrl])
  const cloudsRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (groupRef.current) {
      const x = spec.distance * Math.cos(t * spec.orbitSpeed)
      const z = spec.distance * Math.sin(t * spec.orbitSpeed)
      groupRef.current.position.set(x, 0, z)
      onUpdatePosition?.(spec.name, groupRef.current.position.clone())
    }
    if (ref.current) ref.current.rotation.y += spec.rotationSpeed
    if (cloudsRef.current) cloudsRef.current.rotation.y += spec.rotationSpeed * 0.6
  })
  return (
    <group ref={groupRef} onPointerOver={() => onHover(spec.name)} onPointerOut={() => onHover(null)}>
      <mesh ref={ref} rotation={[spec.tilt ?? 0, 0, 0] as any}>
        <sphereGeometry args={[spec.radius, 64, 64]} />
        <meshStandardMaterial map={texture} color={texture ? 'white' : '#888'} />
      </mesh>
      {spec.name === 'Earth' && (
        <mesh ref={cloudsRef}>
          <sphereGeometry args={[spec.radius * 1.02, 64, 64]} />
          <meshStandardMaterial color={'#ffffff'} transparent opacity={0.12} />
        </mesh>
      )}
      {spec.ring && (
        <mesh rotation={[Math.PI / 2, 0, 0] as any}>
          <ringGeometry args={[spec.ring.inner, spec.ring.outer, 128]} />
          <meshBasicMaterial
            map={spec.ring.textureUrl ? new THREE.TextureLoader().load(spec.ring.textureUrl) : undefined}
            color={'#cbbba7'}
            transparent
            opacity={spec.ring.opacity ?? 0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  )
}

function Moon({ parentDistance, planetSpeed, distance, speed, radius }: { parentDistance: number; planetSpeed: number; distance: number; speed: number; radius: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const px = parentDistance * Math.cos(t * planetSpeed)
    const pz = parentDistance * Math.sin(t * planetSpeed)
    const mx = px + distance * Math.cos(t * speed)
    const mz = pz + distance * Math.sin(t * speed)
    if (groupRef.current) groupRef.current.position.set(mx, 0, mz)
    if (meshRef.current) meshRef.current.rotation.y += 0.02
  })
  return (
    <group ref={groupRef}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshStandardMaterial color={'#bbb'} />
      </mesh>
    </group>
  )
}

function ControlsRig({ focus }: { focus?: THREE.Vector3 | null }) {
  const { camera } = useThree()
  const target = useRef(new THREE.Vector3(0, 0, 0))
  useFrame(() => {
    if (focus) {
      target.current.lerp(focus, 0.08)
      camera.position.lerp(new THREE.Vector3(focus.x, focus.y + 3, focus.z + 8), 0.08)
    }
  })
  return <OrbitControls enablePan enableDamping dampingFactor={0.08} />
}

function SolarSystem() {
  const [hovered, setHovered] = useState<string | null>(null)
  const [focus, setFocus] = useState<THREE.Vector3 | null>(null)
  const specs = useMemo<PlanetSpec[]>(
    () => [
      { name: 'Mercury', radius: 0.38, distance: 7, orbitSpeed: 0.8, rotationSpeed: 0.01 },
      { name: 'Venus', radius: 0.95, distance: 10, orbitSpeed: 0.6, rotationSpeed: 0.008 },
      { name: 'Earth', radius: 1, distance: 13, orbitSpeed: 0.5, rotationSpeed: 0.02, tilt: 0.41 },
      { name: 'Mars', radius: 0.53, distance: 16, orbitSpeed: 0.45, rotationSpeed: 0.018 },
      { name: 'Jupiter', radius: 2.5, distance: 22, orbitSpeed: 0.3, rotationSpeed: 0.04 },
      { name: 'Saturn', radius: 2.1, distance: 28, orbitSpeed: 0.25, rotationSpeed: 0.038, ring: { inner: 2.4, outer: 3.6, opacity: 0.55 } },
      { name: 'Uranus', radius: 1.8, distance: 34, orbitSpeed: 0.2, rotationSpeed: 0.03 },
      { name: 'Neptune', radius: 1.7, distance: 39, orbitSpeed: 0.18, rotationSpeed: 0.028 }
    ],
    []
  )

  // Jump buttons handling
  const specsRef = useRef(specs)
  specsRef.current = specs
  const handleJump = (e: Event) => {
    const name = (e as CustomEvent<string>).detail
    const s = specsRef.current.find((p) => p.name === name)
    if (!s) return
    setFocus(new THREE.Vector3(s.distance, 0, 0))
  }
  // Register once
  useMemo(() => {
    window.addEventListener('jumpToPlanet', handleJump as EventListener)
    return () => window.removeEventListener('jumpToPlanet', handleJump as EventListener)
  }, [])

  const planetRefs = useRef<Record<string, THREE.Group | null>>({})
  const currentPositions = useRef<Record<string, THREE.Vector3>>({})

  const handleDoubleClick = (name: string) => {
    const grp = planetRefs.current[name]
    if (grp) {
      const world = new THREE.Vector3()
      grp.getWorldPosition(world)
      setFocus(world)
    }
  }

  return (
    <group>
      <Sun />
      {specs.map((spec) => {
        const ref = (node: THREE.Group | null) => {
          planetRefs.current[spec.name] = node
        }
        const groupRef = { current: planetRefs.current[spec.name] as THREE.Group | null }
        return (
          <group key={spec.name} ref={ref} onDoubleClick={() => handleDoubleClick(spec.name)}>
            <Planet spec={spec} onHover={setHovered} groupRef={groupRef} onUpdatePosition={(n, p) => (currentPositions.current[n] = p)} />
          {spec.name === 'Earth' && (
            <Moon parentDistance={spec.distance} planetSpeed={spec.orbitSpeed} distance={2.2} speed={1.2} radius={0.27} />
          )}
          </group>
        )
      })}
      {hovered && (
        <Html center>
          <div style={{ background: 'rgba(0,0,0,0.6)', padding: '8px 12px', borderRadius: 8, color: 'white', fontSize: 14 }}>
            {hovered}
          </div>
        </Html>
      )}
      <ControlsRig focus={focus} />
      <Stars radius={300} depth={60} count={20000} factor={4} fade speed={1} />
    </group>
  )
}

function App() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <div className="overlay">
        {['Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune'].map((p) => (
          <button key={p} onClick={() => window.dispatchEvent(new CustomEvent('jumpToPlanet', { detail: p }))}>{p}</button>
        ))}
      </div>
      <Suspense fallback={null}>
        <Canvas shadows camera={{ position: [0, 8, 24], fov: 50 }}>
          <color attach="background" args={[0x000000]} />
          <ambientLight intensity={0.15} />
          <SolarSystem />
        </Canvas>
      </Suspense>
    </div>
  )
}

export default App
