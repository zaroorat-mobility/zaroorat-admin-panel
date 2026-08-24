import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type { UserEntity, UserDetails } from '../types'
import type { UserFormData } from '../schemas'

function splitName(name: string): { firstName: string; lastName: string } {
  const trimmed = name.trim()
  const space = trimmed.indexOf(' ')
  if (space === -1) return { firstName: trimmed, lastName: '' }
  return { firstName: trimmed.slice(0, space), lastName: trimmed.slice(space + 1).trim() }
}

export const getUsers = async (params?: QueryParams): Promise<PaginatedResponse<UserEntity>> => {
  const response = await api.get<PaginatedResponse<UserEntity>>(API_ENDPOINTS.users.list, { params })
  return response.data
}

export const getUserById = async (id: string): Promise<UserDetails> => {
  const response = await api.get<{ data: UserDetails }>(API_ENDPOINTS.users.detail(id))
  return response.data.data
}

export const createUser = async (data: UserFormData): Promise<UserEntity> => {
  const { firstName, lastName } = splitName(data.name)
  const response = await api.post<{ data: UserEntity }>(API_ENDPOINTS.users.create, {
    firstName,
    lastName,
    email: data.email,
    phoneNumber: data.phone,
    password: data.password,
    role: data.role,
  })
  return response.data.data
}

export const updateUser = async (id: string, data: Partial<UserFormData>): Promise<UserEntity> => {
  const response = await api.patch<{ data: UserEntity }>(API_ENDPOINTS.users.update(id), data)
  return response.data.data
}

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(API_ENDPOINTS.users.delete(id))
}

export interface RbacPermission {
  code: string
  resource: string
  action: string
  description: string | null
  locked: boolean
}

export interface RbacRole {
  slug: string
  name: string
  description: string | null
  isSystem: boolean
  editable: boolean
  permissionCodes: string[]
}

export const getRbacPermissions = async (): Promise<RbacPermission[]> => {
  const response = await api.get<{ data: RbacPermission[] }>(API_ENDPOINTS.rbac.permissions)
  return response.data.data
}

export const getRbacRoles = async (): Promise<RbacRole[]> => {
  const response = await api.get<{ data: RbacRole[] }>(API_ENDPOINTS.rbac.roles)
  return response.data.data
}

export const putRbacRolePermissions = async (
  slug: string,
  permissionCodes: string[],
): Promise<RbacRole> => {
  const response = await api.put<{ data: RbacRole }>(API_ENDPOINTS.rbac.rolePermissions(slug), {
    permissionCodes,
  })
  return response.data.data
}

export const createRbacRole = async (input: {
  name: string
  description?: string
  permissionCodes?: string[]
}): Promise<RbacRole> => {
  const response = await api.post<{ data: RbacRole }>(API_ENDPOINTS.rbac.roles, input)
  return response.data.data
}
