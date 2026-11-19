import {Cloud, Clouds} from '@react-three/drei'
import {useFrame} from '@react-three/fiber'
import React, {useEffect, useRef, useState} from 'react'
import * as THREE from 'three'

export function WeatherClouds(): React.JSX.Element {
  const cloudsGroupRef = useRef<THREE.Group>(null)
  const cloud1Ref = useRef<THREE.Group>(null)
  const cloud2Ref = useRef<THREE.Group>(null)
  const elapsedRef = useRef(0)
  const [opacity, setOpacity] = useState(0)

  // phase timings in seconds
  const GATHER_DURATION = 20 // time to gather the clouds into a pile
  const HOLD_DURATION = 1 // how many seconds do the clouds stand together?
  const DISPERSE_DURATION = 20 // dispersion and disappearance time

  const DISPERSE_START = GATHER_DURATION + HOLD_DURATION
  const TOTAL_DURATION = DISPERSE_START + DISPERSE_DURATION

  // starting positions (where they arrive from)
  const startPos1 = new THREE.Vector3(-25, 30, 15)
  const startPos2 = new THREE.Vector3(25, 30, -20)

  // positions in the center (collected in a pile)
  const centerPos1 = new THREE.Vector3(0, 30, 0)
  const centerPos2 = new THREE.Vector3(3, 30, -2)

  // End positions (where they fly; can use startPos1/startPos2 or others)
  const exitPos1 = new THREE.Vector3(25, 30, -15)
  const exitPos2 = new THREE.Vector3(-25, 30, 20)

  // reset timer on mount
  useEffect(() => {
    elapsedRef.current = 0
  }, [])

  useFrame((_, rawDelta) => {
    if (elapsedRef.current >= TOTAL_DURATION) {
      return
    }

    const delta = Math.min(rawDelta, 0.1)
    elapsedRef.current += delta
    const elapsed = elapsedRef.current

    // PHASE 1: Clouds gather
    if (elapsed <= GATHER_DURATION) {
      const t = elapsed / GATHER_DURATION
      const easeOut = 1 - Math.pow(1 - t, 3)

      cloud1Ref.current?.position.lerpVectors(startPos1, centerPos1, easeOut)
      cloud2Ref.current?.position.lerpVectors(startPos2, centerPos2, easeOut)
      setOpacity(easeOut)
      return
    }

    // PHASE 2: Clouds stand gathered for n seconds
    if (elapsed <= DISPERSE_START) {
      // guarantee the final position and opacity after the completion of Phase 1
      if (opacity !== 1) {
        cloud1Ref.current?.position.copy(centerPos1)
        cloud2Ref.current?.position.copy(centerPos2)
        setOpacity(1)
      }
      return
    }

    // PHASE 3: Clouds disperse and disappear
    if (elapsed < TOTAL_DURATION) {
      const t = (elapsed - DISPERSE_START) / DISPERSE_DURATION
      // easeInCubic — slow start of dissipation and acceleration at the output
      const easeIn = Math.pow(t, 3)

      cloud1Ref.current?.position.lerpVectors(centerPos1, exitPos1, easeIn)
      cloud2Ref.current?.position.lerpVectors(centerPos2, exitPos2, easeIn)
      setOpacity(1 - easeIn)
      return
    }

    // FINAL: completely hide the clouds to avoid loading the render
    setOpacity(0)
    if (cloudsGroupRef.current) {
      cloudsGroupRef.current.visible = false
    }
  })

  return (
    <Clouds ref={cloudsGroupRef} material={THREE.MeshLambertMaterial}>
      {/* Main dark storm cloud */}
      <Cloud
        ref={cloud1Ref}
        seed={1}
        segments={100}
        bounds={[20, 2, 20]}
        volume={20}
        color="#55606e"
        speed={0}
        position={[-25, 30, 15]}
        opacity={opacity}
      />
      {/* Secondary overlapping cloud */}
      <Cloud
        ref={cloud2Ref}
        seed={2}
        segments={100}
        bounds={[18, 2, 18]}
        volume={18}
        color="#47505c"
        speed={0}
        position={[25, 30, -20]}
        opacity={opacity}
      />
    </Clouds>
  )
}
