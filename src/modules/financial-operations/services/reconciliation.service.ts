import { TransactionLedgerService } from './transactionLedger.service'
import type { QueryParams } from '@/shared/types'
import type { Transaction } from '../transactions/types'

export interface ReconciliationSummary {
  totalRecords: number
  matchedRecords: number
  varianceRecords: number
  varianceAmount: number
}

const getReconciliationRecords = async (params?: QueryParams): Promise<{
  data: Transaction[]
  summary: ReconciliationSummary
}> => {
  const transactions = TransactionLedgerService.getDb()
  const search = ((params?.search as string) || '').toLowerCase()
  const gatewayFilter = params?.gateway as string
  const varianceOnly = params?.varianceOnly === 'true' || params?.varianceOnly === true

  let filtered = [...transactions]

  // Filter out non-payment/adjustment entries if we want to reconciliate fares
  filtered = filtered.filter(t => t.type === 'ride_payment')

  if (search) {
    filtered = filtered.filter(t =>
      t.transactionId.toLowerCase().includes(search) ||
      (t.gatewayReference && t.gatewayReference.toLowerCase().includes(search)) ||
      (t.rideId && t.rideId.toLowerCase().includes(search))
    )
  }

  if (gatewayFilter && gatewayFilter !== 'all') {
    filtered = filtered.filter(t => t.paymentGateway === gatewayFilter)
  }

  if (varianceOnly) {
    filtered = filtered.filter(t => t.variance !== 0)
  }

  // Calculate top-level reconciliation metrics
  const totalRecords = filtered.length
  const matchedRecords = filtered.filter(t => t.variance === 0).length
  const varianceRecords = filtered.filter(t => t.variance !== 0).length
  const varianceAmount = filtered.reduce((sum, t) => sum + Math.abs(t.variance), 0)

  // Sort desc by date
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return {
    data: filtered,
    summary: {
      totalRecords,
      matchedRecords,
      varianceRecords,
      varianceAmount
    }
  }
}

export const ReconciliationService = {
  getReconciliationRecords
}

export default ReconciliationService
