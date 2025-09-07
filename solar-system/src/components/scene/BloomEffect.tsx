import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import * as THREE from 'three'

export function BloomEffect() {
  const { gl, scene, camera, size } = useThree()

  const composer = useMemo(() => {
    const renderTarget = new THREE.WebGLRenderTarget(size.width, size.height, {
      samples: 4,
      type: THREE.HalfFloatType,
    })
    const composer = new EffectComposer(gl, renderTarget)
    const renderPass = new RenderPass(scene, camera)
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(size.width, size.height), 1.2, 0.6, 0.2)
    bloomPass.threshold = 0.3
    bloomPass.strength = 1.1
    bloomPass.radius = 0.9
    composer.addPass(renderPass)
    composer.addPass(bloomPass)
    return composer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera])

  useEffect(() => {
    const prev = gl.autoClear
    gl.autoClear = false
    return () => {
      gl.autoClear = prev
    }
  }, [gl])

  useEffect(() => {
    composer.setSize(size.width, size.height)
  }, [composer, size])

  useFrame(() => {
    composer.render()
  }, 1)

  return null
}

