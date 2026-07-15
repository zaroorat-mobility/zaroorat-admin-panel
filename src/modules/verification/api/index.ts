import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type { VerificationEntity, VerificationDetails } from '../types'

export const getVerifications = async (params?: QueryParams): Promise<PaginatedResponse<VerificationEntity>> => {
  const response = await api.get<PaginatedResponse<VerificationEntity>>(API_ENDPOINTS.verification.list, { params })
  return response.data
}

export const getVerificationById = async (id: string): Promise<VerificationDetails> => {
  const response = await api.get<VerificationDetails>(API_ENDPOINTS.verification.detail(id))
  return response.data
}

export const approveVerification = async (id: string, notes?: string): Promise<void> => {
  await api.post(API_ENDPOINTS.verification.approve(id), { notes })
}

export const rejectVerification = async (id: string, notes?: string): Promise<void> => {
  await api.post(API_ENDPOINTS.verification.reject(id), { notes })
}
