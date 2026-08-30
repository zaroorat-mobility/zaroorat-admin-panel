import axios, { isAxiosError } from 'axios'
import { APP_CONFIG } from '@/app/config'
import { decodeJwtExpiryMs } from '@/infrastructure/auth/token-utils'
import { useAuthStore } from '@/store/auth.store'
import { parseTokenPair } from './token-utils'

let refreshPromise: Promise<string | null> | null = null

function isRefreshAuthFailure(error: unknown): boolean {
  return isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)
}

/**
 * Rotate the refresh token and persist a new access token pair.
 * Returns the new access token, or null when refresh is not possible.
 */
export async function refreshSession(options?: { force?: boolean }): Promise<string | null> {
  const { refreshToken, token, tokenExpiresAt, isAuthenticated } = useAuthStore.getState()
  if (!isAuthenticated || !refreshToken) return null

  if (!options?.force && token) {
    const expiresAt = tokenExpiresAt ?? decodeJwtExpiryMs(token)
    if (expiresAt && expiresAt - Date.now() > 90_000) {
      return token
    }
  }

  const refreshTokenSnapshot = useAuthStore.getState().refreshToken
  if (!refreshTokenSnapshot) return null

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await axios.post(
          `${APP_CONFIG.api.baseUrl}/auth/token/refresh`,
          { refreshToken: refreshTokenSnapshot },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'Idempotency-Key': crypto.randomUUID(),
            },
          },
        )

        const pair = parseTokenPair(response.data)
        if (!pair) throw new Error('Invalid token refresh response')

        useAuthStore.getState().updateTokens(pair.accessToken, pair.refreshToken, pair.accessTokenExpiresInSec)
        return pair.accessToken
      } catch (error) {
        if (isRefreshAuthFailure(error)) {
          useAuthStore.getState().clearCredentials()
        }
        return null
      } finally {
        refreshPromise = null
      }
    })()
  }

  return refreshPromise
}
