import type { BaseEntity } from '@/shared/types'
import type { VehicleType } from '@/modules/driver-management/types'

export interface SurgeRule extends BaseEntity {
  ruleName: string
  version: number
  vehicleType: VehicleType
  multiplier: number
  startTime?: string
  endTime?: string
  effectiveFrom: string
  effectiveTo?: string
  status: 'active' | 'inactive'
}
