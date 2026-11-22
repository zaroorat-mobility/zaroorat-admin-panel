import React, { useEffect, useState } from 'react'
import { Zap, Info } from 'lucide-react'
import { previewFareRule, type FarePreview } from '../../api'
import type { FareRule } from '../../fare-rules/types'

interface SurgeFarePreviewCardProps {
  multiplier?: number | null
  zoneName?: string
  cityCode?: string | null
  vehicleCode?: string | null
  referenceFareRule?: FareRule | null
}

export const SurgeFarePreviewCard: React.FC<SurgeFarePreviewCardProps> = ({
  multiplier = null,
  zoneName = 'selected zone',
  cityCode = null,
  vehicleCode = null,
  referenceFareRule = null,
}) => {
  const [selectedView, setSelectedView] = useState<'normal' | 'surge'>('surge')
  const [normalPreview, setNormalPreview] = useState<FarePreview | null>(null)
  const [surgePreview, setSurgePreview] = useState<FarePreview | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const hasMultiplier = multiplier != null && multiplier > 1
  const safeMultiplier = hasMultiplier ? multiplier : 1
  const percentageIncrease = Math.round((safeMultiplier - 1) * 100)

  useEffect(() => {
    if (!hasMultiplier || !referenceFareRule) {
      setNormalPreview(null)
      setSurgePreview(null)
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(() => {
      setIsLoading(true)
      const baseInput = {
        baseFare: referenceFareRule.baseFare,
        minimumFare: referenceFareRule.minimumFare,
        perKmRate: referenceFareRule.perKmRate,
        perMinuteRate: referenceFareRule.perMinuteRate,
        freeWaitingMinutes: referenceFareRule.freeWaitingMinutes,
        waitingChargePerMinute: referenceFareRule.waitingChargePerMinute,
        bookingFee: referenceFareRule.bookingFee,
        platformFeePct: referenceFareRule.platformFeePct,
        platformFeeFlat: referenceFareRule.platformFeeFlat ?? 0,
        taxRatePct: referenceFareRule.taxRatePct ?? null,
        commissionRatePct: referenceFareRule.commissionRatePct ?? null,
        cityCode: cityCode || referenceFareRule.cityCode || null,
        vehicleType: vehicleCode || referenceFareRule.vehicleType || null,
        distanceKm: 5.0,
        durationMin: 12,
        waitingMinutes: 0,
        discountAmount: 0,
      }

      Promise.all([
        previewFareRule({ ...baseInput, surgeMultiplier: 1 }, controller.signal),
        previewFareRule({ ...baseInput, surgeMultiplier: safeMultiplier }, controller.signal),
      ])
        .then(([normalRes, surgeRes]) => {
          setNormalPreview(normalRes)
          setSurgePreview(surgeRes)
        })
        .catch(() => {
          if (controller.signal.aborted) return
          setNormalPreview(null)
          setSurgePreview(null)
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false)
        })
    }, 250)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [hasMultiplier, safeMultiplier, referenceFareRule, cityCode, vehicleCode])

  if (!hasMultiplier) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#1F2B6D] dark:text-white leading-tight">
              Surge Preview
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight">
              Server-priced comparison against live tariffs.
            </p>
          </div>
        </div>
        <div className="py-5 px-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-1">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Select a fare multiplier
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Choose a surge multiplier (e.g., 1.2x – 2.0x) to preview the live server fare impact.
          </p>
        </div>
      </div>
    )
  }

  if (!referenceFareRule) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#1F2B6D] dark:text-white leading-tight">
              Surge Preview ({safeMultiplier.toFixed(2)}x)
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight">
              +{percentageIncrease}% multiplier impact in {zoneName}.
            </p>
          </div>
        </div>
        <div className="py-4 px-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-1">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            No active Fare Rule found for this selection
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Select a city &amp; vehicle with an active Fare Rule to see an exact server-priced ₹
            comparison.
          </p>
        </div>
      </div>
    )
  }

  const normalFare = normalPreview?.fare
  const surgeFare = surgePreview?.fare
  const gstPct = surgePreview?.rates?.taxRatePct ?? normalPreview?.rates?.taxRatePct ?? 0

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3">
      {/* Header and Toggle Pills */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-[#1F2B6D] dark:text-white leading-tight truncate">
              Surge Preview
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight truncate">
              Live tariff: {referenceFareRule.vehicleTypeName || referenceFareRule.vehicleType}
            </p>
          </div>
        </div>

        {/* Normal vs Surge Toggle Pill */}
        <div className="inline-flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedView('normal')}
            className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              selectedView === 'normal'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => setSelectedView('surge')}
            className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              selectedView === 'surge'
                ? 'bg-[#1F2B6D] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            {safeMultiplier.toFixed(2)}x
          </button>
        </div>
      </div>

      <div className="pt-0.5 flex items-center justify-between text-xs">
        <span className="font-bold text-slate-900 dark:text-slate-100">
          Server-Priced Trip (5.0 km, 12 min)
        </span>
        {isLoading && <span className="text-[10.5px] text-slate-400">Updating…</span>}
      </div>

      {normalFare && surgeFare ? (
        <>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span className="font-medium text-slate-600 dark:text-slate-400">
                Base + Distance + Time
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                ₹{normalFare.subtotal.toFixed(2)}
              </span>
            </div>

            {selectedView === 'surge' && (
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="font-medium text-slate-600 dark:text-slate-400">
                  Surge Add-on ({safeMultiplier.toFixed(2)}x)
                </span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  +₹{surgeFare.surgeAmount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span className="font-medium text-slate-600 dark:text-slate-400">
                GST ({gstPct}%)
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                ₹{(selectedView === 'surge' ? surgeFare.taxAmount : normalFare.taxAmount).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#1F2B6D]/8 dark:bg-[#1F2B6D]/20 border border-[#1F2B6D]/15 dark:border-[#1F2B6D]/30 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-[#1F2B6D] dark:text-white">
              Total Estimated Fare
            </span>
            <div className="flex items-center gap-3 font-mono">
              {selectedView === 'surge' && (
                <span className="text-xs font-semibold text-slate-400 line-through">
                  ₹{normalFare.totalFare.toFixed(2)}
                </span>
              )}
              <span className="text-base sm:text-lg font-black text-[#1F2B6D] dark:text-blue-300">
                ₹{(selectedView === 'surge' ? surgeFare.totalFare : normalFare.totalFare).toFixed(2)}
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="py-3 text-center text-xs text-slate-400">Calculating on server…</div>
      )}

      <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
        <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-[#1F2B6D] dark:text-slate-200 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
          <Info className="w-3 h-3 text-[#1F2B6D] dark:text-slate-200" />
        </div>
        <p className="leading-tight text-[11px]">
          The surge multiplier ({safeMultiplier.toFixed(2)}x) increases the ride subtotal by{' '}
          <span className="font-bold text-slate-900 dark:text-slate-100">+{percentageIncrease}%</span>{' '}
          in <span className="font-bold text-slate-900 dark:text-slate-100">{zoneName}</span>.
        </p>
      </div>
    </div>
  )
}

export default SurgeFarePreviewCard
