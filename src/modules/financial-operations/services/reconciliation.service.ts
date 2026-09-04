import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { QueryParams } from '@/shared/types'
import type { Transaction } from '../transactions/types'

export interface ReconciliationSummary {
  totalRecords: number
  matchedRecords: number
  varianceRecords: number
  varianceAmount: number
}

const getReconciliationRecords = async (
  params?: QueryParams,
): Promise<{ data: Transaction[]; summary: ReconciliationSummary }> => {
  const response = await api.get<{ data: Transaction[]; meta: { totalCount: number } }>(
    API_ENDPOINTS.finance.transactions,
    {
      params: {
        ...params,
        limit: params?.limit ?? 100,
        ...(params?.varianceOnly === 'true' || params?.varianceOnly === true
          ? { varianceStatus: 'variance_found' }
          : {}),
      },
    },
  )

  let filtered = response.data.data.filter((t) => t.type === 'ride_payment')
  const gatewayFilter = params?.gateway as string | undefined
  if (gatewayFilter && gatewayFilter !== 'all') {
    filtered = filtered.filter((t) => t.paymentGateway === gatewayFilter)
  }

  const totalRecords = filtered.length
  const matchedRecords = filtered.filter((t) => t.variance === 0).length
  const varianceRecords = filtered.filter((t) => t.variance !== 0).length
  const varianceAmount = filtered.reduce((sum, t) => sum + Math.abs(t.variance), 0)

  return {
    data: filtered,
    summary: { totalRecords, matchedRecords, varianceRecords, varianceAmount },
  }
}

export const ReconciliationService = {
  getReconciliationRecords,
}

export default ReconciliationService
