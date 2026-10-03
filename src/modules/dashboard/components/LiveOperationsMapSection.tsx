import React, { useMemo } from 'react'
import { MapPin, Navigation, Radio, RefreshCw } from 'lucide-react'
import { LiveMap, type LiveMapMarker } from '@/shared/components/maps/LiveMap'
import { isValidCoordinate } from '@/shared/utils/polyline'
import type { LiveDriver, DashboardErrorStatus } from '../types'
import { DashboardErrorCard, DashboardForbiddenCard } from './DashboardSkeletons'

interface LiveOperationsMapSectionProps {
  /** undefined until the first successful response */
  drivers?: LiveDriver[]
  onlineCount?: number
  onTripCount?: number
  busyCount?: number
  breakCount?: number
  offlineCount?: number
  /** Backend GPS staleness threshold (seconds) behind every driver's gpsFreshness */
  gpsStaleAfterSec?: number
  /** When the shown data was fetched (ms epoch) */
  dataUpdatedAt?: number
  isLoading?: boolean
  isError?: boolean
  isForbidden?: boolean
  errorStatus?: DashboardErrorStatus
  onRetry?: () => void
}

/** One colour per backend driver status, shared by markers, legend and table. */
export const DRIVER_STATUS_STYLE: Record<LiveDriver['status'], { color: string; label: string }> = {
  ONLINE: { color: '#16A34A', label: 'Online' },
  ON_TRIP: { color: '#2563EB', label: 'On trip' },
  BUSY: { color: '#F59E0B', label: 'Busy' },
  BREAK: { color: '#F59E0B', label: 'On break' },
  OFFLINE: { color: '#64748B', label: 'Offline' },
}

const GPS_LABEL: Record<LiveDriver['gpsFreshness'], string> = {
  LIVE: 'GPS live',
  STALE: 'GPS stale',
  UNKNOWN: 'No GPS fix',
  OFFLINE: 'Off duty',
}

/**
 * The marker for a driver, from backend fields only (status, gpsFreshness, location).
 * null without a valid coordinate: such a driver is counted, never placed.
 */
export function driverMarker(d: LiveDriver): LiveMapMarker | null {
  if (!d.location || !isValidCoordinate(d.location.lat, d.location.lng)) return null
  const status = DRIVER_STATUS_STYLE[d.status]
  const gps = GPS_LABEL[d.gpsFreshness]
  const fix = d.recordedAt ? `last fix ${d.lastUpdateText}` : null
  return {
    id: d.id,
    lat: d.location.lat,
    lng: d.location.lng,
    color: status.color,
    // Freshness is the backend's verdict against gpsStaleAfterSec; no second threshold here.
    stale: d.gpsFreshness === 'STALE',
    label: [d.fullName, status.label, gps, fix].filter(Boolean).join(', '),
    details: [
      d.fullName,
      `${status.label} · ${gps}`,
      ...(d.vehicle?.licensePlate ? [d.vehicle.licensePlate] : []),
      ...(d.activeTrip ? [`Trip #${d.activeTrip.rideCode.replace(/^#/, '')}`] : []),
      ...(fix ? [fix.charAt(0).toUpperCase() + fix.slice(1)] : []),
    ],
  }
}

const LegendDot: React.FC<{ color: string; stale?: boolean }> = ({ color, stale }) => (
  <span
    aria-hidden="true"
    className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${stale ? 'border-2 border-dashed bg-white' : ''}`}
    style={stale ? { borderColor: color } : { backgroundColor: color }}
  />
)

export const LiveOperationsMapSection: React.FC<LiveOperationsMapSectionProps> = ({
  drivers,
  onlineCount = 0,
  onTripCount = 0,
  busyCount = 0,
  breakCount = 0,
  offlineCount = 0,
  gpsStaleAfterSec,
  dataUpdatedAt,
  isLoading = false,
  isError = false,
  isForbidden = false,
  errorStatus,
  onRetry,
}) => {
  const markers = useMemo(
    () => (drivers ?? []).map(driverMarker).filter((m): m is LiveMapMarker => m !== null),
    [drivers],
  )
  const withoutFix = useMemo(
    () => (drivers ?? []).filter((d) => d.gpsFreshness === 'UNKNOWN').length,
    [drivers],
  )
  const onDuty = onlineCount + onTripCount + busyCount + breakCount

  if (isForbidden) {
    return <DashboardForbiddenCard title="Live operations map unavailable" permission="operations:read" />
  }

  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Map Card Header */}
      <div className="flex items-center justify-between gap-1.5 pb-3 mb-2.5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#16A34A] flex-shrink-0" />
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
            Live Operations Map
          </h4>
        </div>

        {/* View modes: only the live map exists; the others are shown as unavailable */}
        <div className="flex items-center gap-0.5 bg-slate-100/90 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold flex-shrink-0">
          {[
            { id: 'live', label: 'Live Map', available: true },
            { id: 'heatmap', label: 'Heatmap', available: false },
            { id: 'zones', label: 'Zones', available: false },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={t.available}
              disabled={!t.available}
              title={t.available ? undefined : `${t.label} is not available yet`}
              className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 ${t.available
                  ? 'bg-[#1F2B6D] text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 cursor-not-allowed'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Content Body */}
      {isError && !drivers ? (
        <div className="h-[290px] flex items-center justify-center">
          <DashboardErrorCard
            title="Telemetry map unavailable"
            message="Failed to connect to the live vehicle tracking feed. Please retry."
            status={errorStatus}
            onRetry={onRetry}
            className="w-full h-full"
          />
        </div>
      ) : isLoading ? (
        <div
          role="status"
          aria-label="Loading live vehicle map"
          className="h-[290px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 animate-pulse flex flex-col items-center justify-center gap-2"
        >
          <Navigation className="h-6 w-6 text-slate-300 animate-spin" aria-hidden="true" />
          <span className="text-xs text-slate-500 font-medium">Loading live vehicle map...</span>
        </div>
      ) : markers.length === 0 ? (
        /* Empty State — no fallback city: without a real coordinate there is no map */
        <div className="h-[290px] rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/30 flex flex-col items-center justify-center text-center p-6">
          <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 mb-3">
            <MapPin className="h-6 w-6" aria-hidden="true" />
          </div>
          <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No live driver locations available
          </h5>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mt-1">
            Active drivers currently on-duty have not yet broadcast GPS telemetry pings.
            Coordinates will automatically appear when drivers transmit pings.
          </p>
          {onlineCount > 0 && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-primary font-semibold">
              <Radio className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
              <span>{onlineCount} driver(s) online awaiting location dispatch</span>
            </div>
          )}
        </div>
      ) : (
        /* Live Leaflet Map: created once, markers updated in place */
        <div className="relative rounded-xl overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-inner">
          <LiveMap
            markers={markers}
            height="290px"
            zoom={13}
            hideNotice={true}
            showRecenter={true}
            ariaLabel={`Live operations map, ${markers.length} driver${markers.length === 1 ? '' : 's'} shown`}
            className="w-full"
          />
        </div>
      )}

      {/* A failed refresh keeps the last positions on screen, clearly marked as not current */}
      {isError && drivers && (
        <div
          role="alert"
          className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <span>
            Could not refresh driver positions
            {errorStatus !== undefined ? ` (${errorStatus})` : ''}.
            {dataUpdatedAt ? ` Showing positions from ${new Date(dataUpdatedAt).toLocaleTimeString()}.` : ''}
          </span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 font-semibold underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <RefreshCw className="h-3 w-3" aria-hidden="true" />
              Retry
            </button>
          )}
        </div>
      )}

      {/* Legend: exactly the marker states the map draws */}
      <div className="pt-2 text-[10px] font-medium text-slate-600 dark:text-slate-400 mt-auto border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
        <ul aria-label="Map legend" className="flex items-center justify-between gap-1 flex-wrap">
          <li className="flex items-center gap-1 whitespace-nowrap">
            <LegendDot color={DRIVER_STATUS_STYLE.ONLINE.color} />
            <span>Online ({onlineCount})</span>
          </li>
          <li className="flex items-center gap-1 whitespace-nowrap">
            <LegendDot color={DRIVER_STATUS_STYLE.ON_TRIP.color} />
            <span>On Trip ({onTripCount})</span>
          </li>
          <li className="flex items-center gap-1 whitespace-nowrap">
            <LegendDot color={DRIVER_STATUS_STYLE.BUSY.color} />
            <span>Busy / Break ({busyCount + breakCount})</span>
          </li>
          <li className="flex items-center gap-1 whitespace-nowrap">
            <LegendDot color={DRIVER_STATUS_STYLE.OFFLINE.color} />
            <span>Offline ({offlineCount})</span>
          </li>
          <li className="flex items-center gap-1 whitespace-nowrap">
            <LegendDot color="#475569" stale />
            <span>
              Stale GPS{gpsStaleAfterSec !== undefined ? ` (> ${gpsStaleAfterSec}s)` : ''}
            </span>
          </li>
        </ul>
        {drivers && (drivers.length < onDuty || withoutFix > 0) && (
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {drivers.length < onDuty && `Showing the ${drivers.length} most recently updated of ${onDuty} on-duty drivers. `}
            {withoutFix > 0 && `${withoutFix} on-duty driver${withoutFix === 1 ? ' has' : 's have'} no GPS fix and ${withoutFix === 1 ? 'is' : 'are'} not on the map.`}
          </p>
        )}
      </div>
    </div>
  )
}
export default LiveOperationsMapSection
