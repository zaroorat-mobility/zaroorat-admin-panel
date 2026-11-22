import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import {
  useFareRules,
  useSurgeRules,
  useCancellationRules,
  usePricingHistory,
  usePricingSummary,
  useDeactivateFareRule,
  useDeactivateSurgeRule,
  useDeactivateCancellationRule,
} from '../../hooks'
import type { FareRule, SurgeRule, CancellationRule } from '../../types'
import type { AuditLogEntry } from '@/shared/services/auditLogger'
import { useCities } from '@/modules/geographic-management/hooks'
import { ActionDropdown } from '@/modules/driver-management/components/ActionDropdown'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { useToast } from '@/shared/context/toast'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import { FareRuleDetailsModal } from '../../fare-rules/components/FareRuleDetailsModal'
import { SurgeRuleDetailsModal } from '../../surge-rules/components/SurgeRuleDetailsModal'
import { CancellationRuleDetailsModal } from '../../cancellation-rules/components/CancellationRuleDetailsModal'
import { AuditEventDetailsModal } from '../../pricing-history/components/AuditEventDetailsModal'
import {
  Car,
  Zap,
  Percent,
  Layers,
  AlertTriangle,
  Calendar,
  Clock,
  ArrowRight,
  RefreshCw,
  Plus,
  Eye,
  Pencil,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react'
import {
  CardTable,
  CardThead,
  CardTh,
  CardTbody,
  CardTr,
  CardTd,
  CardTableButton,
} from '@/shared/components/ui/CardTable'

export const PricingDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { success: showSuccess, error: showError } = useToast()
  const user = useAuthStore((state) => state.user)
  const canWrite = hasPermission(user, 'pricing:write')

  // Executive Details Popup State (same custom modal across all Pricing modules)
  const [detailFareRule, setDetailFareRule] = useState<FareRule | null>(null)
  const [detailSurgeRule, setDetailSurgeRule] = useState<SurgeRule | null>(null)
  const [detailCancelRule, setDetailCancelRule] = useState<CancellationRule | null>(null)
  const [detailAuditLog, setDetailAuditLog] = useState<AuditLogEntry | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<{
    kind: 'fare' | 'surge' | 'cancellation'
    id: string
    name: string
  } | null>(null)

  const { mutate: deactivateFare, isPending: isDeactivatingFare } = useDeactivateFareRule()
  const { mutate: deactivateSurge, isPending: isDeactivatingSurge } = useDeactivateSurgeRule()
  const { mutate: deactivateCancel, isPending: isDeactivatingCancel } =
    useDeactivateCancellationRule()

  // Real hooks queries
  const { data: fareData, refetch: refetchFares, isFetching: isFareFetching } = useFareRules()
  const { data: surgeData, refetch: refetchSurges, isFetching: isSurgeFetching } = useSurgeRules()
  const { data: cancelData, refetch: refetchCancels, isFetching: isCancelFetching } = useCancellationRules()
  const { data: historyData, refetch: refetchHistory, isFetching: isHistoryFetching } = usePricingHistory()
  const { data: cities = [], refetch: refetchCities, isFetching: isCitiesFetching } = useCities()
  const { data: pricingSummary, refetch: refetchSummary, isFetching: isSummaryFetching } = usePricingSummary()

  const rawFareRules = fareData?.data || []
  const rawSurgeRules = surgeData?.data || []
  const rawCancellationRules = cancelData?.data || []
  const rawHistoryLogs = historyData?.data || []

  // Refresh and Timestamp State (Geographic Management style)
  const isRefreshing =
    isFareFetching || isSurgeFetching || isCancelFetching || isHistoryFetching || isCitiesFetching || isSummaryFetching
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toLocaleTimeString())

  const handleRefresh = async () => {
    await Promise.allSettled([
      refetchFares(),
      refetchSurges(),
      refetchCancels(),
      refetchHistory(),
      refetchCities(),
      refetchSummary(),
    ])
    setLastUpdated(new Date().toLocaleTimeString())
  }

  // Active & inactive records counts strictly from server data
  const activeFares = useMemo(() => rawFareRules.filter((r) => r.status === 'active'), [rawFareRules])
  const inactiveFareCount = rawFareRules.length - activeFares.length
  const activeSurges = useMemo(() => rawSurgeRules.filter((s) => s.status === 'active'), [rawSurgeRules])
  const inactiveSurgeCount = rawSurgeRules.length - activeSurges.length
  const activeCancellations = useMemo(
    () => rawCancellationRules.filter((c) => c.status === 'active'),
    [rawCancellationRules],
  )
  const inactiveCancelCount = rawCancellationRules.length - activeCancellations.length

  // Live server counts from GET /admin/pricing/summary (with live list count while summary hydrates).
  const activeFareCount = pricingSummary?.counts.activeFareRules ?? activeFares.length
  const activeSurgeCount = pricingSummary?.counts.activeSurgeWindows ?? activeSurges.length
  const activeCancelCount = pricingSummary?.counts.activeCancellationPolicies ?? activeCancellations.length
  const configuredCitiesCount = cities.length

  // Live Commission & GST baseline from GET /admin/pricing/summary (zero hardcoded percentages)
  const commissionBaseline = pricingSummary?.activeGlobalBaseline.commission ?? null
  const gstRecoveryBaseline = pricingSummary?.activeGlobalBaseline.gstRecovery ?? null
  const passengerGstBaseline = pricingSummary?.activeGlobalBaseline.passengerGst ?? null
  const combinedDriverDeductionPct =
    pricingSummary?.activeGlobalBaseline.combinedDriverDeductionPct ?? null
  const taxAndCommissionFlagOn =
    Boolean(pricingSummary?.flags.commissionWalletDeduction) ||
    Boolean(pricingSummary?.flags.passengerGstEnabled) ||
    Boolean(pricingSummary?.flags.gstRecoveryEnabled)

  const gstDisplayValue =
    combinedDriverDeductionPct !== null
      ? `${combinedDriverDeductionPct.toFixed(2)}%`
      : passengerGstBaseline && passengerGstBaseline.ratePct !== null
        ? `${passengerGstBaseline.ratePct.toFixed(2)}%`
        : 'Unconfigured'

  const gstCardTitle =
    combinedDriverDeductionPct !== null ? 'Commission & GST' : 'Passenger GST (Global)'

  const gstSubLabel =
    combinedDriverDeductionPct !== null
      ? `${commissionBaseline?.ratePct ?? 0}% Comm · ${gstRecoveryBaseline?.ratePct ?? 0}% GST` +
        (commissionBaseline ? ` · v${commissionBaseline.version}` : '')
      : passengerGstBaseline
        ? passengerGstBaseline.sacCode
          ? `SAC ${passengerGstBaseline.sacCode} · v${passengerGstBaseline.version}`
          : `v${passengerGstBaseline.version}`
        : 'No active Commission / GST config'

  // Live governance readiness notices derived strictly from backend feature flags & counts
  const governanceAlerts = useMemo(() => {
    if (!pricingSummary) return []
    const items: Array<{ key: string; label: string; route: string }> = []
    if (!pricingSummary.flags.cancellationPolicyEnforcement) {
      items.push({
        key: 'cancellation-flag',
        label: 'Cancellation policy engine flag is OFF (default)',
        route: 'cancellation-rules',
      })
    }
    if (!pricingSummary.flags.passengerGstEnabled) {
      items.push({
        key: 'gst-flag',
        label: 'Passenger GST enforcement flag is OFF (default)',
        route: 'gst',
      })
    }
    if (!pricingSummary.flags.fiscalDocumentsIssue) {
      items.push({
        key: 'fiscal-flag',
        label: 'Fiscal document issuance flag is OFF (default)',
        route: 'invoices',
      })
    }
    if (pricingSummary.counts.openSettlementFailures > 0) {
      items.push({
        key: 'settlement-failures',
        label: `${pricingSummary.counts.openSettlementFailures} open settlement failure(s) require attention`,
        route: 'settlement-failures',
      })
    }
    return items
  }, [pricingSummary])

  // Live display lists from backend records (zero fabricated fallback rows)
  const displayFares = useMemo(() => {
    if (activeFares.length > 0) {
      return activeFares.slice(0, 3).map((r) => {
        const cat = r.vehicleTypeName ?? r.vehicleType
        const code = cat.slice(0, 2).toUpperCase()
        let cz = r.cityCode === 'GLOBAL' ? 'All Cities (Global)' : `${r.cityCode}`
        if (r.serviceZoneName) cz = `${r.cityCode} - ${r.serviceZoneName}`

        return {
          id: r.id,
          code,
          category: cat,
          cityZone: cz,
          baseFare: `₹${r.baseFare.toFixed(2)}`,
          minFare: `₹${r.minimumFare.toFixed(2)}`,
          perKm: `₹${r.perKmRate.toFixed(2)}`,
          perMin: `₹${r.perMinuteRate.toFixed(2)}`,
          status: r.status,
          rawRule: r,
        }
      })
    }
    return []
  }, [activeFares])

  const displaySurges = useMemo(() => {
    if (activeSurges.length > 0) {
      return activeSurges.slice(0, 3).map((s) => ({
        id: s.id,
        code: s.ruleName.slice(0, 2).toUpperCase(),
        ruleName: s.ruleName,
        category: s.vehicleLabel ?? 'All Vehicles',
        cityZone: s.zoneName ?? (s.cityCode ? `${s.cityCode} Citywide` : 'Citywide'),
        multiplier: `${s.multiplier}x`,
        timeWindow:
          s.isPeakHourOnly && s.peakHourStart && s.peakHourEnd
            ? `${s.peakHourStart} – ${s.peakHourEnd}`
            : s.startTime || s.endTime
              ? `${s.startTime || '00:00'} – ${s.endTime || '23:59'}`
              : 'All Day',
        effectiveTill: s.effectiveTo
          ? new Date(s.effectiveTo).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          })
          : 'No End Date',
        status: s.status,
        rawRule: s,
      }))
    }
    return []
  }, [activeSurges])

  const displayCancellations = useMemo(() => {
    if (activeCancellations.length > 0) {
      return activeCancellations.slice(0, 3).map((c) => {
        const formattedFee =
          c.chargeType === 'fixed' ? `₹${c.chargeAmount.toFixed(2)}` : `${c.chargeAmount}%`
        return {
          id: c.id,
          code: c.actor === 'rider' ? 'RD' : 'DR',
          actor: c.actor === 'rider' ? 'Rider' : 'Driver',
          condition:
            c.scenario === 'after_arrival'
              ? 'Cancels after driver arrival'
              : c.scenario === 'after_assignment'
                ? 'Cancels after driver assignment'
                : c.scenario === 'no_show'
                  ? 'Passenger no-show'
                  : 'Cancels before driver assignment',
          fee: formattedFee,
          payoutPenalty:
            c.actor === 'rider'
              ? c.driverCompensationAmount != null && c.driverCompensationAmount > 0
                ? `Driver payout: ₹${c.driverCompensationAmount.toFixed(2)}`
                : `Fee: ${formattedFee}`
              : c.driverPenaltyAmount != null && c.driverPenaltyAmount > 0
                ? `Driver penalty: ₹${c.driverPenaltyAmount.toFixed(2)} (wallet)`
                : `Fee: ${formattedFee}`,
          status: c.status,
          rawRule: c,
        }
      })
    }
    return []
  }, [activeCancellations])

  const displayExpiringRules = useMemo(() => {
    const liveExpiring = [
      ...rawFareRules.map((r) => ({
        id: r.id,
        kind: 'fare' as const,
        iconType: 'car' as 'car' | 'zap' | 'percent',
        title: `${r.ruleName} (Fare Rule)`,
        effectiveFrom: r.effectiveFrom,
        effectiveTo: r.effectiveTo,
        fareRule: r as FareRule | undefined,
        surgeRule: undefined as SurgeRule | undefined,
      })),
      ...rawSurgeRules.map((s) => ({
        id: s.id,
        kind: 'surge' as const,
        iconType: 'zap' as const,
        title: s.ruleName,
        effectiveFrom: s.effectiveFrom,
        effectiveTo: s.effectiveTo,
        fareRule: undefined as FareRule | undefined,
        surgeRule: s as SurgeRule | undefined,
      })),
    ].filter((item) => {
      if (!item.effectiveTo) return false
      return new Date(item.effectiveTo) > new Date()
    })

    if (liveExpiring.length > 0) {
      return liveExpiring.slice(0, 3).map((rule, idx) => {
        const diffMs = new Date(rule.effectiveTo!).getTime() - new Date().getTime()
        const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
        return {
          id: rule.id,
          kind: rule.kind,
          iconType: rule.iconType,
          title: rule.title,
          fareRule: rule.fareRule,
          surgeRule: rule.surgeRule,
          schedule: `Effective: ${new Date(rule.effectiveFrom).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })} – Expires: ${new Date(rule.effectiveTo!).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}`,
          daysLeft: `${days} days left`,
          badgeVariant: idx === 0 ? ('amber' as const) : idx === 1 ? ('emerald' as const) : ('blue' as const),
        }
      })
    }
    return []
  }, [rawFareRules, rawSurgeRules])

  const displayChangesLog = useMemo(() => {
    if (rawHistoryLogs.length > 0) {
      return rawHistoryLogs.slice(0, 4).map((log) => ({
        id: log.id,
        title: log.action,
        timestamp: new Date(log.timestamp).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        details: log.notes ?? 'Pricing configuration modified',
        author: `By: ${log.actor}`,
        rawLog: log,
      }))
    }
    return []
  }, [rawHistoryLogs])

  const handleConfirmDeactivate = () => {
    if (!deactivateTarget) return
    const { kind, id, name } = deactivateTarget
    const callbacks = {
      onSuccess: () => {
        showSuccess('Rule Deactivated', `"${name}" has been deactivated.`)
        setDeactivateTarget(null)
        void handleRefresh()
      },
      onError: (err: unknown) => {
        const apiErr = err as {
          response?: { data?: { error?: { message?: string }; message?: string } }
          message?: string
        }
        showError(
          'Deactivation Failed',
          apiErr?.response?.data?.error?.message ||
            apiErr?.response?.data?.message ||
            apiErr?.message ||
            'Unable to deactivate rule.',
        )
        setDeactivateTarget(null)
      },
    }
    if (kind === 'fare') deactivateFare(id, callbacks)
    else if (kind === 'surge') deactivateSurge(id, callbacks)
    else deactivateCancel(id, callbacks)
  }

  return (
    <PageWrapper className="space-y-4 pt-1 pb-6 px-3 sm:px-5 w-full max-w-full overflow-x-hidden">
      {/* ─── 1. Header matching Geographic Management ────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2B6D] dark:text-white">
            Pricing Control Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage fare rules, surge, cancellation, GST and monitor pricing changes in real-time.
          </p>
        </div>

        {/* Action Controls: Refresh + Settlement Failures + Add Fare Rule */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Last updated {lastUpdated}
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh data"
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#1F2B6D]' : ''}`}
            />
          </button>

          {/* Settlement Failures Quick Link */}
          <button
            type="button"
            onClick={() => navigate('/pricing-management/settlement-failures')}
            className="px-3 py-2 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-xs font-semibold text-[#1F2B6D] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Settlement Failures ({pricingSummary?.counts.openSettlementFailures ?? 0})
          </button>

          {/* Add Fare Rule Button (Exact Geographic Add Button Style) */}
          <button
            type="button"
            onClick={() => navigate('fare-rules/new')}
            className="bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white px-4 py-2 rounded-[10px] text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Fare Rule</span>
          </button>
        </div>
      </div>

      {/* ─── 2. Top 5 Metric Cards (100% Live Server Counts) ─────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 w-full min-w-0">
        {/* Card 1: Active Fare Rules */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                    {activeFareCount}
                  </p>
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Active Fare Rules
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {activeFareCount} active • {inactiveFareCount} inactive
          </p>
        </div>

        {/* Card 2: Active Surge Rules */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                    {activeSurgeCount}
                  </p>
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Active Surge Rules
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {activeSurgeCount} active • {inactiveSurgeCount} inactive
          </p>
        </div>

        {/* Card 3: Cancellation Policies */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                    {activeCancelCount}
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      pricingSummary?.flags.cancellationPolicyEnforcement
                        ? 'bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/20 dark:text-emerald-400'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
                    }`}
                  >
                    {pricingSummary?.flags.cancellationPolicyEnforcement ? 'Enforced' : 'Flag OFF'}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Cancellation Policies
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {activeCancelCount} active • {inactiveCancelCount} inactive
          </p>
        </div>

        {/* Card 4: Commission & GST Baseline (100% Live from DB) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                    {gstDisplayValue}
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      taxAndCommissionFlagOn
                        ? 'bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/20 dark:text-emerald-400'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
                    }`}
                  >
                    {taxAndCommissionFlagOn ? 'Enforced' : 'Flag OFF'}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  {gstCardTitle}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 truncate">
            {gstSubLabel}
          </p>
        </div>

        {/* Card 5: Cities Configured */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {configuredCitiesCount}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Cities Configured
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {cities.length > 0 ? cities.map((c) => c.name).join(', ') : 'No cities configured yet'}
          </p>
        </div>
      </div>

      {/* ─── 3. Live Governance Readiness Notices (Zero Hardcoded Claims) ────── */}
      {governanceAlerts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl px-4 py-2.5 flex items-center flex-wrap gap-x-5 gap-y-2 text-xs w-full min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300 flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>Governance Status ({governanceAlerts.length})</span>
          </div>
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-amber-800 dark:text-amber-200 font-medium">
            {governanceAlerts.map((item) => (
              <span
                key={item.key}
                onClick={() => navigate(item.route)}
                className="flex items-center gap-1.5 hover:underline cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 flex-shrink-0" />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─── 4. Main Two-Column Content Layout ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full min-w-0">
        {/* ─── LEFT COLUMN (8 Cols): 3 Tables using CardTable Suite ────────────── */}
        <div className="lg:col-span-8 space-y-5 min-w-0 w-full">
          {/* Table 1: ACTIVE BASE TARIFFS */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col w-full min-w-0">
            <div className="p-4 sm:px-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Car className="w-[18px] h-[18px] text-[#1F2B6D]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight truncate">
                    ACTIVE BASE TARIFFS ({activeFareCount})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    Currently active fare rules applied to passenger billing categories.
                  </p>
                </div>
              </div>
              <CardTableButton
                variant="outline"
                onClick={() => navigate('fare-rules')}
                className="text-xs flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 flex-shrink-0"
              >
                <span>Manage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </CardTableButton>
            </div>

            <CardTable containerClassName="w-full overflow-x-auto no-scrollbar">
              <CardThead>
                <tr>
                  <CardTh className="w-8 px-2 text-center">#</CardTh>
                  <CardTh className="px-3">Vehicle Category</CardTh>
                  <CardTh className="px-3">City / Zone</CardTh>
                  <CardTh className="px-2 text-right">Base Fare</CardTh>
                  <CardTh className="px-2 text-right">Min Fare</CardTh>
                  <CardTh className="px-2 text-right">Per Km</CardTh>
                  <CardTh className="px-2 text-right">Per Min</CardTh>
                  <CardTh className="px-2 text-center">Status</CardTh>
                  <CardTh className="px-2 text-center">Actions</CardTh>
                </tr>
              </CardThead>
              <CardTbody>
                {displayFares.map((row, idx) => (
                  <CardTr
                    key={row.id}
                    onClick={() => setDetailFareRule(row.rawRule)}
                    className="cursor-pointer"
                  >
                    <CardTd className="px-2 text-center font-semibold text-slate-500 dark:text-slate-400">{idx + 1}</CardTd>
                    <CardTd className="px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-[#1F2B6D] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {row.code}
                        </div>
                        <span className="font-bold text-slate-800 dark:text-white text-xs whitespace-nowrap">
                          {row.category}
                        </span>
                      </div>
                    </CardTd>
                    <CardTd className="px-3 text-slate-600 dark:text-slate-300 font-medium text-xs whitespace-nowrap">{row.cityZone}</CardTd>
                    <CardTd className="px-2 text-right font-semibold text-slate-900 dark:text-white text-xs whitespace-nowrap">{row.baseFare}</CardTd>
                    <CardTd className="px-2 text-right font-semibold text-slate-900 dark:text-white text-xs whitespace-nowrap">{row.minFare}</CardTd>
                    <CardTd className="px-2 text-right font-semibold text-slate-900 dark:text-white text-xs whitespace-nowrap">{row.perKm}</CardTd>
                    <CardTd className="px-2 text-right font-semibold text-slate-900 dark:text-white text-xs whitespace-nowrap">{row.perMin}</CardTd>
                    <CardTd className="px-2 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/20 dark:text-emerald-400 whitespace-nowrap">
                        Active
                      </span>
                    </CardTd>
                    <CardTd className="px-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`fare-rules/${row.id}/edit`)}
                          title="Edit Fare Rule"
                          className="p-1 text-slate-500 hover:text-[#1F2B6D] dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <ActionDropdown
                          actions={[
                            {
                              label: 'View Details',
                              icon: <Eye className="w-4 h-4" />,
                              onClick: () => setDetailFareRule(row.rawRule),
                            },
                            {
                              label: 'Edit Configuration',
                              icon: <Pencil className="w-4 h-4" />,
                              onClick: () => navigate(`fare-rules/${row.id}/edit`),
                            },
                            ...(canWrite
                              ? [
                                  {
                                    label: 'Deactivate Rule',
                                    variant: 'danger' as const,
                                    icon: <AlertCircle className="w-4 h-4" />,
                                    onClick: () =>
                                      setDeactivateTarget({
                                        kind: 'fare',
                                        id: row.id,
                                        name: row.rawRule.ruleName,
                                      }),
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </div>
                    </CardTd>
                  </CardTr>
                ))}
              </CardTbody>
            </CardTable>

            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                {displayFares.length > 0
                  ? `Showing 1–${displayFares.length} of ${activeFareCount} active fare rules`
                  : `Showing 0 of ${activeFareCount} active fare rules`}
              </span>
              <button
                type="button"
                onClick={() => navigate('fare-rules')}
                className="font-bold text-[#1F2B6D] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Fare Rules</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Table 2: ACTIVE SURGE MULTIPLIERS */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col w-full min-w-0">
            <div className="p-4 sm:px-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-[18px] h-[18px] text-[#1F2B6D]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight truncate">
                    ACTIVE SURGE MULTIPLIERS ({activeSurgeCount})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    Real-time pricing multipliers surcharges currently active on vehicle classes.
                  </p>
                </div>
              </div>
              <CardTableButton
                variant="outline"
                onClick={() => navigate('surge-rules')}
                className="text-xs flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 flex-shrink-0"
              >
                <span>Manage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </CardTableButton>
            </div>

            <CardTable containerClassName="w-full overflow-x-auto no-scrollbar">
              <CardThead>
                <tr>
                  <CardTh className="w-8 px-2 text-center">#</CardTh>
                  <CardTh className="px-3">Rule Name</CardTh>
                  <CardTh className="px-2.5">Vehicle</CardTh>
                  <CardTh className="px-2.5">City / Zone</CardTh>
                  <CardTh className="px-2 text-center">Multiplier</CardTh>
                  <CardTh className="px-2 text-center">Time Window</CardTh>
                  <CardTh className="px-2.5 text-center">Effective Till</CardTh>
                  <CardTh className="px-2 text-center">Status</CardTh>
                  <CardTh className="px-2 text-center">Actions</CardTh>
                </tr>
              </CardThead>
              <CardTbody>
                {displaySurges.map((row, idx) => (
                  <CardTr
                    key={row.id}
                    onClick={() => setDetailSurgeRule(row.rawRule)}
                    className="cursor-pointer"
                  >
                    <CardTd className="px-2 text-center font-semibold text-slate-500 dark:text-slate-400">{idx + 1}</CardTd>
                    <CardTd className="px-3 font-semibold text-slate-900 dark:text-white text-xs whitespace-nowrap">{row.ruleName}</CardTd>
                    <CardTd className="px-2.5 text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">{row.category}</CardTd>
                    <CardTd className="px-2.5 text-slate-600 dark:text-slate-300 font-medium text-xs whitespace-nowrap">{row.cityZone}</CardTd>
                    <CardTd className="px-2 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200/70 dark:border-rose-900/50">
                        {row.multiplier}
                      </span>
                    </CardTd>
                    <CardTd className="px-2 text-center">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {row.timeWindow}
                      </span>
                    </CardTd>
                    <CardTd className="px-2.5 text-center text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">{row.effectiveTill}</CardTd>
                    <CardTd className="px-2 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/20 dark:text-emerald-400 whitespace-nowrap">
                        Active
                      </span>
                    </CardTd>
                    <CardTd className="px-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`surge-rules/${row.id}/edit`)}
                          title="Edit Surge Rule"
                          className="p-1 text-slate-500 hover:text-[#1F2B6D] dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <ActionDropdown
                          actions={[
                            {
                              label: 'View Details',
                              icon: <Eye className="w-4 h-4" />,
                              onClick: () => setDetailSurgeRule(row.rawRule),
                            },
                            {
                              label: 'Edit Surge Rule',
                              icon: <Pencil className="w-4 h-4" />,
                              onClick: () => navigate(`surge-rules/${row.id}/edit`),
                            },
                            ...(canWrite
                              ? [
                                  {
                                    label: 'Deactivate Surge',
                                    variant: 'danger' as const,
                                    icon: <AlertCircle className="w-4 h-4" />,
                                    onClick: () =>
                                      setDeactivateTarget({
                                        kind: 'surge',
                                        id: row.id,
                                        name: row.ruleName,
                                      }),
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </div>
                    </CardTd>
                  </CardTr>
                ))}
              </CardTbody>
            </CardTable>

            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                {displaySurges.length > 0
                  ? `Showing 1–${displaySurges.length} of ${activeSurgeCount} active surge rules`
                  : `Showing 0 of ${activeSurgeCount} active surge rules`}
              </span>
              <button
                type="button"
                onClick={() => navigate('surge-rules')}
                className="font-bold text-[#1F2B6D] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Surge Rules</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Table 3: ACTIVE CANCELLATION RULES */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col w-full min-w-0">
            <div className="p-4 sm:px-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-[18px] h-[18px] text-[#1F2B6D]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight truncate">
                    ACTIVE CANCELLATION RULES ({activeCancelCount})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    Operational fees and penalites applied to riders and drivers for cancellation events.
                  </p>
                </div>
              </div>
              <CardTableButton
                variant="outline"
                onClick={() => navigate('cancellation-rules')}
                className="text-xs flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 flex-shrink-0"
              >
                <span>Manage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </CardTableButton>
            </div>

            <CardTable containerClassName="w-full overflow-x-auto no-scrollbar">
              <CardThead>
                <tr>
                  <CardTh className="w-8 px-2 text-center">#</CardTh>
                  <CardTh className="px-3">Actor</CardTh>
                  <CardTh className="px-3">Condition</CardTh>
                  <CardTh className="px-2.5 text-right">Cancellation Fee</CardTh>
                  <CardTh className="px-3">Driver Payout / Penalty</CardTh>
                  <CardTh className="px-2 text-center">Status</CardTh>
                  <CardTh className="px-2 text-center">Actions</CardTh>
                </tr>
              </CardThead>
              <CardTbody>
                {displayCancellations.map((row, idx) => (
                  <CardTr
                    key={row.id}
                    onClick={() => setDetailCancelRule(row.rawRule)}
                    className="cursor-pointer"
                  >
                    <CardTd className="px-2 text-center font-semibold text-slate-500 dark:text-slate-400">{idx + 1}</CardTd>
                    <CardTd className="px-3 font-semibold text-slate-900 dark:text-white text-xs whitespace-nowrap">{row.actor}</CardTd>
                    <CardTd className="px-3 text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">{row.condition}</CardTd>
                    <CardTd className="px-2.5 text-right font-semibold text-slate-900 dark:text-white text-xs whitespace-nowrap">{row.fee}</CardTd>
                    <CardTd className="px-3 text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">{row.payoutPenalty}</CardTd>
                    <CardTd className="px-2 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/20 dark:text-emerald-400 whitespace-nowrap">
                        Active
                      </span>
                    </CardTd>
                    <CardTd className="px-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`cancellation-rules/${row.id}/edit`)}
                          title="Edit Policy"
                          className="p-1 text-slate-500 hover:text-[#1F2B6D] dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <ActionDropdown
                          actions={[
                            {
                              label: 'View Details',
                              icon: <Eye className="w-4 h-4" />,
                              onClick: () => setDetailCancelRule(row.rawRule),
                            },
                            {
                              label: 'Edit Policy',
                              icon: <Pencil className="w-4 h-4" />,
                              onClick: () => navigate(`cancellation-rules/${row.id}/edit`),
                            },
                            ...(canWrite
                              ? [
                                  {
                                    label: 'Deactivate Policy',
                                    variant: 'danger' as const,
                                    icon: <AlertCircle className="w-4 h-4" />,
                                    onClick: () =>
                                      setDeactivateTarget({
                                        kind: 'cancellation',
                                        id: row.id,
                                        name: row.rawRule.ruleName,
                                      }),
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </div>
                    </CardTd>
                  </CardTr>
                ))}
              </CardTbody>
            </CardTable>

            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                {displayCancellations.length > 0
                  ? `Showing 1–${displayCancellations.length} of ${activeCancelCount} cancellation rules`
                  : `Showing 0 of ${activeCancelCount} cancellation rules`}
              </span>
              <button
                type="button"
                onClick={() => navigate('cancellation-rules')}
                className="font-bold text-[#1F2B6D] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Cancellation Policies</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN (4 Cols): Expiring Rules & Changes Log ─────────────── */}
        <div className="lg:col-span-4 space-y-4 min-w-0 w-full">
          {/* Card 1: EXPIRING RULES SCHEDULE */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3 min-w-0 w-full overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-[#1F2B6D] dark:text-white leading-none">
                Expiring Rules Schedule
              </h3>
              <button
                type="button"
                onClick={() => navigate('fare-rules')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View All →
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayExpiringRules.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.kind === 'fare' && item.fareRule) setDetailFareRule(item.fareRule)
                    else if (item.kind === 'surge' && item.surgeRule) setDetailSurgeRule(item.surgeRule)
                  }}
                  className="flex items-center justify-between py-3 px-1.5 -mx-1.5 rounded-lg hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition cursor-pointer text-slate-700 dark:text-slate-300 gap-2 min-w-0 w-full"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                      {item.iconType === 'car' && <Car className="w-4 h-4 text-[#1F2B6D]" strokeWidth={2} />}
                      {item.iconType === 'zap' && <Zap className="w-4 h-4 text-[#1F2B6D]" strokeWidth={2} />}
                      {item.iconType === 'percent' && <Percent className="w-4 h-4 text-[#1F2B6D]" strokeWidth={2} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-[#1F2B6D] dark:text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.schedule}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold whitespace-nowrap ${item.badgeVariant === 'amber'
                        ? 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
                        : item.badgeVariant === 'emerald'
                          ? 'bg-[#E8FAF0] text-[#10B981] border border-[#A7F3D0]'
                          : 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                        }`}
                    >
                      {item.daysLeft}
                    </span>
                    <ActionDropdown
                      actions={[
                        {
                          label: 'View Details',
                          icon: <Eye className="w-4 h-4" />,
                          onClick: () => {
                            if (item.kind === 'fare' && item.fareRule) setDetailFareRule(item.fareRule)
                            else if (item.kind === 'surge' && item.surgeRule) setDetailSurgeRule(item.surgeRule)
                          },
                        },
                        {
                          label: 'Extend Expiry',
                          icon: <Calendar className="w-4 h-4" />,
                          onClick: () =>
                            navigate(
                              item.kind === 'surge'
                                ? `surge-rules/${item.id}/edit`
                                : `fare-rules/${item.id}/edit`,
                            ),
                        },
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: PRICING CHANGES LOG */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3 min-w-0 w-full overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-[#1F2B6D] dark:text-white leading-none">
                Pricing Changes Log
              </h3>
              <button
                type="button"
                onClick={() => navigate('pricing-history')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                View All →
              </button>
            </div>

            <div className="relative pl-5 space-y-3.5 pt-1 before:absolute before:left-2 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 min-w-0">
              {displayChangesLog.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setDetailAuditLog(log.rawLog)}
                  className="relative space-y-0.5 min-w-0 p-1.5 -m-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
                >
                  <div className="absolute -left-[13px] top-2.5 w-2 h-2 rounded-full bg-[#1F2B6D] dark:bg-blue-500 ring-4 ring-white dark:ring-slate-900" />
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <p className="text-[12.5px] font-bold text-[#1F2B6D] dark:text-white leading-snug truncate">
                      {log.title}
                    </p>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap flex-shrink-0">
                      {log.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2 break-words">
                    {log.details}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    {log.author}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Unified Executive Details Modals */}
      <FareRuleDetailsModal
        rule={detailFareRule}
        canWrite={canWrite}
        onClose={() => setDetailFareRule(null)}
        onEdit={(rule) => navigate(`fare-rules/${rule.id}/edit`)}
        onDuplicate={(rule) => navigate(`fare-rules/new?duplicateId=${rule.id}`)}
      />

      <SurgeRuleDetailsModal
        rule={detailSurgeRule}
        canWrite={canWrite}
        onClose={() => setDetailSurgeRule(null)}
        onEdit={(rule) => navigate(`surge-rules/${rule.id}/edit`)}
      />

      <CancellationRuleDetailsModal
        rule={detailCancelRule}
        canWrite={canWrite}
        onClose={() => setDetailCancelRule(null)}
        onEdit={(rule) => navigate(`cancellation-rules/${rule.id}/edit`)}
      />

      <AuditEventDetailsModal
        log={detailAuditLog}
        onClose={() => setDetailAuditLog(null)}
      />

      <ConfirmationModal
        isOpen={Boolean(deactivateTarget)}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Pricing Rule"
        description={
          <p className="text-xs text-muted-foreground text-left">
            Are you sure you want to deactivate <strong>{deactivateTarget?.name}</strong>? Live
            rides will stop applying this rule immediately.
          </p>
        }
        confirmText="Deactivate"
        variant="warning"
        loading={isDeactivatingFare || isDeactivatingSurge || isDeactivatingCancel}
      />
    </PageWrapper>
  )
}

export default PricingDashboardPage
