import React, { useEffect, useState } from 'react'
import {
  Car,
  MapPin,
  Calendar,
  Clock,
  Receipt,
  Coins,
  Layers,
  Pencil,
  Copy,
  ToggleRight,
  ShieldCheck,
  Navigation,
  Calculator,
  History,
  Loader2,
} from 'lucide-react'
import type { FareRule } from '../types'
import { useFareRuleVersions } from '../../hooks'
import { previewFareRule, type FarePreview } from '../../api'
import {
  PricingDetailsModal,
  DetailsKpiCard,
  DetailsSpecList,
  DetailsSpecRow,
} from '../../components/PricingDetailsModal'

interface FareRuleDetailsModalProps {
  rule: FareRule | null
  canWrite: boolean
  onClose: () => void
  onEdit: (rule: FareRule) => void
  onDuplicate?: (rule: FareRule) => void
  onActivate?: (rule: FareRule) => void
}

function formatDate(iso?: string | null): string {
  if (!iso) return 'No End Date'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const FareRuleDetailsModal: React.FC<FareRuleDetailsModalProps> = ({
  rule,
  canWrite,
  onClose,
  onEdit,
  onDuplicate,
  onActivate,
}) => {
  const { data: versions = [] } = useFareRuleVersions(rule?.id ?? '')
  const [samplePreview, setSamplePreview] = useState<FarePreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    if (!rule) {
      setSamplePreview(null)
      return
    }
    const controller = new AbortController()
    setPreviewLoading(true)
    previewFareRule(
      {
        baseFare: rule.baseFare,
        minimumFare: rule.minimumFare ?? rule.baseFare,
        perKmRate: rule.perKmRate,
        perMinuteRate: rule.perMinuteRate,
        freeWaitingMinutes: rule.freeWaitingMinutes ?? 0,
        waitingChargePerMinute: rule.waitingChargePerMinute ?? 0,
        bookingFee: rule.bookingFee ?? 0,
        platformFeePct: rule.platformFeePct ?? 0,
        platformFeeFlat: rule.platformFeeFlat ?? 0,
        taxRatePct: rule.taxRatePct ?? null,
        commissionRatePct: rule.commissionRatePct ?? null,
        distanceKm: 5,
        durationMin: 12,
        waitingMinutes: 5,
        surgeMultiplier: 1,
        discountAmount: 0,
        cityCode: rule.cityCode,
        serviceZoneId: rule.serviceZoneId ?? null,
        vehicleType: rule.vehicleType,
      },
      controller.signal,
    )
      .then((res) => {
        if (!controller.signal.aborted) setSamplePreview(res)
      })
      .catch(() => {
        if (!controller.signal.aborted) setSamplePreview(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setPreviewLoading(false)
      })

    return () => controller.abort()
  }, [rule])

  if (!rule) return null

  const minFare = rule.minimumFare ?? rule.baseFare
  const cityZoneLabel = rule.serviceZoneName
    ? `${rule.serviceZoneName} (${rule.cityCode})`
    : rule.cityCode === 'GLOBAL'
      ? 'All Cities (GLOBAL)'
      : rule.cityCode
  const vehicleDisplay = rule.vehicleTypeName
    ? `${rule.vehicleTypeName} (${rule.vehicleType})`
    : rule.vehicleType
  const waitingEnabled = (rule.waitingChargePerMinute ?? 0) > 0
  const bookingFee = rule.bookingFee ?? 0

  return (
    <PricingDetailsModal
      isOpen={Boolean(rule)}
      onClose={onClose}
      badge={`v${rule.version ?? 1}`}
      title={rule.ruleName}
      subtitle="Complete tariff rate card, live sample fare, version history, and validity stored in PostgreSQL."
      statusBadges={[
        {
          label: rule.status,
          tone: rule.status === 'active' ? 'emerald' : 'rose',
        },
      ]}
      footerActions={
        canWrite ? (
          <>
            <button
              type="button"
              onClick={() => {
                onClose()
                onEdit(rule)
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Rule</span>
            </button>
            {onDuplicate && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onDuplicate(rule)
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate</span>
              </button>
            )}
            {onActivate && rule.status !== 'active' && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onActivate(rule)
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                <ToggleRight className="w-4 h-4" />
                <span>Activate Now</span>
              </button>
            )}
          </>
        ) : undefined
      }
    >
      {/* Rate Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <DetailsKpiCard
          compact
          icon={<Coins className="w-3.5 h-3.5" />}
          label="Base Fare"
          value={`₹${rule.baseFare.toFixed(2)}`}
          sublabel="Flag-down charge"
        />
        <DetailsKpiCard
          compact
          icon={<Navigation className="w-3.5 h-3.5" />}
          label="Per Km"
          value={`₹${rule.perKmRate.toFixed(2)}`}
          sublabel="Distance rate"
        />
        <DetailsKpiCard
          compact
          icon={<Clock className="w-3.5 h-3.5" />}
          label="Per Minute"
          value={`₹${rule.perMinuteRate.toFixed(2)}`}
          sublabel="Ride duration"
        />
        <DetailsKpiCard
          compact
          highlighted
          icon={<Layers className="w-3.5 h-3.5" />}
          label="Minimum Fare"
          value={`₹${minFare.toFixed(2)}`}
          sublabel="Floor before GST"
        />
      </div>

      {/* Detailed Specifications */}
      <DetailsSpecList>
        <DetailsSpecRow
          icon={<Car className="w-4 h-4" />}
          label="Vehicle Category"
          value={
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100">
              {vehicleDisplay}
            </span>
          }
        />
        <DetailsSpecRow
          icon={<MapPin className="w-4 h-4" />}
          label="City / Service Zone"
          value={cityZoneLabel}
        />
        <DetailsSpecRow
          icon={<Clock className="w-4 h-4" />}
          label="Waiting Charges"
          value={
            <span className="font-mono font-semibold">
              {waitingEnabled
                ? `₹${(rule.waitingChargePerMinute ?? 0).toFixed(2)}/min after ${rule.freeWaitingMinutes ?? 0} min free`
                : 'Disabled'}
            </span>
          }
        />
        <DetailsSpecRow
          icon={<Receipt className="w-4 h-4" />}
          label="Booking Fee"
          value={
            <span className="font-mono font-semibold">
              {bookingFee > 0 ? `₹${bookingFee.toFixed(2)} flat` : 'None (₹0.00)'}
            </span>
          }
        />
        <DetailsSpecRow
          icon={<ShieldCheck className="w-4 h-4" />}
          label="Tax & Commission"
          value={
            samplePreview
              ? `${samplePreview.rates.taxRatePct}% GST · ${samplePreview.rates.commissionRatePct}% Commission (Live DB)`
              : 'Managed centrally via Tax & Commission'
          }
        />
        <DetailsSpecRow
          icon={<Calendar className="w-4 h-4" />}
          label="Effective Period"
          value={
            <span className="font-mono">
              {formatDate(rule.effectiveFrom)} – {formatDate(rule.effectiveTo)}
            </span>
          }
        />
        <DetailsSpecRow
          icon={<Calendar className="w-4 h-4" />}
          label="Last Updated"
          value={
            <span className="font-mono font-normal text-slate-600 dark:text-slate-300">
              {formatDateTime(rule.updatedAt || rule.createdAt)}
            </span>
          }
        />
      </DetailsSpecList>

      {/* Live Server-Priced Sample Trip Breakdown */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1F2B6D] dark:text-blue-300">
            <Calculator className="w-4 h-4" />
            <span>Live Server-Priced Sample Trip (5 km · 12 min · 5 min wait)</span>
          </div>
          {previewLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
        </div>

        {samplePreview ? (
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Base + Distance + Time</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                ₹
                {(
                  samplePreview.fare.baseFare +
                  samplePreview.fare.distanceFare +
                  samplePreview.fare.timeFare
                ).toFixed(2)}
              </span>
            </div>
            {samplePreview.fare.waitingCharge > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Waiting Charge</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  ₹{samplePreview.fare.waitingCharge.toFixed(2)}
                </span>
              </div>
            )}
            {samplePreview.fare.bookingFee > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Booking Fee</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  ₹{samplePreview.fare.bookingFee.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>GST ({samplePreview.rates.taxRatePct}%)</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                ₹{samplePreview.fare.taxAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200/80 dark:border-slate-700 font-bold text-[#1F2B6D] dark:text-blue-300 text-[13px]">
              <span>Total Rider Estimate</span>
              <span className="font-mono">₹{samplePreview.fare.totalFare.toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            {previewLoading ? 'Calculating live sample fare...' : 'Sample fare preview unavailable.'}
          </p>
        )}
      </div>

      {/* Version History */}
      {versions.length > 1 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1F2B6D] dark:text-white">
            <History className="w-4 h-4" />
            <span>Version History ({versions.length})</span>
          </div>
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            {versions.slice(0, 6).map((v) => (
              <div
                key={v.id}
                className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-[11px] text-[#1F2B6D] dark:text-blue-300">
                    v{v.version}
                  </span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 truncate">
                    Base ₹{v.baseFare.toFixed(0)} · ₹{v.perKmRate.toFixed(0)}/km · ₹
                    {v.perMinuteRate.toFixed(0)}/min
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                    {formatDate(v.effectiveFrom)}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold capitalize ${
                      v.status === 'active'
                        ? 'bg-[#E8FAF0] text-[#10B981]'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PricingDetailsModal>
  )
}

export default FareRuleDetailsModal
