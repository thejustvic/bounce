import type {InstanceProps} from '@react-three/drei'
import type {FC} from 'react'
import {createContext, useContext} from 'react'

export type MushroomModels = Record<string, FC<InstanceProps>>

export const MushroomContext = createContext<MushroomModels | null>(null)

export const useMushroomModels = () => {
  const context = useContext(MushroomContext)
  if (!context) {
    throw new Error('useMushroomModels must be used inside <MushroomInstances>')
  }
  return context
}
