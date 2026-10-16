import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type { RefundRequest, RefundType, RefundSource } from '../types'

export type CreateRefundInput = {
  transactionId?: string
  rideId?: string
  disputeId?: string
  riderId?: string
  riderName?: string
  refundType: RefundType
  requestedAmount: number
  reason: string
  refundSource: RefundSource
  notes?: string
}

const getRefunds = async (params?: QueryParams): Promise<PaginatedResponse<RefundRequest>> => {
  const response = await api.get<PaginatedResponse<RefundRequest>>(API_ENDPOINTS.finance.refunds, {
    params,
  })
  return response.data
}

const getRefundById = async (id: string): Promise<RefundRequest> => {
  const response = await api.get<{ data: RefundRequest }>(API_ENDPOINTS.finance.refund(id))
  return response.data.data
}

const createRefund = async (data: CreateRefundInput): Promise<RefundRequest> => {
  const response = await api.post<{ data: RefundRequest }>(API_ENDPOINTS.finance.refunds, {
    transactionId: data.transactionId,
    rideId: data.rideId,
    disputeId: data.disputeId,
    riderId: data.riderId,
    riderName: data.riderName,
    refundType: data.refundType,
    requestedAmount: data.requestedAmount,
    reason: data.reason,
    refundSource: data.refundSource,
    notes: data.notes,
  })
  return response.data.data
}

const startRefundReview = async (id: string): Promise<RefundRequest> => {
  const response = await api.post<{ data: RefundRequest }>(
    API_ENDPOINTS.finance.refundStartReview(id),
    {},
  )
  return response.data.data
}

const approveRefund = async (
  id: string,
  approvedAmount: number,
  notes: string,
): Promise<RefundRequest> => {
  const response = await api.post<{ data: RefundRequest }>(
    API_ENDPOINTS.finance.refundApprove(id),
    { approvedAmount, notes },
  )
  return response.data.data
}

const rejectRefund = async (
  id: string,
  reason: string,
): Promise<RefundRequest> => {
  const response = await api.post<{ data: RefundRequest }>(
    API_ENDPOINTS.finance.refundReject(id),
    { reason },
  )
  return response.data.data
}

const markRefundProcessing = async (id: string): Promise<RefundRequest> => {
  const response = await api.post<{ data: RefundRequest }>(
    API_ENDPOINTS.finance.refundMarkProcessing(id),
    {},
  )
  return response.data.data
}

const markRefundCompleted = async (id: string): Promise<RefundRequest> => {
  const response = await api.post<{ data: RefundRequest }>(
    API_ENDPOINTS.finance.refundMarkCompleted(id),
    {},
  )
  return response.data.data
}

export const RefundService = {
  getRefunds,
  getRefundById,
  createRefund,
  startRefundReview,
  approveRefund,
  rejectRefund,
  markRefundProcessing,
  markRefundCompleted,
}

export default RefundService
