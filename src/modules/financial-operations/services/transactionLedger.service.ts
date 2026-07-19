import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type {
  Transaction,
  TransactionStatus,
  TransactionType,
  PaymentMethod,
  PaymentGateway,
  VarianceStatus,
  EntityType,
  TransactionSource,
  TransactionDirection
} from '../transactions/types'

const TRANSACTIONS_KEY = 'zaroorat_transactions_db'

const getDb = (): Transaction[] => {
  const raw = localStorage.getItem(TRANSACTIONS_KEY)
  if (!raw) {
    const seed = seedTransactions()
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(seed))
    return seed
  }
  return JSON.parse(raw)
}

const seedTransactions = (): Transaction[] => {
  const list: Transaction[] = []
  const now = Date.now()
  const gateways: PaymentGateway[] = ['razorpay', 'phonepe', 'cashfree', 'paytm']
  const methods: PaymentMethod[] = ['upi', 'card', 'wallet', 'cash']
  
  // Gateways Error messages seed
  const errors: Record<string, { code: string; msg: string }> = {
    timeout: { code: 'GATEWAY_TIMEOUT', msg: 'The payment gateway timed out waiting for request authorization.' },
    declined: { code: 'BANK_DECLINED', msg: 'Transaction was declined by the cardholder bank.' },
    otp: { code: 'OTP_EXPIRED', msg: 'Verification failed because the OTP code was entered late or expired.' },
    funds: { code: 'INSUFFICIENT_FUNDS', msg: 'Rider wallet or bank balance is insufficient for payment.' },
    cancelled: { code: 'USER_CANCELLED', msg: 'Rider closed payment tab and aborted authorization process.' }
  }

  for (let i = 1; i <= 70; i++) {
    const timeOffset = i * 4 * 3600000 // 4 hours spacing
    const dateStr = new Date(now - timeOffset).toISOString()
    const gateway = gateways[i % gateways.length]
    const method = methods[i % methods.length]
    
    // Determine type
    let type: TransactionType = 'ride_payment'
    let source: TransactionSource = 'ride'
    let entityType: EntityType = 'ride'
    let entityId = `ride-${1000 + i}`
    let direction: TransactionDirection = 'credit'
    let status: TransactionStatus = 'captured'
    
    if (i % 8 === 0) {
      type = 'refund'
      source = 'refund'
      entityType = 'refund'
      entityId = `REF-2026-${1000 + i}`
      direction = 'debit'
      status = 'fully_refunded'
    } else if (i % 12 === 0) {
      type = 'settlement'
      source = 'settlement'
      entityType = 'settlement'
      entityId = `SET-2026-${1000 + i}`
      direction = 'debit'
      status = 'captured'
    } else if (i % 15 === 0) {
      type = 'adjustment'
      source = 'manual_adjustment'
      entityType = 'adjustment'
      entityId = `ADJ-2026-${1000 + i}`
      direction = (i % 2 === 0) ? 'credit' : 'debit'
      status = 'captured'
    } else if (i % 7 === 0) {
      status = 'failed'
    } else if (i % 25 === 0) {
      status = 'reversed'
    } else if (i % 35 === 0) {
      status = 'processing'
    }

    const baseAmount = (i % 3 === 0) ? 450 : (i % 2 === 0) ? 280 : 160
    const fare = baseAmount
    const charged = status === 'failed' ? baseAmount : baseAmount
    const captured = status === 'failed' ? 0 : (i % 9 === 0 && status === 'captured') ? baseAmount - 50 : baseAmount
    const refunded = (status as string) === 'fully_refunded' ? baseAmount : ((status as string) === 'partially_refunded') ? 100 : 0
    const settlement = direction === 'credit' ? baseAmount - (baseAmount * 0.07) : 0
    
    let variance = 0
    let varianceStatus: VarianceStatus = 'matched'
    let reconciledBy: string | undefined
    let lastReconciledAt: string | undefined

    if (captured !== charged) {
      variance = charged - captured
      varianceStatus = 'variance_found'
      if (i % 18 === 0) {
        varianceStatus = 'under_review'
      } else if (i % 22 === 0) {
        varianceStatus = 'resolved'
        reconciledBy = 'Finance Manager'
        lastReconciledAt = new Date(now - timeOffset + 3600000).toISOString()
      }
    }

    // Set errors if failed
    let errCode: string | undefined
    let errMsg: string | undefined
    if (status === 'failed') {
      const errType = i % 5 === 0 ? 'timeout' : i % 4 === 0 ? 'declined' : i % 3 === 0 ? 'otp' : i % 2 === 0 ? 'funds' : 'cancelled'
      errCode = errors[errType].code
      errMsg = errors[errType].msg
    }

    list.push({
      id: `txn-${i}`,
      transactionId: `TXN2026${10000 + i}`,
      rideId: type === 'ride_payment' ? entityId : `ride-${2000 + i}`,
      riderId: `rider-${(i % 5) + 1}`,
      driverId: `driver-${(i % 3) + 1}`,
      entityType,
      entityId,
      type,
      source,
      direction,
      amount: status === 'failed' ? 0 : captured,
      currency: 'INR',
      paymentMethod: method,
      paymentGateway: gateway,
      gatewayReference: status === 'failed' ? undefined : `gref_${Math.random().toString(36).substr(2, 9)}`,
      gatewayStatus: status === 'captured' ? 'SUCCESS' : status === 'failed' ? 'FAILED' : 'PENDING',
      gatewayErrorCode: errCode,
      gatewayErrorMessage: errMsg,
      rideFare: fare,
      amountCharged: charged,
      amountCaptured: captured,
      refundAmount: refunded,
      settlementImpact: settlement,
      variance,
      varianceStatus,
      reconciledBy,
      lastReconciledAt,
      collectionTimeMs: status === 'captured' ? (1000 + (i % 5) * 500) : undefined,
      gatewayResponseTimeMs: (800 + (i % 10) * 200),
      retryAttempts: status === 'failed' ? (i % 3) + 1 : 0,
      failureCount: status === 'failed' ? 1 : 0,
      status,
      createdAt: dateStr,
      updatedAt: dateStr,
      completedAt: status === 'captured' ? new Date(new Date(dateStr).getTime() + 15000).toISOString() : undefined
    })
  }
  return list
}

const getTransactions = async (params?: QueryParams): Promise<PaginatedResponse<Transaction>> => {
  const db = getDb()
  const search = ((params?.search as string) || '').toLowerCase()
  const statusFilter = params?.status as string
  const gatewayFilter = params?.gateway as string
  const typeFilter = params?.type as string
  const sourceFilter = params?.source as string

  let filtered = [...db]

  if (search) {
    filtered = filtered.filter(t =>
      t.transactionId.toLowerCase().includes(search) ||
      (t.gatewayReference && t.gatewayReference.toLowerCase().includes(search)) ||
      (t.rideId && t.rideId.toLowerCase().includes(search)) ||
      t.entityId.toLowerCase().includes(search)
    )
  }

  if (statusFilter && statusFilter !== 'all') {
    filtered = filtered.filter(t => t.status === statusFilter)
  }
  if (gatewayFilter && gatewayFilter !== 'all') {
    filtered = filtered.filter(t => t.paymentGateway === gatewayFilter)
  }
  if (typeFilter && typeFilter !== 'all') {
    filtered = filtered.filter(t => t.type === typeFilter)
  }
  if (sourceFilter && sourceFilter !== 'all') {
    filtered = filtered.filter(t => t.source === sourceFilter)
  }

  // Sort by date desc
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return {
    data: filtered,
    meta: { currentPage: 1, totalPages: 1, pageSize: 100, totalCount: filtered.length }
  }
}

const getTransactionById = async (id: string): Promise<Transaction> => {
  const db = getDb()
  const found = db.find(t => t.id === id)
  if (!found) throw new Error(`Transaction details for ID ${id} not found`)
  return found
}

export const TransactionLedgerService = {
  getDb,
  getTransactions,
  getTransactionById
}

export default TransactionLedgerService
