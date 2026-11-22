import React from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Pencil, MapPin } from 'lucide-react'
import type { FareRule } from '../types'

interface FareRuleConflictModalProps {
  isOpen: boolean
  existingRule: FareRule | null
  fallbackMessage?: string | null
  onClose: () => void
  onEditExisting: (ruleId: string) => void
}

export const FareRuleConflictModal: React.FC<FareRuleConflictModalProps> = ({
  isOpen,
  existingRule,
  fallbackMessage,
  onClose,
  onEditExisting,
}) => {
  if (!isOpen) return null

  const scopeLabel = existingRule
    ? `${existingRule.vehicleTypeName || existingRule.vehicleType} · ${
        existingRule.serviceZoneName
          ? `${existingRule.serviceZoneName} (${existingRule.cityCode})`
          : existingRule.cityCode === 'GLOBAL'
            ? 'All Cities (Global)'
            : existingRule.cityCode
      }`
    : null

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

        {/* Title */}
        <h2 className="text-[20px] sm:text-[21px] font-bold text-[#1F2B6D] dark:text-white tracking-tight mb-2">
          Active Fare Rule Already Exists
        </h2>

        {/* Plain-English Explanation */}
        <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[360px] mb-5">
          {existingRule ? (
            <>
              A live tariff (<strong>v{existingRule.version}</strong>) is already active for{' '}
              <strong className="text-slate-800 dark:text-slate-200">{scopeLabel}</strong>. Edit it
              to publish <strong>v{existingRule.version + 1}</strong> cleanly, or pick a different
              vehicle or zone.
            </>
          ) : (
            fallbackMessage ||
            'An active fare rule already exists for this vehicle and location. Edit the existing rule to publish a new version.'
          )}
        </p>

        {/* Live Existing Tariff Summary Card */}
        {existingRule && (
          <div className="w-full rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 p-4 mb-6 text-left space-y-2.5">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/70 dark:border-slate-700/70">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1F2B6D] dark:text-blue-300 truncate">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{scopeLabel}</span>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/30 dark:text-emerald-400 shrink-0">
                v{existingRule.version} · Active
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/70 py-2 px-1">
                <span className="block text-[10px] text-slate-400 font-medium">Base</span>
                <span className="block text-xs font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
                  ₹{existingRule.baseFare}
                </span>
              </div>
              <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/70 py-2 px-1">
                <span className="block text-[10px] text-slate-400 font-medium">Minimum</span>
                <span className="block text-xs font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
                  ₹{existingRule.minimumFare}
                </span>
              </div>
              <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/70 py-2 px-1">
                <span className="block text-[10px] text-slate-400 font-medium">Per Km</span>
                <span className="block text-xs font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
                  ₹{existingRule.perKmRate}
                </span>
              </div>
              <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/70 py-2 px-1">
                <span className="block text-[10px] text-slate-400 font-medium">Per Min</span>
                <span className="block text-xs font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
                  ₹{existingRule.perMinuteRate}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Stacked Action Buttons matching PricingSuccessModal */}
        <div className="w-full space-y-2.5">
          {existingRule && (
            <button
              type="button"
              onClick={() => onEditExisting(existingRule.id)}
              className="w-full py-3.5 px-6 rounded-[12px] bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white text-[13.5px] font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit Existing Rule (Create v{existingRule.version + 1})</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 px-6 rounded-[12px] bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[#1F2B6D] dark:text-slate-200 text-[13.5px] font-bold transition-all cursor-pointer"
          >
            Choose Different Vehicle / Zone
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default FareRuleConflictModal
