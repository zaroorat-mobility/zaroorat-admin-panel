import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { LoginFormData } from '../schemas'
import type { LoginResponse } from '../types'

/**
 * Call Authentication endpoint
 */
export const postLogin = async (credentials: LoginFormData): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>(API_ENDPOINTS.auth.login, credentials)
  return response.data
}

/**
 * Call Revoke Session endpoint
 */
export const postLogout = async (): Promise<void> => {
  await api.post(API_ENDPOINTS.auth.logout)
}
