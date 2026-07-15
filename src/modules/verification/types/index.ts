import type { BaseEntity } from '@/shared/types'

export interface VerificationEntity extends BaseEntity {
  driverId: string
  driverName: string
  vehicleType: string
  documentType: 'license' | 'rc' | 'aadhaar' | 'pan'
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
}

export interface VerificationDetails extends VerificationEntity {
  documentUrl: string
  auditLogs: {
    action: string
    operator: string
    timestamp: string
    notes?: string
  }[]
}
