import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryParams } from '@/shared/types'
import { RiderManagementService } from '../services'

const QK = {
  riders: (params?: QueryParams) => ['rider-management', 'riders', params],
  rider: (id: string) => ['rider-management', 'riders', 'detail', id],
}

export const useRiders = (params?: QueryParams) => {
  return useQuery({
    queryKey: QK.riders(params),
    queryFn: () => RiderManagementService.getRiders(params),
  })
}

export const useRider = (id: string) => {
  return useQuery({
    queryKey: QK.rider(id),
    queryFn: () => RiderManagementService.getRiderById(id),
    enabled: !!id,
  })
}

export const useSuspendRider = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      RiderManagementService.suspendRider(id, notes),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['rider-management', 'riders'] })
      qc.invalidateQueries({ queryKey: QK.rider(id) })
    },
  })
}

export const useBlockRider = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      RiderManagementService.blockRider(id, notes),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['rider-management', 'riders'] })
      qc.invalidateQueries({ queryKey: QK.rider(id) })
    },
  })
}

export const useActivateRider = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      RiderManagementService.activateRider(id, notes),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['rider-management', 'riders'] })
      qc.invalidateQueries({ queryKey: QK.rider(id) })
    },
  })
}
