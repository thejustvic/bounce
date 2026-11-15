'use client'
import {PropsWithChildren, useState} from 'react'
import {TeamContext, TeamStore} from './team-store'

interface Props extends PropsWithChildren {
  currentTeamId: string | null
}

export default function TeamProvider({children, currentTeamId}: Props) {
  const [store] = useState(() => new TeamStore(currentTeamId))

  return (
    <TeamContext.Provider value={store}>
      <>{children}</>
    </TeamContext.Provider>
  )
}
