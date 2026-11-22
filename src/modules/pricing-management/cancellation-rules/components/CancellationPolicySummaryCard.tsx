import React from 'react'
import {
  ClipboardList,
  Info,
  User,
  Car,
  Clock,
  Percent,
  Coins,
  Users,
  Gavel,
  AlertTriangle,
} from 'lucide-react'
import type { CancellationActor, CancellationScenario, CancellationChargeType } from '../types'

interface CancellationPolicySummaryCardProps {
  actor: CancellationActor
  scenario: CancellationScenario
  freeWindow: number | null
  freeUnit: 'seconds' | 'minutes'
  chargeType: CancellationChargeType
  chargeAmount: number | null
  maxCharge?: number | null
  driverPayout?: number | null
  driverPenalty?: number | null
}

const SCENARIO_LABELS: Record<CancellationScenario, string> = {
  after_arrival: 'After Driver Arrival',
  after_assignment: 'After Driver Assignment',
  no_show: 'Passenger No Show',
  before_assignment: 'Before Driver Assignment',
}

export const CancellationPolicySummaryCard: React.FC<CancellationPolicySummaryCardProps> = ({
  actor = 'rider',
  scenario = 'after_arrival',
  freeWindow = null,
  freeUnit = 'seconds',
  chargeType = 'fixed',
  chargeAmount = null,
  maxCharge = null,
  driverPayout = null,
  driverPenalty = null,
}) => {
  const actorLabel = actor === 'rider' ? 'Rider (Customer)' : 'Driver'
  const scenarioLabel = SCENARIO_LABELS[scenario] || 'After Driver Arrival'

  const windowSeconds =
    freeWindow != null ? Math.max(0, Math.round(freeUnit === 'minutes' ? freeWindow * 60 : freeWindow)) : null
  const windowText =
    windowSeconds == null
      ? 'Not set'
      : windowSeconds < 60
        ? `${windowSeconds} sec`
        : windowSeconds % 60 === 0
          ? `${windowSeconds / 60} min (${windowSeconds}s)`
          : `${Math.floor(windowSeconds / 60)} min ${windowSeconds % 60} sec (${windowSeconds}s)`

  const feeText =
    chargeAmount == null
      ? 'Not set'
      : chargeType === 'percentage'
        ? `${chargeAmount}% of fare`
        : `₹${chargeAmount.toFixed(2)}`

  return (
    <div className="space-y-3 text-left">
      {/* 1. Policy Summary Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-[#1F2B6D] dark:text-white leading-tight">
            Policy Summary
          </h3>
        </div>

        {/* Example How it Works Banner */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold text-[#1F2B6D] dark:text-blue-300">
          <Info className="w-3.5 h-3.5 text-[#1F2B6D] dark:text-blue-400 shrink-0" />
          <span>How this policy works (Example)</span>
        </div>

        {/* Itemized Specification Rows */}
        <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800/60 pt-0.5">
          {/* Applies To */}
          <div className="flex items-center justify-between pt-1 text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Applies To:</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white">{actorLabel}</span>
          </div>

          {/* Cancellation Scenario */}
          <div className="flex items-center justify-between pt-2 text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-medium">
              <Car className="w-3.5 h-3.5 text-slate-400" />
              <span>Cancellation Scenario:</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white">{scenarioLabel}</span>
          </div>

          {/* Free Cancellation Window */}
          <div className="flex items-center justify-between pt-2 text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Free Cancellation Window:</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white">{windowText}</span>
          </div>

          {/* Cancellation Fee */}
          <div className="flex items-center justify-between pt-2 text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-medium">
              <Percent className="w-3.5 h-3.5 text-slate-400" />
              <span>Cancellation Fee:</span>
            </div>
            <span className="font-bold font-mono text-slate-900 dark:text-white">{feeText}</span>
          </div>

          {/* Maximum Charge (only when Percentage of Fare) */}
          {chargeType === 'percentage' && (
            <div className="flex items-center justify-between pt-2 text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5 font-medium">
                <Coins className="w-3.5 h-3.5 text-slate-400" />
                <span>Maximum Charge:</span>
              </div>
              <span className="font-bold font-mono text-slate-900 dark:text-white">
                {maxCharge != null ? `₹${maxCharge}` : 'No limit'}
              </span>
            </div>
          )}

          {/* Driver Payout (Rider cancels) vs Driver Penalty (Driver cancels) */}
          {actor === 'rider' ? (
            <div className="flex items-center justify-between pt-2 text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Driver Payout:</span>
              </div>
              <span className="font-bold font-mono text-slate-900 dark:text-white">
                {driverPayout != null ? (
                  <>
                    ₹{driverPayout}{' '}
                    <span className="font-normal text-[11px] text-slate-500">(to driver)</span>
                  </>
                ) : (
                  'Not set'
                )}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-2 text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5 font-medium">
                <Gavel className="w-3.5 h-3.5 text-slate-400" />
                <span>Driver Penalty:</span>
              </div>
              <span className="font-bold font-mono text-slate-900 dark:text-white">
                {driverPenalty != null && driverPenalty > 0
                  ? `₹${driverPenalty} (from driver)`
                  : 'None'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Governance Rollout Notice Card */}
      <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-1.5">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 leading-tight">
            Feature-flagged enforcement (`cancellation.policy_enforcement`)
          </h4>
        </div>
        <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed pl-6">
          Versioned policies are stored in PostgreSQL and evaluated by the cancellation policy
          engine whenever the feature flag is enabled.
        </p>
      </div>

      {/* 3. Assessment Behaviour Card */}
      <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400 shrink-0 mt-0.5" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
            Assessment &amp; settlement guardrail
          </h4>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-6">
          When enforcement is ON, assessed fees are locked onto the ride cancellation snapshot
          (ASSESSED) without auto-debit until Finance settlement approval (D-07).
        </p>
      </div>
    </div>
  )
}

export default CancellationPolicySummaryCard
