import {Merged, useGLTF} from '@react-three/drei'
import type {ReactNode} from 'react'
import {useMemo} from 'react'
import type {Mesh, MeshStandardMaterial} from 'three'
import type {GLTF} from 'three-stdlib'
import {MushroomContext, MushroomModels} from './mushroom-context'

export type GLTFResult1 = GLTF & {
  nodes: {
    Object_4: Mesh
  }
  materials: {
    ['Material_0.003']: MeshStandardMaterial
  }
}

export type GLTFResult2 = GLTF & {
  nodes: {
    Object_4: Mesh
  }
  materials: {
    ['Material_0.003']: MeshStandardMaterial
  }
}

// utility for automatically adding a prefix to keys, with full type safety
function prefixNodes<T extends Record<string, Mesh>, P extends string>(
  nodes: T,
  prefix: P
) {
  const result = {} as Record<string, Mesh>
  for (const key in nodes) {
    if (nodes[key]?.isMesh) {
      result[`${prefix}${key}`] = nodes[key]
    }
  }
  return result
}
interface MushroomInstancesProps {
  children: ReactNode
}

export const MushroomInstances = ({children}: MushroomInstancesProps) => {
  const gltf1 = useGLTF('/white_mushroom_1.glb') as unknown as GLTFResult1
  const gltf2 = useGLTF('/white_mushroom_2.glb') as unknown as GLTFResult2

  const meshes = useMemo(
    () => ({
      ...prefixNodes(gltf1.nodes, 'M1_'),
      ...prefixNodes(gltf2.nodes, 'M2_')
    }),
    [gltf1.nodes, gltf2.nodes]
  )

  return (
    <Merged meshes={meshes} frustumCulled={false}>
      {models => (
        <MushroomContext.Provider value={models as unknown as MushroomModels}>
          {children}
        </MushroomContext.Provider>
      )}
    </Merged>
  )
}

useGLTF.preload('/white_mushroom_1.glb')
useGLTF.preload('/white_mushroom_2.glb')
