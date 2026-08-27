export function decodeJwtExpiryMs(token: string): number | null {
  try {
    const segment = token.split('.')[1]
    if (!segment) return null
    const padded = segment + '='.repeat((4 - (segment.length % 4)) % 4)
    const json = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(json) as { exp?: unknown }
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

export function parseTokenPair(
  data: unknown,
): { accessToken: string; refreshToken: string; accessTokenExpiresInSec?: number } | null {
  if (!data || typeof data !== 'object') return null
  const record = data as Record<string, unknown>
  const accessToken = record.accessToken
  const refreshToken = record.refreshToken
  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') return null
  const accessTokenExpiresInSec = record.accessTokenExpiresInSec
  return {
    accessToken,
    refreshToken,
    ...(typeof accessTokenExpiresInSec === 'number' ? { accessTokenExpiresInSec } : {}),
  }
}

export function resolveTokenExpiryMs(
  accessToken: string,
  accessTokenExpiresInSec?: number,
): number {
  const fromJwt = decodeJwtExpiryMs(accessToken)
  if (fromJwt) return fromJwt
  const ttlMs = (accessTokenExpiresInSec ?? 900) * 1000
  return Date.now() + ttlMs
}
