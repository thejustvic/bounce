import {useFrame} from '@react-three/fiber'
import React, {useMemo, useRef} from 'react'
import * as THREE from 'three'

interface RainProps {
  count?: number
  area?: number
  height?: number
}

interface RainDrop {
  x: number
  y: number
  z: number
  speed: number
}

export function WeatherRain({
  count = 1500,
  area = 20,
  height = 15
}: RainProps): React.JSX.Element {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Generate initial positions and speeds once
  const drops = useMemo<RainDrop[]>(() => {
    return Array.from({length: count}, () => ({
      x: (Math.random() - 0.5) * area,
      y: Math.random() * height,
      z: (Math.random() - 0.5) * area,
      speed: 12 + Math.random() * 8
    }))
  }, [count, area, height])

  useFrame((_, delta: number) => {
    if (!meshRef.current) {
      return
    }

    drops.forEach((drop, i) => {
      drop.y -= drop.speed * delta

      // Reset raindrop to the top when it falls below 0
      if (drop.y < 0) {
        drop.y = height
      }

      dummy.position.set(drop.x, drop.y, drop.z)
      dummy.updateMatrix()
      meshRef.current?.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {/* Thin, stretched geometry for rain streaks */}
      <boxGeometry args={[0.02, 0.4, 0.02]} />
      <meshBasicMaterial color="#a4c2f4" transparent opacity={0.6} />
    </instancedMesh>
  )
}
