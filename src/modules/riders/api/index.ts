import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type { RiderEntity, RiderDetails } from '../types'

export const getRiders = async (params?: QueryParams): Promise<PaginatedResponse<RiderEntity>> => {
  const response = await api.get<PaginatedResponse<RiderEntity>>(API_ENDPOINTS.riders.list, { params })
  return response.data
}

export const getRiderById = async (id: string): Promise<RiderDetails> => {
  const response = await api.get<RiderDetails>(API_ENDPOINTS.riders.detail(id))
  return response.data
}

export const updateRider = async (id: string, data: Partial<RiderEntity>): Promise<RiderEntity> => {
  const response = await api.patch<RiderEntity>(API_ENDPOINTS.riders.update(id), data)
  return response.data
}
