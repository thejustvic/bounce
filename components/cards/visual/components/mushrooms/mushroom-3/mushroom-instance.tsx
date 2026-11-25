import {useFrame, type ThreeElements} from '@react-three/fiber'
import {easing} from 'maath'
import {useRef} from 'react'
import type {Group} from 'three'
import {useMushroomModels} from './mushroom-context'

interface Props {
  shouldShrink: boolean
  /** Затримка перед початком росту в секундах (за замовчуванням 0) */
  growDelay?: number
  /** Цільовий масштаб гриба (за замовчуванням 1) */
  targetMaxScale?: number
}

type GroupProps = ThreeElements['group']

type CombinedProps = GroupProps & Props

export const MushroomInstance = ({
  growDelay = 0,
  targetMaxScale = 1,
  ...groupProps
}: CombinedProps) => {
  const Models = useMushroomModels()

  const groupRef = useRef<Group>(null)

  // Накопичувач часу в секундах (не викликає ре-рендер)
  const elapsedRef = useRef(0)

  useFrame((_state, delta) => {
    if (groupRef.current === null) {
      return
    }

    // Чекаємо, поки пройде задана затримка
    if (elapsedRef.current < growDelay) {
      elapsedRef.current += delta
      return
    }

    // Плавно збільшуємо масштаб до цільового значення
    easing.damp3(
      groupRef.current.scale,
      [targetMaxScale, targetMaxScale, targetMaxScale],
      0.25,
      delta
    )
  })

  return (
    <group ref={groupRef} {...groupProps} dispose={null}>
      {/* <Models.Obj4 /> this is a figure of a cube */}
      <Models.Obj6 />
      <Models.Obj7 />
      <Models.Obj8 />
      <Models.Obj9 />
      <Models.Obj10 />
      <Models.Obj11 />
      <Models.Obj12 />
      <Models.Obj13 />
      <Models.Obj14 />
    </group>
  )
}
