import {useGlobalStore} from '@/components/global-provider/global-store'
import {BooleanHookState, useBoolean} from '@/hooks/use-boolean'
import {
  maxWidthLeftDrawer,
  maxWidthRightDrawer,
  minDrawerWidth,
  minNavbarWidth
} from '@/utils/const'
import {useCallback, useEffect, useRef} from 'react'

interface Handlers {
  handleMouseDown: (event: React.MouseEvent) => void
  mouseDown: BooleanHookState
}

interface DragHandlersProps {
  drawer: 'left' | 'right'
}

export const useDragDrawerSideHandlers = ({
  drawer
}: DragHandlersProps): Handlers => {
  const mouseDown = useBoolean(false)
  const [state, store] = useGlobalStore()
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  const handleMouseDown = useCallback(
    (event: React.MouseEvent): void => {
      const currentWidth =
        drawer === 'left' ? state.leftDrawerWidth : state.rightDrawerWidth
      startXRef.current = event.screenX
      startWidthRef.current = currentWidth

      mouseDown.turnOn()
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
    },
    [drawer, state.leftDrawerWidth, state.rightDrawerWidth, mouseDown]
  )

  // store the current navbar width in ref so as not to recreate the callback
  const navbarWidthRef = useRef(Number(state.navbarWidth))
  navbarWidthRef.current = Number(state.navbarWidth)

  // auxiliary function to limit the value within specified limits
  const clamp = (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max)

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!mouseDown.value) {
        return
      }

      const delta = startXRef.current - event.screenX
      const currentNavbarWidth = navbarWidthRef.current

      if (drawer === 'left') {
        if (delta < 0 && currentNavbarWidth <= minNavbarWidth) {
          return
        }
        const rawWidth = startWidthRef.current - delta
        const clampedWidth = clamp(rawWidth, minDrawerWidth, maxWidthLeftDrawer)
        store.setLeftDrawerWidth(clampedWidth)
      } else {
        if (delta > 0 && currentNavbarWidth <= minNavbarWidth) {
          return
        }
        const rawWidth = startWidthRef.current + delta
        const clampedWidth = clamp(
          rawWidth,
          minDrawerWidth,
          maxWidthRightDrawer
        )
        store.setRightDrawerWidth(clampedWidth)
      }
    },
    [
      mouseDown.value,
      drawer,
      store,
      minNavbarWidth,
      minDrawerWidth,
      maxWidthLeftDrawer,
      maxWidthRightDrawer
    ]
  )

  const handleMouseUp = useCallback((): void => {
    mouseDown.turnOff()
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }, [mouseDown])

  useEffect(() => {
    if (mouseDown.value) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [mouseDown.value, handleMouseMove, handleMouseUp])

  return {
    handleMouseDown,
    mouseDown
  }
}
