import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryParams } from '@/shared/types'
import { FinancialService } from '../services'
import type { DisputeStatus, DisputeResolutionType, PaymentDispute } from '../types'

const QK = {
  disputes: (params?: QueryParams) => ['financial', 'disputes', params || {}] as const,
  dispute: (id: string) => ['financial', 'dispute', id] as const
}

export const useDisputes = (params?: QueryParams) => {
  return useQuery({
    queryKey: QK.disputes(params),
    queryFn: () => FinancialService.getDisputes(params)
  })
}

export const useDispute = (id: string) => {
  return useQuery({
    queryKey: QK.dispute(id),
    queryFn: () => FinancialService.getDisputeById(id),
    enabled: !!id
  })
}

export const useCreateDispute = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<PaymentDispute, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'timeline'>) =>
      FinancialService.createDispute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] })
    }
  })
}

export const useAssignDispute = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, agentName }: { id: string; agentName: string }) =>
      FinancialService.assignDispute(id, agentName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] })
    }
  })
}

export const useUpdateDisputeStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: DisputeStatus; notes?: string }) =>
      FinancialService.updateDisputeStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] })
    }
  })
}

export const useResolveDispute = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      resolutionType,
      notes,
      adjustmentAmount
    }: {
      id: string
      resolutionType: DisputeResolutionType
      notes: string
      adjustmentAmount?: number
    }) => FinancialService.resolveDispute(id, resolutionType, notes, adjustmentAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] })
    }
  })
}

export const useCloseDispute = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      FinancialService.closeDispute(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] })
    }
  })
}
