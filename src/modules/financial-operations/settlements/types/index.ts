import type { BaseEntity } from '@/shared/types'

// ─── Status ────────────────────────────────────────────────────────────────

export type SettlementStatus = 'draft' | 'pending' | 'processing' | 'completed' | 'failed'

// ─── Ledger Entry Types ─────────────────────────────────────────────────────

export type LedgerEntryType =
  | 'RIDE_EARNING'
  | 'PLATFORM_COMMISSION'
  | 'REFUND_DEDUCTION'
  | 'PENALTY'
  | 'BONUS'
  | 'INCENTIVE'
  | 'SETTLEMENT_PAYOUT'
  | 'ADJUSTMENT'

// ─── Core Entities ──────────────────────────────────────────────────────────

export interface DriverSettlement {
  driverId: string
  driverName: string
  totalTrips: number
  grossEarnings: number
  commissionAmount: number
  commissionPercent: number
  refundAdjustments: number
  penalties: number
  bonuses: number
  incentives: number
  netPayable: number
  walletBalance: number
  status: 'pending' | 'paid'
}

export interface SettlementAdjustment {
  id: string
  driverId: string
  driverName: string
  type: 'deduction' | 'addition'
  reason: string
  amount: number
  appliedAt: string
}

export interface SettlementTimelineEvent {
  action: string
  actor: string
  timestamp: string
  notes?: string
}

export interface SettlementBatch extends BaseEntity {
  batchNumber: string
  periodStart: string
  periodEnd: string
  totalDrivers: number
  totalGrossAmount: number
  totalCommission: number
  totalRefundAdjustments: number
  totalPenalties: number
  totalBonuses: number
  totalNetPayable: number
  status: SettlementStatus
  generatedBy: string
  processedAt?: string
  completedAt?: string
  drivers: DriverSettlement[]
  adjustments: SettlementAdjustment[]
  timeline: SettlementTimelineEvent[]
}

export interface DriverLedgerEntry extends BaseEntity {
  driverId: string
  driverName: string
  type: LedgerEntryType
  description: string
  amount: number          // positive = credit, negative = debit
  rideId?: string
  settlementBatchId?: string
  balance: number         // running balance after this entry
  entryDate: string
}
