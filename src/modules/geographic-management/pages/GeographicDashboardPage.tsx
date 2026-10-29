import React, { useState, useMemo } from 'react'
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
  ChevronDown,
  Loader2,
  Hexagon,
} from 'lucide-react'
import {
  CardTable,
  CardThead,
  CardTh,
  CardTbody,
  CardTr,
  CardTd,
  CardTableButton,
} from '@/shared/components/ui/CardTable'
import { GoogleGeographicMap } from '@/shared/components/maps/google/GoogleGeographicMap'

// Default world center fallback
const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629] // India center

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

  const { data: selectedCityDetail } = useCityDetail(selectedCity?.id || '')

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

              {/* Bottom-Left Distance Scale */}
              <div className="absolute bottom-3.5 left-3.5 z-[1000] flex flex-col gap-2">

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

              {/* Production Google Maps Web SDK Map Component */}
              <GoogleGeographicMap
                center={{ lat: currentCenter[0], lng: currentCenter[1] }}
                zoom={12}
                height="450px"
                cityBoundary={showCityBoundary && selectedCity?.hasBoundary ? selectedCityDetail?.boundary : null}
                zones={cityZonesWithBoundaries.map((z) => ({
                  id: z.id,
                  name: z.name,
                  zoneType: z.zoneType,
                  boundary: z.boundary,
                  isActive: z.isActive,
                }))}
                visibleZoneTypes={{
                  SERVICE: showServiceZones,
                  AIRPORT: showAirportZones,
                  RESTRICTED: showRestrictedZones,
                  SURGE: true,
                }}
                selectedZoneType={selectedZoneType}
                mapType={mapBaseType === 'street' ? 'roadmap' : mapBaseType === 'satellite' ? 'satellite' : 'terrain'}
                onZoneClick={(zoneId) => navigate(`/geographic-management/service-zones/${zoneId}`)}
              />
            </div>
          </div>

          {/* Card B: Cities Overview Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Hexagon className="w-[18px] h-[18px] text-[#1F2B6D] dark:text-[#8B93D9]" strokeWidth={2.5} />
                <div>
                  <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                    Operating Cities Overview
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Overview of all operating cities and their coverage</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/geographic-management/cities')}
                className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                View All
              </button>
            </div>

            {rawCities.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading cities…
              </div>
            ) : (
              <CardTable>
                <CardThead>
                  <tr>
                    <CardTh>City</CardTh>
                    <CardTh>Code</CardTh>
                    <CardTh>State / UT</CardTh>
                    <CardTh className="text-center">Zones</CardTh>
                    <CardTh className="text-center">Airport</CardTh>
                    <CardTh className="text-center">Restricted</CardTh>
                    <CardTh className="text-center">Status</CardTh>
                    <CardTh className="text-center">Actions</CardTh>
                  </tr>
                </CardThead>
                <CardTbody>
                  {rawCities.map((c) => {
                    const stats = cityZoneStats[c.code] ?? { total: 0, airport: 0, restricted: 0 }
                    return (
                      <CardTr key={c.id}>
                        <CardTd>
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md bg-[#1F2B6D] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              {c.code.slice(0, 2)}
                            </div>
                            <span className="font-bold text-slate-800 dark:text-white">
                              {c.name}
                            </span>
                          </div>
                        </CardTd>
                        <CardTd className="font-medium text-slate-500 dark:text-slate-400">
                          {c.code}
                        </CardTd>
                        <CardTd className="text-slate-600 dark:text-slate-400">
                          {c.state ?? '—'}
                        </CardTd>
                        <CardTd className="text-center font-bold text-slate-700 dark:text-slate-300">{stats.total}</CardTd>
                        <CardTd className="text-center font-bold text-slate-700 dark:text-slate-300">{stats.airport}</CardTd>
                        <CardTd className="text-center font-bold text-slate-700 dark:text-slate-300">
                          {stats.restricted}
                        </CardTd>
                        <CardTd className="text-center">
                          {c.isActive ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11.5px] font-bold bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/20 dark:text-emerald-400">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11.5px] font-bold bg-[#FEE2E2] text-[#EF4444] dark:bg-rose-950/20 dark:text-rose-400">
                              Inactive
                            </span>
                          )}
                        </CardTd>
                        <CardTd className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <CardTableButton
                              variant="outline"
                              onClick={() => navigate('/geographic-management/cities')}
                            >
                              Manage
                            </CardTableButton>
                            <button
                              type="button"
                              onClick={() => navigate('/geographic-management/cities')}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </CardTd>
                      </CardTr>
                    )
                  })}
                </CardTbody>
              </CardTable>
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

export default GeographicDashboardPage
