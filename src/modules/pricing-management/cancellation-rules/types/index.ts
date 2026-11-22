import type { BaseEntity } from '@/shared/types'

export type CancellationActor = 'rider' | 'driver'
export type CancellationScenario = 'before_assignment' | 'after_assignment' | 'after_arrival' | 'no_show'
export type CancellationChargeType = 'fixed' | 'percentage'
export type CancellationFeeBase = 'QUOTED_FARE' | 'BASE_FARE' | 'MINIMUM_FARE'
export type DriverCompensationType = 'NONE' | 'FLAT' | 'PERCENT_OF_FEE'

export interface CancellationRule extends BaseEntity {
  ruleName: string
  familyId?: string
  version: number
  supersedesId?: string | null
  actor: CancellationActor
  scenario: CancellationScenario
  chargeType: CancellationChargeType
  chargeAmount: number
  feeBase?: CancellationFeeBase
  maxFee?: number | null
  freeCancelWindowSec?: number
  freeCancellationWindow?: number
  freeCancellationUnit?: 'seconds' | 'minutes'
  maxChargeAmount?: number | null
  driverCompensationType?: DriverCompensationType
  driverCompensationAmount?: number
  driverPenaltyAmount?: number | null
  driverPayout?: number
  driverPenalty?: number | null
  cityCode?: string | null
  vehicleTypeId?: string | null
  effectiveFrom?: string
  effectiveTo?: string | null
  expectedVersion?: number
  status: 'active' | 'inactive'
}
