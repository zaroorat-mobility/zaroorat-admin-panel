import React from 'react'
import {
  Coins,
  Wallet,
  HandCoins,
} from 'lucide-react'
import type { DashboardFinancials, DashboardErrorStatus } from '../types'
import {
  KpiSkeletonGrid,
  DashboardErrorCard,
  DashboardForbiddenCard,
  DashboardUnavailableCard,
  DeltaText,
} from './DashboardSkeletons'

interface FinancialKpisProps {
  financials?: DashboardFinancials
  isLoading?: boolean
  isError?: boolean
  isForbidden?: boolean
  errorStatus?: DashboardErrorStatus
  onRetry?: () => void
}

function formatFinancialDisplay(amount: number): string {
  return `₹ ${new Intl.NumberFormat('en-IN').format(amount)}`
}

export const FinancialKpis: React.FC<FinancialKpisProps> = ({
  financials,
  isLoading = false,
  isError = false,
  isForbidden = false,
  errorStatus,
  onRetry,
}) => {
  if (isForbidden) {
    return <DashboardForbiddenCard title="Financial data unavailable" permission="finance:read" />
  }

  if (isLoading) {
    return <KpiSkeletonGrid count={3} columns="grid-cols-1 md:grid-cols-3" />
  }

  if (isError) {
    return (
      <DashboardErrorCard
        title="Financial metrics unavailable"
        message="Unable to load financial summaries. Please verify connection and retry."
        status={errorStatus}
        onRetry={onRetry}
      />
    )
  }

  if (!financials) {
    return <DashboardUnavailableCard title="Financial metrics unavailable" />
  }

  // Every value below comes from GET /dashboard/financials; zero stays zero.
  const cards = [
    {
      id: 'platform-revenue',
      label: 'Platform Revenue (Today)',
      displayValue: formatFinancialDisplay(financials.platformRevenueToday),
      deltaPct: financials.platformRevenueChangePct,
      subtext: 'Subscriptions + Commission + Platform Fees',
      icon: Coins,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    },
    {
      id: 'gross-ride-value',
      label: 'Gross Ride Value (Today)',
      displayValue: formatFinancialDisplay(financials.grossRideValueToday),
      deltaPct: financials.grossRideValueChangePct,
      subtext: 'Total ride value (paid directly to drivers)',
      icon: Wallet,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
    },
    {
      id: 'driver-ride-collections',
      label: 'Driver Ride Collections (Today)',
      displayValue: formatFinancialDisplay(financials.driverRideCollectionsToday),
      deltaPct: financials.driverRideCollectionsChangePct,
      subtext: 'After ride commission/fees (excl. subscriptions)',
      icon: HandCoins,
      iconBg: 'bg-rose-50 text-rose-500 dark:bg-rose-950/50 dark:text-rose-400',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 w-full">
      {cards.map((c) => {
        const Icon = c.icon

        return (
          <div
            key={c.id}
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3.5 2xl:px-5 2xl:py-4 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between gap-3 sm:gap-4"
          >
            <div className={`h-11 w-11 2xl:h-12 2xl:w-12 rounded-2xl flex items-center justify-center shrink-0 ${c.iconBg}`}>
              <Icon className="h-5 w-5 2xl:h-6 2xl:w-6" />
            </div>

            <div className="flex-1 min-w-0">
              <div title={c.label} className="text-[11.5px] 2xl:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate leading-tight">
                {c.label}
              </div>
              <div className="flex items-baseline gap-2 mt-0.5 leading-tight flex-nowrap">
                <span className="text-xl sm:text-2xl 2xl:text-[26px] font-black text-[#0F172A] dark:text-white tracking-tight shrink-0">
                  {c.displayValue}
                </span>
                <DeltaText pct={c.deltaPct} className="text-xs" />
              </div>
              <div title={c.subtext} className="text-[10.5px] 2xl:text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-normal leading-tight">
                {c.subtext}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
export default FinancialKpis
