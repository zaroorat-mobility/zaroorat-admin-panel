export interface AdminSession {
  id: string
  userId: string
  userEmail: string | null
  userPhone: string | null
  ipAddress: string | null
  userAgent: string | null
  mfaVerified: boolean
  startedAt: string
  expiresAt: string
  revokedAt: string | null
  active: boolean
}

export interface LoginHistoryEntry {
  id: string
  userId: string
  userEmail: string | null
  loginMethod: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  revokedAt: string | null
  active: boolean
}

export interface SecurityEvent {
  id: string
  actorId: string | null
  action: string
  entityType: string | null
  entityId: string | null
  summary: string | null
  ipAddress: string | null
  createdAt: string
}

export interface SecurityPolicy {
  sessionMaxConcurrent: number
  sessionTtlHours: number
  requireMfa: boolean
  ipAllowlistEnabled: boolean
  passwordMinLength: number
}

export interface PaginatedMeta {
  page: number
  limit: number
  total: number
}
