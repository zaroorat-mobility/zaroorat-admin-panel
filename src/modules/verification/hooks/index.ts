import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import VerificationService from '../services'
import type { QueryParams } from '@/shared/types'

export const useVerifications = (params?: QueryParams) => {
  return useQuery({
    queryKey: ['verifications', 'list', params],
    queryFn: () => VerificationService.fetchVerifications(params),
  })
}

export const useVerification = (id: string) => {
  return useQuery({
    queryKey: ['verifications', 'detail', id],
    queryFn: () => VerificationService.fetchVerificationById(id),
    enabled: !!id,
  })
}

export const useApproveVerification = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      VerificationService.approveVerification(id, notes),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['verifications', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['verifications', 'detail', id] })
    },
  })
}

export const useRejectVerification = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      VerificationService.rejectVerification(id, notes),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['verifications', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['verifications', 'detail', id] })
    },
  })
}
