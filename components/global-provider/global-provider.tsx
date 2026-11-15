'use client'

import {
  GlobalContext,
  GlobalStore
} from '@/components/global-provider/global-store'
import {Theme} from '@/components/global-provider/types'
import {usePageRefresh} from '@/hooks/use-page-refresh'
import {ReactNode, useEffect, useState} from 'react'

interface Props {
  children: ReactNode
  serverTheme: Theme | undefined
}

export default function GlobalProvider({children, serverTheme}: Props) {
  usePageRefresh()

  const [store] = useState(() => new GlobalStore(serverTheme))

  useEffect(() => {
    const dispose = store.initPersist()
    return () => dispose()
  }, [store])

  return (
    <GlobalContext.Provider value={store}>
      <>{children}</>
    </GlobalContext.Provider>
  )
}
