import {useCardChecklistStore} from '@/components/cards/card-checklist/card-checklist-store'
import {useCardInfoStore} from '@/components/cards/card-info/card-info-store'
import {getSearchCard} from '@/components/cards/get-search-card'
import {Card} from '@/components/cards/types'
import {Checkbox} from '@/components/checklist/types'
import tw from '@/components/common/tw-styled-components'
import {Html} from '@react-three/drei'
import {observer} from 'mobx-react-lite'
import {Suspense, useState} from 'react'
import {Point, PositionType, useMainSequence} from '../../ui/tulip'
import {MushroomInstance, MushroomVariant} from './mushroom-instance'
import {MushroomInstances} from './mushroom-instances'

const calcPositions = (newData: Point[]) => {
  const positions: PositionType[] = []

  newData.forEach(point => {
    positions.push([point.x, 0, point.z])
  })
  return positions
}

interface CardDataProps {
  card: Card | null
  checklist: Checkbox[] | undefined
}

const getBaseConstants = (checklist: Checkbox[] | undefined) => {
  const baseRadius = 5
  const referenceCount = 2
  const scaleFactor = Math.sqrt(
    Math.max(referenceCount, checklist?.length ?? 0) / referenceCount
  )
  const fieldRadius = baseRadius * scaleFactor

  const itemRadius = 2
  const minRequiredDistance = itemRadius * 2

  return {
    baseRadius,
    referenceCount,
    scaleFactor,
    fieldRadius,
    minRequiredDistance
  }
}

export const MushroomField = observer(() => {
  const id = String(getSearchCard())

  const [, cardChecklistStore] = useCardChecklistStore()
  const [cardInfoState] = useCardInfoStore()

  const checklist = cardChecklistStore.getAllCheckboxes(id)
  const card = cardInfoState.card.data

  const {fieldRadius, minRequiredDistance} = getBaseConstants(checklist)

  const [positions, updatePositions] = useState<PositionType[]>([])
  const [shouldShrink, updateShouldShrink] = useState(false)
  const [cardData, updateCardData] = useState<CardDataProps>({
    card: card,
    checklist: checklist
  })

  useMainSequence({
    updatePositions,
    updateShouldShrink,
    updateCardData,
    calcPositions,
    checklist,
    cardData,
    card,
    minRequiredDistance,
    fieldRadius
  })

  return (
    <group>
      <Suspense fallback={<LoadingMushrooms />}>
        <MushroomInstances>
          {positions.map((item, index) => {
            // it produces the sequence 1, 2, 1, 2, 1, 2...
            const variant = ((index % 2) + 1) as MushroomVariant
            return (
              <MushroomInstance
                key={item.toString()}
                variant={variant}
                position={item}
                shouldShrink={shouldShrink}
                growDelay={15}
                targetMaxScale={10}
              />
            )
          })}
        </MushroomInstances>
      </Suspense>
    </group>
  )
})

const TwWrapper = tw.div`
  text-2xl
  text-white
  bold
  -ml-14
  pb-10
  truncate
`

const LoadingMushrooms = () => {
  return (
    <Html>
      <TwWrapper>loading of mushrooms...</TwWrapper>
    </Html>
  )
}
