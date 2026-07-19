import type { BaseEntity } from '@/shared/types'

export type DisputeType =
  | 'FARE_DIFFERENCE'
  | 'UNCOLLECTED_CASH'
  | 'DOUBLE_CHARGE'
  | 'REFUND_REQUEST'
  | 'SURGE_DISPUTE'
  | 'CANCELLATION_FEE_DISPUTE'
  | 'WAITING_CHARGE_DISPUTE'
  | 'OTHER'

export type DisputeStatus =
  | 'open'
  | 'assigned'
  | 'investigating'
  | 'pending_approval'
  | 'resolved'
  | 'closed'

export type DisputeResolutionType =
  | 'Approve Refund'
  | 'Reject Claim'
  | 'Reverse Driver Due'
  | 'Adjust Fare'
  | 'Mark Paid'
  | 'Write Off'

export interface DisputeTimelineEvent {
  action: string
  actor: string
  timestamp: string
  notes?: string
}

export interface PaymentDispute extends BaseEntity {
  rideId: string
  complaintId?: string
  type: DisputeType
  status: DisputeStatus
  riderId: string
  riderName: string
  driverId: string
  driverName: string
  amount: number
  requestedAmount?: number
  reason: string
  assignedTo?: string
  assignedAt?: string
  resolvedBy?: string
  resolvedAt?: string
  resolutionType?: DisputeResolutionType
  resolutionNotes?: string
  adjustmentAmount?: number
  version?: number
  timeline: DisputeTimelineEvent[]
}
