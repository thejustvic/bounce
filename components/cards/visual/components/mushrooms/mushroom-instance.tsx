import {useFrame, type ThreeElements} from '@react-three/fiber'
import {easing} from 'maath'
import {useRef} from 'react'
import type {Group} from 'three'
import {MushroomModelKey, useMushroomModels} from './mushroom-context'

export type MushroomVariant = 1 | 2

// lists of parts for each type of mushroom (excluding Object_4), which is a cube figure
const VARIANT_PARTS: Record<MushroomVariant, MushroomModelKey[]> = {
  1: [
    'M1_Object_6',
    'M1_Object_7',
    'M1_Object_8',
    'M1_Object_9',
    'M1_Object_10',
    'M1_Object_11',
    'M1_Object_12',
    'M1_Object_13',
    'M1_Object_14',
    'M1_Object_15',
    'M1_Object_16',
    'M1_Object_17',
    'M1_Object_18',
    'M1_Object_19'
  ],
  2: [
    'M2_Object_6',
    'M2_Object_7',
    'M2_Object_8',
    'M2_Object_9',
    'M2_Object_10',
    'M2_Object_11',
    'M2_Object_12',
    'M2_Object_13',
    'M2_Object_14'
  ]
}

interface Props {
  variant?: MushroomVariant
  shouldShrink: boolean
  /** delay before growth begins, in seconds (default 0) */
  growDelay?: number
  /** target scale of the mushroom (default 1) */
  targetMaxScale?: number
}

type CombinedProps = ThreeElements['group'] & Props

export const MushroomInstance = ({
  variant = 1,
  growDelay = 0,
  targetMaxScale = 1,
  ...groupProps
}: CombinedProps) => {
  const Models = useMushroomModels()

  const groupRef = useRef<Group>(null)

  // time accumulator in seconds (does not trigger a re-render)
  const elapsedRef = useRef(0)

  useFrame((_state, delta) => {
    if (groupRef.current === null) {
      return
    }

    // waiting for the specified delay to pass
    if (elapsedRef.current < growDelay) {
      elapsedRef.current += delta
      return
    }

    // smoothly increase the scale to the target value
    easing.damp3(
      groupRef.current.scale,
      [targetMaxScale, targetMaxScale, targetMaxScale],
      0.25,
      delta
    )
  })

  return (
    <group ref={groupRef} {...groupProps} dispose={null}>
      {VARIANT_PARTS[variant].map(partKey => {
        const Part = Models[partKey]
        return <Part key={partKey} />
      })}
    </group>
  )
}
