import './App.css'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { StarsBackground } from './components/scene/StarsBackground'
import { BloomEffect } from './components/scene/BloomEffect'
import { Sun } from './components/Sun'
import { Planet } from './components/Planet'
import type { PlanetHandle, PlanetInfo } from './components/Planet'

type FocusTarget = {
  name: string
  object: THREE.Object3D
}

function useCameraFocus(controlsRef: React.RefObject<any>) {
  const { camera } = useThree()
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null)
  const animRef = useRef<{ start: number; fromPos: THREE.Vector3; toPos: THREE.Vector3; fromTarget: THREE.Vector3; toTarget: THREE.Vector3 } | null>(null)

  const focusOnObject = useCallback((object: THREE.Object3D, fitOffset = 2.4) => {
    const box = new THREE.Box3().setFromObject(object)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const maxDim = Math.max(size.x, size.y, size.z)
    const fov = THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov)
    const distance = Math.abs(maxDim / Math.tan(fov / 2)) * fitOffset
    const dir = new THREE.Vector3().subVectors(camera.position, (controlsRef.current?.target ?? new THREE.Vector3())).normalize()
    const newPos = new THREE.Vector3().copy(center).add(dir.multiplyScalar(distance))
    const currentTarget = (controlsRef.current?.target as THREE.Vector3) ?? new THREE.Vector3()
    animRef.current = {
      start: performance.now(),
      fromPos: camera.position.clone(),
      toPos: newPos,
      fromTarget: currentTarget.clone(),
      toTarget: center,
    }
    setFocusTarget({ name: object.name || 'Target', object })
  }, [camera, controlsRef])

  const tick = useCallback(() => {
    if (!animRef.current) return
    const t = (performance.now() - animRef.current.start) / 900
    const k = THREE.MathUtils.smoothstep(Math.min(1, t), 0, 1)
    camera.position.lerpVectors(animRef.current.fromPos, animRef.current.toPos, k)
    if (controlsRef.current) {
      const target = controlsRef.current.target as THREE.Vector3
      target.lerpVectors(animRef.current.fromTarget, animRef.current.toTarget, k)
      controlsRef.current.update()
    }
    if (t >= 1) {
      animRef.current = null
    }
  }, [camera, controlsRef])

  return { focusTarget, focusOnObject, tick }
}

function Scene() {
  const controlsRef = useRef<any>(null)
  const planetRefs = useRef<Record<string, PlanetHandle | undefined>>({})
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetInfo | null>(null)
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetInfo | null>(null)
  const { tick, focusOnObject } = useCameraFocus(controlsRef)

  const registerPlanet = useCallback((name: string, handle: PlanetHandle | null) => {
    planetRefs.current[name] = handle ?? undefined
  }, [])

  const jumpToPlanet = useCallback((name: string) => {
    const handle = planetRefs.current[name]
    if (handle?.object3D) focusOnObject(handle.object3D)
  }, [focusOnObject])

  const onPlanetDoubleClick = useCallback((info: PlanetInfo) => {
    if (planetRefs.current[info.name]?.object3D) focusOnObject(planetRefs.current[info.name]!.object3D)
    setSelectedPlanet(info)
  }, [focusOnObject])

  const onPlanetHover = useCallback((info: PlanetInfo | null) => setHoveredPlanet(info), [])
  const onPlanetClick = useCallback((info: PlanetInfo) => setSelectedPlanet(info), [])

  // Advance focus animation each frame
  const onFrame = useCallback(() => tick(), [tick])

  // Listen to global UI events to jump to a planet
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<string>
      if (ce.detail) jumpToPlanet(ce.detail)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('jumpToPlanet', handler as EventListener)
    }
    return () => {
      if (typeof window !== 'undefined') window.removeEventListener('jumpToPlanet', handler as EventListener)
    }
  }, [jumpToPlanet])

  // Planet configuration (scaled for visibility, not to scale)
  const planets = useMemo(() => ([
    { name: 'Mercury', radius: 0.08, distance: 4, orbitSpeed: 0.8, rotationSpeed: 0.02, texture: '/textures/2k_mercury.jpg' },
    { name: 'Venus', radius: 0.19, distance: 6, orbitSpeed: 0.6, rotationSpeed: -0.004, texture: '/textures/2k_venus_surface.jpg' },
    { name: 'Earth', radius: 0.2, distance: 8.5, orbitSpeed: 0.5, rotationSpeed: 0.03, texture: '/textures/2k_earth_daymap.jpg', normal: '/textures/2k_earth_normal_map.jpg', clouds: '/textures/2k_earth_clouds.jpg', tilt: THREE.MathUtils.degToRad(23.5) },
    { name: 'Mars', radius: 0.1, distance: 11, orbitSpeed: 0.45, rotationSpeed: 0.028, texture: '/textures/2k_mars.jpg' },
    { name: 'Jupiter', radius: 1.1, distance: 16, orbitSpeed: 0.25, rotationSpeed: 0.06, texture: '/textures/2k_jupiter.jpg' },
    { name: 'Saturn', radius: 0.95, distance: 22, orbitSpeed: 0.2, rotationSpeed: 0.05, texture: '/textures/2k_saturn.jpg', tilt: THREE.MathUtils.degToRad(26.7), ring: { map: '/textures/2k_saturn_ring_alpha.png', inner: 1.2, outer: 2.0 } },
    { name: 'Uranus', radius: 0.5, distance: 27, orbitSpeed: 0.18, rotationSpeed: -0.04, texture: '/textures/2k_uranus.jpg' },
    { name: 'Neptune', radius: 0.48, distance: 31, orbitSpeed: 0.16, rotationSpeed: 0.04, texture: '/textures/2k_neptune.jpg' },
  ]), [])

  return (
    <>
      <ambientLight intensity={0.03} />
      <Sun position={[0, 0, 0]} intensity={3} distance={200} decay={2} onDoubleClick={() => jumpToPlanet('Sun')} />

      {planets.map((p) => (
        <Planet
          key={p.name}
          name={p.name}
          radius={p.radius}
          distance={p.distance}
          orbitSpeed={p.orbitSpeed}
          rotationSpeed={p.rotationSpeed}
          texture={p.texture}
          normal={p.normal}
          clouds={p.clouds}
          tilt={p.tilt}
          ring={p.ring}
          register={registerPlanet}
          onDoubleClick={onPlanetDoubleClick}
          onHover={onPlanetHover}
          onClick={onPlanetClick}
        />
      ))}

      {/* Earth's Moon */}
      <Planet.Moon
        parentName="Earth"
        name="Moon"
        radius={0.055}
        distance={0.5}
        orbitSpeed={1.6}
        texture={'/textures/2k_moon.jpg'}
        register={registerPlanet}
        onDoubleClick={onPlanetDoubleClick}
        onHover={onPlanetHover}
        onClick={onPlanetClick}
      />

      {/* Jupiter's Galilean moons (optional) */}
      <Planet.Moon parentName="Jupiter" name="Io" radius={0.07} distance={1.8} orbitSpeed={1.2} texture={'/textures/2k_moon.jpg'} register={registerPlanet} onDoubleClick={onPlanetDoubleClick} onHover={onPlanetHover} onClick={onPlanetClick} />
      <Planet.Moon parentName="Jupiter" name="Europa" radius={0.06} distance={2.1} orbitSpeed={0.95} texture={'/textures/2k_moon.jpg'} register={registerPlanet} onDoubleClick={onPlanetDoubleClick} onHover={onPlanetHover} onClick={onPlanetClick} />
      <Planet.Moon parentName="Jupiter" name="Ganymede" radius={0.08} distance={2.5} orbitSpeed={0.8} texture={'/textures/2k_moon.jpg'} register={registerPlanet} onDoubleClick={onPlanetDoubleClick} onHover={onPlanetHover} onClick={onPlanetClick} />
      <Planet.Moon parentName="Jupiter" name="Callisto" radius={0.075} distance={3.0} orbitSpeed={0.7} texture={'/textures/2k_moon.jpg'} register={registerPlanet} onDoubleClick={onPlanetDoubleClick} onHover={onPlanetHover} onClick={onPlanetClick} />

      <StarsBackground />
      <BloomEffect />

      <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.1} minDistance={2} maxDistance={120} />

      {/* Fact cards */}
      {hoveredPlanet && (
        <Html position={hoveredPlanet.worldPosition} distanceFactor={10} center occlude style={{ pointerEvents: 'none' }}>
          <div className="fact-tooltip">{hoveredPlanet.name}</div>
        </Html>
      )}
      {selectedPlanet && (
        <Html position={selectedPlanet.worldPosition} distanceFactor={8} occlude center>
          <div className="fact-card">
            <div className="fact-title">{selectedPlanet.name}</div>
            <div className="fact-row"><span>Diameter:</span><span>{selectedPlanet.diameterKm?.toLocaleString() ?? '—'} km</span></div>
            <div className="fact-row"><span>Distance:</span><span>{selectedPlanet.distanceFromSunAU ? `${selectedPlanet.distanceFromSunAU} AU` : '—'}</span></div>
            <div className="fact-row"><span>Orbit:</span><span>{selectedPlanet.orbitDays ? `${selectedPlanet.orbitDays} days` : '—'}</span></div>
          </div>
        </Html>
      )}

      {/* Drive animations that are not tied to a specific component */}
      <FrameTickerR3F onFrame={onFrame} />
    </>
  )
}

// Small helper to run a callback every frame without creating a component
function FrameTickerR3F({ onFrame }: { onFrame: () => void }) {
  const { invalidate } = useThree()
  useFrame(() => { onFrame(); invalidate() })
  return null
}

function App() {
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1

  return (
    <div className="app-root">
      <Canvas dpr={dpr} camera={{ position: [0, 6, 26], fov: 60 }}>
        <color attach="background" args={[0x000000]} />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      <div className="ui-overlay">
        <div className="ui-title">Solar System</div>
        <div className="ui-buttons">
          {['Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune'].map((p) => (
            <button key={p} className="ui-btn" onClick={() => {
              const event = new CustomEvent('jumpToPlanet', { detail: p })
              window.dispatchEvent(event)
            }}>{p}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
