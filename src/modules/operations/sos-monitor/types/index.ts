import type { BaseEntity } from '@/shared/types'

export type SosPriority = 'low' | 'medium' | 'high' | 'critical'
export type SosStatus = 'open' | 'acknowledged' | 'escalated' | 'resolved'
export type SosResolutionType =
  | 'False Alarm'
  | 'Customer Safe'
  | 'Driver Safe'
  | 'Emergency Services Contacted'
  | 'Unable To Reach Customer'
  | 'Other'

export interface SOSAlert extends BaseEntity {
  rideId: string
  driverId: string
  driverName: string
  riderId: string
  riderName: string
  vehiclePlate: string
  timeRaised: string
  priority: SosPriority
  status: SosStatus
  location: string
  acknowledgedBy?: string
  acknowledgedAt?: string
  acknowledgementNotes?: string
  resolvedBy?: string
  resolvedAt?: string
  resolutionType?: SosResolutionType
  resolutionNotes?: string
}
