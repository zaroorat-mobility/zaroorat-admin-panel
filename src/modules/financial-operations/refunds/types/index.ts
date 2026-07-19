import type { BaseEntity } from '@/shared/types'

export type RefundType =
  | 'RIDE_CANCELLED'
  | 'FARE_OVERCHARGED'
  | 'DOUBLE_PAYMENT'
  | 'PAYMENT_FAILURE'
  | 'DRIVER_NO_SHOW'
  | 'SERVICE_ISSUE'
  | 'GOODWILL_COMPENSATION'
  | 'DISPUTE_RESOLUTION'

export type RefundStatus =
  | 'requested'
  | 'under_review'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'rejected'

export type RefundApprovalLevel = 'support' | 'finance'

export type RefundSource = 'dispute' | 'complaint' | 'ride' | 'manual'

export interface RefundTimelineEvent {
  action: string
  actor: string
  timestamp: string
  notes?: string
}

export interface RefundRequest extends BaseEntity {
  refundId: string
  rideId?: string
  disputeId?: string
  riderId: string
  riderName: string
  refundType: RefundType
  requestedAmount: number
  approvedAmount?: number
  reason: string
  status: RefundStatus
  requestedAt: string
  reviewedBy?: string
  reviewedAt?: string
  processedBy?: string
  processedAt?: string
  notes?: string
  approvalLevel: RefundApprovalLevel
  refundSource: RefundSource
  timeline: RefundTimelineEvent[]
}
