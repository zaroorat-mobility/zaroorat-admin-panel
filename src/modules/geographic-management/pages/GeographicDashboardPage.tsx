import React, { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { useCities, useServiceZones, useCity as useCityDetail } from '../hooks'
import { useCityZonesWithBoundaries } from '../hooks/useCityZonesWithBoundaries'
import {
  MapPin,
  Plane,
  Shield,
  Building2,
  Settings,
  BarChart3,
  RefreshCw,
  Plus,
  MoreVertical,
  Locate,
  ChevronDown,
  Info,
  Loader2,
} from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/shared/components/ui/Table'
import { MapContainer, TileLayer, Polygon, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Leaflet default icon fix
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// @ts-expect-error leaflet icon patch
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  iconShadow: markerShadow,
})

// Zone color mapping by type
const ZONE_COLORS: Record<string, { stroke: string; fill: string }> = {
  AIRPORT:    { stroke: '#ea580c', fill: '#fed7aa' },
  RESTRICTED: { stroke: '#dc2626', fill: '#fecaca' },
  SERVICE:    { stroke: '#16a34a', fill: '#bbf7d0' },
  SURGE:      { stroke: '#9333ea', fill: '#e9d5ff' },
}

// Icon SVGs per zone type
const ZONE_ICON_SVGS: Record<string, string> = {
  AIRPORT: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>`,
  RESTRICTED: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="18" y2="12"/></svg>`,
  SERVICE: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  SURGE: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>`,
}

const ZONE_BADGE_COLORS: Record<string, string> = {
  AIRPORT: '#f97316',
  RESTRICTED: '#dc2626',
  SERVICE: '#16a34a',
  SURGE: '#9333ea',
}

const ZONE_LABEL_SUBS: Record<string, string> = {
  AIRPORT: 'Airport',
  RESTRICTED: 'No service',
  SERVICE: 'Service zone',
  SURGE: 'Surge zone',
}

// Custom HTML icon for zone center labels
const createZoneLabelIcon = (
  iconSvg: string,
  title: string,
  sub: string,
  badgeBg: string,
) => {
  return L.divIcon({
    className: 'custom-zone-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; transform: translate(-50%, -50%);">
        <div style="background-color: ${badgeBg}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.25); color: white; margin-bottom: 2px;">
          ${iconSvg}
        </div>
        <div style="text-align: center; white-space: nowrap; pointer-events: none;">
          <div style="font-size: 11.5px; font-weight: 700; color: #0f172a; text-shadow: 0 1px 3px rgba(255,255,255,0.95), 0 0 6px #ffffff; line-height: 1.15;">
            ${title}
          </div>
          <div style="font-size: 10px; font-weight: 600; color: #475569; text-shadow: 0 1px 2px rgba(255,255,255,0.95); margin-top: 1px;">
            ${sub}
          </div>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

// City Center Label Icon
const createCityLabelIcon = (cityName: string) => {
  return L.divIcon({
    className: 'custom-city-label',
    html: `
      <div style="pointer-events: none; transform: translate(-50%, -50%); font-size: 15px; font-weight: 800; color: #0f172a; text-shadow: 0 1px 4px rgba(255,255,255,0.95), 0 0 8px #ffffff; letter-spacing: -0.01em;">
        ${cityName}
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

// (vertex handles not used on dashboard map)

// Default world center fallback
const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629] // India center

// Custom Map Controller to fly when city changes
function MapViewController({
  center,
  zoom,
}: {
  center: [number, number]
  zoom: number
}) {
  const map = useMap()
  React.useEffect(() => {
    map.invalidateSize()
    const t1 = setTimeout(() => map.invalidateSize(), 150)
    const t2 = setTimeout(() => map.invalidateSize(), 500)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [map])

  React.useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 })
  }, [center, zoom, map])
  return null
}

// Compute polygon centroid from GeoJSON-style coords [lng, lat][]
function computeCentroid(coords: number[][]): [number, number] {
  let latSum = 0
  let lngSum = 0
  for (const [lng, lat] of coords) {
    latSum += lat
    lngSum += lng
  }
  return [latSum / coords.length, lngSum / coords.length]
}

export const GeographicDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: rawCities = [], refetch: refetchCities, isFetching } = useCities()
  const { data: allZones = [], refetch: refetchZones } = useServiceZones()

  // Last updated timestamp
  const [lastUpdated, setLastUpdated] = useState(() => {
    const now = new Date()
    return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ', ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  })

  // Map Filter State — default to first city if available
  const [selectedCityCode, setSelectedCityCode] = useState<string>('')
  const [selectedZoneType, setSelectedZoneType] = useState('ALL')
  const [mapBaseType, setMapBaseType] = useState<'street' | 'satellite' | 'terrain'>('street')

  // Map Legend Visibility Toggles
  const [showCityBoundary, setShowCityBoundary] = useState(true)
  const [showServiceZones, setShowServiceZones] = useState(true)
  const [showAirportZones, setShowAirportZones] = useState(true)
  const [showRestrictedZones, setShowRestrictedZones] = useState(true)

  // Map instance reference
  const mapRef = useRef<L.Map | null>(null)

  // Auto-select first city when data loads
  React.useEffect(() => {
    if (rawCities.length > 0 && !selectedCityCode) {
      setSelectedCityCode(rawCities[0].code)
    }
  }, [rawCities, selectedCityCode])

  // Selected city object
  const selectedCity = useMemo(
    () => rawCities.find((c) => c.code === selectedCityCode) ?? null,
    [rawCities, selectedCityCode],
  )

  // Load zones WITH boundaries for the selected city
  const { zones: cityZonesWithBoundaries, isLoading: isLoadingZones } = useCityZonesWithBoundaries(
    selectedCityCode || undefined,
  )

  // Compute map center from selected city boundary or city center
  const currentCenter = useMemo((): [number, number] => {
    // Try to get a center from zones boundaries
    if (cityZonesWithBoundaries.length > 0) {
      const firstZone = cityZonesWithBoundaries[0]
      if (firstZone.boundary?.[0]?.length) {
        return computeCentroid(firstZone.boundary[0])
      }
    }
    return DEFAULT_CENTER
  }, [cityZonesWithBoundaries])

  const handleRefresh = async () => {
    const now = new Date()
    setLastUpdated(
      now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ', ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    )
    await Promise.all([refetchCities(), refetchZones()])
  }

  // Calculated Metrics from real data
  const metrics = useMemo(() => {
    const totalCities = rawCities.length
    const activeCities = rawCities.filter((c) => c.isActive).length
    const inactiveCities = totalCities - activeCities

    const totalZones = allZones.length
    const activeZones = allZones.filter((z) => z.isActive).length
    const inactiveZones = totalZones - activeZones

    const airportCount = allZones.filter((z) => z.zoneType === 'AIRPORT').length
    const restrictedCount = allZones.filter((z) => z.zoneType === 'RESTRICTED').length

    return {
      totalCities,
      activeCities,
      inactiveCities,
      totalZones,
      activeZones,
      inactiveZones,
      airportCount,
      restrictedCount,
    }
  }, [rawCities, allZones])

  // Per-city zone counts for the cities overview table
  const cityZoneStats = useMemo(() => {
    const mapData: Record<string, { total: number; airport: number; restricted: number }> = {}
    for (const z of allZones) {
      if (!mapData[z.cityCode]) {
        mapData[z.cityCode] = { total: 0, airport: 0, restricted: 0 }
      }
      mapData[z.cityCode].total++
      if (z.zoneType === 'AIRPORT') mapData[z.cityCode].airport++
      if (z.zoneType === 'RESTRICTED') mapData[z.cityCode].restricted++
    }
    return mapData
  }, [allZones])

  // Zone summary for selected city panel
  const selectedCityZoneSummary = useMemo(() => {
    const zonesForCity = allZones.filter((z) => z.cityCode === selectedCityCode)
    const serviceZones = zonesForCity.filter((z) => z.zoneType === 'SERVICE')
    const airportZones = zonesForCity.filter((z) => z.zoneType === 'AIRPORT')
    const restrictedZones = zonesForCity.filter((z) => z.zoneType === 'RESTRICTED')

    return {
      service: {
        total: serviceZones.length,
        active: serviceZones.filter((z) => z.isActive).length,
        inactive: serviceZones.filter((z) => !z.isActive).length,
      },
      airport: {
        total: airportZones.length,
        active: airportZones.filter((z) => z.isActive).length,
        inactive: airportZones.filter((z) => !z.isActive).length,
      },
      restricted: {
        total: restrictedZones.length,
        active: restrictedZones.filter((z) => z.isActive).length,
        inactive: restrictedZones.filter((z) => !z.isActive).length,
      },
    }
  }, [allZones, selectedCityCode])

  // All zones for selected city (for the zones list panel)
  const selectedCityZones = useMemo(
    () => allZones.filter((z) => z.cityCode === selectedCityCode),
    [allZones, selectedCityCode],
  )

  return (
    <PageWrapper className="space-y-4 pt-1 pb-6 px-3 sm:px-5">
      {/* ─── 1. Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2B6D] dark:text-white">
            Geographic Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Overview of cities, zones, boundaries, and coverage across all operating areas.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Last updated {lastUpdated}
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh data"
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition shadow-2xs"
          >
            <RefreshCw
              className={`w-4 h-4 ${isFetching ? 'animate-spin text-indigo-600' : ''}`}
            />
          </button>
          <button
            type="button"
            onClick={() => navigate('/geographic-management/cities/new')}
            className="bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white px-4 py-2 rounded-[10px] text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add City</span>
            <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-80" />
          </button>
        </div>
      </div>

      {/* ─── 2. Top 5 Metric Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Cities */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {metrics.totalCities}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Total Cities
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {metrics.activeCities} active • {metrics.inactiveCities} inactive
          </p>
        </div>

        {/* Card 2: Service Zones */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {metrics.totalZones}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Service Zones
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {metrics.activeZones} active • {metrics.inactiveZones} inactive
          </p>
        </div>

        {/* Card 3: Airport Zones */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Plane className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {metrics.airportCount}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Airport Zones
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            Across all cities
          </p>
        </div>

        {/* Card 4: Restricted Zones */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {metrics.restrictedCount}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Restricted Zones
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            Across all cities
          </p>
        </div>

        {/* Card 5: Inactive Zones */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-rose-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {metrics.inactiveZones}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Inactive Zones
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            Needs attention
          </p>
        </div>
      </div>

      {/* ─── 3. Main 2-Column Dashboard Grid ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ─── LEFT COLUMN (Col 8): Coverage Map + Cities Overview Table ─────── */}
        <div className="lg:col-span-8 space-y-5">
          {/* Card A: Coverage Map */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            {/* Map Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 z-10">
              <div>
                <h2 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                  Coverage Map
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  View and manage city boundaries, service zones, airport zones, and restricted zones.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="relative">
                  <select
                    value={selectedCityCode}
                    onChange={(e) => setSelectedCityCode(e.target.value)}
                    className="text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-7 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none shadow-2xs cursor-pointer"
                  >
                    {rawCities.length === 0 && (
                      <option value="">Loading cities…</option>
                    )}
                    {rawCities.map((city) => (
                      <option key={city.id} value={city.code}>
                        {city.name} ({city.code})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={selectedZoneType}
                    onChange={(e) => setSelectedZoneType(e.target.value)}
                    className="text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-7 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none shadow-2xs cursor-pointer"
                  >
                    <option value="ALL">All Zone Types</option>
                    <option value="SERVICE">Service Zones</option>
                    <option value="AIRPORT">Airport Zones</option>
                    <option value="RESTRICTED">Restricted Zones</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Map Canvas with Interactive Leaflet */}
            <div className="relative h-[450px] w-full bg-slate-100 dark:bg-slate-950 overflow-hidden">

              {/* Loading spinner overlay */}
              {isLoadingZones && (
                <div className="absolute inset-0 z-[1100] flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-[#1F2B6D] font-semibold text-sm">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading zones…</span>
                  </div>
                </div>
              )}

              {/* Top-Left Floating Legend */}
              <div className="absolute top-3.5 left-3.5 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-3 rounded-lg shadow-sm border border-slate-200/90 dark:border-slate-800 space-y-2 text-xs font-semibold text-[#1F2B6D] dark:text-slate-200">
                <div
                  onClick={() => setShowCityBoundary(!showCityBoundary)}
                  className="flex items-center gap-2 cursor-pointer select-none py-0.5 hover:opacity-80 transition-opacity"
                >
                  <span
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors ${showCityBoundary ? 'bg-[#1F2B6D] text-white' : 'border border-slate-300 bg-white'
                      }`}
                  >
                    {showCityBoundary && (
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb] inline-block flex-shrink-0" />
                  <span className="text-[#1F2B6D] dark:text-slate-200 text-xs font-medium">City Boundary</span>
                </div>

                <div
                  onClick={() => setShowServiceZones(!showServiceZones)}
                  className="flex items-center gap-2 cursor-pointer select-none py-0.5 hover:opacity-80 transition-opacity"
                >
                  <span
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors ${showServiceZones ? 'bg-[#1F2B6D] text-white' : 'border border-slate-300 bg-white'
                      }`}
                  >
                    {showServiceZones && (
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] inline-block flex-shrink-0" />
                  <span className="text-[#1F2B6D] dark:text-slate-200 text-xs font-medium">Service Zones</span>
                </div>

                <div
                  onClick={() => setShowAirportZones(!showAirportZones)}
                  className="flex items-center gap-2 cursor-pointer select-none py-0.5 hover:opacity-80 transition-opacity"
                >
                  <span
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors ${showAirportZones ? 'bg-[#1F2B6D] text-white' : 'border border-slate-300 bg-white'
                      }`}
                  >
                    {showAirportZones && (
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c] inline-block flex-shrink-0" />
                  <span className="text-[#1F2B6D] dark:text-slate-200 text-xs font-medium">Airport Zones</span>
                </div>

                <div
                  onClick={() => setShowRestrictedZones(!showRestrictedZones)}
                  className="flex items-center gap-2 cursor-pointer select-none py-0.5 hover:opacity-80 transition-opacity"
                >
                  <span
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors ${showRestrictedZones ? 'bg-[#1F2B6D] text-white' : 'border border-slate-300 bg-white'
                      }`}
                  >
                    {showRestrictedZones && (
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] inline-block flex-shrink-0" />
                  <span className="text-[#1F2B6D] dark:text-slate-200 text-xs font-medium">Restricted Zones</span>
                </div>
              </div>

              {/* Top-Right Floating Map Type Selector */}
              <div className="absolute top-3.5 right-3.5 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-3.5 py-3 rounded-lg shadow-sm border border-slate-200/90 dark:border-slate-800 space-y-2 text-xs font-semibold text-[#1F2B6D] dark:text-slate-200">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="mapBaseLayer"
                    checked={mapBaseType === 'street'}
                    onChange={() => setMapBaseType('street')}
                    className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span>Street Map</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="mapBaseLayer"
                    checked={mapBaseType === 'satellite'}
                    onChange={() => setMapBaseType('satellite')}
                    className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span>Satellite</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="mapBaseLayer"
                    checked={mapBaseType === 'terrain'}
                    onChange={() => setMapBaseType('terrain')}
                    className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span>Terrain</span>
                </label>
              </div>

              {/* Bottom-Left Zoom & Recenter Controls + Distance Scale */}
              <div className="absolute bottom-3.5 left-3.5 z-[1000] flex flex-col gap-2">
                <div className="flex flex-col bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden w-8">
                  <button
                    type="button"
                    onClick={() => mapRef.current?.zoomIn()}
                    className="w-8 h-8 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    title="Zoom In"
                  >
                    +
                  </button>
                  <div className="h-[1px] bg-slate-200 dark:bg-slate-800 w-full" />
                  <button
                    type="button"
                    onClick={() => mapRef.current?.zoomOut()}
                    className="w-8 h-8 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    title="Zoom Out"
                  >
                    −
                  </button>
                  <div className="h-[1px] bg-slate-200 dark:bg-slate-800 w-full" />
                  <button
                    type="button"
                    onClick={() => mapRef.current?.flyTo(currentCenter, 12)}
                    className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    title="Recenter Map"
                  >
                    <Locate className="w-4 h-4" />
                  </button>
                </div>

                {/* Distance Scale Bar */}
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-1.5 py-1 rounded shadow-sm border border-slate-300 dark:border-slate-700 text-[10px] font-sans font-bold text-[#1F2B6D] dark:text-slate-200 pointer-events-none w-[76px]">
                  <div className="border-b-2 border-l-2 border-r-2 border-black dark:border-white px-1 pb-0.5 text-center leading-none">
                    5 km
                  </div>
                  <div className="border-t-2 border-l-2 border-r-2 border-black dark:border-white px-1 pt-0.5 text-center leading-none mt-0.5">
                    3 mi
                  </div>
                </div>
              </div>

              {/* Bottom-Right Attribution & Info Button */}
              <div className="absolute bottom-3.5 right-3.5 z-[1000] flex items-center gap-2">
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-slate-500 border border-slate-200/80 dark:border-slate-800 shadow-2xs pointer-events-none">
                  Leaflet | © OpenStreetMap contributors
                </div>
                <button
                  type="button"
                  className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  title="Layer info"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* React Leaflet Map Container */}
              <MapContainer
                ref={mapRef}
                center={currentCenter}
                zoom={12}
                zoomControl={false}
                attributionControl={false}
                style={{ height: '450px', width: '100%', minHeight: '450px' }}
              >
                <MapViewController center={currentCenter} zoom={12} />

                {mapBaseType === 'street' && (
                  <TileLayer
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
                    maxZoom={19}
                  />
                )}
                {mapBaseType === 'satellite' && (
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution="&copy; Esri &mdash; Earthstar Geographics"
                  />
                )}
                {mapBaseType === 'terrain' && (
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
                    attribution="&copy; Esri &mdash; Topo Map"
                  />
                )}

                {/* Render real zone polygons from API */}
                {cityZonesWithBoundaries.map((zone) => {
                  const zoneType = zone.zoneType
                  const colors = ZONE_COLORS[zoneType] ?? ZONE_COLORS['SERVICE']

                  // Filter by visibility toggles
                  const isVisible =
                    (zoneType === 'SERVICE' && showServiceZones) ||
                    (zoneType === 'AIRPORT' && showAirportZones) ||
                    (zoneType === 'RESTRICTED' && showRestrictedZones)

                  // Filter by zone type dropdown
                  const matchesTypeFilter =
                    selectedZoneType === 'ALL' || selectedZoneType === zoneType

                  if (!isVisible || !matchesTypeFilter) return null

                  // Convert GeoJSON [lng, lat][] → Leaflet [lat, lng][]
                  const outerRing = zone.boundary?.[0]
                  if (!outerRing || outerRing.length < 3) return null

                  const positions: [number, number][] = outerRing.map(([lng, lat]) => [lat, lng])
                  const centroid = computeCentroid(outerRing)

                  const icon = createZoneLabelIcon(
                    ZONE_ICON_SVGS[zoneType] ?? ZONE_ICON_SVGS['SERVICE'],
                    zone.name,
                    ZONE_LABEL_SUBS[zoneType] ?? '',
                    ZONE_BADGE_COLORS[zoneType] ?? '#16a34a',
                  )

                  return (
                    <React.Fragment key={zone.id}>
                      <Polygon
                        positions={positions}
                        pathOptions={{
                          color: colors.stroke,
                          weight: 2,
                          fillColor: colors.fill,
                          fillOpacity: 0.35,
                        }}
                      />
                      <Marker position={centroid} icon={icon} />
                    </React.Fragment>
                  )
                })}

                {/* City boundary outline if city has boundary */}
                {showCityBoundary && selectedCity?.hasBoundary && (
                  <CityBoundaryLayer cityId={selectedCity.id} />
                )}

                {/* City center label */}
                {selectedCity && (
                  <Marker
                    position={currentCenter}
                    icon={createCityLabelIcon(selectedCity.name)}
                  />
                )}
              </MapContainer>
            </div>
          </div>

          {/* Card B: Cities Overview Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                  Cities Overview
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Overview of all operating cities and their coverage</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/geographic-management/cities')}
                className="text-xs font-semibold text-[#1F2B6D] dark:text-[#8B93D9] bg-[#1F2B6D]/[0.06] hover:bg-[#1F2B6D]/[0.12] dark:bg-slate-800 dark:hover:bg-slate-700/80 px-2.5 py-1 rounded-md border border-[#1F2B6D]/20 dark:border-slate-700 transition flex items-center gap-1 shadow-2xs"
              >
                View All Cities →
              </button>
            </div>

            {rawCities.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading cities…
              </div>
            ) : (
              <Table containerClassName="overflow-x-hidden" className="w-full text-xs">
                <TableHeader className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                  <TableRow>
                    <TableHead className="py-2.5 px-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 normal-case tracking-normal">City</TableHead>
                    <TableHead className="py-2.5 px-2 text-xs font-semibold text-slate-600 dark:text-slate-400 normal-case tracking-normal">Code</TableHead>
                    <TableHead className="py-2.5 px-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 normal-case tracking-normal">State / UT</TableHead>
                    <TableHead className="py-2.5 px-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 normal-case tracking-normal">Zones</TableHead>
                    <TableHead className="py-2.5 px-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 normal-case tracking-normal">Airport</TableHead>
                    <TableHead className="py-2.5 px-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 normal-case tracking-normal">Restricted</TableHead>
                    <TableHead className="py-2.5 px-2.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 normal-case tracking-normal">Status</TableHead>
                    <TableHead className="py-2.5 px-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 normal-case tracking-normal">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {rawCities.map((c) => {
                    const stats = cityZoneStats[c.code] ?? { total: 0, airport: 0, restricted: 0 }
                    return (
                      <TableRow
                        key={c.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <TableCell className="py-2.5 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md bg-[#1F2B6D] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              {c.code.slice(0, 2)}
                            </div>
                            <span className="font-bold text-slate-800 dark:text-white">
                              {c.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 px-2 font-medium text-slate-500 dark:text-slate-400">
                          {c.code}
                        </TableCell>
                        <TableCell className="py-2.5 px-2.5 text-slate-600 dark:text-slate-400">
                          {c.state ?? '—'}
                        </TableCell>
                        <TableCell className="py-2.5 px-2 text-center text-slate-700 dark:text-slate-300 font-medium">{stats.total}</TableCell>
                        <TableCell className="py-2.5 px-2 text-center text-slate-700 dark:text-slate-300 font-medium">{stats.airport}</TableCell>
                        <TableCell className="py-2.5 px-2 text-center text-slate-700 dark:text-slate-300 font-medium">
                          {stats.restricted}
                        </TableCell>
                        <TableCell className="py-2.5 px-2.5 text-center">
                          {c.isActive ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-500 dark:text-rose-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Inactive
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => navigate('/geographic-management/cities')}
                              className="px-3 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-md font-semibold text-slate-700 dark:text-slate-300 hover:border-[#1F2B6D] hover:text-[#1F2B6D] dark:hover:border-[#8B93D9] dark:hover:text-[#8B93D9] hover:bg-[#1F2B6D]/5 transition shadow-2xs"
                            >
                              Manage
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate('/geographic-management/cities')}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* ─── RIGHT COLUMN (Col 4): Quick Actions, Zone Summary, Recent Changes ─── */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Quick Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-sm">
            <h3 className="text-sm font-bold text-[#1F2B6D] dark:text-white mb-3 leading-none">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Add City */}
              <button
                type="button"
                onClick={() => navigate('/geographic-management/cities/new')}
                className="p-3 rounded-xl border border-slate-200 hover:border-[#1F2B6D]/40 hover:bg-slate-50 transition-all flex items-center gap-2.5 bg-white cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-[18px] h-[18px] text-[#1F2B6D]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-bold text-[#1F2B6D] dark:text-slate-100 leading-tight">
                    Add City
                  </p>
                  <p className="text-[11px] text-slate-400 leading-tight truncate">
                    Create new operating city
                  </p>
                </div>
              </button>

              {/* Add Service Zone */}
              <button
                type="button"
                onClick={() => navigate('/geographic-management/service-zones/new')}
                className="p-3 rounded-xl border border-slate-200 hover:border-[#1F2B6D]/40 hover:bg-slate-50 transition-all flex items-center gap-2.5 bg-white cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-[18px] h-[18px] text-[#1F2B6D]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-bold text-[#1F2B6D] dark:text-slate-100 leading-tight">
                    Add Service Zone
                  </p>
                  <p className="text-[11px] text-slate-400 leading-tight truncate">
                    Draw service area
                  </p>
                </div>
              </button>

              {/* Add Restricted Zone */}
              <button
                type="button"
                onClick={() => navigate('/geographic-management/service-zones/new?type=RESTRICTED')}
                className="p-3 rounded-xl border border-slate-200 hover:border-[#1F2B6D]/40 hover:bg-slate-50 transition-all flex items-center gap-2.5 bg-white cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-[18px] h-[18px] text-[#1F2B6D]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-bold text-[#1F2B6D] dark:text-slate-100 leading-tight">
                    Add Restricted Zone
                  </p>
                  <p className="text-[11px] text-slate-400 leading-tight truncate">
                    Block service area
                  </p>
                </div>
              </button>

              {/* Add Airport Zone */}
              <button
                type="button"
                onClick={() => navigate('/geographic-management/service-zones/new?type=AIRPORT')}
                className="p-3 rounded-xl border border-slate-200 hover:border-[#1F2B6D]/40 hover:bg-slate-50 transition-all flex items-center gap-2.5 bg-white cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Plane className="w-[18px] h-[18px] text-[#1F2B6D]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-bold text-[#1F2B6D] dark:text-slate-100 leading-tight">
                    Add Airport Zone
                  </p>
                  <p className="text-[11px] text-slate-400 leading-tight truncate">
                    Configure airport area
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Card 2: Zone Summary for Selected City */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-[#1F2B6D] dark:text-white leading-none">
                Zone Summary {selectedCity ? `(${selectedCity.name})` : ''}
              </h3>
              <button
                type="button"
                onClick={() => navigate('/geographic-management/service-zones')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 underline hover:no-underline"
              >
                View All →
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* Service Zones */}
              <div className="flex items-center justify-between py-3 text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-[#1F2B6D]" strokeWidth={2} />
                  </div>
                  <span className="text-[13px] font-semibold text-[#1F2B6D] dark:text-slate-200 w-32">Service Zones</span>
                  <span className="text-[15px] font-bold text-[#1F2B6D] dark:text-white">{selectedCityZoneSummary.service.total}</span>
                </div>
                <div className="text-[12px] text-slate-500 font-medium">
                  Active: {selectedCityZoneSummary.service.active} &nbsp; Inactive: {selectedCityZoneSummary.service.inactive}
                </div>
              </div>

              {/* Airport Zones */}
              <div className="flex items-center justify-between py-3 text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Plane className="w-4 h-4 text-[#1F2B6D]" strokeWidth={2} />
                  </div>
                  <span className="text-[13px] font-semibold text-[#1F2B6D] dark:text-slate-200 w-32">Airport Zones</span>
                  <span className="text-[15px] font-bold text-[#1F2B6D] dark:text-white">{selectedCityZoneSummary.airport.total}</span>
                </div>
                <div className="text-[12px] text-slate-500 font-medium">
                  Active: {selectedCityZoneSummary.airport.active} &nbsp; Inactive: {selectedCityZoneSummary.airport.inactive}
                </div>
              </div>

              {/* Restricted Zones */}
              <div className="flex items-center justify-between py-3 text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-[#1F2B6D]" strokeWidth={2} />
                  </div>
                  <span className="text-[13px] font-semibold text-[#1F2B6D] dark:text-slate-200 w-32">Restricted Zones</span>
                  <span className="text-[15px] font-bold text-[#1F2B6D] dark:text-white">{selectedCityZoneSummary.restricted.total}</span>
                </div>
                <div className="text-[12px] text-slate-500 font-medium">
                  Active: {selectedCityZoneSummary.restricted.active} &nbsp; Inactive: {selectedCityZoneSummary.restricted.inactive}
                </div>
              </div>

            </div>
          </div>

          {/* Card 3: Zones in City — real zone list for selected city */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-1">
              <h3 className="text-sm font-bold text-[#1F2B6D] dark:text-white leading-none">
                Zones in {selectedCity?.name ?? 'City'}
              </h3>
              <button
                type="button"
                onClick={() => navigate('/geographic-management/service-zones')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 underline hover:no-underline"
              >
                All Zones →
              </button>
            </div>

            {selectedCityZones.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-slate-400 text-xs">
                {selectedCity ? 'No zones found for this city' : 'Select a city to view zones'}
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {selectedCityZones.slice(0, 6).map((zone) => {
                  const typeColors: Record<string, { dot: string; badge: string; label: string }> = {
                    AIRPORT:    { dot: 'bg-orange-400', badge: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400', label: 'Airport' },
                    RESTRICTED: { dot: 'bg-rose-500',   badge: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',     label: 'Restricted' },
                    SERVICE:    { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400', label: 'Service' },
                  }
                  const tc = typeColors[zone.zoneType] ?? typeColors['SERVICE']
                  return (
                    <div
                      key={zone.id}
                      className="flex items-center justify-between py-2.5 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40 rounded px-1 transition-colors"
                      onClick={() => navigate(`/geographic-management/service-zones/${zone.id}`)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${tc.dot}`} />
                        <span className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-200 truncate">{zone.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tc.badge}`}>{tc.label}</span>
                        <span className={`text-[10px] font-medium ${zone.isActive ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {zone.isActive ? '● Active' : '○ Inactive'}
                        </span>
                      </div>
                    </div>
                  )
                })}
                {selectedCityZones.length > 6 && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => navigate('/geographic-management/service-zones')}
                      className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      +{selectedCityZones.length - 6} more zones →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}

// Lazy city boundary loader — fetches city detail boundary and renders it
function CityBoundaryLayer({ cityId }: { cityId: string }) {
  return <CityBoundaryLayerInner cityId={cityId} />
}

function CityBoundaryLayerInner({ cityId }: { cityId: string }) {
  const { data: cityDetail } = useCityDetail(cityId)

  if (!cityDetail?.boundary?.[0]?.length) return null

  const outerRing = cityDetail.boundary[0]
  const positions: [number, number][] = outerRing.map(([lng, lat]) => [lat, lng])

  return (
    <Polygon
      positions={positions}
      pathOptions={{
        color: '#2563eb',
        weight: 2,
        fillColor: '#3b82f6',
        fillOpacity: 0.08,
      }}
    />
  )
}

export default GeographicDashboardPage
