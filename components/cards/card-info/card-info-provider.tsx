'use client'

import {PropsWithChildren, useState} from 'react'
import {CardInfoStore, CardInfoStoreContext} from './card-info-store'

export default function CardInfoProvider({children}: PropsWithChildren) {
  const [store] = useState(() => new CardInfoStore())

  return (
    <CardInfoStoreContext.Provider value={store}>
      <>{children}</>
    </CardInfoStoreContext.Provider>
  )
}
