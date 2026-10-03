import React from 'react'
import { AlertCircle, RefreshCw, ShieldAlert, CircleSlash } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { formatDeltaPct } from '../utils/formatters'
import type { DashboardErrorStatus } from '../types'
import type { RealtimeState } from '../realtime'

interface DashboardErrorCardProps {
  title?: string
  message?: string
  /** HTTP status of the failed request (or timeout / network); picks a specific message. */
  status?: DashboardErrorStatus
  onRetry?: () => void
  isRetrying?: boolean
  className?: string
}

function statusMessage(status?: DashboardErrorStatus): string | undefined {
  if (status === 'timeout') return 'The server did not answer in time. Retry shortly.'
  if (status === 'network') return 'The server could not be reached. Check your connection, then retry.'
  if (status === 400) return 'The server rejected this request as invalid (400). Retrying will not change the answer.'
  if (status === 401) return 'Your session is no longer valid. Sign in again to reload this section.'
  if (status === 404) return 'This data source was not found on the server (404).'
  if (status === 429) return 'Too many requests. Wait a moment, then retry.'
  if (status !== undefined && status >= 500) return `The server failed to load this section (${status}). Retry shortly.`
  return undefined
}

export const DashboardErrorCard: React.FC<DashboardErrorCardProps> = ({
  title = 'Failed to load section data',
  message = 'An unexpected error occurred while fetching real-time telemetry. Click retry to reload.',
  status,
  onRetry,
  isRetrying = false,
  className = '',
}) => {
  const text = statusMessage(status) ?? message
  return (
    <div
      role="alert"
      className={`rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-6 flex flex-col items-center justify-center text-center gap-3 ${className}`}
    >
      <div className="p-2.5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
        <AlertCircle className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">{title}</h4>
        <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-1 max-w-md">{text}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          loading={isRetrying}
          className="mt-1 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100/60"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Retry Section
        </Button>
      )}
    </div>
  )
}

/** Shown when the user lacks the permission, or the backend answered 403. Never shows data. */
export const DashboardForbiddenCard: React.FC<{ title: string; permission: string }> = ({
  title,
  permission,
}) => {
  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm h-full">
      <div className="flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            You do not have permission to view this section (<code className="font-mono text-amber-600 dark:text-amber-400 text-[11px]">{permission}</code> required).
          </p>
        </div>
      </div>
    </div>
  )
}

/** Shown when a request neither failed nor returned data. Never shows data. */
export const DashboardUnavailableCard: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm h-full">
      <div className="flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <CircleSlash className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">No data is available for this section.</p>
        </div>
      </div>
    </div>
  )
}

/** Renders a backend change percentage with its real sign; "—" when there is no value. */
export const DeltaText: React.FC<{ pct: number | null | undefined; className?: string }> = ({
  pct,
  className = '',
}) => {
  const d = formatDeltaPct(pct)
  const tone = d.isNeutral ? 'text-slate-400' : d.isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'
  const text = d.isNeutral ? d.text : `${d.isPositive ? '↑' : '↓'} ${d.text.replace(/^[+-]/, '')}`
  return <span className={`font-bold shrink-0 ${tone} ${className}`}>{text}</span>
}

export const KpiSkeletonGrid: React.FC<{ count?: number; columns?: string }> = ({
  count = 5,
  columns = 'grid-cols-2 md:grid-cols-5',
}) => {
  return (
    <div role="status" aria-label="Loading" className={`grid ${columns} gap-3.5 w-full`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm animate-pulse space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-7 w-7 rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-7 w-24 bg-slate-300 dark:bg-slate-700 rounded mt-2" />
          <div className="h-2.5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      ))}
    </div>
  )
}

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-72' }) => {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm animate-pulse flex flex-col justify-between ${height}`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-6 w-28 bg-slate-300 dark:bg-slate-700 rounded" />
        </div>
        <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
      <div className="flex items-end gap-2 h-44 pt-6">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-t"
            style={{ height: `${30 + (i * 12) % 60}%` }}
          />
        ))}
      </div>
    </div>
  )
}

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm animate-pulse"
    >
      <div className="h-10 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800" />
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

const REALTIME_LABEL: Record<RealtimeState['status'], { text: string; dot: string }> = {
  connecting: { text: 'Connecting to live updates…', dot: 'bg-slate-400' },
  live: { text: 'Live updates on', dot: 'bg-emerald-500' },
  reconnecting: { text: 'Live updates interrupted, reconnecting. Showing the last loaded data.', dot: 'bg-amber-500' },
  offline: { text: 'Live updates offline. Showing the last loaded data; use Refresh to update.', dot: 'bg-slate-400' },
  unauthorized: { text: 'Live updates stopped: your session expired. Sign in again.', dot: 'bg-rose-500' },
  forbidden: { text: 'Live updates are not available for your role.', dot: 'bg-slate-400' },
}

/**
 * Realtime connection state. Never implies anything about the data itself: every section
 * keeps showing what the server last returned, with its own loading / error state.
 */
export const RealtimeStatusBadge: React.FC<{ state: RealtimeState | null }> = ({ state }) => {
  if (!state) return null
  const { text, dot } = REALTIME_LABEL[state.status]
  return (
    <p role="status" aria-live="polite" className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
      <span aria-hidden="true" className={`h-2 w-2 rounded-full flex-shrink-0 ${dot}`} />
      <span>{text}</span>
    </p>
  )
}
