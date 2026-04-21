import { STORAGE_KEYS } from './constants'

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const joinUrl = (baseUrl: string, path: string) => {
  const normalizedBase = trimTrailingSlash(baseUrl)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

export const API_BASE_URL = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || '')
const PUBLIC_FILE_API_PATH = '/content/public-file'
const PUBLIC_ASSET_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const PUBLIC_ASSET_DOWNLOAD_TIMEOUT_MS = 15 * 1000

// #ifdef H5
const ENABLE_LOCAL_FILE_CACHE = false
// #endif
// #ifndef H5
const ENABLE_LOCAL_FILE_CACHE = true
// #endif

type PublicAssetCacheRecord = {
  localPath: string
  expiresAt: number
}

const publicAssetCache = new Map<string, PublicAssetCacheRecord>()
const inflightAssetDownloads = new Map<string, Promise<void>>()
let cacheLoaded = false

const getApiBaseOrigin = () => {
  if (API_BASE_URL.endsWith('/api')) {
    return API_BASE_URL.slice(0, -4)
  }

  return API_BASE_URL
}

const getNow = () => Date.now()

const normalizePublicPath = (path: string) => path.replace(/^\/+/, '').replace(/^public\//, '')

const loadPublicAssetCache = () => {
  if (cacheLoaded) {
    return
  }

  cacheLoaded = true
  const raw = uni.getStorageSync(STORAGE_KEYS.PUBLIC_ASSET_CACHE)
  if (!raw) {
    return
  }

  try {
    const parsed = JSON.parse(raw as string) as Record<string, PublicAssetCacheRecord>
    const now = getNow()

    Object.entries(parsed).forEach(([path, record]) => {
      if (
        record &&
        typeof record.localPath === 'string' &&
        typeof record.expiresAt === 'number' &&
        record.localPath &&
        record.expiresAt > now
      ) {
        publicAssetCache.set(path, record)
      }
    })
  } catch {
    publicAssetCache.clear()
    uni.removeStorageSync(STORAGE_KEYS.PUBLIC_ASSET_CACHE)
  }
}

const persistPublicAssetCache = () => {
  const payload: Record<string, PublicAssetCacheRecord> = {}
  publicAssetCache.forEach((value, key) => {
    payload[key] = value
  })

  uni.setStorageSync(STORAGE_KEYS.PUBLIC_ASSET_CACHE, JSON.stringify(payload))
}

const readPublicAssetCache = (path: string) => {
  if (!ENABLE_LOCAL_FILE_CACHE) {
    return ''
  }

  loadPublicAssetCache()

  const cached = publicAssetCache.get(path)
  if (!cached) {
    return ''
  }

  if (cached.expiresAt <= getNow()) {
    publicAssetCache.delete(path)
    persistPublicAssetCache()
    return ''
  }

  if (cached.localPath.startsWith('blob:')) {
    publicAssetCache.delete(path)
    persistPublicAssetCache()
    return ''
  }

  return cached.localPath
}

const writePublicAssetCache = (path: string, localPath: string) => {
  if (!ENABLE_LOCAL_FILE_CACHE || !localPath || localPath.startsWith('blob:')) {
    return
  }

  publicAssetCache.set(path, {
    localPath,
    expiresAt: getNow() + PUBLIC_ASSET_CACHE_TTL_MS
  })
  persistPublicAssetCache()
}

const downloadPublicAsset = (url: string) =>
  new Promise<string>((resolve, reject) => {
    uni.downloadFile({
      url,
      timeout: PUBLIC_ASSET_DOWNLOAD_TIMEOUT_MS,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.tempFilePath) {
          resolve(res.tempFilePath)
          return
        }

        reject(new Error(`download failed: ${res.statusCode}`))
      },
      fail: (error) => reject(error)
    })
  })

const savePublicAssetFile = (tempFilePath: string) =>
  new Promise<string>((resolve) => {
    uni.saveFile({
      tempFilePath,
      success: (res) => resolve(res.savedFilePath || tempFilePath),
      fail: () => resolve(tempFilePath)
    })
  })

export const getApiUrl = (path: string) => {
  if (path.startsWith('http')) {
    return path
  }

  return joinUrl(API_BASE_URL, path)
}

export const resolveBackendRelativeUrl = (path: string) => {
  if (!path) {
    return ''
  }

  if (path.startsWith('http')) {
    return path
  }

  if (path.startsWith('/api/')) {
    return joinUrl(getApiBaseOrigin(), path)
  }

  return getApiUrl(path)
}

export const getAssetUrl = (path: string) => {
  const normalizedPath = normalizePublicPath(path)

  if (!ENABLE_LOCAL_FILE_CACHE) {
    const query = `${PUBLIC_FILE_API_PATH}?path=${encodeURIComponent(normalizedPath)}`
    return getApiUrl(query)
  }

  const cached = readPublicAssetCache(normalizedPath)
  if (cached) {
    return cached
  }

  const query = `${PUBLIC_FILE_API_PATH}?path=${encodeURIComponent(normalizedPath)}`
  const remoteUrl = getApiUrl(query)

  const inflight = inflightAssetDownloads.get(normalizedPath)
  if (!inflight) {
    const task = (async () => {
      try {
        const tempFilePath = await downloadPublicAsset(remoteUrl)
        const localPath = await savePublicAssetFile(tempFilePath)
        writePublicAssetCache(normalizedPath, localPath)
      } catch {
        // Keep remote URL fallback when local cache build fails.
      } finally {
        inflightAssetDownloads.delete(normalizedPath)
      }
    })()

    inflightAssetDownloads.set(normalizedPath, task)
  }

  return remoteUrl
}
