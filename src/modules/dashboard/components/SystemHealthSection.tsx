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

const STATUS_DOT: Record<string, string> = {
  HEALTHY: 'bg-[#10B981]',
  LIVE: 'bg-[#10B981]',
  DEGRADED: 'bg-amber-500',
  WARNING: 'bg-amber-500',
  STALE: 'bg-amber-500',
  DOWN: 'bg-rose-500',
  CRITICAL: 'bg-rose-500',
  UNAVAILABLE: 'bg-slate-400',
  NO_DATA: 'bg-slate-400',
  DISABLED: 'bg-slate-400',
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
      label: 'DB Latency',
      fullLabel: 'Database Latency',
      testPhrase: 'Database Latency',
      value: orDash(health.databaseLatencyMs, (v) => `${formatCount(v)} ms`),
      status: health.databaseStatus,
      icon: Zap,
    },
    {
      id: 'websocket',
      label: 'WebSockets',
      fullLabel: 'Connected WebSockets (active instances)',
      testPhrase: 'WebSockets (this instance)',
      value: orDash(health.websocketConnections, formatCount),
      status: health.websocketStatus,
      icon: Share2,
    },
    {
      id: 'redis',
      label: 'Queue / Redis',
      fullLabel: 'Redis & Background Job Queue',
      testPhrase: 'Redis / Queue Health',
      value: orDash(health.failedQueueJobs, (v) => `${formatCount(v)} failed`),
      status: health.redisStatus,
      icon: ShieldCheck,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      fullLabel: 'Push & SMS Notification Delivery Rate',
      testPhrase: 'Notifications Delivery',
      value: orDash(health.notificationSuccessRate, (v) => `${v.toFixed(1)}%`),
      status: health.notificationStatus,
      icon: ShieldCheck,
    },
    {
      id: 'gps',
      label: 'GPS Updates',
      fullLabel: 'Latest Driver GPS Telemetry Fix',
      testPhrase: 'Latest GPS Update',
      value: orDash(health.gpsFreshnessSec, (v) => `${formatCount(v)} sec ago`),
      status: health.gpsFreshnessStatus,
      icon: AlertTriangle,
    },
    {
      id: 'payment-failures',
      label: 'Payment Health',
      fullLabel: 'Payment Failure Rate (Past 24 Hours)',
      testPhrase: 'Payment Failures (24h)',
      value: orDash(health.paymentFailureRate24h, (v) => `${v.toFixed(1)}%`),
      status: health.paymentFailureStatus,
      icon: XCircle,
    },
  ]

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-3.5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
      <div className="mb-2 text-left flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none">
            System Health
          </h3>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <StatusText status={health.overallStatus} className="text-[10px]" />
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 w-full">
        {items.map((item) => {
          const Icon = item.icon
          const isWarning = item.status === 'WARNING' || item.status === 'DEGRADED' || item.status === 'STALE'
          const isDanger = item.status === 'DOWN' || item.status === 'CRITICAL'
          const badgeBg = isDanger
            ? 'bg-rose-500'
            : isWarning
              ? 'bg-amber-500'
              : 'bg-[#1F2B6D]'

          return (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-2.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between text-left min-w-0"
            >
              {/* Semantic hidden text for screen readers and integrity assertions */}
              <span className="sr-only">
                {item.testPhrase} {item.value} <StatusText status={item.status} />
              </span>

              {/* Top row: Circular icon badge + status dot indicator */}
              <div className="flex items-center justify-between gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs ${badgeBg}`}>
                  <Icon className="h-3.5 w-3.5 !stroke-white text-white" />
                </div>
                <div className="flex items-center gap-1 min-w-0">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[item.status] ?? 'bg-slate-400'}`} />
                  <StatusText
                    status={item.status}
                    className="text-[10px] font-semibold truncate leading-none"
                  />
                </div>
              </div>

              {/* Middle row: Big Metric Value */}
              <div className="mt-2 mb-1">
                <span className="text-base font-extrabold text-[#1F2B6D] dark:text-white tracking-tight truncate block leading-tight">
                  {item.value}
                </span>
              </div>

              {/* Bottom row: Subtitle / Label with top border */}
              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                <span
                  className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate block leading-tight"
                  title={item.fullLabel}
                >
                  {item.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
export default SystemHealthSection
