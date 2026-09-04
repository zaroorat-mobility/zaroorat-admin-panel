import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type {
  PaymentDispute,
  DisputeStatus,
  DisputeResolutionType,
} from '../types'

const getDisputes = async (params?: QueryParams): Promise<PaginatedResponse<PaymentDispute>> => {
  const response = await api.get<PaginatedResponse<PaymentDispute>>(API_ENDPOINTS.finance.disputes, {
    params,
  })
  return response.data
}

const getDisputeById = async (id: string): Promise<PaymentDispute> => {
  const response = await api.get<{ data: PaymentDispute }>(API_ENDPOINTS.finance.dispute(id))
  return response.data.data
}

const createDispute = async (
  data: Omit<PaymentDispute, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'timeline'>,
): Promise<PaymentDispute> => {
  const response = await api.post<{ data: PaymentDispute }>(API_ENDPOINTS.finance.disputes, {
    rideId: data.rideId,
    complaintId: data.complaintId,
    type: data.type,
    riderId: data.riderId,
    riderName: data.riderName,
    driverId: data.driverId,
    driverName: data.driverName,
    amount: data.amount,
    requestedAmount: data.requestedAmount,
    reason: data.reason,
  })
  return response.data.data
}

const assignDispute = async (id: string, agentName: string): Promise<PaymentDispute> => {
  const response = await api.post<{ data: PaymentDispute }>(
    API_ENDPOINTS.finance.disputeAssign(id),
    { agentName },
  )
  return response.data.data
}

const updateDisputeStatus = async (
  id: string,
  status: DisputeStatus,
  notes?: string,
): Promise<PaymentDispute> => {
  const response = await api.post<{ data: PaymentDispute }>(
    API_ENDPOINTS.finance.disputeStatus(id),
    { status, ...(notes ? { notes } : {}) },
  )
  return response.data.data
}

const resolveDispute = async (
  id: string,
  resolutionType: DisputeResolutionType,
  notes: string,
  adjustmentAmount?: number,
): Promise<PaymentDispute> => {
  const response = await api.post<{ data: PaymentDispute }>(
    API_ENDPOINTS.finance.disputeResolve(id),
    {
      resolutionType,
      resolutionNotes: notes,
      ...(adjustmentAmount !== undefined ? { adjustmentAmount } : {}),
    },
  )
  return response.data.data
}

const closeDispute = async (id: string, notes?: string): Promise<PaymentDispute> => {
  const response = await api.post<{ data: PaymentDispute }>(API_ENDPOINTS.finance.disputeClose(id), {
    ...(notes ? { notes } : {}),
  })
  return response.data.data
}

export const FinancialService = {
  getDisputes,
  getDisputeById,
  createDispute,
  assignDispute,
  updateDisputeStatus,
  resolveDispute,
  closeDispute,
}

export default FinancialService
