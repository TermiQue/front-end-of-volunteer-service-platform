export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'volunteer_access_token',
  REFRESH_TOKEN: 'volunteer_refresh_token',
  USER_CACHE: 'volunteer_user_cache',
  DEVICE_ID: 'volunteer_device_id',
  PENDING_REDIRECT: 'volunteer_pending_redirect',
  PUBLIC_ASSET_CACHE: 'volunteer_public_asset_cache',
  AVATAR_FILE_CACHE: 'volunteer_avatar_file_cache'
} as const

const toPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export const DEFAULT_PAGE_SIZE = toPositiveInt(import.meta.env.VITE_PAGE_SIZE, 10)
