import type { BaseEntity } from '@/shared/types'

export type RideServiceTypeUi = 'instant' | 'scheduled' | 'rental' | 'outstation'

export interface FareRuleWarning {
  code: 'FARE_RULE_GAP' | string
  message: string
}

export interface FareRule extends BaseEntity {
  ruleName: string
  version: number
  ruleFamilyId?: string
  supersedesId?: string | null
  /** The vehicle type code, e.g. CAB_MINI_AC. The server looks it up in its table. */
  vehicleType: string
  /** The exact vehicle type row. What the form sends; the code above is for display. */
  vehicleTypeId?: string
  /** "Cab Mini (AC)" — the server's own label for the type. */
  vehicleTypeName?: string
  /** The type's `category` column (car, auto, bike), for grouping only. */
  vehicleCategory?: string
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
  platformFeeFlat?: number | null
  taxRatePct: number | null
  commissionRatePct: number | null
  nightEnabled?: boolean
  nightStartTime?: string
  nightEndTime?: string
  nightChargePercentage?: number
  status: 'active' | 'inactive'
  effectiveFrom: string
  effectiveFromIso?: string
  effectiveTo?: string
  effectiveToIso?: string | null
  warnings?: FareRuleWarning[]
  /** Optimistic concurrency guard sent on PATCH (409 FARE_RULE_STALE on mismatch). */
  expectedVersion?: number
}

export interface CityOption {
  id: string
  code: string
  name: string
  state: string | null
  isActive: boolean
  maxSurgeMultiplier?: number
}

export interface ServiceZoneOption {
  id: string
  code: string
  name: string
  zoneType: string
  cityCode: string
  isActive: boolean
}
