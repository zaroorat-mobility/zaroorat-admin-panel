import React from 'react'
import {
  User,
  Users,
  Clock,
  CreditCard,
  ShieldCheck,
  Calendar,
  MapPin,
  AlertTriangle,
  Pencil,
  ToggleRight,
  History,
} from 'lucide-react'
import type { CancellationRule } from '../types'
import { useCancellationRuleVersions } from '../../hooks'
import {
  PricingDetailsModal,
  DetailsKpiCard,
  DetailsSpecList,
  DetailsSpecRow,
} from '../../components/PricingDetailsModal'

interface CancellationRuleDetailsModalProps {
  rule: CancellationRule | null
  canWrite: boolean
  onClose: () => void
  onEdit: (rule: CancellationRule) => void
  onActivate?: (rule: CancellationRule) => void
}

function formatScenario(scenario: string): string {
  return scenario
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

function formatDurationHuman(totalSeconds: number): string {
  const secs = Math.max(0, Math.round(totalSeconds))
  if (secs < 60) return `${secs} sec`
  const mins = Math.floor(secs / 60)
  const rem = secs % 60
  if (rem === 0) return `${mins} min`
  return `${mins}m ${rem}s`
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

export const CancellationRuleDetailsModal: React.FC<CancellationRuleDetailsModalProps> = ({
  rule,
  canWrite,
  onClose,
  onEdit,
  onActivate,
}) => {
  const { data: versions = [] } = useCancellationRuleVersions(rule?.id ?? '')

  if (!rule) return null

  const version = rule.version ?? 1
  const freeSec = rule.freeCancelWindowSec ?? rule.freeCancellationWindow ?? 0
  const freeDisplay = formatDurationHuman(freeSec)
  const driverPayout = rule.driverPayout ?? rule.driverCompensationAmount ?? 0
  const maxFee = rule.maxFee ?? rule.maxChargeAmount ?? null
  const driverPenalty = rule.driverPenalty ?? rule.driverPenaltyAmount ?? null

  return (
    <PricingDetailsModal
      isOpen={Boolean(rule)}
      onClose={onClose}
      badge={`v${version}`}
      title={rule.ruleName}
      subtitle="Complete cancellation penalty, grace window, settlement, and version history stored in PostgreSQL."
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
              <span>Edit Policy (Create v{version + 1})</span>
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
          icon={<Clock className="w-3.5 h-3.5" />}
          label="Free Window"
          value={freeDisplay}
          sublabel={`${freeSec} seconds grace period`}
        />
        {rule.actor === 'rider' ? (
          <DetailsKpiCard
            icon={<Users className="w-3.5 h-3.5" />}
            label="Driver Payout"
            value={`₹${driverPayout.toFixed(2)}`}
            sublabel="Paid to driver"
          />
        ) : (
          <DetailsKpiCard
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
            label="Driver Penalty"
            value={driverPenalty != null && driverPenalty > 0 ? `₹${driverPenalty.toFixed(2)}` : '₹0.00'}
            sublabel="Deducted from wallet"
          />
        )}
        <DetailsKpiCard
          highlighted
          icon={<CreditCard className="w-3.5 h-3.5" />}
          label="Cancellation Fee"
          value={
            rule.chargeType === 'percentage'
              ? `${rule.chargeAmount}%`
              : `₹${rule.chargeAmount.toFixed(2)}`
          }
          sublabel={rule.chargeType === 'percentage' ? 'Percentage of fare' : 'Fixed flat charge'}
        />
      </div>

      {/* Detailed Specifications */}
      <DetailsSpecList>
        <DetailsSpecRow
          icon={rule.actor === 'driver' ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
          label="Applies To"
          value={
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100">
              {rule.actor === 'rider' ? 'Rider (Customer)' : 'Driver'}
            </span>
          }
        />
        <DetailsSpecRow
          icon={<ShieldCheck className="w-4 h-4" />}
          label="Cancellation Scenario"
          value={formatScenario(rule.scenario)}
        />
        {rule.chargeType === 'percentage' && (
          <DetailsSpecRow
            icon={<CreditCard className="w-4 h-4" />}
            label="Maximum Fee Cap"
            value={
              <span className="font-mono">
                {maxFee != null ? `₹${maxFee.toFixed(2)}` : 'No Limit'}
              </span>
            }
          />
        )}
        <DetailsSpecRow
          icon={<MapPin className="w-4 h-4" />}
          label="Geographic Scope"
          value={rule.cityCode ? rule.cityCode : 'All Cities (Global)'}
        />
        <DetailsSpecRow
          icon={<Calendar className="w-4 h-4" />}
          label="Effective Period"
          value={
            <span className="font-mono">
              {rule.effectiveFrom ? formatDate(rule.effectiveFrom) : 'Immediate'} –{' '}
              {formatDate(rule.effectiveTo)}
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
                    v{v.version ?? 1}
                  </span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 truncate">
                    {v.chargeType === 'percentage'
                      ? `${v.chargeAmount}%`
                      : `₹${v.chargeAmount.toFixed(2)}`}{' '}
                    · Free {formatDurationHuman(v.freeCancelWindowSec ?? v.freeCancellationWindow ?? 0)}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                    {formatDate(v.effectiveFrom || v.createdAt)}
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

export default CancellationRuleDetailsModal
