import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import RiderService from '../services'
import type { QueryParams } from '@/shared/types'
import type { RiderEntity } from '../types'

export const useRiders = (params?: QueryParams) => {
  return useQuery({
    queryKey: ['riders', 'list', params],
    queryFn: () => RiderService.fetchRiders(params),
  })
}

export const useRider = (id: string) => {
  return useQuery({
    queryKey: ['riders', 'detail', id],
    queryFn: () => RiderService.fetchRiderById(id),
    enabled: !!id,
  })
}

export const useUpdateRider = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<RiderEntity>) => RiderService.updateRider(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['riders', 'detail', id] })
    },
  })
}
