import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type { Transaction } from '../transactions/types'

export const TransactionLedgerService = {
  getTransactions: async (params?: QueryParams): Promise<PaginatedResponse<Transaction>> => {
    const response = await api.get<PaginatedResponse<Transaction>>(
      API_ENDPOINTS.finance.transactions,
      { params },
    )
    return response.data
  },

  getTransactionById: async (id: string): Promise<Transaction> => {
    const response = await api.get<{ data: Transaction }>(API_ENDPOINTS.finance.transaction(id))
    return response.data.data
  },

  reconcileTransaction: async (
    id: string,
    varianceStatus: string,
    notes?: string,
  ): Promise<Transaction> => {
    const response = await api.post<{ data: Transaction }>(API_ENDPOINTS.finance.reconcile(id), {
      varianceStatus,
      ...(notes ? { notes } : {}),
    })
    return response.data.data
  },
}

export default TransactionLedgerService
