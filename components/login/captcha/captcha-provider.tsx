import {PropsWithChildren, useState} from 'react'
import {CaptchaContext, CaptchaStore} from './captcha-store'

export const CaptchaProvider = ({children}: PropsWithChildren) => {
  const [store] = useState(() => new CaptchaStore())

  return (
    <CaptchaContext.Provider value={store}>{children}</CaptchaContext.Provider>
  )
}
