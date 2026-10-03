import React, { useState } from 'react'
import type { RideStatusDistribution, DashboardErrorStatus } from '../types'
import { formatCount } from '../utils/formatters'
import {
  ChartSkeleton,
  DashboardErrorCard,
  DashboardForbiddenCard,
  DashboardUnavailableCard,
} from './DashboardSkeletons'

interface RideStatusDonutChartProps {
  distribution?: RideStatusDistribution
  isLoading?: boolean
  isError?: boolean
  isForbidden?: boolean
  errorStatus?: DashboardErrorStatus
  onRetry?: () => void
}

interface StatusSegment {
  id: string
  label: string
  count: number
  pct: number
  color: string
}

export const RideStatusDonutChart: React.FC<RideStatusDonutChartProps> = ({
  distribution,
  isLoading = false,
  isError = false,
  isForbidden = false,
  errorStatus,
  onRetry,
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)

  if (isForbidden) {
    return <DashboardForbiddenCard title="Status distribution unavailable" permission="operations:read" />
  }

  if (isLoading) {
    return <ChartSkeleton height="h-80" />
  }

  if (isError) {
    return (
      <DashboardErrorCard
        title="Status distribution unavailable"
        message="Unable to load ride status metrics. Please retry."
        status={errorStatus}
        onRetry={onRetry}
      />
    )
  }

  if (!distribution) {
    return <DashboardUnavailableCard title="Status distribution unavailable" />
  }

  // Real backend counts only; total 0 renders the empty state below.
  const effectiveDist = distribution

  // Donut slices clockwise: Completed (Green) -> Cancelled (Red) -> Ongoing (Purple) -> No Driver Found (Blue)
  const donutSlices: StatusSegment[] = [
    {
      id: 'completed',
      label: 'Completed',
      count: effectiveDist.completed,
      pct: effectiveDist.completedPct,
      color: '#10B981', // Emerald Green matching Image 1
    },
    {
      id: 'cancelled',
      label: 'Cancelled',
      count: effectiveDist.cancelled,
      pct: effectiveDist.cancelledPct,
      color: '#EF4444', // Red matching Image 1
    },
    {
      id: 'ongoing',
      label: 'Ongoing',
      count: effectiveDist.ongoing,
      pct: effectiveDist.ongoingPct,
      color: '#8B5CF6', // Purple matching Image 1
    },
    {
      id: 'noDriversFound',
      label: 'No Driver Found',
      count: effectiveDist.noDriversFound,
      pct: effectiveDist.noDriversFoundPct,
      color: '#3B82F6', // Blue matching Image 1
    },
  ]

  // Legend items in exact order and dot colors matching Image 1
  const legendItems = [
    {
      id: 'completed',
      label: 'Completed',
      count: effectiveDist.completed,
      pct: effectiveDist.completedPct,
      dotColor: '#10B981',
    },
    {
      id: 'cancelled',
      label: 'Cancelled',
      count: effectiveDist.cancelled,
      pct: effectiveDist.cancelledPct,
      dotColor: '#EF4444',
    },
    {
      id: 'noDriversFound',
      label: 'No Driver Found',
      count: effectiveDist.noDriversFound,
      pct: effectiveDist.noDriversFoundPct,
      dotColor: '#3B82F6', // same colour as its donut segment
    },
    {
      id: 'ongoing',
      label: 'Ongoing',
      count: effectiveDist.ongoing,
      pct: effectiveDist.ongoingPct,
      dotColor: '#8B5CF6', // Purple dot matching Image 1 legend
    },
  ]

  const total = effectiveDist.total

  // SVG Donut geometry matching Image 1 master mockup (lush thick 42px ring)
  const size = 196
  const center = size / 2
  const strokeWidth = 42 // Lush, thick ring matching Image 1
  const radius = center - strokeWidth / 2
  const circumference = 2 * Math.PI * radius

  // Clean 2px hairline white slits between segments matching Image 1
  const hasMultipleSegments = donutSlices.filter((s) => s.count > 0).length > 1
  const gap = total > 0 && hasMultipleSegments ? 2.0 : 0
  let currentOffset = 0
  const renderedSegments = donutSlices.map((seg) => {
    const fraction = total > 0 ? seg.count / total : 0
    const rawArc = fraction * circumference
    const arcLength = rawArc > gap ? rawArc - gap : rawArc
    const strokeDasharray = `${arcLength} ${circumference - arcLength}`
    const strokeDashoffset = -(currentOffset + gap / 2)
    currentOffset += rawArc
    return {
      ...seg,
      strokeDasharray,
      strokeDashoffset,
    }
  })

  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col justify-between h-full">
      {/* Header (Matching Card 1 & Card 2 exact font, padding, and dropdown) */}
      <div className="flex items-center justify-between gap-3 pb-1.5">
        <h4 className="text-sm font-bold text-[#0F172A] dark:text-white tracking-tight">
          Ride Status Distribution
        </h4>
        {/* The backend reports today only (IST); a week/month choice would relabel today's numbers */}
        <span className="shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
          Today
        </span>
      </div>

      {total === 0 ? (
        <div className="h-52 flex flex-col items-center justify-center text-center p-6 text-slate-400">
          <p className="text-xs font-medium">No ride data available</p>
        </div>
      ) : (
        /* Donut Chart & Legend matching Image 1 target design */
        <div className="flex-1 flex items-center justify-between gap-3 sm:gap-6 pt-2 pb-1">
          {/* SVG Donut with thick lush ring and hairline white slits */}
          <div className="relative flex items-center justify-center flex-shrink-0">
            {/* Decorative: the legend beside it states every count and share in text */}
            <svg width={size} height={size} className="transform -rotate-90" aria-hidden="true">
              {/* Background ring */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-slate-100 dark:text-slate-800"
              />

              {/* Data segments */}
              {renderedSegments.map((seg) => (
                <circle
                  key={seg.id}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={hoveredSegment === seg.id ? strokeWidth + 2 : strokeWidth}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  strokeLinecap="butt"
                  className="transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredSegment(seg.id)}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              ))}
            </svg>

            {/* Center Total Count matching Image 1 */}
            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-2xl sm:text-[28px] font-black text-[#0F172A] dark:text-white leading-none tracking-tight">
                {formatCount(total)}
              </span>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
                Total Rides
              </span>
            </div>
          </div>

          {/* Right Legend matching Image 1 */}
          <div className="flex-1 space-y-3.5 pl-2 sm:pl-3">
            {legendItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-2.5 transition-all cursor-pointer ${
                  hoveredSegment === item.id ? 'opacity-100 scale-102' : 'opacity-95'
                }`}
                onMouseEnter={() => setHoveredSegment(item.id)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                <span
                  className="h-3.5 w-3.5 rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: item.dotColor }}
                />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1E293B] dark:text-slate-200 leading-tight">
                    {item.label}
                  </div>
                  <div className="text-sm mt-0.5 leading-tight">
                    <span className="font-bold text-[#0F172A] dark:text-white">
                      {formatCount(item.count)}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">
                      ({item.pct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
export default RideStatusDonutChart
