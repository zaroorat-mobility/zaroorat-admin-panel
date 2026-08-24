import { postLogin, postLogout, postAdminOtpSend, postAdminOtpVerify } from '../api'
import type { LoginFormData, AdminOtpVerifyData } from '../schemas'
import type { AdminLoginResponse, AdminUserPayload, LoginResponse } from '../types'
import type { AdminRole, User } from '@/store/auth.store'

function mapRole(roles: string[]): AdminRole {
  if (roles.includes('admin')) return 'admin'
  if (roles.includes('support')) return 'support'
  if (roles.includes('finance')) return 'admin'
  return 'admin'
}

export function toSessionUser(payload: AdminUserPayload): User {
  return {
    id: payload.id,
    name: payload.name?.trim() || payload.email || payload.phoneNumber || 'Staff',
    email: payload.email || payload.phoneNumber || '',
    role: mapRole(payload.roles),
    permissions: payload.roles,
  }
}

export function toLoginResponse(result: AdminLoginResponse): LoginResponse {
  return {
    token: result.accessToken,
    refreshToken: result.refreshToken,
    user: toSessionUser(result.user),
  }
}

export const AuthService = {
  async login(credentials: LoginFormData): Promise<LoginResponse> {
    return toLoginResponse(await postLogin(credentials))
  },

  async sendOtp(phoneNumber: string) {
    return postAdminOtpSend(phoneNumber)
  },

  async verifyOtp(payload: AdminOtpVerifyData): Promise<LoginResponse> {
    return toLoginResponse(await postAdminOtpVerify(payload))
  },

  async logout(): Promise<void> {
    return postLogout()
  },
}

export default AuthService
