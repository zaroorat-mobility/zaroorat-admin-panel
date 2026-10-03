import React from 'react'
import {
  Zap,
  Share2,
  ShieldCheck,
  AlertTriangle,
  XCircle,
} from 'lucide-react'
import type { DashboardHealth, DashboardErrorStatus } from '../types'
import { formatCount } from '../utils/formatters'
import {
  DashboardErrorCard,
  DashboardForbiddenCard,
  DashboardUnavailableCard,
} from './DashboardSkeletons'

interface SystemHealthSectionProps {
  health?: DashboardHealth
  isLoading?: boolean
  isError?: boolean
  isForbidden?: boolean
  errorStatus?: DashboardErrorStatus
  onRetry?: () => void
}

/** Colour for each status the backend health DTO can report. */
const STATUS_CLASS: Record<string, string> = {
  HEALTHY: 'text-[#10B981]',
  LIVE: 'text-[#10B981]',
  DEGRADED: 'text-amber-600 dark:text-amber-400',
  WARNING: 'text-amber-600 dark:text-amber-400',
  STALE: 'text-amber-600 dark:text-amber-400',
  DOWN: 'text-rose-600 dark:text-rose-400',
  CRITICAL: 'text-rose-600 dark:text-rose-400',
  UNAVAILABLE: 'text-slate-400 dark:text-slate-500',
  NO_DATA: 'text-slate-400 dark:text-slate-500',
  DISABLED: 'text-slate-400 dark:text-slate-500',
}

const StatusText: React.FC<{ status: string; className?: string }> = ({ status, className = '' }) => (
  <span className={`font-semibold ${STATUS_CLASS[status] ?? 'text-slate-400'} ${className}`}>
    {status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ')}
  </span>
)

/** "—" when the backend did not measure the value. */
const orDash = (value: number | null, render: (v: number) => string) => (value === null ? '—' : render(value))

export const SystemHealthSection: React.FC<SystemHealthSectionProps> = ({
  health,
  isLoading = false,
  isError = false,
  isForbidden = false,
  errorStatus,
  onRetry,
}) => {
  if (isForbidden) {
    return <DashboardForbiddenCard title="Infrastructure health unavailable" permission="operations:read" />
  }

  if (isError) {
    return (
      <DashboardErrorCard
        title="Infrastructure health unavailable"
        message="Unable to probe system service vitals. Please retry."
        status={errorStatus}
        onRetry={onRetry}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs animate-pulse space-y-2.5">
        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!health) {
    return <DashboardUnavailableCard title="Infrastructure health unavailable" />
  }

  // Values and statuses exactly as GET /dashboard/health reports them; each label names what
  // the metric actually measures. "—" marks a value the backend did not measure (null).
  const items = [
    {
      id: 'database-latency',
      label: 'Database Latency',
      value: orDash(health.databaseLatencyMs, (v) => `${formatCount(v)} ms`),
      status: health.databaseStatus,
      icon: Zap,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    },
    {
      id: 'websocket',
      label: 'WebSockets (this instance)',
      value: orDash(health.websocketConnections, formatCount),
      status: health.websocketStatus,
      icon: Share2,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
    },
    {
      id: 'redis',
      label: 'Redis / Queue Health',
      value: orDash(health.failedQueueJobs, (v) => `${formatCount(v)} failed jobs`),
      status: health.redisStatus,
      icon: ShieldCheck,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
    },
    {
      id: 'notifications',
      label: 'Notifications Delivery',
      value: orDash(health.notificationSuccessRate, (v) => `${v.toFixed(1)}%`),
      status: health.notificationStatus,
      icon: ShieldCheck,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    },
    {
      id: 'gps',
      label: 'Latest GPS Update',
      value: orDash(health.gpsFreshnessSec, (v) => `${formatCount(v)} sec ago`),
      status: health.gpsFreshnessStatus,
      icon: AlertTriangle,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    },
    {
      id: 'payment-failures',
      label: 'Payment Failures (24h)',
      // The backend returns a percentage (1.5 means 1.5 %).
      value: orDash(health.paymentFailureRate24h, (v) => `${v.toFixed(1)}%`),
      status: health.paymentFailureStatus,
      icon: XCircle,
      iconBg: 'bg-rose-50 text-rose-500 dark:bg-rose-950/50 dark:text-rose-400',
    },
  ]

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-3.5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
      <div className="mb-2 text-left flex items-baseline gap-2">
        <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none">
          System Health
        </h3>
        <StatusText status={health.overallStatus} className="text-xs" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 w-full">
        {items.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-slate-950/30 p-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-xs transition-shadow flex flex-col justify-between overflow-hidden"
            >
              <div className="flex items-start gap-1.5">
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-[10px] 2xl:text-[10.5px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap leading-tight">
                    {item.label}
                  </div>
                  <div className="text-sm sm:text-[15px] 2xl:text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug mt-0.5 whitespace-nowrap">
                    {item.value}
                  </div>
                  <StatusText
                    status={item.status}
                    className="block text-[9px] sm:text-[9.5px] 2xl:text-[10px] mt-0.5 whitespace-nowrap leading-none"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
export default SystemHealthSection
