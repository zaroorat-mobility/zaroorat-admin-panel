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
      badgeBg: 'bg-[#1F2B6D]',
    },
    {
      id: 'gross-ride-value',
      label: 'Gross Ride Value (Today)',
      displayValue: formatFinancialDisplay(financials.grossRideValueToday),
      deltaPct: financials.grossRideValueChangePct,
      subtext: 'Total ride value (paid directly to drivers)',
      icon: Wallet,
      badgeBg: 'bg-[#1F2B6D]',
    },
    {
      id: 'driver-ride-collections',
      label: 'Driver Ride Collections (Today)',
      displayValue: formatFinancialDisplay(financials.driverRideCollectionsToday),
      deltaPct: financials.driverRideCollectionsChangePct,
      subtext: 'After ride commission/fees (excl. subscriptions)',
      icon: HandCoins,
      badgeBg: 'bg-[#1F2B6D]',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 w-full">
      {cards.map((c) => {
        const Icon = c.icon

        return (
          <div
            key={c.id}
            className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between text-left select-none transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-[42px] h-[42px] rounded-full ${c.badgeBg} flex items-center justify-center text-white shadow-sm flex-shrink-0 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:!text-white [&_svg]:!stroke-white`}>
                  <Icon className="w-5 h-5 text-white stroke-white" />
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5 leading-none">
                    <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                      {c.displayValue}
                    </p>
                    <DeltaText pct={c.deltaPct} className="text-xs" />
                  </div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    {c.label}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="truncate">{c.subtext}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
export default FinancialKpis
