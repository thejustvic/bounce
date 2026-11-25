import {Merged, useGLTF} from '@react-three/drei'
import type {ReactNode} from 'react'
import {useMemo} from 'react'
import type {Mesh, MeshBasicMaterial} from 'three'
import type {GLTF} from 'three-stdlib'
import {MushroomContext} from './mushroom-context'

type GLTFResult = GLTF & {
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

interface MushroomInstancesProps {
  children: ReactNode
}

export const MushroomInstances = ({children}: MushroomInstancesProps) => {
  const {nodes} = useGLTF('/mushroom-3.glb') as unknown as GLTFResult

  const meshes = useMemo(
    () => ({
      Obj4: nodes.Object_4,
      Obj6: nodes.Object_6,
      Obj7: nodes.Object_7,
      Obj8: nodes.Object_8,
      Obj9: nodes.Object_9,
      Obj10: nodes.Object_10,
      Obj11: nodes.Object_11,
      Obj12: nodes.Object_12,
      Obj13: nodes.Object_13,
      Obj14: nodes.Object_14
    }),
    [nodes]
  )

  return (
    <Merged meshes={meshes} frustumCulled={false}>
      {models => (
        <MushroomContext.Provider value={models}>
          {children}
        </MushroomContext.Provider>
      )}
    </Merged>
  )
}
