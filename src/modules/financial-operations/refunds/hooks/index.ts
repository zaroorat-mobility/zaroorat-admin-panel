import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryParams } from '@/shared/types'
import { RefundService } from '../services'
import type { RefundRequest } from '../types'

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
    mutationFn: (
      data: Omit<RefundRequest, 'id' | 'refundId' | 'createdAt' | 'updatedAt' | 'timeline' | 'requestedAt' | 'status' | 'approvalLevel'>
    ) => RefundService.createRefund(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] })
    }
  })
}

export const useStartRefundReview = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reviewerName }: { id: string; reviewerName: string }) =>
      RefundService.startRefundReview(id, reviewerName),
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
      reviewerName
    }: {
      id: string
      approvedAmount: number
      notes: string
      reviewerName: string
    }) => RefundService.approveRefund(id, approvedAmount, notes, reviewerName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] })
    }
  })
}

export const useRejectRefund = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason, reviewerName }: { id: string; reason: string; reviewerName: string }) =>
      RefundService.rejectRefund(id, reason, reviewerName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] })
    }
  })
}

export const useMarkRefundProcessing = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, processorName }: { id: string; processorName: string }) =>
      RefundService.markRefundProcessing(id, processorName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] })
    }
  })
}

export const useMarkRefundCompleted = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, processorName }: { id: string; processorName: string }) =>
      RefundService.markRefundCompleted(id, processorName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] })
    }
  })
}
