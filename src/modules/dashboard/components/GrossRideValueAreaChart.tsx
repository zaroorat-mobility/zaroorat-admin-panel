import React, { useState, useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import type { GrossRideValueTrend, AnalyticsRange, DashboardErrorStatus } from '../types'
import { formatCount, formatInr } from '../utils/formatters'
import { valueScale } from '../utils/chartScale'
import {
  ChartSkeleton,
  DashboardErrorCard,
  DashboardForbiddenCard,
  DashboardUnavailableCard,
} from './DashboardSkeletons'

interface GrossRideValueAreaChartProps {
  data?: GrossRideValueTrend[]
  range: AnalyticsRange
  onRangeChange: (range: AnalyticsRange) => void
  isLoading?: boolean
  isError?: boolean
  isForbidden?: boolean
  errorStatus?: DashboardErrorStatus
  onRetry?: () => void
}

function formatAxisDate(dateKey: string, fallback: string): string {
  try {
    const parts = dateKey.split('-')
    if (parts.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthIdx = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
        return `${months[monthIdx]} ${day}`
      }
    }
  } catch {
    // fallback
  }
  return fallback.split(',')[0]
}

function formatTooltipDate(dateKey: string, fallback: string): string {
  try {
    const parts = dateKey.split('-')
    if (parts.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthIdx = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const year = parts[0]
      if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
        return `${months[monthIdx]} ${day}, ${year}`
      }
    }
  } catch {
    // fallback
  }
  return fallback
}

/**
 * Generates an ultra-smooth cubic Bezier spline SVG path through coordinate points.
 */
function getSplinePath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`

  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i > 0 ? pts[i - 1] : pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = i < pts.length - 2 ? pts[i + 2] : p2

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

export const GrossRideValueAreaChart: React.FC<GrossRideValueAreaChartProps> = ({
  data,
  range,
  onRangeChange,
  isLoading = false,
  isError = false,
  isForbidden = false,
  errorStatus,
  onRetry,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Real backend series only (the backend zero-fills every day in the range).
  const displayData = useMemo(() => data ?? [], [data])

  const values = useMemo(() => displayData.map((d) => d.grossRideValue), [displayData])
  const totalValue = useMemo(() => values.reduce((sum, v) => sum + v, 0), [values])

  // Chart dimensions & layout matching PlatformRevenueAreaChart
  const width = 480
  const height = 195
  const paddingLeft = 48
  const paddingRight = 16
  const paddingTop = 25
  const paddingBottom = 30

  const chartW = width - paddingLeft - paddingRight
  const chartH = height - paddingTop - paddingBottom

  // Domain spans min(0, lowest) … max(0, highest): negatives plot below the zero line,
  // nothing is clamped; an all-zero series draws a flat line at ₹0.
  const scale = useMemo(() => valueScale(values, paddingTop, chartH), [values, chartH])

  const points = useMemo(() => {
    return displayData.map((d, i) => {
      const x = paddingLeft + (i / Math.max(displayData.length - 1, 1)) * chartW
      return { x, y: scale.y(d.grossRideValue), data: d }
    })
  }, [displayData, scale, chartW, paddingLeft])

  // X-Axis labels to display (render all 7 when <= 7; render sparse intervals when > 7 to prevent text overlap)
  const axisLabels = useMemo(() => {
    if (displayData.length <= 7) {
      return displayData.map((d, i) => ({
        key: d.dateKey,
        x: paddingLeft + (i / Math.max(displayData.length - 1, 1)) * chartW,
        label: formatAxisDate(d.dateKey, d.date),
      }))
    }
    const indices = [
      0,
      Math.floor(displayData.length * 0.25),
      Math.floor(displayData.length * 0.5),
      Math.floor(displayData.length * 0.75),
      displayData.length - 1,
    ]
    const uniqueIndices = Array.from(new Set(indices))
    return uniqueIndices.map((i) => ({
      key: displayData[i].dateKey,
      x: paddingLeft + (i / Math.max(displayData.length - 1, 1)) * chartW,
      label: formatAxisDate(displayData[i].dateKey, displayData[i].date),
    }))
  }, [displayData, paddingLeft, chartW])

  const splineD = useMemo(() => getSplinePath(points), [points])
  const areaD = useMemo(() => {
    if (points.length === 0) return ''
    // Filled to the zero line, not the chart floor, so a negative day shades below ₹0
    const zeroY = scale.zeroY.toFixed(1)
    return `${splineD} L ${points[points.length - 1].x.toFixed(1)} ${zeroY} L ${points[0].x.toFixed(1)} ${zeroY} Z`
  }, [splineD, points, scale])

  const total = totalValue
  const rangeLabel = range === '7d' ? 'last 7 days' : range === '30d' ? 'last 30 days' : 'last 90 days'

  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null

  // Y-axis ticks across the real domain; the zero line is drawn solid.
  const yTicks = useMemo(
    () => scale.ticks.map((value) => ({ value, y: scale.y(value), label: formatInr(value, true) })),
    [scale],
  )
  const hasZeroTick = yTicks.some((t) => t.value === 0)
  const lowest = values.length ? Math.min(...values) : 0
  const highest = values.length ? Math.max(...values) : 0

  if (isForbidden) {
    return <DashboardForbiddenCard title="Gross ride value unavailable" permission="finance:read" />
  }

  if (isLoading) {
    return <ChartSkeleton height="h-80" />
  }

  if (isError) {
    return (
      <DashboardErrorCard
        title="Gross ride value unavailable"
        message="Unable to load ride value trend. Please retry."
        status={errorStatus}
        onRetry={onRetry}
      />
    )
  }

  if (displayData.length === 0) {
    return <DashboardUnavailableCard title="Gross ride value unavailable" />
  }

  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col justify-between h-full">
      {/* Line 1: Title on left, Dropdown on right (Matching Image 1) */}
      <div className="flex items-center justify-between gap-3 pb-1.5">
        <h4 className="text-sm font-bold text-[#0F172A] dark:text-white tracking-tight">
          Gross Ride Value ({range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'})
        </h4>
        <div className="relative shrink-0">
          <select
            aria-label="Ride value chart period"
            value={range}
            onChange={(e) => onRangeChange(e.target.value as AnalyticsRange)}
            className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 pr-6 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:border-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Line 2: period total (no comparison: the backend provides none for this series) */}
      <div className="flex items-baseline gap-2.5 pb-2 flex-nowrap whitespace-nowrap">
        <span className="text-2xl sm:text-[26px] font-black text-[#0F172A] dark:text-white tracking-tight shrink-0">
          ₹ {formatCount(totalValue)}
        </span>
      </div>

      {/* SVG Interactive Area Chart */}
      <div className="relative pt-1 w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 overflow-visible"
          role="img"
          aria-label={`Gross ride value by day, ${rangeLabel}: total ${formatInr(total)}, lowest ${formatInr(lowest)}, highest ${formatInr(highest)}. Daily values are listed in the table that follows.`}
        >
          <defs>
            <linearGradient id="grossRideValueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Vertical Y-Axis Line */}
          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={height - paddingBottom}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-700"
            strokeWidth="1"
          />

          {/* Y-Axis Labels & Dashed Horizontal Gridlines */}
          {yTicks.map(({ value, y, label }) => (
            <g key={value}>
              <text
                x={paddingLeft - 8}
                y={y + 3.5}
                textAnchor="end"
                fontSize="9.5"
                className="fill-slate-500 dark:fill-slate-400"
                fontWeight="500"
              >
                {label}
              </text>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="currentColor"
                className={value === 0 ? 'text-slate-300 dark:text-slate-600' : 'text-slate-100 dark:text-slate-800/80'}
                strokeDasharray={value === 0 ? 'none' : '4 4'}
              />
            </g>
          ))}
          {/* Zero line when it falls between ticks (mixed signs) */}
          {!hasZeroTick && (
            <line
              x1={paddingLeft}
              y1={scale.zeroY}
              x2={width - paddingRight}
              y2={scale.zeroY}
              stroke="currentColor"
              className="text-slate-300 dark:text-slate-600"
            />
          )}

          {/* Gradient Area Fill */}
          <path d={areaD} fill="url(#grossRideValueGradient)" />

          {/* Smooth Spline Curve Line */}
          <path
            d={splineD}
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Solid circular data points: all points shown when <= 7 days */}
          {points.map((p, i) => {
            const isSparse = points.length <= 7
            const isActive = hoveredIndex === i

            return (
              <g key={i}>
                {(isSparse || isActive) && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isActive ? 5 : 4}
                    fill="#10B981"
                    stroke={isActive ? '#FFFFFF' : 'none'}
                    strokeWidth={isActive ? 2 : 0}
                    className="transition-all"
                  />
                )}
                {/* Invisible broad hover column */}
                <rect
                  aria-hidden="true"
                  x={p.x - 12}
                  y={0}
                  width={24}
                  height={height - paddingBottom}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            )
          })}

          {/* Hover tooltip for the real data point under the cursor */}
          {activePoint && (
            <g
              transform={`translate(${Math.max(48, Math.min(width - 50, activePoint.x))}, ${Math.max(
                36,
                activePoint.y - 12,
              )})`}
              className="pointer-events-none transition-all duration-150"
            >
              <rect
                x="-42"
                y="-36"
                width="84"
                height="34"
                rx="6"
                fill="#0F172A"
                className="filter drop-shadow-md"
              />
              <polygon points="-5,-2 5,-2 0,4" fill="#0F172A" />
              <text
                x="0"
                y="-21"
                textAnchor="middle"
                fill="#94A3B8"
                fontSize="9.5"
                fontWeight="500"
              >
                {formatTooltipDate(activePoint.data.dateKey, activePoint.data.date)}
              </text>
              <text
                x="0"
                y="-8"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="11"
                fontWeight="700"
              >
                {formatInr(activePoint.data.grossRideValue)}
              </text>
            </g>
          )}

          {/* X-Axis Labels positioned under points directly in SVG (no overlap) */}
          {axisLabels.map((l) => (
            <text
              key={l.key}
              x={l.x}
              y={height - paddingBottom + 16}
              textAnchor="middle"
              fontSize="9.5"
              className="fill-slate-500 dark:fill-slate-400"
              fontWeight="500"
            >
              {l.label}
            </text>
          ))}
        </svg>
        {/* sr-only on the wrapper: a table ignores width: 1px and would widen the page */}
        <div className="sr-only">
        <table>
          <caption>Gross ride value by day, {rangeLabel}</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Gross ride value</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((d) => (
              <tr key={d.dateKey}>
                <td>{formatTooltipDate(d.dateKey, d.date)}</td>
                <td>{formatInr(d.grossRideValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}

export default GrossRideValueAreaChart
