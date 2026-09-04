import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type { Transaction } from '../transactions/types'

const toTxnParams = (params?: QueryParams) => {
  if (!params) return undefined
  const { gateway, paymentGateway, page, limit, search, status, type, varianceStatus, paymentMethod, ...rest } =
    params
  return {
    page,
    limit,
    search,
    status,
    type,
    varianceStatus,
    paymentMethod,
    paymentGateway: paymentGateway ?? gateway,
    ...rest,
  }
}

const getTransactions = async (params?: QueryParams): Promise<PaginatedResponse<Transaction>> => {
  const response = await api.get<PaginatedResponse<Transaction>>(API_ENDPOINTS.finance.transactions, {
    params: toTxnParams(params),
  })
  return response.data
}

const getTransactionById = async (id: string): Promise<Transaction> => {
  const response = await api.get<{ data: Transaction }>(API_ENDPOINTS.finance.transaction(id))
  return response.data.data
}

const reconcileTransaction = async (
  id: string,
  varianceStatus: string,
  notes?: string,
): Promise<Transaction> => {
  const response = await api.post<{ data: Transaction }>(API_ENDPOINTS.finance.reconcile(id), {
    varianceStatus,
    notes,
  })
  return response.data.data
}

export const TransactionLedgerService = {
  getTransactions,
  getTransactionById,
  reconcileTransaction,
}

export default TransactionLedgerService
