import { onShow } from '@dcloudio/uni-app'

import {
  currentRole,
  ensureLoginForRoute,
  ensureProfileForRoute,
  fetchCurrentUser
} from '@/utils/auth'

type GuardOptions = {
  routePath: string
  roleCheck?: (role: number | null) => boolean
  onForbidden?: () => void
  onAuthorized?: () => void | Promise<void>
  fetchUser?: boolean
}

export const useAuthGuard = (options: GuardOptions) => {
  const { routePath, roleCheck, onForbidden, onAuthorized, fetchUser = true } = options

  onShow(async () => {
    if (!ensureLoginForRoute(routePath)) {
      return
    }

    if (!ensureProfileForRoute(routePath)) {
      return
    }

    if (fetchUser) {
      try {
        await fetchCurrentUser()
      } catch {
        return
      }
    }

    if (roleCheck && !roleCheck(currentRole.value)) {
      onForbidden?.()
      return
    }

    await onAuthorized?.()
  })
}
