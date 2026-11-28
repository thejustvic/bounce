import {reaction, runInAction, toJS} from 'mobx'

interface HasState<S> {
  state: S
}

export const makeAutoPersist = <S extends object>(
  _this: HasState<S>,
  name: string,
  keysToPersist: (keyof S)[]
): (() => void) => {
  if (typeof window === 'undefined' || !window?.localStorage) {
    return () => {}
  }

  // function to select only the required keys
  const pickPersistedState = (state: S): Partial<S> => {
    const result: Partial<S> = {}
    for (const key of keysToPersist) {
      if (state[key] !== undefined) {
        result[key] = toJS(state[key])
      }
    }
    return result
  }

  // restore only allowed fields inside runInAction
  try {
    const storedJson = window.localStorage.getItem(name)
    if (storedJson) {
      const parsed = JSON.parse(storedJson) as {state?: Partial<S>}
      if (parsed?.state) {
        runInAction(() => {
          for (const key of keysToPersist) {
            if (parsed.state?.[key] !== undefined) {
              _this.state[key] = parsed.state[key]
            }
          }
        })
      }
    }
  } catch (err) {
    console.warn('makeAutoPersist: restore failed', err)
  }

  // subscribe only to changes in selected keys
  const disposer = reaction(
    () => pickPersistedState(_this.state),
    persistedState => {
      try {
        window.localStorage.setItem(
          name,
          JSON.stringify({state: persistedState})
        )
      } catch (err) {
        console.error('makeAutoPersist: save failed', err)
      }
    },
    {delay: 300}
  )

  return disposer
}
