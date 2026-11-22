import type { BaseEntity } from '@/shared/types'

export interface SurgeRule extends BaseEntity {
  ruleName: string
  /** Vehicle type ids a rule applies to. Empty means all vehicles. */
  vehicleTypeIds?: string[]
  vehicleTypes?: Array<{ id: string; code: string; name: string }>
  /** What this rule applies to, in words. "All vehicles" when it has no vehicle type. */
  vehicleLabel?: string
  serviceZoneId?: string | null
  zoneId?: string
  zoneName?: string
  cityCode?: string
  supersedesId?: string | null
  multiplier: number
  peakHourStart?: string | null
  peakHourEnd?: string | null
  isPeakHourOnly?: boolean
  /** 0 = Sunday .. 6 = Saturday. Empty means every day. */
  daysOfWeek?: number[]
  startTime?: string
  endTime?: string
  effectiveFrom: string
  effectiveTo?: string
  status: 'active' | 'inactive'
}
