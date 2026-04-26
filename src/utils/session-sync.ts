export type SessionHooks = {
  onSessionRefreshed?: (payload: { accessToken: string; refreshToken: string }) => void
  onSessionCleared?: () => void
}

let sessionHooks: SessionHooks = {}

export const registerSessionHooks = (hooks: SessionHooks) => {
  sessionHooks = hooks
}

export const getSessionHooks = () => sessionHooks
