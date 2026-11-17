import {Cloud, Clouds} from '@react-three/drei'
import React from 'react'
import * as THREE from 'three'

export function WeatherClouds(): React.JSX.Element {
  return (
    <Clouds material={THREE.MeshLambertMaterial}>
      {/* Main dark storm cloud */}
      <Cloud
        seed={1}
        segments={100}
        bounds={[20, 2, 20]}
        volume={20}
        color="#55606e"
        speed={0}
        position={[0, 30, 0]}
      />
      {/* Secondary overlapping cloud */}
      <Cloud
        seed={2}
        segments={100}
        bounds={[18, 2, 18]}
        volume={18}
        color="#47505c"
        speed={0}
        position={[5, 30, -3]}
      />
    </Clouds>
  )
}
