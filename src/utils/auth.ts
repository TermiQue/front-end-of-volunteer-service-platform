import { computed, ref } from 'vue'

import { ApiError, clearRequestCache, clearSessionStorage, requestJson, uploadJson } from './request'
import { STORAGE_KEYS } from './constants'
import { resolveBackendRelativeUrl } from './urls'

type VolunteerProfile = {
  user_id: number
  name: string
  student_id: string
  phone: string
  volunteer_hours: string
  project_count: number
}

type CurrentUser = {
  userId: number
  nickname: string
  avatarUrl: string
  role: number
  profile?: VolunteerProfile | null
}

type LoginResponse = {
  accessToken: string
  refreshToken: string
  user: CurrentUser
}

type MeResponse = {
  user: CurrentUser
}

type ProfileResponse = {
  profile: VolunteerProfile
}

type BaseUserResponse = {
  user: CurrentUser
}

export type ProfileFormPayload = {
  name: string
  studentId: string
  phone: string
}

const accessToken = ref('')
const refreshToken = ref('')
const currentUser = ref<CurrentUser | null>(null)
const hydrated = ref(false)
const resolvedAvatar = ref('')

type AvatarCacheRecord = {
  localPath: string
  expiresAt: number
}

const AVATAR_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const AVATAR_DOWNLOAD_TIMEOUT_MS = 15 * 1000

let ENABLE_AVATAR_FILE_CACHE: boolean
// ifdef MP-WEIXIN
ENABLE_AVATAR_FILE_CACHE = true
// elif H5
ENABLE_AVATAR_FILE_CACHE = false
// else
ENABLE_AVATAR_FILE_CACHE = true
// endif

const avatarInflight = new Map<string, Promise<string>>()

const normalizeUser = (user: CurrentUser | null | undefined) => {
  if (!user) {
    return null
  }

  return {
    ...user,
    avatarUrl: resolveBackendRelativeUrl(user.avatarUrl),
    profile: user.profile ?? null
  }
}

export const isLoggedIn = computed(() => !!accessToken.value)
export const hasProfile = computed(() => !!currentUser.value?.profile)
export const currentRole = computed(() => currentUser.value?.role ?? null)
export const currentNickname = computed(() => currentUser.value?.nickname ?? '')
export const currentAvatar = computed(() => resolvedAvatar.value || currentUser.value?.avatarUrl || '')
export const currentProfile = computed(() => currentUser.value?.profile ?? null)
export const authReady = computed(() => hydrated.value)

const getNow = () => Date.now()

const isProtectedAvatarUrl = (url: string) => {
  return url.includes('/api/auth/avatar') || url.endsWith('/auth/avatar')
}

const readAvatarCache = (url: string) => {
  if (!ENABLE_AVATAR_FILE_CACHE) {
    return ''
  }

  const cache = uni.getStorageSync(STORAGE_KEYS.AVATAR_FILE_CACHE)
  if (!cache) {
    return ''
  }

  try {
    const parsed = JSON.parse(cache as string) as Record<string, AvatarCacheRecord>
    const record = parsed[url]
    if (!record || !record.localPath || typeof record.expiresAt !== 'number') {
      return ''
    }

    if (record.expiresAt <= getNow()) {
      delete parsed[url]
      uni.setStorageSync(STORAGE_KEYS.AVATAR_FILE_CACHE, JSON.stringify(parsed))
      return ''
    }

    if (record.localPath.startsWith('blob:')) {
      delete parsed[url]
      uni.setStorageSync(STORAGE_KEYS.AVATAR_FILE_CACHE, JSON.stringify(parsed))
      return ''
    }

    return record.localPath
  } catch {
    uni.removeStorageSync(STORAGE_KEYS.AVATAR_FILE_CACHE)
    return ''
  }
}

const writeAvatarCache = (url: string, localPath: string) => {
  if (!ENABLE_AVATAR_FILE_CACHE || !localPath || localPath.startsWith('blob:')) {
    return
  }

  let parsed: Record<string, AvatarCacheRecord> = {}
  const raw = uni.getStorageSync(STORAGE_KEYS.AVATAR_FILE_CACHE)
  if (raw) {
    try {
      parsed = JSON.parse(raw as string) as Record<string, AvatarCacheRecord>
    } catch {
      parsed = {}
    }
  }

  parsed[url] = {
    localPath,
    expiresAt: getNow() + AVATAR_CACHE_TTL_MS
  }
  uni.setStorageSync(STORAGE_KEYS.AVATAR_FILE_CACHE, JSON.stringify(parsed))
}

const clearAvatarCacheByUrl = (url: string) => {
  if (!url) {
    return
  }

  const normalized = resolveBackendRelativeUrl(url)
  const raw = uni.getStorageSync(STORAGE_KEYS.AVATAR_FILE_CACHE)
  if (!raw) {
    return
  }

  try {
    const parsed = JSON.parse(raw as string) as Record<string, AvatarCacheRecord>
    if (!parsed[normalized]) {
      return
    }

    delete parsed[normalized]
    uni.setStorageSync(STORAGE_KEYS.AVATAR_FILE_CACHE, JSON.stringify(parsed))
  } catch {
    uni.removeStorageSync(STORAGE_KEYS.AVATAR_FILE_CACHE)
  }
}

const downloadProtectedAvatar = async (url: string) => {
  const token = accessToken.value
  if (!token) {
    return ''
  }

  const inflight = avatarInflight.get(url)
  if (inflight) {
    return inflight
  }

  const task = new Promise<string>((resolve, reject) => {
    uni.downloadFile({
      url,
      timeout: AVATAR_DOWNLOAD_TIMEOUT_MS,
      header: {
        Authorization: `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.tempFilePath) {
          uni.saveFile({
            tempFilePath: res.tempFilePath,
            success: (saveRes) => {
              resolve(saveRes.savedFilePath || res.tempFilePath)
            },
            fail: () => {
              resolve(res.tempFilePath)
            }
          })
          return
        }

        reject(new Error(`avatar download failed: ${res.statusCode}`))
      },
      fail: (error) => reject(error)
    })
  }).finally(() => {
    avatarInflight.delete(url)
  })

  avatarInflight.set(url, task)
  return task
}

const syncResolvedAvatar = async () => {
  const avatarUrl = currentUser.value?.avatarUrl || ''
  if (!avatarUrl) {
    resolvedAvatar.value = ''
    return
  }

  const normalized = resolveBackendRelativeUrl(avatarUrl)

  if (!isProtectedAvatarUrl(normalized)) {
    resolvedAvatar.value = normalized
    return
  }

  if (!ENABLE_AVATAR_FILE_CACHE) {
    resolvedAvatar.value = normalized
    return
  }

  const cached = readAvatarCache(normalized)
  if (cached) {
    resolvedAvatar.value = cached
    return
  }

  try {
    const localAvatar = await downloadProtectedAvatar(normalized)
    if (localAvatar) {
      writeAvatarCache(normalized, localAvatar)
      resolvedAvatar.value = localAvatar
      return
    }
  } catch {
    // Keep remote URL fallback when download fails.
  }

  resolvedAvatar.value = normalized
}

const persistState = () => {
  if (accessToken.value) {
    uni.setStorageSync(STORAGE_KEYS.ACCESS_TOKEN, accessToken.value)
  } else {
    uni.removeStorageSync(STORAGE_KEYS.ACCESS_TOKEN)
  }

  if (refreshToken.value) {
    uni.setStorageSync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken.value)
  } else {
    uni.removeStorageSync(STORAGE_KEYS.REFRESH_TOKEN)
  }

  if (currentUser.value) {
    uni.setStorageSync(STORAGE_KEYS.USER_CACHE, JSON.stringify(currentUser.value))
  } else {
    uni.removeStorageSync(STORAGE_KEYS.USER_CACHE)
  }
}

export const hydrateAuthState = () => {
  accessToken.value = uni.getStorageSync(STORAGE_KEYS.ACCESS_TOKEN) || ''
  refreshToken.value = uni.getStorageSync(STORAGE_KEYS.REFRESH_TOKEN) || ''

  const cachedUser = uni.getStorageSync(STORAGE_KEYS.USER_CACHE)
  if (cachedUser) {
    try {
      currentUser.value = normalizeUser(JSON.parse(cachedUser) as CurrentUser)
    } catch {
      currentUser.value = null
      uni.removeStorageSync(STORAGE_KEYS.USER_CACHE)
    }
  }

  hydrated.value = true
  void syncResolvedAvatar()
}

export const setSession = (payload: { accessToken: string; refreshToken: string; user?: CurrentUser | null }) => {
  accessToken.value = payload.accessToken
  refreshToken.value = payload.refreshToken
  currentUser.value = normalizeUser(payload.user)
  clearRequestCache()
  persistState()
  void syncResolvedAvatar()
}

export const setCurrentUser = (user: CurrentUser | null) => {
  currentUser.value = normalizeUser(user)
  persistState()
  void syncResolvedAvatar()
}

export const clearAuthState = () => {
  accessToken.value = ''
  refreshToken.value = ''
  currentUser.value = null
  resolvedAvatar.value = ''
  clearRequestCache()
  clearSessionStorage()
  persistState()
}
const getDeviceId = () => {
  const storedDeviceId = uni.getStorageSync(STORAGE_KEYS.DEVICE_ID)
  if (storedDeviceId) {
    return storedDeviceId
  }

  let generatedDeviceId: string
  
  generatedDeviceId = `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  
  uni.setStorageSync(STORAGE_KEYS.DEVICE_ID, generatedDeviceId)
  return generatedDeviceId
}

const getDeviceType = () => {
  let deviceType: number
  // #ifdef MP-WEIXIN
  deviceType = 1
  // #elif H5
  deviceType = 3
  // #endif
  return deviceType
}

const getCurrentRoute = () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const route = currentPage?.route || ''
  return route ? `/${route}` : '/pages/index/index'
}

const buildRedirectUrl = (path: string) => `/pages/mine/profile-form?redirect=${encodeURIComponent(path)}`

export const setPendingRedirect = (path: string) => {
  uni.setStorageSync(STORAGE_KEYS.PENDING_REDIRECT, path)
}

export const getPendingRedirect = () => uni.getStorageSync(STORAGE_KEYS.PENDING_REDIRECT) || ''

export const consumePendingRedirect = () => {
  const redirect = getPendingRedirect()
  uni.removeStorageSync(STORAGE_KEYS.PENDING_REDIRECT)
  return redirect
}

export const goToMine = () => {
  uni.reLaunch({ url: '/pages/mine/mine' })
}

export const goToProfileForm = (redirectPath = '') => {
  const target = redirectPath || consumePendingRedirect() || getCurrentRoute()
  uni.navigateTo({ url: buildRedirectUrl(target) })
}

export const showTeamIntro = () => {
  uni.showModal({
    title: '团队介绍',
    content: '本团队来自中国矿业大学公共管理学院，致力于通过技术手段服务志愿者和社会公益组织，提升志愿服务的效率和影响力。\n\n管理员联系方式(QQ)：\n李天琦：2777434282\n\n本小程序由计科24-4班李天琦开发\n联系方式：18500605698@163.com',
    showCancel: false,
    confirmText: 'OK'
  })
}
export const fetchCurrentUser = async () => {
  const data = await requestJson<MeResponse>({
    url: '/auth/me',
    method: 'GET',
    cache: {
      enabled: true,
      ttlMs: 8 * 1000
    }
  })

  setCurrentUser(data.user)
  return data.user
}

export const loginWithWechat = async () => {
  let loginCode = ''

  // #ifndef MP-WEIXIN
  loginCode = 'test-code-001'
  // #endif

  // #ifdef MP-WEIXIN
  const loginResult = await new Promise<UniApp.LoginRes>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: resolve,
      fail: reject
    })
  })

  if (!loginResult.code) {
    throw new ApiError(40001, '微信登录失败')
  }
  loginCode = loginResult.code  
  // #endif

  const data = await requestJson<LoginResponse>({
    url: '/login/wechat',
    method: 'POST',
    auth: false,
    data: {
      code: loginCode, 
      deviceId: getDeviceId(),
      deviceType: getDeviceType()
    }
  })

  setSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: data.user
  })

  const meUser = await fetchCurrentUser()
  return meUser
}

export const ensureLoginForRoute = (redirectPath: string) => {
  if (isLoggedIn.value) {
    return true
  }

  setPendingRedirect(redirectPath)
  goToMine()
  return false
}

export const ensureProfileForRoute = (redirectPath: string) => {
  if (!isLoggedIn.value) {
    setPendingRedirect(redirectPath)
    goToMine()
    return false
  }

  if (!hasProfile.value) {
    setPendingRedirect(redirectPath)
    goToProfileForm(redirectPath)
    return false
  }

  return true
}

export const updateAvatar = async (avatarPath: string) => {
  const previousAvatar = currentUser.value?.avatarUrl || ''

  const data = await uploadJson<BaseUserResponse>({
    url: '/auth/avatar',
    filePath: avatarPath,
    name: 'avatar'
  })

  clearAvatarCacheByUrl(previousAvatar)
  clearAvatarCacheByUrl(data.user?.avatarUrl || '')
  resolvedAvatar.value = ''
  setCurrentUser(data.user)
  await syncResolvedAvatar()
  return data.user
}

export const updateNickname = async (nickname: string) => {
  const data = await requestJson<BaseUserResponse>({
    url: '/auth/nickname',
    method: 'POST',
    data: {
      nickname
    }
  })

  setCurrentUser(data.user)
  return data.user
}

export const updateProfile = async (payload: ProfileFormPayload) => {
  const data = await requestJson<ProfileResponse>({
    url: '/auth/profile',
    method: 'POST',
    data: payload
  })

  if (currentUser.value) {
    currentUser.value = {
      ...currentUser.value,
      profile: data.profile
    }
    persistState()
  }

  return data.profile
}

export const logout = async () => {
  try {
    await requestJson<null>({
      url: '/auth/logout',
      method: 'POST'
    })
  } finally {
    clearAuthState()
  }
}



