import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type { DriverEntity, DriverDetails } from '../types'

export const getDrivers = async (params?: QueryParams): Promise<PaginatedResponse<DriverEntity>> => {
  const response = await api.get<PaginatedResponse<DriverEntity>>(API_ENDPOINTS.drivers.list, { params })
  return response.data
}

export const getDriverById = async (id: string): Promise<DriverDetails> => {
  const response = await api.get<DriverDetails>(API_ENDPOINTS.drivers.detail(id))
  return response.data
}

export const updateDriver = async (id: string, data: Partial<DriverEntity>): Promise<DriverEntity> => {
  const response = await api.patch<DriverEntity>(API_ENDPOINTS.drivers.update(id), data)
  return response.data
}
