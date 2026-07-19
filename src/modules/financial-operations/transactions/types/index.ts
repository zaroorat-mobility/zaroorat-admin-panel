import type { BaseEntity } from '@/shared/types'

// ─── Status & Type Descriptors ──────────────────────────────────────────────

export type TransactionType =
  | 'ride_payment'
  | 'refund'
  | 'settlement'
  | 'adjustment'
  | 'penalty'
  | 'bonus'

export type TransactionSource =
  | 'ride'
  | 'refund'
  | 'settlement'
  | 'manual_adjustment'
  | 'penalty'
  | 'bonus'

export type TransactionStatus =
  | 'initiated'
  | 'processing'
  | 'captured'
  | 'failed'
  | 'partially_refunded'
  | 'fully_refunded'
  | 'reversed'

export type TransactionDirection = 'credit' | 'debit'

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'wallet'

export type PaymentGateway = 'razorpay' | 'cashfree' | 'phonepe' | 'paytm'

export type VarianceStatus = 'matched' | 'variance_found' | 'under_review' | 'resolved'

export type EntityType = 'ride' | 'refund' | 'dispute' | 'settlement' | 'adjustment'

// ─── Core Transaction Entity ────────────────────────────────────────────────

export interface Transaction extends BaseEntity {
  transactionId: string
  rideId?: string
  riderId?: string
  driverId?: string
  entityType: EntityType
  entityId: string
  type: TransactionType
  source: TransactionSource
  direction: TransactionDirection
  amount: number
  currency: 'INR'
  paymentMethod: PaymentMethod
  paymentGateway?: PaymentGateway
  gatewayReference?: string
  gatewayStatus?: string
  gatewayErrorCode?: string
  gatewayErrorMessage?: string
  
  // Financial breakdown reconciliation fields
  rideFare: number
  amountCharged: number
  amountCaptured: number
  refundAmount: number
  settlementImpact: number
  variance: number
  varianceStatus: VarianceStatus
  reconciledBy?: string
  lastReconciledAt?: string
  
  // Analytics / Gateway health performance tracking
  collectionTimeMs?: number
  gatewayResponseTimeMs?: number
  retryAttempts?: number
  failureCount?: number
  
  status: TransactionStatus
  createdAt: string
  completedAt?: string
}

// ─── Finance Audit Log Entity ───────────────────────────────────────────────

export interface FinanceAuditLog extends BaseEntity {
  correlationId: string
  user: string
  ipAddress: string
  action: string
  module: 'transactions' | 'disputes' | 'refunds' | 'settlements' | 'dashboard'
  entityType: EntityType
  entityId: string
  oldValue?: string
  newValue?: string
  severity: 'info' | 'warning' | 'critical'
  notes?: string
}
