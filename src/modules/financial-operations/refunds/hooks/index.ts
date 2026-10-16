import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryParams } from '@/shared/types'
import { RefundService, type CreateRefundInput } from '../services'

const QK = {
  refunds: (params?: QueryParams) => ['financial', 'refunds', params || {}] as const,
  refund: (id: string) => ['financial', 'refund', id] as const
}

export const useRefunds = (params?: QueryParams) => {
  return useQuery({
    queryKey: QK.refunds(params),
    queryFn: () => RefundService.getRefunds(params)
  })
}

export const useRefund = (id: string) => {
  return useQuery({
    queryKey: QK.refund(id),
    queryFn: () => RefundService.getRefundById(id),
    enabled: !!id
  })
}

export const useCreateRefund = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateRefundInput) => RefundService.createRefund(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] })
    }
  })
}

export const useStartRefundReview = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string }) => RefundService.startRefundReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] })
    }
  })
}

export const useApproveRefund = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      approvedAmount,
      notes,
    }: {
      id: string
      approvedAmount: number
      notes: string
    }) => RefundService.approveRefund(id, approvedAmount, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] })
    }
  })
}

export const useRejectRefund = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      RefundService.rejectRefund(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] })
    }
  })
}

export const useMarkRefundProcessing = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string }) => RefundService.markRefundProcessing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] })
    }
  })
}

export const useMarkRefundCompleted = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string }) => RefundService.markRefundCompleted(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] })
    }
  })
}
