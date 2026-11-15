import {AuthView} from '@/components/global-provider/types'
import {PropsWithChildren, useState} from 'react'
import {EmailLoginContext, EmailLoginStore} from './email-login-store'

interface Props extends PropsWithChildren {
  cookieAuthView: AuthView
}

export default function EmailLoginProvider({children, cookieAuthView}: Props) {
  const [store] = useState(() => new EmailLoginStore(cookieAuthView))

  return (
    <EmailLoginContext.Provider value={store}>
      {children}
    </EmailLoginContext.Provider>
  )
}
