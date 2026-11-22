import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calculator,
  MapPin,
  Clock,
  Hourglass,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { previewFareRule, type FarePreview } from '../../api'

export interface FareRulePreviewCardProps {
  baseFare: number
  minimumFare: number
  perKmRate: number
  perMinuteRate: number
  freeWaitingMinutes: number
  waitingChargePerMinute: number
  bookingFee: number
  waitingChargeEnabled?: boolean
  bookingFeeEnabled?: boolean
  platformFeePct?: number
  platformFeeFlat?: number | null
  taxRatePct?: number | null
  commissionRatePct?: number | null
  cityCode?: string | null
  serviceZoneId?: string | null
  vehicleType?: string | null
  isReady?: boolean
}

export const FareRulePreviewCard: React.FC<FareRulePreviewCardProps> = ({
  baseFare = 0,
  minimumFare = 0,
  perKmRate = 0,
  perMinuteRate = 0,
  freeWaitingMinutes = 0,
  waitingChargePerMinute = 0,
  bookingFee = 0,
  waitingChargeEnabled = true,
  bookingFeeEnabled = true,
  platformFeePct = 0,
  platformFeeFlat = 0,
  taxRatePct = null,
  commissionRatePct = null,
  cityCode = null,
  serviceZoneId = null,
  vehicleType = null,
  isReady = true,
}) => {
  const navigate = useNavigate()

  const [distanceKm] = useState<number>(5.0)
  const [durationMin] = useState<number>(12)
  const [waitingMinutes] = useState<number>(5)
  const [preview, setPreview] = useState<FarePreview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const effectiveWaitRate = waitingChargeEnabled ? waitingChargePerMinute : 0
  const effectiveFreeWait = waitingChargeEnabled ? freeWaitingMinutes : 0
  const effectiveBookingFee = bookingFeeEnabled ? bookingFee : 0
  const billableWait = Math.max(0, waitingMinutes - effectiveFreeWait)

  useEffect(() => {
    if (!isReady) {
      setPreview(null)
      setPreviewError(null)
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      previewFareRule(
        {
          baseFare,
          minimumFare,
          perKmRate,
          perMinuteRate,
          freeWaitingMinutes: effectiveFreeWait,
          waitingChargePerMinute: effectiveWaitRate,
          bookingFee: effectiveBookingFee,
          platformFeePct,
          platformFeeFlat,
          taxRatePct,
          commissionRatePct,
          cityCode,
          serviceZoneId,
          vehicleType,
          distanceKm,
          durationMin,
          waitingMinutes,
          surgeMultiplier: 1,
          discountAmount: 0,
        },
        controller.signal,
      )
        .then((res) => {
          setPreview(res)
          setPreviewError(null)
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return
          setPreview(null)
          setPreviewError(err instanceof Error ? err.message : 'Preview unavailable from server')
        })
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [
    isReady,
    baseFare,
    minimumFare,
    perKmRate,
    perMinuteRate,
    effectiveFreeWait,
    effectiveWaitRate,
    effectiveBookingFee,
    platformFeePct,
    platformFeeFlat,
    taxRatePct,
    commissionRatePct,
    cityCode,
    serviceZoneId,
    vehicleType,
    distanceKm,
    durationMin,
    waitingMinutes,
  ])

  const fare = preview?.fare
  const rates = preview?.rates
  const distanceFare = fare?.distanceFare ?? 0
  const timeFare = fare?.timeFare ?? 0
  const waitingCharge = fare?.waitingCharge ?? 0
  const serverBookingFee = fare?.bookingFee ?? 0
  const platformFee = fare?.platformFee ?? 0
  const totalFare = fare?.subtotal ?? 0
  const rawComponentsSum =
    (fare?.baseFare ?? baseFare) + distanceFare + timeFare + waitingCharge + serverBookingFee
  const minFareTopUp =
    fare && totalFare > rawComponentsSum + 0.005
      ? Number((totalFare - rawComponentsSum).toFixed(2))
      : 0
  const gstRate = rates?.taxRatePct ?? 0
  const gstAmount = fare?.taxAmount ?? 0
  const grandTotal = fare?.totalFare ?? 0

  return (
    <div className="space-y-2.5 sm:space-y-3 text-left">
      {/* 1. Fare Preview Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
        {/* Header matching Geographic Dashboard */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
            <Calculator className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#1F2B6D] dark:text-white leading-tight">Fare Preview</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight">
              See how the fare is calculated for a sample ride.
            </p>
          </div>
        </div>

        {/* Sample Trip Pill Button */}
        <div className="pt-0.5">
          <div className="w-full bg-[#1F2B6D] text-white text-xs sm:text-[13px] font-bold py-2 px-3 rounded-xl text-center shadow-xs cursor-default tracking-wide">
            {!isReady
              ? 'Enter Fare Rates to Preview'
              : preview
                ? 'Server-Priced Sample Trip'
                : previewError
                  ? 'Server Preview Unavailable'
                  : 'Calculating on Server…'}
          </div>
        </div>

        {/* Sample Stats Bar */}
        <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center">
          <div className="space-y-0.5">
            <div className="flex items-center justify-center text-[#1F2B6D] dark:text-blue-400">
              <MapPin className="h-3.5 w-3.5" />
            </div>
            <span className="block text-xs sm:text-sm font-extrabold text-[#1F2B6D] dark:text-white font-mono leading-tight">
              {distanceKm.toFixed(1)} km
            </span>
            <span className="block text-[10px] text-slate-500 font-medium">Distance</span>
          </div>

          <div className="space-y-0.5 border-x border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center justify-center text-[#1F2B6D] dark:text-blue-400">
              <Clock className="h-3.5 w-3.5" />
            </div>
            <span className="block text-xs sm:text-sm font-extrabold text-[#1F2B6D] dark:text-white font-mono leading-tight">
              {durationMin} min
            </span>
            <span className="block text-[10px] text-slate-500 font-medium">Ride Time</span>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center justify-center text-[#1F2B6D] dark:text-blue-400">
              <Hourglass className="h-3.5 w-3.5" />
            </div>
            <span className="block text-xs sm:text-sm font-extrabold text-[#1F2B6D] dark:text-white font-mono leading-tight">
              {waitingMinutes} min
            </span>
            <span className="block text-[10px] text-slate-500 font-medium">Waiting</span>
          </div>
        </div>

        {!isReady ? (
          <div className="py-5 px-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-1">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              No fare rates entered yet
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Enter Base Fare, Minimum Fare, Per Km, and Per Minute rates to calculate a live
              server-priced 5.0 km sample trip.
            </p>
          </div>
        ) : previewError ? (
          <div className="py-4 px-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-center space-y-1">
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
              Could not calculate server preview
            </p>
            <p className="text-[11px] text-rose-600/90 dark:text-rose-400 leading-relaxed">
              {previewError}
            </p>
          </div>
        ) : (
          <>
            {/* Itemized Calculation Breakdown */}
            <div className="pt-0.5 space-y-1.5 text-xs sm:text-[13px]">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="font-medium text-slate-600 dark:text-slate-400">Base Fare</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹{(fare?.baseFare ?? baseFare).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="font-medium text-slate-600 dark:text-slate-400">
                  Distance ({distanceKm.toFixed(1)} km × ₹{perKmRate.toFixed(2)})
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹{distanceFare.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="font-medium text-slate-600 dark:text-slate-400">
                  Time ({durationMin} min × ₹{perMinuteRate.toFixed(2)})
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹{timeFare.toFixed(2)}
                </span>
              </div>

              {waitingChargeEnabled && (
                <div className="flex items-start justify-between gap-2 text-slate-700 dark:text-slate-300">
                  <div className="min-w-0">
                    <span className="font-medium text-slate-600 dark:text-slate-400 block">
                      Waiting ({billableWait} min × ₹{effectiveWaitRate.toFixed(2)})
                    </span>
                    {effectiveFreeWait > 0 && (
                      <span className="text-[10px] text-slate-400 block">
                        {waitingMinutes} min wait − {effectiveFreeWait} min free
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                    ₹{waitingCharge.toFixed(2)}
                  </span>
                </div>
              )}

              {serverBookingFee > 0 && (
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span className="font-medium text-slate-600 dark:text-slate-400">Booking Fee</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ₹{serverBookingFee.toFixed(2)}
                  </span>
                </div>
              )}

              {minFareTopUp > 0 && (
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    Minimum Fare Adjustment
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    +₹{minFareTopUp.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Subtotal, GST & Platform Fee Lines */}
            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs sm:text-[13px]">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Fare (Before Tax)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹{totalFare.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-400">
                  <span>GST ({gstRate}%)</span>
                  <span className="text-[10px] text-slate-400 font-mono">(CGST + SGST)</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹{gstAmount.toFixed(2)}
                </span>
              </div>

              {platformFee > 0 && (
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    Platform Fee (Default)
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ₹{platformFee.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Fare Total Box */}
            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[#1F2B6D] dark:text-white">
              <div>
                <span className="text-xs sm:text-sm font-bold text-[#1F2B6D] dark:text-white block">
                  Total Estimated Fare
                </span>
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-normal">
                  Includes {gstRate}% GST (₹{gstAmount.toFixed(2)})
                  {platformFee > 0 ? ` + ₹${platformFee.toFixed(2)} fee` : ''}
                </span>
              </div>
              <span className="text-base sm:text-lg font-black font-mono text-[#1F2B6D] dark:text-white">
                ₹{grandTotal.toFixed(2)}
              </span>
            </div>
          </>
        )}

        {/* GST Note Banner with Link matching Geographic link style */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
          <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-[#1F2B6D] dark:text-slate-200 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
            i
          </div>
          <div className="space-y-0.5 leading-tight">
            <p>GST applied as per statutory GST & Taxation settings.</p>
            <button
              type="button"
              onClick={() => navigate('/pricing-management/gst')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 underline hover:no-underline cursor-pointer"
            >
              <span>Manage GST & Taxation</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Quick Info Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-[#1F2B6D] dark:text-white leading-tight">Quick Info</h4>
        </div>

        <ul className="space-y-2 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" strokeWidth={2} />
            <span className="leading-snug">Surge pricing is configured separately in Surge Rules.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" strokeWidth={2} />
            <span className="leading-snug">Cancellation charges are configured in Cancellation Rules.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" strokeWidth={2} />
            <span className="leading-snug">Platform commission &amp; GST are managed centrally in Tax &amp; Commission.</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default FareRulePreviewCard
