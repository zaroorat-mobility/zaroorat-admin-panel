import React from 'react'
import {
  Zap,
  Car,
  MapPin,
  Calendar,
  Clock,
  Flag,
  Pencil,
  ToggleRight,
  ShieldCheck,
  AlertTriangle,
  History,
} from 'lucide-react'
import type { SurgeRule } from '../types'
import { useSurgeRuleVersions } from '../../hooks'
import { useCities, useCity } from '@/modules/geographic-management/hooks'
import {
  PricingDetailsModal,
  DetailsKpiCard,
  DetailsSpecList,
  DetailsSpecRow,
} from '../../components/PricingDetailsModal'

interface SurgeRuleDetailsModalProps {
  rule: SurgeRule | null
  canWrite: boolean
  onClose: () => void
  onEdit: (rule: SurgeRule) => void
  onActivate?: (rule: SurgeRule) => void
}

const DAY_LABELS: Record<number, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
}

function formatDays(daysOfWeek?: number[] | null): string {
  if (!daysOfWeek || daysOfWeek.length === 0 || daysOfWeek.length === 7) {
    return 'Every Day'
  }
  const ordered = [1, 2, 3, 4, 5, 6, 0].filter((d) => daysOfWeek.includes(d))
  if (ordered.length === 5 && [1, 2, 3, 4, 5].every((d) => ordered.includes(d))) {
    return 'Weekdays (Mon – Fri)'
  }
  if (ordered.length === 2 && ordered.includes(6) && ordered.includes(0)) {
    return 'Weekend (Sat – Sun)'
  }
  return ordered.map((d) => DAY_LABELS[d]).join(', ')
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

export const SurgeRuleDetailsModal: React.FC<SurgeRuleDetailsModalProps> = ({
  rule,
  canWrite,
  onClose,
  onEdit,
  onActivate,
}) => {
  const { data: versions = [] } = useSurgeRuleVersions(rule?.id ?? '')
  const { data: cities = [] } = useCities(true)

  const matchedCity = rule?.cityCode
    ? cities.find((c) => c.code.toUpperCase() === rule.cityCode?.toUpperCase()) ?? null
    : null
  const { data: cityDetail } = useCity(matchedCity?.id ?? '')

  if (!rule) return null

  const isScheduled = Boolean(rule.isPeakHourOnly || (rule.peakHourStart && rule.peakHourEnd))
  const extraPct = Math.round((rule.multiplier - 1) * 100)
  const scopeLabel = rule.zoneName || (rule.cityCode ? `${rule.cityCode} (Citywide)` : 'Citywide')
  const vehicleChips =
    rule.vehicleTypes && rule.vehicleTypes.length > 0
      ? rule.vehicleTypes.map((v) => v.name || v.code)
      : rule.vehicleLabel
        ? [rule.vehicleLabel]
        : ['All vehicles']

  const hoursLabel =
    isScheduled && rule.peakHourStart && rule.peakHourEnd
      ? `${rule.peakHourStart} – ${rule.peakHourEnd} (Daily Peak)`
      : rule.startTime || rule.endTime
        ? `${rule.startTime || '00:00'} – ${rule.endTime || '23:59'} (Event Hours)`
        : 'All Day (00:00 – 23:59)'

  const citySurgeCap = cityDetail?.maxSurgeMultiplier ?? null
  const exceedsCityCap = citySurgeCap != null && rule.multiplier > citySurgeCap

  return (
    <PricingDetailsModal
      isOpen={Boolean(rule)}
      onClose={onClose}
      badge={<span className="font-mono">{rule.multiplier.toFixed(1)}x</span>}
      title={rule.ruleName}
      subtitle="Complete surge multiplier, geographic zone, schedule, legal cap, and validity stored in PostgreSQL."
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
              <span>Edit Surge Rule</span>
            </button>
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
      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <DetailsKpiCard
          mono={false}
          icon={isScheduled ? <Clock className="w-3.5 h-3.5" /> : <Flag className="w-3.5 h-3.5" />}
          label="Application Mode"
          value={isScheduled ? 'Scheduled' : 'Continuous'}
          sublabel={isScheduled ? 'Recurring days & peak hours' : 'Event / manual window'}
        />
        <DetailsKpiCard
          mono={false}
          icon={<Car className="w-3.5 h-3.5" />}
          label="Vehicle Scope"
          value={
            rule.vehicleTypeIds && rule.vehicleTypeIds.length > 0
              ? `${rule.vehicleTypeIds.length} ${rule.vehicleTypeIds.length === 1 ? 'Type' : 'Types'}`
              : 'All Vehicles'
          }
          sublabel={rule.vehicleLabel || 'All active vehicles'}
        />
        <DetailsKpiCard
          highlighted
          icon={<Zap className="w-3.5 h-3.5" />}
          label="Fare Multiplier"
          value={`${rule.multiplier.toFixed(2)}x`}
          sublabel={extraPct > 0 ? `+${extraPct}% above standard fare` : 'Standard fare'}
        />
      </div>

      {exceedsCityCap && citySurgeCap != null && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>City Legal Cap ({citySurgeCap.toFixed(1)}x):</strong> Live rides in{' '}
            {matchedCity?.name || rule.cityCode} will be clamped to {citySurgeCap.toFixed(1)}x
            unless the city surge cap is raised.
          </span>
        </div>
      )}

      {/* Detailed Specifications */}
      <DetailsSpecList>
        <DetailsSpecRow
          icon={<MapPin className="w-4 h-4" />}
          label="City / Surge Zone"
          value={scopeLabel}
        />
        <DetailsSpecRow
          icon={<Car className="w-4 h-4" />}
          label="Applicable Vehicles"
          value={
            <div className="flex flex-wrap sm:justify-end gap-1.5">
              {vehicleChips.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
                >
                  {v}
                </span>
              ))}
            </div>
          }
        />
        <DetailsSpecRow
          icon={<Calendar className="w-4 h-4" />}
          label="Active Days"
          value={isScheduled ? formatDays(rule.daysOfWeek) : 'All Days (Continuous)'}
        />
        <DetailsSpecRow
          icon={<Clock className="w-4 h-4" />}
          label="Active Hours"
          value={<span className="font-mono">{hoursLabel}</span>}
        />
        {citySurgeCap != null && (
          <DetailsSpecRow
            icon={<ShieldCheck className="w-4 h-4" />}
            label="City Legal Surge Cap"
            value={<span className="font-mono">{citySurgeCap.toFixed(1)}x max</span>}
          />
        )}
        <DetailsSpecRow
          icon={<Calendar className="w-4 h-4" />}
          label="Effective Period"
          value={
            <span className="font-mono">
              {rule.effectiveFrom} – {rule.effectiveTo || 'No End Date'}
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

      {/* Version History */}
      {versions.length > 1 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1F2B6D] dark:text-white">
            <History className="w-4 h-4" />
            <span>Revision History ({versions.length})</span>
          </div>
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            {versions.slice(0, 6).map((v) => (
              <div
                key={v.id}
                className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/30 font-mono font-bold text-[11px] text-rose-700 dark:text-rose-300">
                    {v.multiplier.toFixed(2)}x
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 truncate">
                    {v.ruleName}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                    {v.effectiveFrom}
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

export default SurgeRuleDetailsModal
