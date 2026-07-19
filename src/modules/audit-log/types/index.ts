import type { BaseEntity } from '@/shared/types'

export interface AuditLogItem extends BaseEntity {
  timestamp: string
  actor: string
  action: string
  entityId?: string
  entityType?: 'driver' | 'rider' | 'vehicle' | 'fare_config' | 'payment' | 'sos'
  notes?: string
}
