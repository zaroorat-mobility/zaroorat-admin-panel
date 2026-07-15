import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type { UserEntity, UserDetails } from '../types'
import type { UserFormData } from '../schemas'

export const getUsers = async (params?: QueryParams): Promise<PaginatedResponse<UserEntity>> => {
  const response = await api.get<PaginatedResponse<UserEntity>>(API_ENDPOINTS.users.list, { params })
  return response.data
}

export const getUserById = async (id: string): Promise<UserDetails> => {
  const response = await api.get<UserDetails>(API_ENDPOINTS.users.detail(id))
  return response.data
}

export const createUser = async (data: UserFormData): Promise<UserEntity> => {
  const response = await api.post<UserEntity>(API_ENDPOINTS.users.create, data)
  return response.data
}

export const updateUser = async (id: string, data: Partial<UserFormData>): Promise<UserEntity> => {
  const response = await api.patch<UserEntity>(API_ENDPOINTS.users.update(id), data)
  return response.data
}

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(API_ENDPOINTS.users.delete(id))
}
