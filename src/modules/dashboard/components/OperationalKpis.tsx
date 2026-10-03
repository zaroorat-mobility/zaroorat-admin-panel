import React from 'react'
import {
  Users,
  Wifi,
  Car,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import type { DashboardOverview, DashboardErrorStatus } from '../types'
import { formatCount } from '../utils/formatters'
import {
  KpiSkeletonGrid,
  DashboardErrorCard,
  DashboardForbiddenCard,
  DashboardUnavailableCard,
  DeltaText,
} from './DashboardSkeletons'

interface OperationalKpisProps {
  overview?: DashboardOverview
  isLoading?: boolean
  isError?: boolean
  isForbidden?: boolean
  errorStatus?: DashboardErrorStatus
  onRetry?: () => void
}

export const OperationalKpis: React.FC<OperationalKpisProps> = ({
  overview,
  isLoading = false,
  isError = false,
  isForbidden = false,
  errorStatus,
  onRetry,
}) => {
  if (isForbidden) {
    return <DashboardForbiddenCard title="Operational KPIs unavailable" permission="operations:read" />
  }

  if (isLoading) {
    return <KpiSkeletonGrid count={5} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5" />
  }

  if (isError) {
    return (
      <DashboardErrorCard
        title="Operational KPIs unavailable"
        message="Unable to retrieve real-time operational metrics. Please check network connectivity or retry."
        status={errorStatus}
        onRetry={onRetry}
      />
    )
  }

  if (!overview) {
    return <DashboardUnavailableCard title="Operational KPIs unavailable" />
  }

  // Every value below comes from GET /dashboard/overview. A delta of undefined renders "—";
  // Online Drivers has no backend comparison, so it shows none.
  const kpis = [
    {
      id: 'active-drivers',
      label: 'Active Drivers',
      value: formatCount(overview.activeDrivers),
      deltaPct: overview.activeDriversChangePct,
      subtext: `of ${formatCount(overview.registeredDrivers)} registered`,
      icon: Users,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    },
    {
      id: 'online-drivers',
      label: 'Online Drivers',
      value: formatCount(overview.onlineDrivers),
      deltaPct: undefined,
      subtext: `${formatCount(Math.round(overview.onlineDriversPctOfActive))}% of active drivers`,
      icon: Wifi,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    },
    {
      id: 'ongoing-rides',
      label: 'Ongoing Rides',
      value: formatCount(overview.ongoingRides),
      deltaPct: overview.ongoingRidesChangePct,
      subtext: 'Live on platform',
      icon: Car,
      iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
    },
    {
      id: 'completed-rides',
      label: 'Completed Rides Today',
      value: formatCount(overview.completedRidesToday),
      deltaPct: overview.completedRidesChangePct,
      subtext: `vs ${formatCount(overview.completedRidesYesterday)} by this time yesterday`,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
    },
    {
      id: 'pending-verifications',
      label: 'Pending Verifications',
      value: formatCount(overview.pendingVerifications),
      deltaPct: overview.pendingVerificationsChangePct,
      subtext: 'Driver & vehicle documents',
      icon: FileText,
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full">
      {kpis.map((kpi) => {
        const Icon = kpi.icon

        return (
          <div
            key={kpi.id}
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-3 2xl:px-4 2xl:py-3.5 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between gap-2.5 sm:gap-3"
          >
            <div className={`h-11 w-11 2xl:h-12 2xl:w-12 rounded-2xl flex items-center justify-center shrink-0 ${kpi.iconBg}`}>
              <Icon className="h-5 w-5 2xl:h-6 2xl:w-6" />
            </div>

            <div className="flex-1 min-w-0">
              <div title={kpi.label} className="text-[11.5px] 2xl:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate leading-tight">
                {kpi.label}
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5 leading-tight flex-nowrap">
                <span className="text-xl 2xl:text-2xl font-black text-[#0F172A] dark:text-white tracking-tight shrink-0">
                  {kpi.value}
                </span>
                <DeltaText pct={kpi.deltaPct} className="text-[11px] 2xl:text-xs" />
              </div>
              <div title={kpi.subtext} className="text-[10.5px] 2xl:text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-normal leading-tight">
                {kpi.subtext}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
export default OperationalKpis
