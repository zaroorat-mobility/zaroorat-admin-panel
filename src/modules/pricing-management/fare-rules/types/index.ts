import type { BaseEntity } from '@/shared/types'
import type { VehicleType } from '@/modules/driver-management/types'

export type RideServiceTypeUi = 'instant' | 'scheduled' | 'rental' | 'outstation'

export interface FareRule extends BaseEntity {
  ruleName: string
  version: number
  vehicleType: VehicleType
  cityCode: string
  serviceType: RideServiceTypeUi | null
  serviceZoneId: string | null
  serviceZoneName: string | null
  baseFare: number
  minimumFare: number
  perKmRate: number
  perMinuteRate: number
  freeWaitingMinutes: number
  waitingChargePerMinute: number
  bookingFee: number
  platformFeePct: number
  taxRatePct: number | null
  commissionRatePct: number | null
  nightEnabled: boolean
  nightStartTime: string
  nightEndTime: string
  nightChargePercentage: number
  status: 'active' | 'inactive'
  effectiveFrom: string
  effectiveTo?: string
}

export interface CityOption {
  id: string
  code: string
  name: string
  state: string | null
  isActive: boolean
}

export interface ServiceZoneOption {
  id: string
  code: string
  name: string
  zoneType: string
  cityCode: string
  isActive: boolean
}
