'use client'

import {ReactNode, useState} from 'react'
import {ChatContext, ChatStore} from './chat-store'

interface Props {
  children: ReactNode
}

export default function ChatProvider({children}: Props) {
  const [store] = useState(() => new ChatStore())

  return (
    <ChatContext.Provider value={store}>
      <>{children}</>
    </ChatContext.Provider>
  )
}
