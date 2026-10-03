import React, { useCallback, useMemo, useState, useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Marker,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  PenTool,
  Edit2,
  Trash2,
  RotateCcw,
  Maximize2,
  CheckCircle2,
  Copy,
  Check,
  Plus,
  Minus,
  Crosshair,
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

const TILE_URLS: Record<BaseLayerType, string> = {
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  map: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  terrain: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
}

// Controller for map events and view operations
function MapController({
  cityBoundary,
  coordinates,
  center,
  isDrawing,
  onMapClick,
  fitTrigger,
  flyToTarget,
}: {
  cityBoundary?: number[][][] | null
  coordinates?: number[][][] | null
  center: LatLngPoint
  isDrawing: boolean
  onMapClick: (point: [number, number]) => void
  fitTrigger: number
  flyToTarget?: FlyToTarget | null
}) {
  const map = useMap()

  useMapEvents({
    click(e) {
      if (isDrawing) {
        onMapClick([Number(e.latlng.lng.toFixed(6)), Number(e.latlng.lat.toFixed(6))])
      }
    },
  })

  // Fit bounds to city or zone on load or when fitTrigger increments
  useEffect(() => {
    map.invalidateSize()
    const targetPoly = cityBoundary?.[0]?.length ? cityBoundary : coordinates
    if (targetPoly?.[0]?.length && targetPoly[0].length >= 3) {
      const bounds = targetPoly[0].map(([lng, lat]) => [lat, lng] as [number, number])
      map.fitBounds(bounds, { padding: [30, 30] })
    } else {
      map.setView([center.lat, center.lng], 12)
    }
  }, [center, cityBoundary, coordinates, fitTrigger, map])

  // Smooth flyTo when search result or airport locator is triggered
  useEffect(() => {
    if (flyToTarget && flyToTarget.timestamp > 0) {
      map.flyTo([flyToTarget.lat, flyToTarget.lng], flyToTarget.zoom ?? 14, { duration: 1.2 })
    }
  }, [flyToTarget, map])

  return null
}

// Map Controls component (Zoom + Locate)
function MapControls({ center }: { center: LatLngPoint }) {
  const map = useMap()

  return (
    <div className="absolute top-3 left-3 z-[400] flex flex-col gap-1.5 pointer-events-auto">
      <div className="bg-white/95 backdrop-blur-md rounded-lg border border-slate-200/90 shadow-sm flex flex-col overflow-hidden">
        <button
          type="button"
          onClick={() => map.zoomIn()}
          className="p-1.5 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100 flex items-center justify-center cursor-pointer"
          title="Zoom In"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={() => map.zoomOut()}
          className="p-1.5 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center cursor-pointer"
          title="Zoom Out"
        >
          <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => map.setView([center.lat, center.lng], 12, { animate: true })}
        className="p-1.5 bg-white/95 backdrop-blur-md hover:bg-slate-50 border border-slate-200/90 rounded-lg text-slate-700 shadow-sm transition-colors flex items-center justify-center cursor-pointer"
        title="Center City View"
      >
        <Crosshair className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// Vertex handle icon with white circle and blue border matching screenshot
const vertexHandleIcon = L.divIcon({
  className: 'zone-vertex-handle',
  html: `
    <div style="
      width: 14px;
      height: 14px;
      background: #FFFFFF;
      border: 3px solid #2563EB;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
      cursor: grab;
      transition: transform 0.1s ease;
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

// City Center Label Icon
const createCityLabelIcon = (cityName: string) => {
  return L.divIcon({
    className: 'city-name-label',
    html: `
      <div style="
        font-family: inherit;
        font-weight: 800;
        font-size: 15px;
        color: #0f172a;
        text-shadow: 0 0 5px #ffffff, 0 0 10px #ffffff;
        white-space: nowrap;
        transform: translate(-50%, -50%);
        pointer-events: none;
        letter-spacing: -0.01em;
      ">
        ${cityName || 'City'}
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

// Zone Center Badge Icon (e.g. Airport Zone, Restricted Zone, New Zone, Service Zone)
const createZoneBadgeIcon = (
  text: string,
  bgColor: string,
  textColor: string,
  symbol?: string,
) => {
  return L.divIcon({
    className: 'zone-center-badge',
    html: `
      <div style="
        background-color: ${bgColor};
        color: ${textColor};
        font-weight: 700;
        font-size: 11px;
        padding: 3px 8px;
        border-radius: 6px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
        transform: translate(-50%, -50%);
        pointer-events: none;
      ">
        ${symbol ? `<span style="font-size: 12px; line-height: 1;">${symbol}</span>` : ''}
        <span>${text}</span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

// Airport Pin Marker Icon for Leaflet
const createAirportPinIcon = (iata: string, name: string) => {
  return L.divIcon({
    className: 'airport-pin-marker',
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -100%);
        pointer-events: auto;
        cursor: pointer;
      " title="${name}">
        <div style="
          background: #059669;
          color: #ffffff;
          font-weight: 800;
          font-size: 11px;
          padding: 4px 9px;
          border-radius: 9999px;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.45);
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          border: 2px solid #ffffff;
        ">
          <span style="font-size: 13px; line-height: 1;">✈</span>
          <span>${iata} Airport</span>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 7px solid #059669;
          margin-top: -1px;
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

// Search Place Pin Marker Icon for Leaflet
const createSearchPinIcon = (title: string) => {
  return L.divIcon({
    className: 'search-pin-marker',
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -100%);
        pointer-events: auto;
      ">
        <div style="
          background: #1F2B6D;
          color: #ffffff;
          font-weight: 700;
          font-size: 11px;
          padding: 4px 9px;
          border-radius: 8px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          white-space: nowrap;
          border: 2px solid #ffffff;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
        ">
          📍 ${title}
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 6px solid #1F2B6D;
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

function getCentroid(boundary: number[][][]): [number, number] {
  if (!boundary?.[0] || boundary[0].length === 0) return [0, 0]
  const ring = boundary[0]
  const sum = ring.reduce(
    (acc, [lng, lat]) => ({ lng: acc.lng + lng, lat: acc.lat + lat }),
    { lng: 0, lat: 0 },
  )
  return [sum.lat / ring.length, sum.lng / ring.length]
}

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
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<
    Array<{
      id: string
      name: string
      address: string
      lat: number
      lng: number
      type: 'airport' | 'station' | 'place'
    }>
  >([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
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

  // Handle location search: searches dynamically within active city via Nominatim geocoder
  const handlePerformSearch = async (queryText: string) => {
    const q = queryText.trim()
    if (!q) {
      setSearchResults([])
      setIsSearchOpen(false)
      return
    }

    setIsSearching(true)
    setIsSearchOpen(true)

    const qLower = q.toLowerCase()
    const matches: Array<{
      id: string
      name: string
      address: string
      lat: number
      lng: number
      type: 'airport' | 'station' | 'place'
    }> = []

    // 1. If searching for airport and current city has registered airport, prioritize it
    if (
      currentAirport &&
      (qLower.includes('airport') || qLower.includes(currentAirport.iata.toLowerCase()))
    ) {
      matches.push({
        id: `local-ap-${currentAirport.iata}`,
        name: `${currentAirport.name} (${currentAirport.iata})`,
        address: currentAirport.address,
        lat: currentAirport.lat,
        lng: currentAirport.lng,
        type: 'airport',
      })
    }

    // 2. Search OpenStreetMap Nominatim for real-time dynamic geocoding in this city
    try {
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        q + (cityName ? `, ${cityName}` : ''),
      )}&countrycodes=in&limit=6`
      const res = await fetch(searchUrl, {
        headers: { 'Accept-Language': 'en' },
      })
      if (res.ok) {
        const data = (await res.json()) as Array<{
          place_id: number
          display_name: string
          lat: string
          lon: string
          type: string
        }>
        data.forEach((item) => {
          const lat = parseFloat(item.lat)
          const lng = parseFloat(item.lon)
          if (!isNaN(lat) && !isNaN(lng)) {
            const isAirport =
              item.display_name.toLowerCase().includes('airport') ||
              item.type.toLowerCase().includes('aerodrome')
            const isStation =
              item.display_name.toLowerCase().includes('railway') ||
              item.display_name.toLowerCase().includes('station')
            if (!matches.some((m) => Math.abs(m.lat - lat) < 0.002 && Math.abs(m.lng - lng) < 0.002)) {
              matches.push({
                id: `nom-${item.place_id}`,
                name: item.display_name.split(',')[0],
                address: item.display_name,
                lat,
                lng,
                type: isAirport ? 'airport' : isStation ? 'station' : 'place',
              })
            }
          }
        })
      }
    } catch {
      // Offline fallback
    }

    setSearchResults(matches.slice(0, 6))
    setIsSearching(false)
  }

  const handleSelectSearchResult = (result: {
    lat: number
    lng: number
    name: string
    address?: string
    type: 'airport' | 'station' | 'place'
  }) => {
    setSelectedPlace({
      name: result.name,
      address: result.address || '',
      lat: result.lat,
      lng: result.lng,
      isAirport: result.type === 'airport',
    })
    setSearchPin({ lat: result.lat, lng: result.lng, name: result.name })
    setFlyToTarget({ lat: result.lat, lng: result.lng, zoom: 14, timestamp: Date.now() })
    setIsSearchOpen(false)
  }

  // LatLng for city boundary reference
  const cityBoundaryLatLngs = useMemo(() => {
    if (!cityBoundary?.[0] || cityBoundary[0].length < 3) return null
    return cityBoundary[0].map(([lng, lat]) => [lat, lng] as [number, number])
  }, [cityBoundary])

  // LatLng for active New Zone polygon
  const zonePolygonLatLngs = useMemo(() => {
    if (!coordinates?.[0] || coordinates[0].length < 3) return null
    return coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number])
  }, [coordinates])

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

  // Centroid of New Zone for badge positioning
  const newZoneCenter = useMemo<LatLngPoint>(() => {
    if (uniqueVertices.length > 0) {
      const sum = uniqueVertices.reduce(
        (acc, [lng, lat]) => ({ lng: acc.lng + lng, lat: acc.lat + lat }),
        { lng: 0, lat: 0 },
      )
      return {
        lng: sum.lng / uniqueVertices.length,
        lat: sum.lat / uniqueVertices.length,
      }
    }
    return { lng: cityCenter.lng, lat: cityCenter.lat }
  }, [uniqueVertices, cityCenter])

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

  // Click on map to add vertex
  const handleMapClick = useCallback(
    (point: [number, number]) => {
      if (toolMode !== 'draw') return
      const currentRing = coordinates?.[0] ? [...coordinates[0]] : []
      if (currentRing.length >= 3) {
        const first = currentRing[0]
        const last = currentRing[currentRing.length - 1]
        if (first[0] === last[0] && first[1] === last[1]) {
          currentRing.pop()
        }
      }
      currentRing.push(point)
      if (currentRing.length >= 3) {
        const closed = [...currentRing, [currentRing[0][0], currentRing[0][1]] as [number, number]]
        setCoordinates([closed])
      } else {
        setCoordinates([currentRing])
      }
    },
    [coordinates, toolMode, setCoordinates],
  )

  // Drag vertex handle in Edit mode
  const handleVertexDrag = useCallback(
    (index: number, newLatLng: L.LatLng) => {
      if (!coordinates?.[0] || coordinates[0].length < 3) return
      const ring = coordinates[0].map(([lng, lat]) => [lng, lat] as [number, number])
      const newLng = Number(newLatLng.lng.toFixed(6))
      const newLat = Number(newLatLng.lat.toFixed(6))
      ring[index] = [newLng, newLat]
      if (index === 0) {
        ring[ring.length - 1] = [newLng, newLat]
      }
      setCoordinates([ring])
    },
    [coordinates, setCoordinates],
  )

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
                      void handlePerformSearch(e.target.value)
                    }}
                    onFocus={() => {
                      if (searchQuery.trim()) setIsSearchOpen(true)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void handlePerformSearch(searchQuery)
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
                        setSearchResults([])
                        setIsSearchOpen(false)
                      }}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void handlePerformSearch(searchQuery)}
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
                        onClick={() => handleSelectSearchResult(res)}
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
                          {res.type === 'airport' ? (
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
                        onClick={() => handleDrawAtLocation(res.lat, res.lng, res.type === 'airport' ? 1.5 : 1.0)}
                        className="px-2 py-1 text-[11px] font-bold bg-[#1F2B6D] hover:bg-[#182258] text-white rounded-md shrink-0 transition-colors cursor-pointer shadow-2xs"
                        title="Fly camera and create zone circle here"
                      >
                        Draw Zone Here
                      </button>
                    </div>
                  ))}
                </div>
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
                      setSearchQuery(cat.label)
                      void handlePerformSearch(`${cityName} ${cat.searchTerm}`)
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
          <div className="relative w-full rounded-xl overflow-hidden border border-slate-200/90 bg-slate-900 shadow-inner h-[440px] [&_.leaflet-control-attribution]:hidden">
            <MapContainer
              key={`zone-map-editor-${cityCenter.lat.toFixed(4)}-${cityCenter.lng.toFixed(4)}`}
              center={[cityCenter.lat, cityCenter.lng]}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer attribution="" url={TILE_URLS[baseLayer]} />

              <MapController
                cityBoundary={cityBoundary}
                coordinates={coordinates}
                center={cityCenter}
                isDrawing={toolMode === 'draw'}
                onMapClick={handleMapClick}
                fitTrigger={fitTrigger}
                flyToTarget={flyToTarget}
              />

              <MapControls center={cityCenter} />

              {/* 1. Reference City Boundary (Blue polygon) */}
              {showCityBoundary && cityBoundaryLatLngs && (
                <Polygon
                  positions={cityBoundaryLatLngs}
                  pathOptions={{
                    color: '#2563EB',
                    weight: 2.5,
                    fillColor: '#60A5FA',
                    fillOpacity: 0.14,
                  }}
                />
              )}

              {/* 2. Real Airport Zones (Green) */}
              {showAirportZones &&
                airportZones.map((z) => (
                  <Polygon
                    key={`ap-${z.id}`}
                    positions={z.boundary[0].map(([lng, lat]) => [lat, lng] as [number, number])}
                    pathOptions={{
                      color: '#10B981',
                      weight: 2,
                      fillColor: '#34D399',
                      fillOpacity: 0.35,
                    }}
                  />
                ))}

              {/* 3. Real Restricted Zones (Orange) */}
              {showRestrictedZones &&
                restrictedZones.map((z) => (
                  <Polygon
                    key={`rz-${z.id}`}
                    positions={z.boundary[0].map(([lng, lat]) => [lat, lng] as [number, number])}
                    pathOptions={{
                      color: '#F59E0B',
                      weight: 2,
                      fillColor: '#FBBF24',
                      fillOpacity: 0.35,
                    }}
                  />
                ))}

              {/* 4. Real Existing Service Zones (Purple) */}
              {showServiceZones &&
                serviceZones.map((z) => (
                  <Polygon
                    key={`sz-${z.id}`}
                    positions={z.boundary[0].map(([lng, lat]) => [lat, lng] as [number, number])}
                    pathOptions={{
                      color: '#8B5CF6',
                      weight: 2,
                      fillColor: '#A78BFA',
                      fillOpacity: 0.28,
                    }}
                  />
                ))}

              {/* 5. Active New Zone Polygon (Bright Blue) */}
              {zonePolygonLatLngs && (
                <Polygon
                  positions={zonePolygonLatLngs}
                  pathOptions={{
                    color: '#2563EB',
                    weight: 2.8,
                    fillColor: '#3B82F6',
                    fillOpacity: 0.45,
                  }}
                />
              )}

              {/* In-progress drawing line */}
              {coordinates?.[0] && coordinates[0].length === 2 && (
                <Polyline
                  positions={coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number])}
                  pathOptions={{ color: '#2563EB', weight: 2.5, dashArray: '5, 5' }}
                />
              )}

              {/* Draggable Vertex Handles for New Zone */}
              {uniqueVertices.map(([lng, lat], idx) => (
                <Marker
                  key={`vh-${idx}`}
                  position={[lat, lng]}
                  icon={vertexHandleIcon}
                  draggable={true}
                  eventHandlers={{
                    dragend: (e) => handleVertexDrag(idx, e.target.getLatLng()),
                  }}
                />
              ))}

              {/* Real Labels & Badges on Map */}
              {showLabels && (
                <>
                  {/* City Center Name */}
                  <Marker
                    position={[cityCenter.lat + 0.005, cityCenter.lng - 0.008]}
                    icon={createCityLabelIcon(cityName)}
                  />

                  {/* Airport Zone Badges */}
                  {showAirportZones &&
                    airportZones.map((z) => (
                      <Marker
                        key={`ap-badge-${z.id}`}
                        position={getCentroid(z.boundary)}
                        icon={createZoneBadgeIcon(z.name, '#059669', '#FFFFFF', '✈')}
                      />
                    ))}

                  {/* Restricted Zone Badges */}
                  {showRestrictedZones &&
                    restrictedZones.map((z) => (
                      <Marker
                        key={`rz-badge-${z.id}`}
                        position={getCentroid(z.boundary)}
                        icon={createZoneBadgeIcon(z.name, '#D97706', '#FFFFFF', '⛔')}
                      />
                    ))}

                  {/* Existing Service Zone Badges */}
                  {showServiceZones &&
                    serviceZones.map((z) => (
                      <Marker
                        key={`sz-badge-${z.id}`}
                        position={getCentroid(z.boundary)}
                        icon={createZoneBadgeIcon(z.name, '#7C3AED', '#FFFFFF')}
                      />
                    ))}

                  {/* New Zone Badge - offset slightly if near airport to avoid overlap */}
                  {zonePolygonLatLngs && (
                    <Marker
                      position={[
                        currentAirport && Math.abs(newZoneCenter.lat - currentAirport.lat) < 0.008
                          ? newZoneCenter.lat - 0.0055
                          : newZoneCenter.lat,
                        newZoneCenter.lng,
                      ]}
                      icon={createZoneBadgeIcon(
                        zoneName || (zoneType === 'AIRPORT' ? 'New Airport Zone' : 'New Zone'),
                        '#2563EB',
                        '#FFFFFF',
                        zoneType === 'AIRPORT' ? '✈' : undefined,
                      )}
                    />
                  )}

                  {/* Airport Landmark Pin Marker - only display if there isn't already an existing airport zone badge here */}
                  {currentAirport &&
                    !airportZones.some((z) => {
                      const [cLat, cLng] = getCentroid(z.boundary)
                      return (
                        Math.abs(cLat - currentAirport.lat) < 0.015 &&
                        Math.abs(cLng - currentAirport.lng) < 0.015
                      )
                    }) && (
                      <Marker
                        position={[currentAirport.lat, currentAirport.lng]}
                        icon={createAirportPinIcon(currentAirport.iata, currentAirport.name)}
                        eventHandlers={{
                          click: () => handleLocateAirport(),
                        }}
                      />
                    )}

                  {/* Temporary Search Result Pin */}
                  {searchPin && (
                    <Marker
                      position={[searchPin.lat, searchPin.lng]}
                      icon={createSearchPinIcon(searchPin.name)}
                    />
                  )}
                </>
              )}
            </MapContainer>

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
