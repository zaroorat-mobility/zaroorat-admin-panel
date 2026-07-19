import type { BaseEntity } from '@/shared/types'
import type { VehicleType } from '@/modules/driver-management/types'

export interface FareRule extends BaseEntity {
  ruleName: string
  version: number
  vehicleType: VehicleType
  baseFare: number
  minimumFare: number
  perKmRate: number
  perMinuteRate: number
  freeWaitingMinutes: number
  waitingChargePerMinute: number
  nightEnabled: boolean
  nightStartTime: string
  nightEndTime: string
  nightChargePercentage: number
  status: 'active' | 'inactive'
  effectiveFrom: string
  effectiveTo?: string
}
