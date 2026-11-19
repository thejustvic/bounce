import {useFrame} from '@react-three/fiber'
import React, {useEffect, useMemo, useRef} from 'react'
import * as THREE from 'three'

interface RainProps {
  count?: number
  area?: number
  height?: number
  delay?: number // delay before start (10 sec)
  duration?: number // rain duration (12 sec)
  fadeTime?: number // smooth ramp time (2.5 sec)
}

interface RainDrop {
  x: number
  y: number
  z: number
  speed: number
  active: boolean
}

export function WeatherRain({
  count = 1500,
  area = 20,
  height = 15,
  delay = 10,
  duration = 12,
  fadeTime = 2.5
}: RainProps): React.JSX.Element {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  const elapsedRef = useRef(0)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // reset the timer when mounting
  useEffect(() => {
    elapsedRef.current = 0
  }, [])

  const drops = useMemo<RainDrop[]>(() => {
    return Array.from({length: count}, () => ({
      x: (Math.random() - 0.5) * area,
      y: height + Math.random() * height, // they start from above (from the clouds), not in mid-air
      z: (Math.random() - 0.5) * area,
      speed: 12 + Math.random() * 8,
      active: false
    }))
  }, [count, area, height])

  useFrame((_, rawDelta: number) => {
    if (!meshRef.current) {
      return
    }

    // limit delta so that time doesn't jump when switching tabs
    const delta = Math.min(rawDelta, 0.1)
    elapsedRef.current += delta

    const timeSinceStart = elapsedRef.current - delay

    // 1. before the rain starts (0 .. 10 sec)
    if (timeSinceStart < 0) {
      meshRef.current.visible = false
      return
    }

    const isSpawning = timeSinceStart <= duration

    // turn on visibility at startup
    if (isSpawning && !meshRef.current.visible) {
      meshRef.current.visible = true
    }

    // if the rain has completely stopped, let's go out.
    if (!isSpawning && !meshRef.current.visible) {
      return
    }

    // 2. gradual emergence: how many drops are allowed to run now (from 0 to count)
    const spawnProgress = Math.min(timeSinceStart / fadeTime, 1)
    const maxAllowedDrops = Math.floor(count * spawnProgress)

    // smooth increase in material transparency (from 0 to 0.6)
    if (materialRef.current) {
      materialRef.current.opacity = 0.6 * spawnProgress
    }

    let visibleDropsCount = 0

    for (let i = 0; i < count; i++) {
      const drop = drops[i]

      // activate the drop if its turn has come and it is still raining
      if (!drop.active && isSpawning && i < maxAllowedDrops) {
        drop.active = true
        drop.y = height + Math.random() * 2 // З'являється зверху під хмарами
      }

      if (drop.active) {
        drop.y -= drop.speed * delta

        // if the drop reaches the ground
        if (drop.y <= 0) {
          // eslint-disable-next-line max-depth
          if (isSpawning) {
            // it's still raining - we're turning the drop back up
            drop.y = height
          } else {
            // time is up (10 seconds of rain have passed) - turn off the drop
            drop.active = false
          }
        }
      }

      if (drop.active) {
        visibleDropsCount++
        dummy.scale.set(1, 1, 1)
        dummy.position.set(drop.x, drop.y, drop.z)
      } else {
        // hiding an inactive droplet
        dummy.scale.set(0, 0, 0)
      }

      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true

    // 3. when the time for rain has come and the last drop has fallen to the ground, hide the whole mesh
    if (!isSpawning && visibleDropsCount === 0) {
      meshRef.current.visible = false
    }
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      visible={false}
      frustumCulled={false} // important: prevents InstancedMesh disappearing/hanging bug
    >
      <boxGeometry args={[0.02, 0.4, 0.02]} />
      <meshBasicMaterial
        ref={materialRef}
        color="#a4c2f4"
        transparent
        opacity={0}
      />
    </instancedMesh>
  )
}
