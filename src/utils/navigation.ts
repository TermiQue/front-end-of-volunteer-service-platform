import { currentRole, ensureLoginForRoute, ensureProfileForRoute, goToProfileForm, showTeamIntro } from './auth'

const reLaunchTo = (url: string) => {
  uni.reLaunch({ url })
}

export const openHome = () => {
  reLaunchTo('/pages/index/index')
}

export const openMine = () => {
  reLaunchTo('/pages/mine/mine')
}

export const openMessage = () => {
  if (!ensureLoginForRoute('/pages/message/message')) {
    return
  }

  if (!ensureProfileForRoute('/pages/message/message')) {
    return
  }

  reLaunchTo('/pages/message/message')
}

export const openFunctionEntry = () => {
  if (!ensureLoginForRoute('/pages/volunteer/volunteer')) {
    return
  }

  const targetPath = currentRole.value === 1 ? '/pages/juvenile/juvenile' : '/pages/volunteer/volunteer'

  if (!ensureProfileForRoute(targetPath)) {
    return
  }

  reLaunchTo(targetPath)
}

export const openIconEntry = () => {
  if (!ensureLoginForRoute('/pages/index/index')) {
    return
  }

  if (currentRole.value === 2 || currentRole.value === 3) {
    if (!ensureProfileForRoute('/pages/admin/admin')) {
      return
    }

    reLaunchTo('/pages/admin/admin')
    return
  }

  if (!ensureProfileForRoute('/pages/index/index')) {
    return
  }

  showTeamIntro()
}

export const openTeamIntro = () => {
  showTeamIntro()
}

export const openProfileForm = (redirectPath = '') => {
  goToProfileForm(redirectPath)
}

export const openLoginEntry = () => {
  openMine()
}
