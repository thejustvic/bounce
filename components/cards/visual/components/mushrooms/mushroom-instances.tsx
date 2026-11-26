import {Merged, useGLTF} from '@react-three/drei'
import type {ReactNode} from 'react'
import {useMemo} from 'react'
import type {Mesh, MeshBasicMaterial} from 'three'
import type {GLTF} from 'three-stdlib'
import {MushroomContext, MushroomModels} from './mushroom-context'

export type GLTFResult1 = GLTF & {
  nodes: {
    Object_4: Mesh
    Object_6: Mesh
    Object_7: Mesh
    Object_8: Mesh
    Object_9: Mesh
    Object_10: Mesh
    Object_11: Mesh
    Object_12: Mesh
    Object_13: Mesh
    Object_14: Mesh
    Object_15: Mesh
    Object_16: Mesh
    Object_17: Mesh
    Object_18: Mesh
    Object_19: Mesh
  }
  materials: {
    ['Material.001']: MeshBasicMaterial
    ['QS1568-W10-1-1']: MeshBasicMaterial
  }
}

export type GLTFResult2 = GLTF & {
  nodes: {
    Object_4: Mesh
    Object_6: Mesh
    Object_7: Mesh
    Object_8: Mesh
    Object_9: Mesh
    Object_10: Mesh
    Object_11: Mesh
    Object_12: Mesh
    Object_13: Mesh
    Object_14: Mesh
  }
  materials: {
    ['Material.001']: MeshBasicMaterial
    ['QS1568-W11-1-1']: MeshBasicMaterial
  }
}

// specify the exact return type in prefixNodes
type PrefixedNodes<T, P extends string> = {
  [K in Exclude<keyof T & string, 'Object_4'> as `${P}${K}`]: Mesh
}

// utility for automatically adding a prefix to keys, with full type safety
function prefixNodes<T extends Record<string, Mesh>, P extends string>(
  nodes: T,
  prefix: P
): PrefixedNodes<T, P> {
  const result = {} as Record<string, Mesh>
  for (const key in nodes) {
    if (key !== 'Object_4' && nodes[key]?.isMesh) {
      result[`${prefix}${key}`] = nodes[key]
    }
  }
  return result as PrefixedNodes<T, P>
}

interface MushroomInstancesProps {
  children: ReactNode
}

export const MushroomInstances = ({children}: MushroomInstancesProps) => {
  const gltf1 = useGLTF('/mushroom-1.glb') as unknown as GLTFResult1
  const gltf2 = useGLTF('/mushroom-2.glb') as unknown as GLTFResult2

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

useGLTF.preload('/mushroom-1.glb')
useGLTF.preload('/mushroom-2.glb')
