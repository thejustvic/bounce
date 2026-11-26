import {useCardChecklistStore} from '@/components/cards/card-checklist/card-checklist-store'
import {getSearchCard} from '@/components/cards/get-search-card'
import {Checkbox} from '@/components/checklist/types'
import tw from '@/components/common/tw-styled-components'
import {Html} from '@react-three/drei'
import {observer} from 'mobx-react-lite'
import {Suspense, useMemo} from 'react'
import {generateNonOverlappingPoints, Point, PositionType} from '../../ui/tulip'
import {MushroomInstance, MushroomVariant} from './mushroom-instance'
import {MushroomInstances} from './mushroom-instances'

const calcPositions = (newData: Point[]) => {
  const positions: PositionType[] = []

  newData.forEach(point => {
    positions.push([point.x, 0.25, point.z])
  })
  return positions
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
  const checklist = cardChecklistStore.getAllCheckboxes(id)

  const itemsCount = checklist?.length ?? 0

  const positions = useMemo(() => {
    if (itemsCount === 0) {
      return []
    }

    const {fieldRadius, minRequiredDistance} = getBaseConstants(checklist)
    const newData = generateNonOverlappingPoints({
      numberOfItems: itemsCount,
      fieldRadius,
      minRequiredDistance
    })

    return calcPositions(newData)
  }, [itemsCount])

  return (
    <group>
      <Suspense fallback={<LoadingMushrooms />}>
        <MushroomInstances>
          {positions.map((item, index) => {
            // it produces the sequence 1, 2, 1, 2, 1, 2...
            const variant = ((index % 2) + 1) as MushroomVariant
            return (
              <MushroomInstance
                key={index}
                variant={variant}
                position={item}
                growDelay={15}
                targetMaxScale={0.25}
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
