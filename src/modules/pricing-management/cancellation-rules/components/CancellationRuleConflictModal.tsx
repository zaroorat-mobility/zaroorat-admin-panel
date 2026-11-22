import React from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Pencil, ShieldCheck } from 'lucide-react'
import type { CancellationRule } from '../types'

interface CancellationRuleConflictModalProps {
  isOpen: boolean
  existingPolicy: CancellationRule | null
  fallbackMessage?: string | null
  onClose: () => void
  onEditExisting: (policyId: string) => void
}

function formatScenarioLabel(scenario: string): string {
  return scenario
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatFeeLabel(policy: CancellationRule): string {
  if (policy.chargeType === 'percentage') {
    return policy.maxChargeAmount != null
      ? `${policy.chargeAmount}% (max ₹${policy.maxChargeAmount.toFixed(0)})`
      : `${policy.chargeAmount}% of fare`
  }
  return `₹${policy.chargeAmount.toFixed(2)} flat`
}

export const CancellationRuleConflictModal: React.FC<CancellationRuleConflictModalProps> = ({
  isOpen,
  existingPolicy,
  fallbackMessage,
  onClose,
  onEditExisting,
}) => {
  if (!isOpen) return null

  const currentVersion = existingPolicy?.version ?? 1
  const nextVersion = currentVersion + 1

  return createPortal(
    <div
      className="fixed inset-0 z-[130] m-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[460px] bg-white dark:bg-slate-900 rounded-[24px] p-7 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Amber Warning Halo matching PricingSuccessModal */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="w-[82px] h-[82px] rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
            <div className="w-[64px] h-[64px] rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <div className="w-[46px] h-[46px] rounded-full bg-amber-500 flex items-center justify-center shadow-sm shadow-amber-500/30">
                <AlertTriangle className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-[20px] sm:text-[21px] font-bold text-[#1F2B6D] dark:text-white tracking-tight mb-2">
          Active Cancellation Policy Exists
        </h2>

        <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[360px] mb-5">
          {existingPolicy ? (
            <>
              An active policy (<strong className="text-slate-800 dark:text-slate-200">{existingPolicy.ruleName}</strong>, v{currentVersion}) already covers this actor and scenario. Edit it to publish <strong className="text-slate-800 dark:text-slate-200">v{nextVersion}</strong> and keep a clean audit trail.
            </>
          ) : (
            fallbackMessage ||
            'An active cancellation policy already covers this actor and scenario.'
          )}
        </p>

        {existingPolicy && (
          <div className="w-full rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 p-4 mb-6 text-left space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/70 dark:border-slate-700/70">
              <div className="flex items-center gap-1.5 font-bold text-[#1F2B6D] dark:text-blue-300 truncate">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{existingPolicy.ruleName}</span>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#E8FAF0] text-[#10B981] shrink-0">
                v{currentVersion} · Active
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Applies To:</span>
              <strong className="text-slate-900 dark:text-white capitalize">
                {existingPolicy.actor === 'rider' ? 'Rider (Customer)' : 'Driver'}
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Scenario:</span>
              <strong className="text-slate-900 dark:text-white">
                {formatScenarioLabel(existingPolicy.scenario)}
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Cancellation Charge:</span>
              <strong className="font-mono text-slate-900 dark:text-white">
                {formatFeeLabel(existingPolicy)}
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Free Window:</span>
              <strong className="font-mono text-slate-900 dark:text-white">
                {existingPolicy.freeCancelWindowSec ?? existingPolicy.freeCancellationWindow ?? 0}s
              </strong>
            </div>
          </div>
        )}

        <div className="w-full space-y-2.5">
          {existingPolicy && (
            <button
              type="button"
              onClick={() => onEditExisting(existingPolicy.id)}
              className="w-full py-3.5 px-6 rounded-[12px] bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white text-[13.5px] font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit Existing Policy (Create v{nextVersion})</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 px-6 rounded-[12px] bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[#1F2B6D] dark:text-slate-200 text-[13.5px] font-bold transition-all cursor-pointer"
          >
            Choose Different Actor / Scenario
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default CancellationRuleConflictModal
