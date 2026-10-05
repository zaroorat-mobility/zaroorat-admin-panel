import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { DashboardActivity, DashboardErrorStatus } from '../types'
import { DashboardErrorCard, DashboardForbiddenCard } from './DashboardSkeletons'

interface RecentActivityTimelineProps {
  activities?: DashboardActivity[]
  isLoading?: boolean
  isError?: boolean
  isForbidden?: boolean
  errorStatus?: DashboardErrorStatus
  onRetry?: () => void
}

export const RecentActivityTimeline: React.FC<RecentActivityTimelineProps> = ({
  activities = [],
  isLoading = false,
  isError = false,
  isForbidden = false,
  errorStatus,
  onRetry,
}) => {
  const navigate = useNavigate()

  const getActivityDotColor = (act: DashboardActivity) => {
    const text = `${act.type} ${act.title} ${act.description}`.toUpperCase()
    if (text.includes('APPROV') || text.includes('VERIF') || text.includes('COMPLET') || text.includes('SETTLE')) {
      return 'bg-emerald-500 ring-emerald-100 dark:ring-emerald-950/60'
    }
    if (text.includes('REJECT') || text.includes('CANCEL') || text.includes('BLOCK') || text.includes('FAIL') || text.includes('ALERT')) {
      return 'bg-rose-500 ring-rose-100 dark:ring-rose-950/60'
    }
    if (text.includes('UPDATE') || text.includes('FLAG') || text.includes('WARN')) {
      return 'bg-amber-500 ring-amber-100 dark:ring-amber-950/60'
    }
    return 'bg-[#1F2B6D] ring-indigo-100 dark:ring-indigo-950/60'
  }

  if (isForbidden) {
    return <DashboardForbiddenCard title="Activity stream unavailable" permission="operations:read" />
  }

  if (isError) {
    return (
      <DashboardErrorCard
        title="Activity stream unavailable"
        message="Unable to load recent operational events. Please retry."
        status={errorStatus}
        onRetry={onRetry}
      />
    )
  }

  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-2.5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          Recent Activity Timeline
        </h4>
        <button
          type="button"
          onClick={() => navigate('/audit/logs')}
          className="text-xs font-semibold text-primary hover:underline transition-colors flex items-center gap-1"
        >
          View All →
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4 py-2 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700 flex-shrink-0 ring-4 ring-slate-100 dark:ring-slate-800" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-2.5 w-44 bg-slate-100 dark:bg-slate-800/60 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
          <p className="text-xs font-medium">No recent operational activity recorded</p>
        </div>
      ) : (
        /* Event Stream with Vertical Timeline */
        <div className="relative flex-1 flex flex-col justify-between py-1 min-h-[290px]">
          {activities.slice(0, 7).map((act, index, arr) => {
            const dotColor = getActivityDotColor(act)

            return (
              <div
                key={act.id || index}
                className="flex items-start gap-3 relative group text-left py-1"
              >
                {/* Timeline Rail & Dot */}
                <div className="relative flex flex-col items-center flex-shrink-0 w-3 pt-1 self-stretch">
                  {index < arr.length - 1 && (
                    <div className="absolute top-2.5 bottom-[-100%] w-[1.5px] bg-slate-200 dark:bg-slate-800" />
                  )}
                  <span
                    className={`h-2.5 w-2.5 rounded-full z-10 ring-4 ${dotColor}`}
                  />
                </div>

                {/* Description & Title */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={act.title}>
                      {act.title}
                    </p>
                    <span className="text-[10px] text-slate-400 font-normal whitespace-nowrap flex-shrink-0">
                      {act.timeAgoText}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={act.description}>
                    {act.description.toLowerCase() === act.title.toLowerCase()
                      ? (act.actorName && act.actorName !== 'System' ? `Action by ${act.actorName}` : 'Operational event recorded')
                      : act.description}
                    {act.description.toLowerCase() !== act.title.toLowerCase() && act.actorName && act.actorName !== 'System' && (
                      <span className="text-slate-400 dark:text-slate-500 font-normal"> • by {act.actorName}</span>
                    )}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
export default RecentActivityTimeline
