import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import UserService from '../services'
import type { QueryParams } from '@/shared/types'
import type { UserFormData } from '../schemas'

export const useUsers = (params?: QueryParams) => {
  return useQuery({
    queryKey: ['users', 'list', params],
    queryFn: () => UserService.fetchUsers(params),
  })
}

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['users', 'detail', id],
    queryFn: () => UserService.fetchUserById(id),
    enabled: !!id,
  })
}

export const useCreateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UserFormData) => UserService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
    },
  })
}

export const useUpdateUser = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<UserFormData>) => UserService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['users', 'detail', id] })
    },
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => UserService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
    },
  })
}
