import type { User } from '@/store/auth.store'

export interface TokenPair {
  accessToken: string
  accessTokenExpiresInSec: number
  refreshToken: string
  refreshTokenExpiresInSec: number
}

export interface AdminUserPayload {
  id: string
  status: string
  roles: string[]
  permissions?: string[]
  isNew: boolean
  email?: string | null
  phoneNumber?: string
  name?: string | null
}

export interface AdminLoginResponse extends TokenPair {
  user: AdminUserPayload
}

export interface LoginResponse {
  token: string
  refreshToken: string
  user: User
  accessTokenExpiresInSec?: number
}

export interface AuthError {
  message: string
  errors?: Record<string, string[]>
}

export interface SendOtpResponse {
  challengeId: string
  expiresInSec: number
  resendAvailableInSec: number
}
