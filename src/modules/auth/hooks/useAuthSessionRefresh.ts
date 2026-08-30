import { useEffect } from 'react'
import { refreshSession } from '@/infrastructure/auth/session-refresh'
import { decodeJwtExpiryMs } from '@/infrastructure/auth/token-utils'
import { useAuthStore } from '@/store/auth.store'

const REFRESH_BUFFER_MS = 60_000
const VISIBILITY_REFRESH_THRESHOLD_MS = 120_000
const MIN_SCHEDULE_DELAY_MS = 5_000

/**
 * Keeps the admin session alive by refreshing access tokens before they expire,
 * including when the tab becomes visible again after being idle.
 */
export function useAuthSessionRefresh(): void {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const token = useAuthStore((state) => state.token)
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const tokenExpiresAt = useAuthStore((state) => state.tokenExpiresAt)

  useEffect(() => {
    if (!isAuthenticated || !token || !refreshToken) return

    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const scheduleRefresh = () => {
      const state = useAuthStore.getState()
      const expiresAt =
        state.tokenExpiresAt ?? (state.token ? decodeJwtExpiryMs(state.token) : null)
      if (!expiresAt) return

      const delay = Math.max(expiresAt - Date.now() - REFRESH_BUFFER_MS, MIN_SCHEDULE_DELAY_MS)
      timeoutId = setTimeout(() => {
        void refreshSession().then((nextToken) => {
          if (nextToken) scheduleRefresh()
        })
      }, delay)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return

      const state = useAuthStore.getState()
      const expiresAt =
        state.tokenExpiresAt ?? (state.token ? decodeJwtExpiryMs(state.token) : null)
      if (!expiresAt) return

      if (expiresAt - Date.now() <= VISIBILITY_REFRESH_THRESHOLD_MS) {
        void refreshSession({ force: true }).then((nextToken) => {
          if (nextToken) scheduleRefresh()
        })
      }
    }

    scheduleRefresh()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAuthenticated, token, refreshToken, tokenExpiresAt])
}
