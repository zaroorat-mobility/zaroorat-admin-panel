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
      badgeBg: 'bg-[#1F2B6D]',
    },
    {
      id: 'online-drivers',
      label: 'Online Drivers',
      value: formatCount(overview.onlineDrivers),
      deltaPct: undefined,
      subtext: `${formatCount(Math.round(overview.onlineDriversPctOfActive))}% of active drivers`,
      icon: Wifi,
      badgeBg: 'bg-[#1F2B6D]',
    },
    {
      id: 'ongoing-rides',
      label: 'Ongoing Rides',
      value: formatCount(overview.ongoingRides),
      deltaPct: overview.ongoingRidesChangePct,
      subtext: 'Live on platform',
      icon: Car,
      badgeBg: 'bg-[#1F2B6D]',
    },
    {
      id: 'completed-rides',
      label: 'Completed Rides Today',
      value: formatCount(overview.completedRidesToday),
      deltaPct: overview.completedRidesChangePct,
      subtext: `vs ${formatCount(overview.completedRidesYesterday)} by this time yesterday`,
      icon: CheckCircle2,
      badgeBg: 'bg-[#1F2B6D]',
    },
    {
      id: 'pending-verifications',
      label: 'Pending Verifications',
      value: formatCount(overview.pendingVerifications),
      deltaPct: overview.pendingVerificationsChangePct,
      subtext: 'Driver & vehicle documents',
      icon: FileText,
      badgeBg: 'bg-rose-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 w-full">
      {kpis.map((kpi) => {
        const Icon = kpi.icon

        return (
          <div
            key={kpi.id}
            className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between text-left select-none transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-[42px] h-[42px] rounded-full ${kpi.badgeBg} flex items-center justify-center text-white shadow-sm flex-shrink-0 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:!text-white [&_svg]:!stroke-white`}>
                  <Icon className="w-5 h-5 text-white stroke-white" />
                </div>
                <div>
                  <span className="sr-only">{kpi.label} {kpi.value} </span>
                  <div className="flex items-baseline gap-1.5 leading-none">
                    <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                      {kpi.value}
                    </p>
                    <DeltaText pct={kpi.deltaPct} className="text-xs" />
                  </div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    {kpi.label}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="truncate">{kpi.subtext}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
export default OperationalKpis
