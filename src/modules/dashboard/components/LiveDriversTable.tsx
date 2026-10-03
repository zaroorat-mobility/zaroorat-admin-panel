import React from 'react'
import { AlertCircle } from 'lucide-react'
import { isValidCoordinate } from '@/shared/utils/polyline'
import { useNavigate } from 'react-router-dom'
import type { LiveDriver, DashboardErrorStatus } from '../types'
import { TableSkeleton, DashboardErrorCard, DashboardForbiddenCard } from './DashboardSkeletons'

interface LiveDriversTableProps {
  /** undefined until the first successful response */
  drivers?: LiveDriver[]
  onlineCount?: number
  isLoading?: boolean
  isError?: boolean
  isForbidden?: boolean
  errorStatus?: DashboardErrorStatus
  onRetry?: () => void
}

/** Last-update cell: the backend's freshness verdict in words, never colour alone. */
function lastUpdateLabel(d: LiveDriver): { text: string; note?: string } {
  if (d.gpsFreshness === 'UNKNOWN' || !d.recordedAt) return { text: 'No GPS fix' }
  if (d.gpsFreshness === 'STALE') return { text: d.lastUpdateText, note: 'Stale' }
  return { text: d.lastUpdateText }
}

export const LiveDriversTable: React.FC<LiveDriversTableProps> = ({
  drivers,
  onlineCount = 0,
  isLoading = false,
  isError = false,
  isForbidden = false,
  errorStatus,
  onRetry,
}) => {
  const navigate = useNavigate()

  const getStatusBadge = (status: LiveDriver['status']) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-[#DCFCE7] text-[#16A34A] dark:bg-emerald-950/60 dark:text-emerald-300'
      case 'ON_TRIP':
        return 'bg-[#E0E7FF] text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-300'
      case 'BUSY':
      case 'BREAK':
        return 'bg-[#FEF3C7] text-[#D97706] dark:bg-amber-950/60 dark:text-amber-300'
      case 'OFFLINE':
      default:
        return 'bg-[#F1F5F9] text-[#64748B] dark:bg-slate-800 dark:text-slate-400'
    }
  }

  const getModeBadge = (mode: LiveDriver['mode']) => {
    switch (mode) {
      case 'Car':
        return 'bg-[#E0F2FE] text-[#0284C7] dark:bg-sky-950/60 dark:text-sky-300'
      case 'Auto':
        return 'bg-[#DCFCE7] text-[#16A34A] dark:bg-emerald-950/60 dark:text-emerald-300'
      case 'Bike':
        return 'bg-[#F1F5F9] text-[#475569] dark:bg-slate-800 dark:text-slate-300'
      default:
        return 'bg-[#F1F5F9] text-[#64748B]'
    }
  }

  if (isForbidden) {
    return <DashboardForbiddenCard title="Driver telemetry table unavailable" permission="operations:read" />
  }

  if (isError && !drivers) {
    return (
      <DashboardErrorCard
        title="Driver telemetry table unavailable"
        message="Unable to fetch active driver status records. Please retry."
        status={errorStatus}
        onRetry={onRetry}
      />
    )
  }

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col h-full overflow-hidden">
      {/* Table Card Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center">
          <h4 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white tracking-tight">
            Live Drivers & Vehicles
          </h4>
          <span className="text-sm text-slate-500 dark:text-slate-400 font-normal ml-2">
            ({onlineCount} online)
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/operations/live-dashboard')}
          className="text-xs sm:text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline transition-colors flex items-center gap-1"
        >
          View All →
        </button>
      </div>

      {isError && drivers && (
        <p role="alert" className="mx-5 mb-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          Could not refresh drivers{errorStatus !== undefined ? ` (${errorStatus})` : ''}. Showing the last loaded list.
        </p>
      )}
      {isLoading ? (
        <div className="p-5">
          <TableSkeleton rows={5} />
        </div>
      ) : !drivers || drivers.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-5 text-slate-400">
          <AlertCircle className="h-6 w-6 mb-2 opacity-50" />
          <p className="text-xs font-medium">No active drivers connected to the dispatch fleet</p>
        </div>
      ) : (
        <div className="w-full flex-1 overflow-x-auto">
          <table className="w-full min-w-[580px] table-fixed border-collapse text-left text-xs align-middle">
            {/* Table Header Strip (Subtle tinted strip spanning edge-to-edge) */}
            <thead>
              <tr className="bg-[#F8FAFC] dark:bg-slate-800/60 text-[#1E293B] dark:text-slate-200 text-xs font-bold border-b border-slate-100 dark:border-slate-800">
                <th className="w-[22%] py-2.5 pl-5 pr-1.5 text-left whitespace-nowrap">Driver & Vehicle</th>
                <th className="w-[16%] py-2.5 px-1.5 text-left whitespace-nowrap">Location</th>
                <th className="w-[11%] py-2.5 px-1 text-center whitespace-nowrap">Status</th>
                <th className="w-[8%] py-2.5 px-1 text-center whitespace-nowrap">Mode</th>
                <th className="w-[9%] py-2.5 px-1.5 text-left whitespace-nowrap">Speed</th>
                <th className="w-[8%] py-2.5 px-1.5 text-left whitespace-nowrap">Heading</th>
                <th className="w-[12%] py-2.5 px-1.5 text-left whitespace-nowrap">Trip</th>
                <th className="w-[14%] py-2.5 pl-1.5 pr-5 text-left whitespace-nowrap">Last Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {drivers.slice(0, 5).map((drv) => {
                const hasCoords = !!drv.location && isValidCoordinate(drv.location.lat, drv.location.lng)
                const lastUpdate = lastUpdateLabel(drv)

                return (
                  <tr
                    key={drv.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Driver & Vehicle */}
                    <td className="py-2.5 pl-5 pr-1.5 overflow-hidden">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative w-8 h-8 flex-shrink-0">
                          {drv.avatarUrl ? (
                            <img
                              src={drv.avatarUrl}
                              alt={drv.fullName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs shadow-2xs">
                              {drv.fullName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span
                            aria-hidden="true"
                            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${drv.status === 'ONLINE'
                                ? 'bg-[#16A34A]'
                                : drv.status === 'ON_TRIP'
                                  ? 'bg-[#2563EB]'
                                  : drv.status === 'BUSY' || drv.status === 'BREAK'
                                    ? 'bg-[#F59E0B]'
                                    : 'bg-[#94A3B8]'
                              }`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className="font-bold text-xs text-[#0F172A] dark:text-white leading-tight truncate"
                            title={drv.fullName}
                          >
                            {drv.fullName}
                          </div>
                          <div className="text-[11px] text-[#64748B] dark:text-slate-400 font-normal leading-tight mt-0.5 truncate">
                            {drv.vehicle?.licensePlate || drv.driverNumber}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-2.5 px-1.5 overflow-hidden">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#1E293B] dark:text-slate-200 truncate leading-tight">
                          {drv.location?.address || (hasCoords ? 'Address unavailable' : 'No Signal')}
                        </div>
                        {hasCoords ? (
                          <div className="text-[11px] text-[#94A3B8] font-normal mt-0.5 truncate leading-tight">
                            {drv.location!.lat.toFixed(4)}, {drv.location!.lng.toFixed(4)}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 truncate leading-tight">
                            No GPS Signal
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-1 text-center whitespace-nowrap overflow-hidden">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${getStatusBadge(
                          drv.status,
                        )}`}
                      >
                        {drv.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Mode — null when the driver has no assigned vehicle */}
                    <td className="py-2.5 px-1 text-center whitespace-nowrap overflow-hidden">
                      {drv.mode ? (
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${getModeBadge(
                            drv.mode,
                          )}`}
                        >
                          {drv.mode}
                        </span>
                      ) : (
                        <span className="text-[#94A3B8] text-xs font-normal">—</span>
                      )}
                    </td>

                    {/* Speed */}
                    <td className="py-2.5 px-1.5 text-left whitespace-nowrap overflow-hidden text-xs">
                      {drv.status === 'OFFLINE' || drv.speedKmh === null ? (
                        <span className="text-[#94A3B8] text-xs font-normal">—</span>
                      ) : (
                        <span className="font-normal text-[#475569] dark:text-slate-300 text-xs">
                          {drv.speedKmh} km/h
                        </span>
                      )}
                    </td>

                    {/* Heading */}
                    <td className="py-2.5 px-1.5 text-left whitespace-nowrap overflow-hidden text-xs font-normal text-[#475569] dark:text-slate-300">
                      {drv.status === 'OFFLINE' ? (
                        <span className="text-[#94A3B8] text-xs font-normal">—</span>
                      ) : (
                        drv.heading || '—'
                      )}
                    </td>

                    {/* Active Trip */}
                    <td className="py-2.5 px-1.5 text-left whitespace-nowrap overflow-hidden text-xs">
                      {drv.activeTrip ? (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/operations/ride-monitor?query=${drv.activeTrip?.rideCode}`)
                          }
                          className="font-bold text-xs text-[#2563EB] hover:underline cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
                          title="Monitor this ride"
                        >
                          {drv.activeTrip.rideCode.startsWith('#')
                            ? drv.activeTrip.rideCode
                            : `#${drv.activeTrip.rideCode}`}
                        </button>
                      ) : (
                        <span className="text-[#94A3B8] text-xs font-normal">—</span>
                      )}
                    </td>

                    {/* Last Update */}
                    <td className="py-2.5 pl-1.5 pr-5 text-left whitespace-nowrap overflow-hidden text-xs font-normal text-[#64748B] dark:text-slate-400">
                      {lastUpdate.text}
                      {lastUpdate.note && (
                        <span className="ml-1 inline-flex px-1 rounded border border-dashed border-amber-500 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                          {lastUpdate.note}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
export default LiveDriversTable
