import type {InstanceProps} from '@react-three/drei'
import type {FC} from 'react'
import {createContext, useContext} from 'react'
import {GLTFResult1, GLTFResult2} from './mushroom-instances'

// generate keys with prefixes
type PrefixedKeys<T, P extends string> = `${P}${keyof T & string}`

export type MushroomModelKey =
  | PrefixedKeys<GLTFResult1['nodes'], 'M1_'>
  | PrefixedKeys<GLTFResult2['nodes'], 'M2_'>

export type MushroomModels = Record<MushroomModelKey, FC<InstanceProps>>

export const MushroomContext = createContext<MushroomModels | null>(null)

export const useMushroomModels = () => {
  const context = useContext(MushroomContext)
  if (!context) {
    throw new Error('useMushroomModels must be used inside <MushroomInstances>')
  }
  return context
}
