import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { QueryParams } from '@/shared/types'
import type {
  AdminSession,
  LoginHistoryEntry,
  PaginatedMeta,
  SecurityEvent,
  SecurityPolicy,
} from '../types'

export const getSecuritySessions = async (
  params?: QueryParams,
): Promise<{ data: AdminSession[]; meta: PaginatedMeta }> => {
  const response = await api.get<{ data: AdminSession[]; meta: PaginatedMeta }>(
    API_ENDPOINTS.security.sessions,
    { params },
  )
  return response.data
}

export const revokeSecuritySession = async (id: string): Promise<void> => {
  await api.post(API_ENDPOINTS.security.revokeSession(id))
}

export const forceLogoutAll = async (userId?: string): Promise<{ revokedCount: number }> => {
  const response = await api.post<{ revokedCount: number }>(
    API_ENDPOINTS.security.forceLogoutAll,
    userId ? { userId } : {},
  )
  return response.data
}

export const getLoginHistory = async (
  params?: QueryParams,
): Promise<{ data: LoginHistoryEntry[]; meta: PaginatedMeta }> => {
  const response = await api.get<{ data: LoginHistoryEntry[]; meta: PaginatedMeta }>(
    API_ENDPOINTS.security.loginHistory,
    { params },
  )
  return response.data
}

export const getSecurityEvents = async (
  params?: QueryParams,
): Promise<{ data: SecurityEvent[]; meta: PaginatedMeta }> => {
  const response = await api.get<{ data: SecurityEvent[]; meta: PaginatedMeta }>(
    API_ENDPOINTS.security.events,
    { params },
  )
  return response.data
}

export const getSecurityPolicy = async (): Promise<SecurityPolicy> => {
  const response = await api.get<SecurityPolicy>(API_ENDPOINTS.security.policy)
  return response.data
}

export const updateSecurityPolicy = async (
  patch: Partial<SecurityPolicy>,
): Promise<SecurityPolicy> => {
  const response = await api.put<SecurityPolicy>(API_ENDPOINTS.security.policy, patch)
  return response.data
}
