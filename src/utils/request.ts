import { STORAGE_KEYS } from './constants'
import { getApiUrl } from './urls'
import { getSessionHooks } from './session-sync'

export type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
  details?: unknown
}

export class ApiError extends Error {
  code: number
  details?: unknown

  constructor(code: number, message: string, details?: unknown) {
    super(message)
    this.code = code
    this.details = details
  }
}

type RequestOptions = Omit<UniApp.RequestOptions, 'url' | 'success' | 'fail' | 'complete'> & {
  url: string
  auth?: boolean
  retry?: boolean
  dedupe?: boolean
  timeout?: number
  cache?: {
    enabled?: boolean
    ttlMs?: number
    key?: string
  }
}

type UploadOptions = Omit<UniApp.UploadFileOption, 'url' | 'success' | 'fail' | 'complete'> & {
  url: string
  auth?: boolean
  retry?: boolean
  timeout?: number
}

const getRequestUrl = (url: string) => getApiUrl(url)

const DEFAULT_HTTP_MAX_CONCURRENT = 4
const DEFAULT_HTTP_TIMEOUT_MS = 15 * 1000
const DEFAULT_GET_CACHE_TTL_MS = 8 * 1000

type CacheRecord = {
  expiresAt: number
  data: unknown
}

let activeRequestCount = 0
const requestQueue: Array<() => void> = []

const responseCache = new Map<string, CacheRecord>()
const inflightRequests = new Map<string, Promise<unknown>>()

const getNow = () => Date.now()

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`
}

const normalizeMethod = (method?: string) => (method || 'GET').toUpperCase()

const buildRequestKey = (method: string, url: string, payload: unknown, auth: boolean, cacheKey = '') => {
  if (cacheKey) {
    return `${method}::${cacheKey}`
  }

  return [method, url, auth ? 'auth' : 'anon', stableStringify(payload ?? null)].join('::')
}

const runNextRequest = () => {
  if (activeRequestCount >= DEFAULT_HTTP_MAX_CONCURRENT || requestQueue.length === 0) {
    return
  }

  const task = requestQueue.shift()
  if (!task) {
    return
  }

  activeRequestCount += 1
  task()
}

const withHttpConcurrencyLimit = <T>(task: () => Promise<T>) =>
  new Promise<T>((resolve, reject) => {
    const wrappedTask = async () => {
      try {
        const result = await task()
        resolve(result)
      } catch (error) {
        reject(error)
      } finally {
        activeRequestCount -= 1
        runNextRequest()
      }
    }

    requestQueue.push(wrappedTask)
    runNextRequest()
  })

const readResponseCache = <T>(key: string): T | null => {
  const record = responseCache.get(key)
  if (!record) {
    return null
  }

  if (record.expiresAt <= getNow()) {
    responseCache.delete(key)
    return null
  }

  return record.data as T
}

const writeResponseCache = <T>(key: string, data: T, ttlMs: number) => {
  responseCache.set(key, {
    data,
    expiresAt: getNow() + ttlMs
  })
}

const clearResponseCache = () => {
  responseCache.clear()
}

let refreshPromise: Promise<boolean> | null = null

const getStoredRefreshToken = () => uni.getStorageSync(STORAGE_KEYS.REFRESH_TOKEN) || ''

const clearStoredSession = () => {
  uni.removeStorageSync(STORAGE_KEYS.ACCESS_TOKEN)
  uni.removeStorageSync(STORAGE_KEYS.REFRESH_TOKEN)
  uni.removeStorageSync(STORAGE_KEYS.USER_CACHE)
  getSessionHooks().onSessionCleared?.()
}

const getCurrentRoute = () => {
  try {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const route = currentPage?.route || ''
    return route ? `/${route}` : '/pages/index/index'
  } catch {
    return '/pages/index/index'
  }
}

const redirectToLogin = () => {
  const currentRoute = getCurrentRoute()
  if (currentRoute !== '/pages/mine/mine' && currentRoute !== '/pages/mine/profile-form') {
    uni.setStorageSync(STORAGE_KEYS.PENDING_REDIRECT, currentRoute)
  }

  uni.reLaunch({
    url: '/pages/mine/mine'
  })
}

const refreshSession = async () => {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = new Promise<boolean>((resolve) => {
    const refreshToken = getStoredRefreshToken()

    if (!refreshToken) {
      resolve(false)
      return
    }

    withHttpConcurrencyLimit(
      () =>
        new Promise<void>((innerResolve) => {
          uni.request({
            url: getRequestUrl('/auth/refresh-token'),
            method: 'POST',
            timeout: DEFAULT_HTTP_TIMEOUT_MS,
            header: {
              'Content-Type': 'application/json'
            },
            data: {
              refreshToken
            },
            success: (res) => {
              const result = res.data as ApiEnvelope<{ accessToken: string; refreshToken: string }>

              if (result && result.code === 0 && result.data) {
                uni.setStorageSync(STORAGE_KEYS.ACCESS_TOKEN, result.data.accessToken)
                uni.setStorageSync(STORAGE_KEYS.REFRESH_TOKEN, result.data.refreshToken)
                getSessionHooks().onSessionRefreshed?.({
                  accessToken: result.data.accessToken,
                  refreshToken: result.data.refreshToken
                })
                resolve(true)
                innerResolve()
                return
              }

              clearStoredSession()
              resolve(false)
              innerResolve()
            },
            fail: () => {
              clearStoredSession()
              resolve(false)
              innerResolve()
            },
            complete: () => {
              refreshPromise = null
            }
          })
        })
    ).catch(() => {
      clearStoredSession()
      resolve(false)
      refreshPromise = null
    })
  })

  return refreshPromise
}

const buildHeaders = (auth: boolean, contentType?: string) => {
  const headers: Record<string, string> = {}
  if (contentType) {
    headers['Content-Type'] = contentType
  }

  if (auth) {
    const accessToken = uni.getStorageSync(STORAGE_KEYS.ACCESS_TOKEN) || ''
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }
  }

  return headers
}

export const requestJson = async <T>(options: RequestOptions): Promise<T> => {
  const { auth = true, retry = false, dedupe = true, cache, url, header, timeout, ...rest } = options

  const method = normalizeMethod(rest.method as string | undefined)
  const requestUrl = getRequestUrl(url)
  const shouldUseCache = cache?.enabled ?? method === 'GET'
  const cacheTtlMs = cache?.ttlMs ?? DEFAULT_GET_CACHE_TTL_MS
  const requestTimeout = timeout ?? DEFAULT_HTTP_TIMEOUT_MS
  const requestKey = buildRequestKey(method, requestUrl, rest.data, auth, cache?.key)

  if (shouldUseCache) {
    const cached = readResponseCache<T>(requestKey)
    if (cached !== null) {
      return cached
    }
  }

  if (dedupe) {
    const inflight = inflightRequests.get(requestKey)
    if (inflight) {
      return inflight as Promise<T>
    }
  }

  const requestTask = withHttpConcurrencyLimit(
    () =>
      new Promise<ApiEnvelope<T> | T>((resolve, reject) => {
        uni.request({
          ...rest,
          timeout: requestTimeout,
          url: requestUrl,
          header: {
            ...buildHeaders(auth, (header as Record<string, string> | undefined)?.['Content-Type']),
            ...(header as Record<string, string> | undefined)
          },
          success: (res) => {
            resolve(res.data as ApiEnvelope<T> | T)
          },
          fail: (error) => {
            reject(error)
          }
        })
      })
  )

  const responsePromise = (async () => {
    const result = await requestTask

    if (result && typeof result === 'object' && 'code' in result) {
      const envelope = result as ApiEnvelope<T>

      if (envelope.code === 0) {
        if (shouldUseCache) {
          writeResponseCache(requestKey, envelope.data, cacheTtlMs)
        }

        if (method !== 'GET') {
          clearResponseCache()
        }

        return envelope.data
      }

      if (!retry && auth && (envelope.code === 40101 || envelope.code === 40301 || envelope.code === 40302)) {
        const refreshed = await refreshSession()
        if (refreshed) {
          return requestJson<T>({ ...options, retry: true })
        }
        clearStoredSession()
        redirectToLogin()
      }

      throw new ApiError(envelope.code, envelope.message, envelope.details)
    }

    if (shouldUseCache) {
      writeResponseCache(requestKey, result as T, cacheTtlMs)
    }

    if (method !== 'GET') {
      clearResponseCache()
    }

    return result as T
  })()

  if (dedupe) {
    inflightRequests.set(
      requestKey,
      responsePromise.finally(() => {
        inflightRequests.delete(requestKey)
      })
    )
  }

  return responsePromise
}

export const uploadJson = async <T>(options: UploadOptions): Promise<T> => {
  const { auth = true, retry = false, url, timeout, ...rest } = options
  const requestTimeout = timeout ?? DEFAULT_HTTP_TIMEOUT_MS

  const result = await withHttpConcurrencyLimit(
    () =>
      new Promise<ApiEnvelope<T> | T>((resolve, reject) => {
        uni.uploadFile({
          ...rest,
          timeout: requestTimeout,
          url: getRequestUrl(url),
          header: {
            ...buildHeaders(auth)
          },
          success: (res) => {
            try {
              resolve(JSON.parse(res.data) as ApiEnvelope<T> | T)
            } catch (error) {
              reject(error)
            }
          },
          fail: (error) => {
            reject(error)
          }
        })
      })
  )

  if (result && typeof result === 'object' && 'code' in result) {
    const envelope = result as ApiEnvelope<T>

    if (envelope.code === 0) {
      clearResponseCache()
      return envelope.data
    }

    if (!retry && auth && (envelope.code === 40101 || envelope.code === 40301 || envelope.code === 40302)) {
      const refreshed = await refreshSession()
      if (refreshed) {
        return uploadJson<T>({ ...options, retry: true })
      }
      clearStoredSession()
      redirectToLogin()
    }

    throw new ApiError(envelope.code, envelope.message, envelope.details)
  }

  clearResponseCache()
  return result as T
}

export const downloadFileWithAuth = async (url: string, retry = false): Promise<string> => {
  const result = await withHttpConcurrencyLimit(
    () =>
      new Promise<UniApp.DownloadSuccessData>((resolve, reject) => {
        uni.downloadFile({
          url: getRequestUrl(url),
          timeout: DEFAULT_HTTP_TIMEOUT_MS,
          header: {
            ...buildHeaders(true)
          },
          success: resolve,
          fail: reject
        })
      })
  )

  if (result.statusCode >= 200 && result.statusCode < 300 && result.tempFilePath) {
    return result.tempFilePath
  }

  if (!retry && (result.statusCode === 401 || result.statusCode === 403)) {
    const refreshed = await refreshSession()
    if (refreshed) {
      return downloadFileWithAuth(url, true)
    }
    clearStoredSession()
    redirectToLogin()
  }

  throw new Error(`download failed: ${result.statusCode}`)
}

export const clearSessionStorage = clearStoredSession
export const clearRequestCache = clearResponseCache

