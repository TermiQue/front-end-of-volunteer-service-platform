import { currentRole, ensureLoginForRoute, ensureProfileForRoute, goToProfileForm, showTeamIntro } from './auth'

const reLaunchTo = (url: string) => {
  uni.reLaunch({ url })
}

const TAB_PAGE_PATHS = new Set([
  '/pages/index/index',
  '/pages/volunteer/volunteer',
  '/pages/juvenile/juvenile',
  '/pages/message/message',
  '/pages/mine/mine',
  '/pages/admin/admin'
])

const normalizeInAppPath = (url: string) => {
  const trimmed = url.trim()
  if (!trimmed) {
    return ''
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return ''
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
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

export const openInAppLink = (url: string) => {
  const normalized = normalizeInAppPath(url)
  if (!normalized) {
    uni.showToast({
      title: '暂无可跳转详情',
      icon: 'none'
    })
    return
  }

  const pathOnly = normalized.split('?')[0] || normalized
  if (TAB_PAGE_PATHS.has(pathOnly)) {
    reLaunchTo(normalized)
    return
  }

  uni.navigateTo({
    url: normalized,
    fail: () => {
      uni.showToast({
        title: '详情跳转失败',
        icon: 'none'
      })
    }
  })
}
