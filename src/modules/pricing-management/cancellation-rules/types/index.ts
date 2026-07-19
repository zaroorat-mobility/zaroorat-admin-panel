import type { BaseEntity } from '@/shared/types'

export type CancellationActor = 'rider' | 'driver'
export type CancellationScenario = 'before_assignment' | 'after_assignment' | 'after_arrival' | 'no_show'
export type CancellationChargeType = 'fixed' | 'percentage'

export interface CancellationRule extends BaseEntity {
  ruleName: string
  version: number
  actor: CancellationActor
  scenario: CancellationScenario
  chargeType: CancellationChargeType
  chargeAmount: number
  status: 'active' | 'inactive'
}
