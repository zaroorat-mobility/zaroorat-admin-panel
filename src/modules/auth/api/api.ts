import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { LoginFormData, AdminOtpVerifyData } from '../schemas'
import type { AdminLoginResponse, SendOtpResponse } from '../types'

export const postLogin = async (credentials: LoginFormData): Promise<AdminLoginResponse> => {
  const response = await api.post<AdminLoginResponse>(API_ENDPOINTS.auth.login, {
    email: credentials.email,
    password: credentials.password,
  })
  return response.data
}

export const postAdminOtpSend = async (phoneNumber: string): Promise<SendOtpResponse> => {
  const response = await api.post<SendOtpResponse>(API_ENDPOINTS.auth.otpSend, { phoneNumber })
  return response.data
}

export const postAdminOtpVerify = async (
  payload: AdminOtpVerifyData,
): Promise<AdminLoginResponse> => {
  const response = await api.post<AdminLoginResponse>(API_ENDPOINTS.auth.otpVerify, payload, {
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  })
  return response.data
}

/**
 * Call Revoke Session endpoint
 */
export const postLogout = async (): Promise<void> => {
  await api.post(API_ENDPOINTS.auth.logout, {})
}

export const postRefresh = async (refreshToken: string): Promise<AdminLoginResponse> => {
  const response = await api.post<AdminLoginResponse>(
    API_ENDPOINTS.auth.refreshToken,
    { refreshToken },
    { headers: { 'Idempotency-Key': crypto.randomUUID() } },
  )
  return response.data
}
