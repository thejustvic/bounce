import {useFrame, type ThreeElements} from '@react-three/fiber'
import {easing} from 'maath'
import {useRef} from 'react'
import type {Group} from 'three'
import {MushroomModelKey, useMushroomModels} from './mushroom-context'

export type MushroomVariant = 1 | 2

// lists of parts for each type of mushroom
const VARIANT_PARTS: Record<MushroomVariant, MushroomModelKey[]> = {
  1: ['M1_Object_4'],
  2: ['M2_Object_4']
}

interface Props {
  variant?: MushroomVariant
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

    const safeDelta = Math.min(delta, 0.05)

    // waiting for the specified delay to pass
    if (elapsedRef.current < growDelay) {
      elapsedRef.current += delta
      return
    }

    // smoothly increase the scale to the target value
    easing.damp3(
      groupRef.current.scale,
      [targetMaxScale, targetMaxScale, targetMaxScale],
      5.0,
      safeDelta
    )
  })

  return (
    <group ref={groupRef} {...groupProps} scale={0.0001} dispose={null}>
      {VARIANT_PARTS[variant].map(partKey => {
        const Part = Models[partKey]
        return <Part key={partKey} />
      })}
    </group>
  )
}
