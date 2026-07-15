import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import DriverService from '../services'
import type { QueryParams } from '@/shared/types'
import type { DriverEntity } from '../types'

export const useDrivers = (params?: QueryParams) => {
  return useQuery({
    queryKey: ['drivers', 'list', params],
    queryFn: () => DriverService.fetchDrivers(params),
  })
}

export const useDriver = (id: string) => {
  return useQuery({
    queryKey: ['drivers', 'detail', id],
    queryFn: () => DriverService.fetchDriverById(id),
    enabled: !!id,
  })
}

export const useUpdateDriver = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<DriverEntity>) => DriverService.updateDriver(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['drivers', 'detail', id] })
    },
  })
}
