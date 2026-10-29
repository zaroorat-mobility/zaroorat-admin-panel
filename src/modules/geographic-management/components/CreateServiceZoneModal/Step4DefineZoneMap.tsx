import React, { useMemo, useState, useEffect } from 'react'
import { GoogleZoneDrawingMap } from '@/shared/components/maps/google/GoogleZoneDrawingMap'
import {
  PenTool,
  Edit2,
  Trash2,
  RotateCcw,
  Maximize2,
  CheckCircle2,
  Copy,
  Check,
  Hexagon,
  Scan,
  Compass,
  Search,
  Plane,
  MapPin,
  AlertTriangle,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react'
import {
  calculatePolygonAreaKm2,
  calculatePolygonPerimeterKm,
  generateCirclePolygon,
  haversineDistanceKm,
  hasSelfIntersections,
  isPointInsidePolygon,
  type LatLngPoint,
} from '../CreateCityModal/geoUtils'
import { placeKind, type PlaceKind } from '../../services/geocodingService'
import { usePlaceAutocomplete, type PlaceSuggestion } from '@/shared/hooks/usePlaceAutocomplete'
import type { ServiceZoneDetail, ServiceZoneType } from '../../types'

export interface AirportLocation {
  name: string
  iata: string
  cityCode: string
  lat: number
  lng: number
  defaultRadiusKm: number
  address: string
}

export const KNOWN_AIRPORTS: Record<string, AirportLocation> = {
  ATQ: {
    name: 'Sri Guru Ram Dass Jee International Airport',
    iata: 'ATQ',
    cityCode: 'ATQ',
    lat: 31.7096,
    lng: 74.7973,
    defaultRadiusKm: 1.5,
    address: 'Ajnala Road, Raja Sansi, Amritsar, Punjab 143101',
  },
  IXC: {
    name: 'Shaheed Bhagat Singh International Airport',
    iata: 'IXC',
    cityCode: 'IXC',
    lat: 30.6735,
    lng: 76.7885,
    defaultRadiusKm: 1.5,
    address: 'New Civil Air Terminal, Mohali / Chandigarh 140306',
  },
  CHD: {
    name: 'Shaheed Bhagat Singh International Airport',
    iata: 'IXC',
    cityCode: 'CHD',
    lat: 30.6735,
    lng: 76.7885,
    defaultRadiusKm: 1.5,
    address: 'New Civil Air Terminal, Mohali / Chandigarh 140306',
  },
  SGR: {
    name: 'Sheikh ul-Alam International Airport',
    iata: 'SGR',
    cityCode: 'SGR',
    lat: 33.9871,
    lng: 74.7744,
    defaultRadiusKm: 1.5,
    address: 'Budgam, Srinagar, Jammu & Kashmir 190007',
  },
  JMU: {
    name: 'Jammu Civil Enclave / Jammu Airport',
    iata: 'IXJ',
    cityCode: 'JMU',
    lat: 32.6891,
    lng: 74.8374,
    defaultRadiusKm: 1.2,
    address: 'Civil Airport, Satwari, Jammu, Jammu & Kashmir 180003',
  },
  LUH: {
    name: 'Sahnewal Airport (Ludhiana)',
    iata: 'LUH',
    cityCode: 'LUH',
    lat: 30.8546,
    lng: 75.9525,
    defaultRadiusKm: 1.2,
    address: 'Airport Road, Sahnewal, Ludhiana, Punjab 141120',
  },
  JUC: {
    name: 'Adampur Airport (Jalandhar Civil Enclave)',
    iata: 'AIP',
    cityCode: 'JUC',
    lat: 31.4336,
    lng: 75.7592,
    defaultRadiusKm: 1.5,
    address: 'Adampur, Jalandhar, Punjab 144102',
  },
  DEL: {
    name: 'Indira Gandhi International Airport',
    iata: 'DEL',
    cityCode: 'DEL',
    lat: 28.5562,
    lng: 77.1000,
    defaultRadiusKm: 2.5,
    address: 'New Delhi, Delhi 110037',
  },
  BLR: {
    name: 'Kempegowda International Airport',
    iata: 'BLR',
    cityCode: 'BLR',
    lat: 13.1986,
    lng: 77.7066,
    defaultRadiusKm: 2.5,
    address: 'Devanahalli, Bengaluru, Karnataka 560300',
  },
}

export interface QuickCategory {
  label: string
  category: 'airport' | 'station' | 'bus' | 'hospital' | 'center'
  icon: string
  searchTerm: string
}

export const QUICK_CATEGORIES: QuickCategory[] = [
  { label: 'Airport', category: 'airport', icon: '✈', searchTerm: 'international airport' },
  { label: 'Railway Station', category: 'station', icon: '🚆', searchTerm: 'railway station' },
  { label: 'Bus Terminal', category: 'bus', icon: '🚌', searchTerm: 'bus stand' },
  { label: 'Main Hospital', category: 'hospital', icon: '🏥', searchTerm: 'hospital' },
  { label: 'City Center', category: 'center', icon: '🏛', searchTerm: 'city center' },
]

/** Place search ranks results within this distance of the city centre first. */
const CITY_SEARCH_RADIUS_M = 30_000

interface ZoneSearchResult {
  id: string
  name: string
  address: string
  type: PlaceKind
  /** Known for the registered airport; a Google place gets it from its details when picked. */
  location?: { lat: number; lng: number }
  suggestion?: PlaceSuggestion
}

export interface FlyToTarget {
  lat: number
  lng: number
  zoom?: number
  timestamp: number
}

interface Step4DefineZoneMapProps {
  coordinates: number[][][] | null
  setCoordinates: (coords: number[][][] | null) => void
  cityBoundary: number[][][] | null
  cityCenter: LatLngPoint
  cityName: string
  zoneName: string
  zoneType?: ServiceZoneType
  cityCode?: string
  existingZones?: ServiceZoneDetail[]
  onValidationChange?: (isValid: boolean) => void
}

type BaseLayerType = 'map' | 'satellite' | 'terrain'

export const Step4DefineZoneMap: React.FC<Step4DefineZoneMapProps> = ({
  coordinates,
  setCoordinates,
  cityBoundary,
  cityCenter,
  cityName,
  zoneName,
  zoneType = 'SERVICE',
  cityCode = '',
  existingZones = [],
  onValidationChange,
}) => {
  const [toolMode, setToolMode] = useState<'draw' | 'edit'>('draw')
  const [baseLayer, setBaseLayer] = useState<BaseLayerType>('satellite')
  const [fitTrigger, setFitTrigger] = useState<number>(0)
  const [copiedGeoJson, setCopiedGeoJson] = useState<boolean>(false)

  // Location search and flyTo state
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [locatingId, setLocatingId] = useState<string | null>(null)
  const [locateError, setLocateError] = useState<string | null>(null)
  const {
    suggestions,
    isSearching,
    error: searchError,
    resolve,
  } = usePlaceAutocomplete(searchQuery, {
    bias: { lat: cityCenter.lat, lng: cityCenter.lng, radiusMeters: CITY_SEARCH_RADIUS_M },
  })
  const [searchPin, setSearchPin] = useState<{ lat: number; lng: number; name: string } | null>(null)
  const [flyToTarget, setFlyToTarget] = useState<FlyToTarget | null>(null)

  // Floating Checkbox Legend State
  const [showCityBoundary, setShowCityBoundary] = useState(true)
  const [showServiceZones, setShowServiceZones] = useState(true)
  const [showAirportZones, setShowAirportZones] = useState(true)
  const [showRestrictedZones, setShowRestrictedZones] = useState(true)
  const [showLabels, setShowLabels] = useState(true)

  // Detect current city's registered airport (e.g. ATQ -> Sri Guru Ram Dass Jee International Airport)
  const currentAirport = useMemo(() => {
    if (!cityCode) return null
    return KNOWN_AIRPORTS[cityCode.toUpperCase()] || null
  }, [cityCode])

  const [selectedPlace, setSelectedPlace] = useState<{
    name: string
    address: string
    lat: number
    lng: number
    isAirport?: boolean
  } | null>(null)

  // Seed default 8-point polygon: if Airport Zone, center directly on airport coordinates!
  useEffect(() => {
    if (!coordinates || !coordinates[0]?.length) {
      const airport = (cityCode && KNOWN_AIRPORTS[cityCode.toUpperCase()]) || null
      const initialCenter =
        zoneType === 'AIRPORT' && airport
          ? { lat: airport.lat, lng: airport.lng }
          : cityCenter
      const initialRadius = zoneType === 'AIRPORT' && airport ? airport.defaultRadiusKm : 2.0
      const defaultRing = generateCirclePolygon(initialCenter, initialRadius, 8)
      setCoordinates(defaultRing)
    }
  }, [coordinates, cityCenter, setCoordinates, zoneType, cityCode])

  // 1-Click: Locate Airport camera
  const handleLocateAirport = () => {
    if (!currentAirport) return
    setFlyToTarget({
      lat: currentAirport.lat,
      lng: currentAirport.lng,
      zoom: 14,
      timestamp: Date.now(),
    })
  }

  // 1-Click: Draw zone directly around Airport
  const handleDrawAtAirport = () => {
    if (!currentAirport) return
    const ring = generateCirclePolygon(
      { lat: currentAirport.lat, lng: currentAirport.lng },
      currentAirport.defaultRadiusKm,
      8,
    )
    setCoordinates(ring)
    setFlyToTarget({
      lat: currentAirport.lat,
      lng: currentAirport.lng,
      zoom: 14,
      timestamp: Date.now(),
    })
    setToolMode('edit')
  }

  // Draw zone around arbitrary searched location
  const handleDrawAtLocation = (lat: number, lng: number, radiusKm = 1.5) => {
    const ring = generateCirclePolygon({ lat, lng }, radiusKm, 8)
    setCoordinates(ring)
    setFlyToTarget({ lat, lng, zoom: 14, timestamp: Date.now() })
    setToolMode('edit')
    setIsSearchOpen(false)
  }

  // Draw rectangular runway corridor (3.5 km x 1.6 km)
  const handleDrawRunwayCorridor = (lat: number, lng: number) => {
    const dLat = 0.008
    const dLng = 0.018
    const ring: [number, number][] = [
      [Number((lng - dLng).toFixed(6)), Number((lat + dLat).toFixed(6))],
      [Number((lng + dLng).toFixed(6)), Number((lat + dLat).toFixed(6))],
      [Number((lng + dLng).toFixed(6)), Number((lat - dLat).toFixed(6))],
      [Number((lng - dLng).toFixed(6)), Number((lat - dLat).toFixed(6))],
      [Number((lng - dLng).toFixed(6)), Number((lat + dLat).toFixed(6))],
    ]
    setCoordinates([ring])
    setFlyToTarget({ lat, lng, zoom: 14, timestamp: Date.now() })
    setToolMode('edit')
    setIsSearchOpen(false)
  }

  // Place search in this city: the registered airport first, then Google Places (New) near the city
  const searchResults = useMemo<ZoneSearchResult[]>(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    const airport =
      currentAirport && (q.includes('airport') || q.includes(currentAirport.iata.toLowerCase()))
        ? currentAirport
        : null
    const results: ZoneSearchResult[] = []
    if (airport) {
      results.push({
        id: `local-ap-${airport.iata}`,
        name: `${airport.name} (${airport.iata})`,
        address: airport.address,
        type: 'airport',
        location: { lat: airport.lat, lng: airport.lng },
      })
    }
    for (const suggestion of suggestions) {
      const type = placeKind(suggestion.types)
      // The registered airport above already stands for the city's airport.
      if (airport && type === 'airport') continue
      results.push({
        id: suggestion.placeId,
        name: suggestion.mainText,
        address: suggestion.secondaryText,
        type,
        suggestion,
      })
    }
    return results.slice(0, 6)
  }, [searchQuery, suggestions, currentAirport])

  // Coordinates of a result; for a Google place this fetches its details (ending the search session).
  const locateResult = async (result: ZoneSearchResult): Promise<{ lat: number; lng: number } | null> => {
    if (result.location) return result.location
    if (!result.suggestion) return null
    setLocatingId(result.id)
    setLocateError(null)
    try {
      return (await resolve(result.suggestion)).location
    } catch (err) {
      setLocateError(err instanceof Error ? err.message : 'Could not load this place from Google.')
      return null
    } finally {
      setLocatingId(null)
    }
  }

  const handleSelectSearchResult = async (result: ZoneSearchResult) => {
    const location = await locateResult(result)
    if (!location) return
    setSelectedPlace({
      name: result.name,
      address: result.address,
      lat: location.lat,
      lng: location.lng,
      isAirport: result.type === 'airport',
    })
    setSearchPin({ lat: location.lat, lng: location.lng, name: result.name })
    setFlyToTarget({ lat: location.lat, lng: location.lng, zoom: 14, timestamp: Date.now() })
    setIsSearchOpen(false)
  }

  const handleDrawAtResult = async (result: ZoneSearchResult) => {
    const location = await locateResult(result)
    if (location) handleDrawAtLocation(location.lat, location.lng, result.type === 'airport' ? 1.5 : 1.0)
  }

  const uniqueVertices = useMemo(() => {
    if (!coordinates?.[0] || coordinates[0].length === 0) return []
    if (coordinates[0].length >= 3) {
      const first = coordinates[0][0]
      const last = coordinates[0][coordinates[0].length - 1]
      if (first[0] === last[0] && first[1] === last[1]) {
        return coordinates[0].slice(0, -1)
      }
    }
    return coordinates[0]
  }, [coordinates])

  const areaKm2 = useMemo(() => {
    const a = calculatePolygonAreaKm2(coordinates)
    return a > 0 ? a : 0
  }, [coordinates])

  const perimeterKm = useMemo(() => {
    const p = calculatePolygonPerimeterKm(coordinates)
    return p > 0 ? p : 0
  }, [coordinates])

  const pointsCount = uniqueVertices.length > 0 ? uniqueVertices.length : 0

  // Categorize real existing zones from the database
  const airportZones = useMemo(() => {
    return existingZones.filter(
      (z) => z.zoneType === 'AIRPORT' && z.boundary?.[0]?.length >= 3,
    )
  }, [existingZones])

  const restrictedZones = useMemo(() => {
    return existingZones.filter(
      (z) => z.zoneType === 'RESTRICTED' && z.boundary?.[0]?.length >= 3,
    )
  }, [existingZones])

  const serviceZones = useMemo(() => {
    return existingZones.filter(
      (z) => z.zoneType === 'SERVICE' && z.boundary?.[0]?.length >= 3,
    )
  }, [existingZones])

  // Validation criteria
  const isInsideCity = useMemo(() => {
    if (!cityBoundary?.[0] || !coordinates?.[0] || coordinates[0].length < 3) return true
    return coordinates[0].every(([lng, lat]) => isPointInsidePolygon({ lng, lat }, cityBoundary))
  }, [cityBoundary, coordinates])

  // Real mathematical calculation of zone distance from city center & city radius
  const zoneDistFromCenterKm = useMemo(() => {
    if (!coordinates?.[0] || coordinates[0].length === 0) return 0
    let maxDist = 0
    for (const [lng, lat] of coordinates[0]) {
      const d = haversineDistanceKm(cityCenter, { lat, lng })
      if (d > maxDist) maxDist = d
    }
    return Number(maxDist.toFixed(1))
  }, [coordinates, cityCenter])

  const currentCityRadiusKm = useMemo(() => {
    if (!cityBoundary?.[0] || cityBoundary[0].length === 0) return 5.0
    let maxDist = 0
    for (const [lng, lat] of cityBoundary[0]) {
      const d = haversineDistanceKm(cityCenter, { lat, lng })
      if (d > maxDist) maxDist = d
    }
    return Number(maxDist.toFixed(1))
  }, [cityBoundary, cityCenter])

  const recommendedRadiusKm = useMemo(() => {
    return Math.max(Math.ceil(zoneDistFromCenterKm + 2), Math.ceil(currentCityRadiusKm + 2), 10)
  }, [zoneDistFromCenterKm, currentCityRadiusKm])

  const noIntersections = useMemo(() => !hasSelfIntersections(coordinates), [coordinates])
  const isAreaValid = areaKm2 > 0.05
  const allConnected = Boolean(coordinates?.[0] && coordinates[0].length >= 4)
  const isOverallValid = isInsideCity && noIntersections && isAreaValid && allConnected

  useEffect(() => {
    onValidationChange?.(isOverallValid)
  }, [isOverallValid, onValidationChange])

  const handleDelete = () => {
    if (!coordinates?.[0] || coordinates[0].length === 0) return
    const ring = [...coordinates[0]]
    if (ring.length <= 4) {
      setCoordinates(null)
      return
    }
    ring.pop()
    ring.pop()
    ring.push([ring[0][0], ring[0][1]])
    setCoordinates([ring])
  }

  const handleClearAll = () => {
    setCoordinates(null)
    setToolMode('draw')
  }

  const handleFitToCity = () => {
    setFitTrigger((prev) => prev + 1)
  }

  // GeoJSON representation string
  const geoJsonString = useMemo(() => {
    const geom = {
      type: 'Polygon',
      coordinates: coordinates || [],
    }
    return JSON.stringify(geom, null, 2)
  }, [coordinates])

  const handleCopyGeoJson = () => {
    void navigator.clipboard.writeText(geoJsonString)
    setCopiedGeoJson(true)
    setTimeout(() => setCopiedGeoJson(false), 2000)
  }

  return (
    <div className="space-y-3">
      {/* ── Section Header ─────────────────────────────────────── */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#1F2B6D] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Hexagon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Define Zone on Map</h3>
          <p className="text-xs text-slate-500">
            Draw the service zone on the map. The zone must be completely inside the city boundary.
          </p>
        </div>
      </div>

      {/* ── Main 2-Column Layout matching screenshot ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* ── LEFT COLUMN: Map & Toolbar ──────────────────────── */}
        <div className="lg:col-span-8 space-y-2">
          {/* Map Toolbar matching screenshot + 1-Click Airport Actions */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setToolMode('draw')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    toolMode === 'draw'
                      ? 'bg-[#1F2B6D] text-white shadow-2xs'
                      : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Draw Polygon</span>
                </button>

                <button
                  type="button"
                  onClick={() => setToolMode('edit')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    toolMode === 'edit'
                      ? 'bg-[#1F2B6D] text-white shadow-2xs'
                      : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Delete</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Clear All</span>
                </button>

                <button
                  type="button"
                  onClick={handleFitToCity}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Fit to City</span>
                </button>
              </div>

              {/* 1-Click Airport Quick Actions if current city has a registered airport */}
              {currentAirport && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleLocateAirport}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title={`Fly camera directly to ${currentAirport.name}`}
                  >
                    <Plane className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Locate Airport ({currentAirport.iata})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDrawAtAirport}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title="Automatically create 1.5km zone polygon centered at the airport terminal"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Draw at Airport</span>
                  </button>
                </div>
              )}
            </div>

            {/* Fast Location & Landmark Search Bar */}
            <div className="relative z-[450]">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    {isSearching ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1F2B6D]" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setIsSearchOpen(true)
                      setLocateError(null)
                    }}
                    onFocus={() => {
                      if (searchQuery.trim()) setIsSearchOpen(true)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        setIsSearchOpen(true)
                      }
                    }}
                    placeholder={`Search place, landmark, or airport in ${cityName || 'city'} (e.g. Airport, Railway Station)...`}
                    className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] transition-all shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        setIsSearchOpen(false)
                        setLocateError(null)
                      }}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0 border border-slate-200"
                >
                  Search
                </button>
              </div>

              {/* Autocomplete Results Dropdown */}
              {isSearchOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {searchResults.map((res) => (
                    <div
                      key={res.id}
                      className="p-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-left"
                    >
                      <button
                        type="button"
                        disabled={locatingId !== null}
                        onClick={() => void handleSelectSearchResult(res)}
                        className="flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer"
                      >
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                            res.type === 'airport'
                              ? 'bg-emerald-100 text-emerald-700'
                              : res.type === 'station'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {locatingId === res.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : res.type === 'airport' ? (
                            <Plane className="w-3.5 h-3.5" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{res.name}</p>
                          <p className="text-[10.5px] text-slate-500 truncate">{res.address}</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        disabled={locatingId !== null}
                        onClick={() => void handleDrawAtResult(res)}
                        className="px-2 py-1 text-[11px] font-bold bg-[#1F2B6D] hover:bg-[#182258] text-white rounded-md shrink-0 transition-colors cursor-pointer shadow-2xs"
                        title="Fly camera and create zone circle here"
                      >
                        Draw Zone Here
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {(locateError || searchError) && (
                <p role="alert" className="mt-1 text-[10.5px] leading-tight text-amber-700">
                  {locateError || searchError}
                </p>
              )}
            </div>

            {/* Quick 1-Click Search Categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 text-xs no-scrollbar">
              <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#1F2B6D]" />
                <span>Quick Places:</span>
              </span>
              {QUICK_CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => {
                    if (cat.category === 'center') {
                      setSelectedPlace({
                        name: `${cityName || 'City'} Center`,
                        address: cityName || 'City Center Area',
                        lat: cityCenter.lat,
                        lng: cityCenter.lng,
                        isAirport: false,
                      })
                      setFlyToTarget({ lat: cityCenter.lat, lng: cityCenter.lng, zoom: 13, timestamp: Date.now() })
                    } else if (cat.category === 'airport' && currentAirport) {
                      setSelectedPlace({
                        name: currentAirport.name,
                        address: currentAirport.address,
                        lat: currentAirport.lat,
                        lng: currentAirport.lng,
                        isAirport: true,
                      })
                      setFlyToTarget({ lat: currentAirport.lat, lng: currentAirport.lng, zoom: 14, timestamp: Date.now() })
                    } else {
                      setSearchQuery(`${cityName} ${cat.searchTerm}`.trim())
                      setIsSearchOpen(true)
                      setLocateError(null)
                    }
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 cursor-pointer shadow-2xs flex items-center gap-1.5 ${
                    selectedPlace?.name.toLowerCase().includes(cat.label.toLowerCase())
                      ? 'bg-[#1F2B6D] text-white shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90'
                  }`}
                  title={`Find ${cat.label} in ${cityName || 'city'}`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Floating Action Banner when a Landmark or Place is Selected */}
            {selectedPlace && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50/80 border border-blue-200/90 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs text-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#1F2B6D] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    {selectedPlace.isAirport ? (
                      <Plane className="w-3.5 h-3.5" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{selectedPlace.name}</p>
                    <p className="text-[10.5px] text-slate-600 truncate">{selectedPlace.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDrawAtLocation(selectedPlace.lat, selectedPlace.lng, 1.5)}
                    className="px-2.5 py-1 bg-[#1F2B6D] hover:bg-[#182258] text-white font-bold rounded-lg text-[11px] transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                    title="Generate circular zone with 1.5 km radius"
                  >
                    <Sparkles className="w-3 h-3 text-blue-200" />
                    <span>Circle (1.5 km)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDrawAtLocation(selectedPlace.lat, selectedPlace.lng, 2.5)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-lg text-[11px] transition-all cursor-pointer shadow-2xs"
                    title="Generate circular zone with 2.5 km radius"
                  >
                    <span>Circle (2.5 km)</span>
                  </button>

                  {selectedPlace.isAirport && (
                    <button
                      type="button"
                      onClick={() => handleDrawRunwayCorridor(selectedPlace.lat, selectedPlace.lng)}
                      className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-[11px] transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                      title="Generate rectangular corridor matching runway (3.5 km x 1.6 km)"
                    >
                      <Plane className="w-3 h-3 text-emerald-200" />
                      <span>Runway Box</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedPlace(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer ml-1"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Map Container */}
          <div className="relative w-full rounded-xl overflow-hidden border border-slate-200/90 bg-slate-900 shadow-inner h-[440px]">
            <GoogleZoneDrawingMap
              coordinates={coordinates}
              onChange={setCoordinates}
              cityBoundary={cityBoundary}
              center={cityCenter}
              cityName={cityName}
              zoneName={zoneName}
              zoneType={zoneType}
              height="440px"
              mapType={baseLayer === 'satellite' ? 'satellite' : baseLayer === 'terrain' ? 'terrain' : 'roadmap'}
              toolMode={toolMode}
              overlayZones={[
                ...(showAirportZones ? airportZones.map((z) => ({ id: z.id, name: z.name, zoneType: 'AIRPORT', boundary: z.boundary })) : []),
                ...(showRestrictedZones ? restrictedZones.map((z) => ({ id: z.id, name: z.name, zoneType: 'RESTRICTED', boundary: z.boundary })) : []),
                ...(showServiceZones ? serviceZones.map((z) => ({ id: z.id, name: z.name, zoneType: 'SERVICE', boundary: z.boundary })) : []),
              ]}
              showCityBoundary={showCityBoundary}
              showOverlayZones={true}
              flyToTarget={flyToTarget}
              fitTrigger={fitTrigger}
              searchPin={searchPin}
            />

            {/* Top-Right Floating Checkbox Legend matching screenshot */}
            <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-md p-2.5 pointer-events-auto text-xs font-semibold space-y-1.5 min-w-[155px]">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-800">
                <input
                  type="checkbox"
                  checked={showCityBoundary}
                  onChange={(e) => setShowCityBoundary(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-blue-600"></span>
                  <span>City Boundary</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
                <input
                  type="checkbox"
                  checked={showServiceZones}
                  onChange={(e) => setShowServiceZones(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-purple-500"></span>
                  <span>Service Zones ({serviceZones.length})</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
                <input
                  type="checkbox"
                  checked={showAirportZones}
                  onChange={(e) => setShowAirportZones(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
                  <span>Airport Zones ({airportZones.length})</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
                <input
                  type="checkbox"
                  checked={showRestrictedZones}
                  onChange={(e) => setShowRestrictedZones(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
                  <span>Restricted ({restrictedZones.length})</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 pt-1 border-t border-slate-100">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="text-slate-800">Show Labels</span>
              </label>
            </div>

            {/* Bottom-Right Base Layer Switcher [Map | Satellite | Terrain] */}
            <div className="absolute bottom-3 right-3 z-[400] bg-white/95 backdrop-blur-md rounded-lg border border-slate-200/90 shadow-md p-0.5 flex items-center pointer-events-auto">
              {(['map', 'satellite', 'terrain'] as BaseLayerType[]).map((layer) => (
                <button
                  key={layer}
                  type="button"
                  onClick={() => setBaseLayer(layer)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold capitalize transition-all cursor-pointer ${
                    baseLayer === layer
                      ? 'bg-[#1F2B6D] text-white shadow-2xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {layer}
                </button>
              ))}
            </div>

            {/* Bottom-Left: Scale Indicator matching screenshot */}
            <div className="absolute bottom-3 left-3 z-[400] pointer-events-none">
              <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-200/90 text-[10.5px] font-bold text-slate-800 shadow-xs flex items-center gap-2">
                <span className="w-10 border-b-2 border-slate-800 inline-block"></span>
                <span>5 km</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Metrics, Validation, GeoJSON ───────── */}
        <div className="lg:col-span-4 space-y-3">
          {/* 1. Zone Details (Live) Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900">Zone Details (Live)</h4>

            <div className="grid grid-cols-3 gap-2">
              {/* Points */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-slate-500">
                  <Compass className="w-3.5 h-3.5 text-[#1F2B6D]" />
                  <span className="text-[10.5px] font-semibold text-slate-500">Points</span>
                </div>
                <p className="text-base font-extrabold text-slate-900">{pointsCount}</p>
              </div>

              {/* Area */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-slate-500">
                  <Scan className="w-3.5 h-3.5 text-[#1F2B6D]" />
                  <span className="text-[10.5px] font-semibold text-slate-500">Area</span>
                </div>
                <p className="text-base font-extrabold text-slate-900">{areaKm2.toFixed(2)} km²</p>
              </div>

              {/* Perimeter */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-slate-500">
                  <RotateCcw className="w-3.5 h-3.5 text-[#1F2B6D]" />
                  <span className="text-[10.5px] font-semibold text-slate-500">Perimeter</span>
                </div>
                <p className="text-base font-extrabold text-slate-900">{perimeterKm.toFixed(1)} km</p>
              </div>
            </div>
          </div>

          {/* 2. Validation Card */}
          <div
            className={`border rounded-xl p-3.5 shadow-2xs space-y-2 ${
              isOverallValid
                ? 'bg-emerald-50/80 border-emerald-200/90'
                : 'bg-amber-50/80 border-amber-200/90'
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-5 h-5 rounded-full text-white flex items-center justify-center shrink-0 ${
                  isOverallValid ? 'bg-emerald-600' : 'bg-amber-600'
                }`}
              >
                {isOverallValid ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : (
                  <span className="text-xs font-bold leading-none">!</span>
                )}
              </div>
              <h4
                className={`text-xs font-bold ${
                  isOverallValid ? 'text-emerald-950' : 'text-amber-950'
                }`}
              >
                Validation {isOverallValid ? 'Passed' : 'Issues'}
              </h4>
            </div>

            <div className="space-y-1.5 text-xs font-medium pl-0.5">
              <div
                className={`flex items-center gap-2 ${
                  isInsideCity ? 'text-emerald-900' : 'text-red-700'
                }`}
              >
                <CheckCircle2
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isInsideCity ? 'text-emerald-600' : 'text-red-500'
                  }`}
                />
                <span>Polygon is completely inside city boundary</span>
              </div>
              <div
                className={`flex items-center gap-2 ${
                  noIntersections ? 'text-emerald-900' : 'text-red-700'
                }`}
              >
                <CheckCircle2
                  className={`w-3.5 h-3.5 shrink-0 ${
                    noIntersections ? 'text-emerald-600' : 'text-red-500'
                  }`}
                />
                <span>Polygon is valid (no self-intersections)</span>
              </div>
              <div
                className={`flex items-center gap-2 ${
                  isAreaValid ? 'text-emerald-900' : 'text-red-700'
                }`}
              >
                <CheckCircle2
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isAreaValid ? 'text-emerald-600' : 'text-red-500'
                  }`}
                />
                <span>Minimum area requirement met ({areaKm2.toFixed(2)} km²)</span>
              </div>
              <div
                className={`flex items-center gap-2 ${
                  allConnected ? 'text-emerald-900' : 'text-red-700'
                }`}
              >
                <CheckCircle2
                  className={`w-3.5 h-3.5 shrink-0 ${
                    allConnected ? 'text-emerald-600' : 'text-red-500'
                  }`}
                />
                <span>All points connected ({pointsCount} vertices)</span>
              </div>
            </div>
          </div>

          {/* Actionable Boundary Warning Banner if polygon is outside city boundary */}
          {!isInsideCity && (
            <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-3 shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Zone Outside Registered City Boundary</span>
              </div>
              <p className="text-[11.5px] text-amber-900 leading-relaxed">
                The defined zone extends up to <strong>{zoneDistFromCenterKm} km</strong> from {cityName || 'the city'}&apos;s center, which exceeds the currently registered boundary radius (~{currentCityRadiusKm} km).
              </p>
              <div className="pt-2 border-t border-amber-200/80 text-[11px] text-amber-900 flex flex-col gap-1">
                <span className="font-semibold text-slate-800">How to resolve:</span>
                <div className="flex items-center justify-between gap-2 bg-amber-100/70 p-2 rounded-lg border border-amber-200">
                  <span className="text-[10.5px] text-amber-950">
                    Go to <strong>Geographic Management &gt; Cities &gt; Edit {cityName || 'City'}</strong>
                  </span>
                  <span className="font-bold text-amber-800 bg-white px-2 py-0.5 rounded shadow-xs text-[10.5px] shrink-0 border border-amber-300">
                    Expand Radius &ge; {recommendedRadiusKm} km
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 3. Coordinates (GeoJSON) Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900">Coordinates (GeoJSON)</h4>
              <button
                type="button"
                onClick={handleCopyGeoJson}
                title="Copy GeoJSON"
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                {copiedGeoJson ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 max-h-[145px] overflow-y-auto font-mono text-[11px] text-slate-800 leading-snug">
              <pre className="whitespace-pre">{geoJsonString}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Step4DefineZoneMap
