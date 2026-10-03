import React from 'react'
import {
  Car,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck2,
  IndianRupee,
  UserRound,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { DashboardActivity, DashboardActivityType, DashboardErrorStatus } from '../types'
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

  const getActivityVisuals = (type: DashboardActivityType) => {
    switch (type) {
      case 'DRIVER_REGISTERED':
        return {
          icon: UserRound,
          dotColor: 'bg-blue-600',
          badgeColor:
            'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
        }
      case 'KYC_APPROVED':
      case 'DRIVER_VERIFIED':
        return {
          icon: CheckCircle2,
          dotColor: 'bg-emerald-600',
          badgeColor:
            'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900',
        }
      case 'DRIVER_REJECTED':
      case 'RIDE_CANCELLED':
        return {
          icon: XCircle,
          dotColor: 'bg-rose-600',
          badgeColor:
            'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900',
        }
      case 'RIDE_COMPLETED':
        return {
          icon: Car,
          dotColor: 'bg-[#1F2B6D]',
          badgeColor:
            'bg-indigo-50 text-[#1F2B6D] border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900',
        }
      case 'PAYMENT_SETTLED':
        return {
          icon: IndianRupee,
          dotColor: 'bg-sky-500',
          badgeColor:
            'bg-sky-50 text-sky-600 border border-sky-100 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900',
        }
      case 'VEHICLE_ADDED':
        return {
          icon: Car,
          dotColor: 'bg-amber-500',
          badgeColor:
            'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900',
        }
      case 'HIGH_CANCELLATION_RATE':
      case 'SYSTEM_ALERT':
        return {
          icon: AlertTriangle,
          dotColor: 'bg-rose-500',
          badgeColor:
            'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900',
        }
      default:
        return {
          icon: FileCheck2,
          dotColor: 'bg-slate-400',
          badgeColor:
            'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
        }
    }
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
              <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700 flex-shrink-0" />
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
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
            const visuals = getActivityVisuals(act.type)
            const Icon = visuals.icon

            return (
              <div
                key={act.id || index}
                className="flex items-center gap-2.5 relative group text-left py-0.5"
              >
                {/* Timeline Rail & Dot */}
                <div className="relative flex flex-col items-center justify-center flex-shrink-0 w-2.5 self-stretch">
                  {index < arr.length - 1 && (
                    <div className="absolute top-1/2 bottom-[-100%] w-[1.5px] bg-slate-200 dark:bg-slate-800" />
                  )}
                  <span
                    className={`h-2 w-2 rounded-full z-10 ring-2 ring-white dark:ring-slate-900 ${visuals.dotColor}`}
                  />
                </div>

                {/* Circular Icon Badge */}
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-2xs ${visuals.badgeColor}`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Description */}
                <div className="flex-1 min-w-0 pr-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {act.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {act.description}
                  </p>
                </div>

                {/* Timestamp */}
                <span className="text-[11px] text-slate-400 font-normal whitespace-nowrap flex-shrink-0 pl-1">
                  {act.timeAgoText}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
export default RecentActivityTimeline
