import React, { useState } from 'react'
import type { RideHourDistribution, DashboardErrorStatus } from '../types'
import { formatCount } from '../utils/formatters'
import {
  ChartSkeleton,
  DashboardErrorCard,
  DashboardForbiddenCard,
  DashboardUnavailableCard,
} from './DashboardSkeletons'

interface RidesByHourBarChartProps {
  data?: RideHourDistribution[]
  isLoading?: boolean
  isError?: boolean
  isForbidden?: boolean
  errorStatus?: DashboardErrorStatus
  onRetry?: () => void
}

export const RidesByHourBarChart: React.FC<RidesByHourBarChartProps> = ({
  data,
  isLoading = false,
  isError = false,
  isForbidden = false,
  errorStatus,
  onRetry,
}) => {
  const [hoveredHour, setHoveredHour] = useState<RideHourDistribution | null>(null)

  if (isForbidden) {
    return <DashboardForbiddenCard title="Hourly pattern unavailable" permission="operations:read" />
  }

  if (isLoading) {
    return <ChartSkeleton height="h-64" />
  }

  if (isError) {
    return (
      <DashboardErrorCard
        title="Hourly pattern unavailable"
        message="Unable to load 24-hour ride distribution. Please retry."
        status={errorStatus}
        onRetry={onRetry}
      />
    )
  }

  if (!data || data.length === 0) {
    return <DashboardUnavailableCard title="Hourly pattern unavailable" />
  }

  // Real backend buckets only; the scale and the highlighted peak come from the data.
  const chartData = data
  const totalRides = data.reduce((acc, curr) => acc + curr.count, 0)
  const yCeiling = Math.max(...data.map((d) => d.count), 0)
  const yTicks = [1, 0.75, 0.5, 0.25, 0].map((ratio) => Math.round(yCeiling * ratio))
  const peakHour = data.find((d) => d.isPeak)?.hour

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-3.5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
      {/* Header matching Image 1: Title on left, "View All →" on right */}
      <div className="flex items-center justify-between mb-1.5 text-left">
        <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none">
          Rides by Hour (Today)
        </h3>
      </div>

      {totalRides === 0 ? (
        <div className="h-[90px] flex items-center justify-center text-center text-xs font-medium text-slate-400">
          No rides recorded in this period
        </div>
      ) : (
      /* Chart Canvas with Y-Axis and 24-Hour Bars; bars are pointer-only, the list below is the accessible form */
      <div className="relative pt-5 pb-0 flex flex-col justify-end">
        <ul className="sr-only" aria-label="Rides by hour today">
          {chartData
            .filter((item) => item.count > 0)
            .map((item) => (
              <li key={item.hour}>
                {item.label}: {formatCount(item.count)} rides{item.hour === peakHour ? ' (peak)' : ''}
              </li>
            ))}
        </ul>
        <div className="flex items-stretch h-[62px]" aria-hidden="true">
          {/* Y-Axis scale derived from the real maximum */}
          <div className="flex flex-col justify-between items-end pr-1.5 text-[9px] text-slate-400 dark:text-slate-500 font-mono font-medium shrink-0 border-r border-blue-200/70 dark:border-slate-800">
            {yTicks.map((tick, i) => (
              <span key={i} className="leading-none">{formatCount(tick)}</span>
            ))}
          </div>

          {/* Bars Area with horizontal reference guidelines */}
          <div className="relative flex-1 flex items-end pl-1.5 gap-[1px] sm:gap-[1.5px] h-full border-b border-blue-400 dark:border-blue-500">
            {/* Horizontal guideline grid */}
            <div className="absolute inset-0 pl-1.5 pointer-events-none flex flex-col justify-between">
              {yTicks.map((_, i) => (
                <div key={i} className="w-full border-t border-slate-100/90 dark:border-slate-800/80" />
              ))}
            </div>

            {/* 24 Hourly Bars */}
            {chartData.map((item) => {
              const heightPct = item.count === 0 ? 0 : Math.min(Math.max((item.count / yCeiling) * 100, 2), 100)
              const isPeak = item.hour === peakHour
              const isHovered = hoveredHour?.hour === item.hour
              const showTooltip = isHovered || (!hoveredHour && isPeak)

              return (
                <div
                  key={item.hour}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative z-[1]"
                  onMouseEnter={() => setHoveredHour(item)}
                  onMouseLeave={() => setHoveredHour(null)}
                >
                  {/* Bar element with relative positioning for snug tooltip anchoring */}
                  <div
                    className={`w-full rounded-t-[2px] transition-all duration-150 relative ${
                      item.count <= 2
                        ? 'bg-blue-400/80 dark:bg-blue-500/80'
                        : isHovered || isPeak
                        ? 'bg-[#2563EB] dark:bg-blue-500'
                        : 'bg-[#3B82F6] hover:bg-[#2563EB] dark:bg-blue-600'
                    }`}
                    style={{ height: `${heightPct}%` }}
                    title={`${item.label}: ${item.count} rides`}
                  >
                    {/* Pinned / Hover Tooltip Badge snug directly on top of bar */}
                    {showTooltip && (
                      <div className="absolute bottom-[calc(100%+3px)] left-1/2 -translate-x-1/2 bg-[#0B1527] dark:bg-slate-800 text-white px-2 py-0.5 rounded-md shadow-lg text-center z-30 pointer-events-none whitespace-nowrap animate-in fade-in duration-150">
                        <div className="text-[10px] font-bold leading-tight">{item.label}</div>
                        <div className="text-[9px] text-slate-200 dark:text-slate-300 font-medium leading-tight">
                          {formatCount(item.count)} rides
                        </div>
                        <div className="w-1.5 h-1.5 bg-[#0B1527] dark:bg-slate-800 rotate-45 mx-auto -mb-1 mt-0.5" />
                      </div>
                    )}

                    {/* Indicator dot centered on top edge of bar */}
                    {showTooltip && (
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#2563EB] dark:bg-blue-400 ring-1.5 ring-white dark:ring-slate-900 z-20 pointer-events-none" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* X-Axis Labels (Every 2 Hours) matching Image 1 */}
        <div aria-hidden="true" className="flex justify-between items-center pl-6 pr-0.5 mt-1.5 text-[9px] text-slate-500 dark:text-slate-400 font-mono font-medium">
          <span>12AM</span>
          <span>2AM</span>
          <span>4AM</span>
          <span>6AM</span>
          <span>8AM</span>
          <span>10AM</span>
          <span>12PM</span>
          <span>2PM</span>
          <span>4PM</span>
          <span>6PM</span>
          <span>8PM</span>
          <span>10PM</span>
        </div>
      </div>
      )}
    </div>
  )
}
export default RidesByHourBarChart
