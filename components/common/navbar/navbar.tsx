'use client'

import {getSearchCard} from '@/components/cards/get-search-card'
import {UserImage} from '@/components/common/user-image'
import {Button} from '@/components/daisyui/button'
import {Dropdown} from '@/components/daisyui/dropdown'
import {Navbar as Nav} from '@/components/daisyui/navbar'
import {Toggle} from '@/components/daisyui/toggle'
import {useGlobalStore} from '@/components/global-provider/global-store'
import {SwitchTheme} from '@/components/switch-theme'
import {useResize} from '@/hooks/use-resize'
import {headerHeight, minDrawerWidth, minNavbarWidth} from '@/utils/const'
import {useSupabase} from '@/utils/supabase-utils/supabase-provider'
import {observer} from 'mobx-react-lite'
import {useEffect} from 'react'
import {isMobile} from 'react-device-detect'
import tw from '../tw-styled-components'
import {NavbarLeftDrawerButton} from './navbar-left-drawer-button'
import {NavbarOpenTeamButton} from './navbar-open-team-button'
import {NavbarRightDrawerButton} from './navbar-right-drawer-button'
import {NavbarSearch} from './navbar-search'
import {NavbarTeamSelect, useTeamSync} from './navbar-team-select'

const useAdjustingDrawerWidth = (navbarWidth: number) => {
  const [globalState, globalStore] = useGlobalStore()
  useEffect(() => {
    // wait until the data is restored from localStorage and the real width of the navbar is measured
    if (
      isMobile ||
      !globalState.isHydrated ||
      !navbarWidth ||
      navbarWidth <= 0
    ) {
      return
    }

    globalStore.setNavbarWidth(navbarWidth)

    const threshold = minNavbarWidth - 100
    if (navbarWidth >= threshold) {
      return
    }

    const gap = threshold - navbarWidth
    const {rightDrawerWidth, leftDrawerWidth} = globalState

    // calculate how many pixels the right panel can actually output.
    const availableRightReduction = Math.max(
      0,
      rightDrawerWidth - minDrawerWidth
    )
    const actualRightReduction = Math.min(gap, availableRightReduction)

    if (actualRightReduction > 0) {
      globalStore.setRightDrawerWidth(rightDrawerWidth - actualRightReduction)
    }

    // calculate the remaining deficit that the right panel could not cover
    const remainingGap = gap - actualRightReduction

    // if there is still some space left, shrink the left panel (but not less than minDrawerWidth)
    if (remainingGap > 0) {
      const newLeftWidth = Math.max(
        minDrawerWidth,
        leftDrawerWidth - remainingGap
      )
      if (newLeftWidth !== leftDrawerWidth) {
        globalStore.setLeftDrawerWidth(newLeftWidth)
      }
    }
  }, [navbarWidth, isMobile, globalState.isHydrated])
}

const TwNavbar = tw(Nav)`
  sticky
  top-0
  z-10
  px-0
  bg-base-200
  gap-6
  justify-between
`

export const Navbar = observer(() => {
  useTeamSync()

  const {ref, width: navbarWidth} = useResize()
  useAdjustingDrawerWidth(navbarWidth)

  const cardId = getSearchCard()
  return (
    <TwNavbar ref={ref} style={{height: headerHeight}}>
      {navbarWidth > 650 ? (
        <>
          <NavStart />
          <NavCenter />
          <NavEnd />
        </>
      ) : (
        <>
          {cardId && !isMobile && <NavbarLeftDrawerButton />}
          <NavCenter />
          <NavEndMobile />
        </>
      )}
    </TwNavbar>
  )
})

const TwWrapper = tw.div`
  ml-4
  flex
  gap-2
  items-center
`

const NavStart = () => {
  const cardId = getSearchCard()

  return (
    <Nav.Start>
      {cardId && !isMobile && <NavbarLeftDrawerButton />}
      <TwWrapper>
        <NavbarTeamSelect />
        <NavbarOpenTeamButton />
      </TwWrapper>
    </Nav.Start>
  )
}

interface ITwNavCenter {
  $isMobile: boolean
}
const TwNavCenter = tw(Nav.Center)<ITwNavCenter>`
  ${({$isMobile}) => $isMobile && 'ml-4'}
  font-mono
  text-lg
  w-full
`

const NavCenter = () => {
  return (
    <TwNavCenter $isMobile={isMobile}>
      <NavbarSearch />
    </TwNavCenter>
  )
}

const TwNavEndWrapper = tw.div`
  flex
  items-center
  gap-6
`

const NavEnd = () => {
  return (
    <Nav.End className="gap-2">
      <TwNavEndWrapper>
        <div className="flex gap-2">
          <SwitchTheme />
          <AvatarDropdown />
        </div>
        <NavbarRightDrawerButton />
      </TwNavEndWrapper>
    </Nav.End>
  )
}

const NavEndMobile = () => {
  return (
    <Nav.End className="gap-2">
      <TwNavEndWrapper>
        <div className="flex gap-2">
          <SwitchTheme />
          <AvatarDropdownMobile />
        </div>
        <NavbarRightDrawerButton />
      </TwNavEndWrapper>
    </Nav.End>
  )
}

const TwDropdownMenu = tw(Dropdown.Menu)`
  shadow-lg
  bg-base-200
  gap-4
`

const AvatarDropdown = observer(() => {
  const [state, store] = useGlobalStore()
  const {supabase, user} = useSupabase()
  const cardId = getSearchCard()

  const handleLogout = async () => {
    store.setLogging('logout')
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (!user) {
    return null
  }

  return (
    <Dropdown placements={['end']} hover>
      <UserImage src={user.user_metadata?.avatar_url} />
      <TwDropdownMenu>
        {cardId && <LabelShowLeftMenu />}
        <Button
          soft
          color="info"
          onClick={handleLogout}
          disable={state.logging.logout}
          loading={state.logging.logout}
        >
          Logout
        </Button>
      </TwDropdownMenu>
    </Dropdown>
  )
})

const AvatarDropdownMobile = observer(() => {
  const [state, store] = useGlobalStore()
  const {supabase, user} = useSupabase()

  const handleLogout = async () => {
    store.setLogging('logout')
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (!user) {
    return null
  }

  return (
    <Dropdown placements={['end']} hover>
      <UserImage src={user.user_metadata?.avatar_url} />
      <TwDropdownMenu>
        <div className="flex gap-1 items-center">
          <NavbarTeamSelect />
          <NavbarOpenTeamButton />
        </div>
        <Button
          soft
          color="info"
          onClick={handleLogout}
          disable={state.logging.logout}
          loading={state.logging.logout}
        >
          Logout
        </Button>
      </TwDropdownMenu>
    </Dropdown>
  )
})

const LabelShowLeftMenu = observer(() => {
  const [state, store] = useGlobalStore()
  return (
    <Dropdown.Item className="flex">
      <label className="fieldset-label">
        <span className="truncate">show left menu on hover</span>
        <Toggle
          checked={state.showLeftMenuOnHover}
          onChange={store.setShowLeftMenuOnHoverToggle}
        />
      </label>
    </Dropdown.Item>
  )
})
