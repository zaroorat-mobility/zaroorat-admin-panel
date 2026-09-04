import type { QueryParams } from '@/shared/types'
import type { Transaction } from '../transactions/types'
import { TransactionLedgerService } from './transactionLedger.service'

export interface ReconciliationSummary {
  totalRecords: number
  matchedRecords: number
  varianceRecords: number
  varianceAmount: number
}

const getReconciliationRecords = async (
  params?: QueryParams,
): Promise<{
  data: Transaction[]
  summary: ReconciliationSummary
}> => {
  const varianceOnly = params?.varianceOnly === 'true' || params?.varianceOnly === true
  const { varianceOnly: _v, gateway, ...rest } = params || {}

  const res = await TransactionLedgerService.getTransactions({
    ...rest,
    type: rest.type ?? 'ride_payment',
    gateway,
    limit: rest.limit ?? 100,
    page: rest.page ?? 1,
    ...(varianceOnly ? { varianceStatus: rest.varianceStatus ?? 'variance_found' } : {}),
  })

  let filtered = res.data
  if (varianceOnly && !rest.varianceStatus) {
    filtered = filtered.filter((t) => t.variance !== 0)
  }

  const totalRecords = filtered.length
  const matchedRecords = filtered.filter((t) => t.variance === 0).length
  const varianceRecords = filtered.filter((t) => t.variance !== 0).length
  const varianceAmount = filtered.reduce((sum, t) => sum + Math.abs(t.variance), 0)

  return {
    data: filtered,
    summary: {
      totalRecords,
      matchedRecords,
      varianceRecords,
      varianceAmount,
    },
  }
}

export const ReconciliationService = {
  getReconciliationRecords,
}

export default ReconciliationService
