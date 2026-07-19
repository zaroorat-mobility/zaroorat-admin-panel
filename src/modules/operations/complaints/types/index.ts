import type { BaseEntity } from '@/shared/types'

export type ComplaintCategory =
  | 'Driver Behaviour'
  | 'Rider Behaviour'
  | 'Safety'
  | 'SOS Related'
  | 'Payment'
  | 'Fare Dispute'
  | 'Vehicle Condition'
  | 'Lost Item'
  | 'App Issue'
  | 'Other'

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical'
export type ComplaintStatus = 'open' | 'assigned' | 'investigating' | 'resolved' | 'closed'

export interface ComplaintTimelineEvent {
  action: string
  actor: string
  timestamp: string
  notes?: string
}

export interface Complaint extends BaseEntity {
  rideId?: string
  raisedBy: 'rider' | 'driver' | 'admin'
  raisedByName: string
  category: ComplaintCategory
  priority: ComplaintPriority
  status: ComplaintStatus
  description: string
  assignedTo?: string
  assignedAt?: string
  resolvedBy?: string
  resolvedAt?: string
  resolutionNotes?: string
  timeline: ComplaintTimelineEvent[]
}
