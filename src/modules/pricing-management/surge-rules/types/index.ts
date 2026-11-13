import type { BaseEntity } from '@/shared/types'

export interface SurgeRule extends BaseEntity {
  ruleName: string
  /** Vehicle type ids a new rule applies to. Empty means all vehicles. */
  vehicleTypeIds?: string[]
  /** What this rule applies to, in words. "All vehicles" when it has no vehicle type. */
  vehicleLabel?: string
  zoneId?: string
  zoneName?: string
  cityCode?: string
  multiplier: number
  peakHourStart?: string | null
  peakHourEnd?: string | null
  isPeakHourOnly?: boolean
  startTime?: string
  endTime?: string
  effectiveFrom: string
  effectiveTo?: string
  status: 'active' | 'inactive'
}
