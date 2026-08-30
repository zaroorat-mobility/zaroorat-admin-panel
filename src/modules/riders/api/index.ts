import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type { RiderEntity, RiderDetails } from '../types'

export const getRiders = async (params?: QueryParams): Promise<PaginatedResponse<RiderEntity>> => {
  const response = await api.get<PaginatedResponse<RiderEntity>>(API_ENDPOINTS.riders.list, {
    params,
  })
  return response.data
}

export const getRiderById = async (id: string): Promise<RiderDetails> => {
  const response = await api.get<{ data: RiderDetails }>(API_ENDPOINTS.riders.detail(id))
  return response.data.data
}

export const suspendRider = async (id: string, notes?: string): Promise<RiderDetails> => {
  const response = await api.post<{ data: RiderDetails }>(API_ENDPOINTS.riders.suspend(id), {
    ...(notes ? { notes } : {}),
  })
  return response.data.data
}

export const blockRider = async (id: string, notes?: string): Promise<RiderDetails> => {
  const response = await api.post<{ data: RiderDetails }>(API_ENDPOINTS.riders.block(id), {
    ...(notes ? { notes } : {}),
  })
  return response.data.data
}

export const activateRider = async (id: string, notes?: string): Promise<RiderDetails> => {
  const response = await api.post<{ data: RiderDetails }>(API_ENDPOINTS.riders.activate(id), {
    ...(notes ? { notes } : {}),
  })
  return response.data.data
}
