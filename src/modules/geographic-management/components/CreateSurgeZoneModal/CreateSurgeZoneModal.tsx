import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  X,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Map as MapIcon,
  Code,
  Hexagon,
  Circle,
  Edit2,
  Trash2,
  RotateCcw,
  Crosshair,
  Plus,
  Minus,
  Maximize2,
  Link2,
  ShieldCheck,
  CheckCircle2,
  Check,
  Loader2,
  Copy,
  Info,
  AlertTriangle,
} from 'lucide-react'
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
import { useQueryClient } from '@tanstack/react-query'
import {
  calculatePolygonAreaKm2,
  calculatePolygonPerimeterKm,
  generateCirclePolygon,
  hasSelfIntersections,
  isPointInsidePolygon,
  CITY_COORDINATE_FALLBACKS,
  type LatLngPoint,
} from '../CreateCityModal/geoUtils'
import {
  useCities,
  useCityZonesWithBoundaries,
} from '../../hooks'
import { useCityMapContext } from '../../hooks/useCityMapContext'
import {
  createSurgeZone,
  getSurgeZone,
  updateSurgeZone,
  listSurgeZones,
  type SurgeZoneDetail,
} from '../../api/surge'
import { useToast } from '@/shared/context/toast/ToastContext'


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

export interface CreateSurgeZoneModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (zone: SurgeZoneDetail) => void
  initialCityCode?: string
  zoneId?: string
  isStandalonePage?: boolean
}

type BaseLayerType = 'map' | 'satellite' | 'terrain'

const TILE_URLS: Record<BaseLayerType, string> = {
  map: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  terrain: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
}

// Map Controller for click events and viewport updates
function MapController({
  cityBoundary,
  coordinates,
  center,
  isDrawing,
  onMapClick,
  fitTrigger,
}: {
  cityBoundary?: number[][][] | null
  coordinates?: number[][][] | null
  center: LatLngPoint
  isDrawing: boolean
  onMapClick: (point: [number, number]) => void
  fitTrigger: number
}) {
  const map = useMap()

  useMapEvents({
    click(e) {
      if (isDrawing) {
        onMapClick([Number(e.latlng.lng.toFixed(6)), Number(e.latlng.lat.toFixed(6))])
      }
    },
  })

  useEffect(() => {
    map.invalidateSize()
    const targetPoly = cityBoundary?.[0]?.length && cityBoundary[0].length >= 3 ? cityBoundary : coordinates
    if (targetPoly?.[0]?.length && targetPoly[0].length >= 3) {
      const bounds = targetPoly[0].map(([lng, lat]) => [lat, lng] as [number, number])
      map.fitBounds(bounds, { padding: [35, 35] })
    } else {
      map.setView([center.lat, center.lng], 12)
    }
  }, [center, cityBoundary, coordinates, fitTrigger, map])

  return null
}

// Map Controls: Zoom in/out and Re-center
function MapControls({ center }: { center: LatLngPoint }) {
  const map = useMap()
  return (
    <div className="absolute top-3 left-3 z-[400] flex flex-col gap-1.5 pointer-events-auto">
      <div className="flex flex-col bg-white/95 backdrop-blur-md rounded-lg border border-slate-200/90 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => map.zoomIn()}
          className="p-1.5 hover:bg-slate-50 text-slate-700 transition-colors flex items-center justify-center border-b border-slate-100 cursor-pointer"
          title="Zoom in"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={() => map.zoomOut()}
          className="p-1.5 hover:bg-slate-50 text-slate-700 transition-colors flex items-center justify-center cursor-pointer"
          title="Zoom out"
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

// Vertex handle icon with white circular disc and blue border
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

// Centered Zone Badge Marker on polygon
const createZoneBadgeIcon = (text: string) => {
  return L.divIcon({
    className: 'zone-center-badge',
    html: `
      <div style="
        background-color: #2563EB;
        color: #FFFFFF;
        font-family: inherit;
        font-size: 11px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 6px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        white-space: nowrap;
        transform: translate(-50%, -50%);
        pointer-events: none;
      ">
        ${text}
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

// City Center Label
const createCityLabelIcon = (cityName: string) => {
  return L.divIcon({
    className: 'city-name-label',
    html: `
      <div style="
        font-family: inherit;
        font-weight: 800;
        font-size: 15px;
        color: #0f172a;
        text-shadow: 0 0 6px #ffffff, 0 0 12px #ffffff;
        white-space: nowrap;
        transform: translate(-50%, -50%);
        pointer-events: none;
      ">
        ${cityName}
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

export const CreateSurgeZoneModal: React.FC<CreateSurgeZoneModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCityCode,
  zoneId,
  isStandalonePage = false,
}) => {
  const isEdit = Boolean(zoneId)
  const qc = useQueryClient()
  const { success: showToastSuccess } = useToast()
  const { data: cities = [] } = useCities(true)


  // Form State
  const [cityCode, setCityCode] = useState(initialCityCode || '')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [hasManuallyEditedCode, setHasManuallyEditedCode] = useState(false)
  const [isActive, setIsActive] = useState<boolean>(true)

  // Geometry & Map Tooling
  const [coordinates, setCoordinates] = useState<number[][][] | null>(null)
  const [toolMode, setToolMode] = useState<'draw' | 'circle' | 'edit'>('draw')
  const [baseLayer, setBaseLayer] = useState<BaseLayerType>('map')
  const [fitTrigger, setFitTrigger] = useState<number>(0)
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false)
  const [jsonText, setJsonText] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [copiedGeoJson, setCopiedGeoJson] = useState(false)

  // Floating Layer Checkbox Toggles
  const [showCityBoundary, setShowCityBoundary] = useState(true)
  const [showServiceZones, setShowServiceZones] = useState(true)
  const [showAirportZones, setShowAirportZones] = useState(true)
  const [showRestrictedZones, setShowRestrictedZones] = useState(true)
  const [showSurgeZones, setShowSurgeZones] = useState(true)

  // Submission Status
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // City Map Context (Boundary + Center)
  const { referenceBoundary, cityCenter: detectedCenter } = useCityMapContext(
    cityCode,
    cities,
  )

  // Active City Center fallback
  const cityCenter: LatLngPoint = useMemo(() => {
    if (detectedCenter) return detectedCenter
    if (cityCode && CITY_COORDINATE_FALLBACKS[cityCode]) {
      return CITY_COORDINATE_FALLBACKS[cityCode]
    }
    const currentCity = cities.find((c) => c.code === cityCode)
    if (currentCity?.code && CITY_COORDINATE_FALLBACKS[currentCity.code]) {
      return CITY_COORDINATE_FALLBACKS[currentCity.code]
    }
    return { lat: 31.634, lng: 74.8723 } // Primary default (Amritsar)
  }, [detectedCenter, cityCode, cities])

  // Boundary fallback so map always shows a clear city boundary
  const cityBoundary: number[][][] | null = useMemo(() => {
    if (referenceBoundary && referenceBoundary[0]?.length >= 3) return referenceBoundary
    return generateCirclePolygon(cityCenter, 9.5, 32)
  }, [referenceBoundary, cityCenter])

  const cityName = useMemo(() => {
    const c = cities.find((item) => item.code === cityCode)
    return c ? c.name : (cityCode || 'City')
  }, [cities, cityCode])

  const prevCityCodeRef = useRef<string>(cityCode)

  // Reset form cleanly whenever opening in create mode
  const resetForm = useCallback(() => {
    setFormError(null)
    const validCities = cities.filter((c) => c.code !== 'GLOBAL')
    const activeCode =
      initialCityCode || (validCities.length > 0 ? validCities[0].code : 'ATQ')
    const activeCity = validCities.find((c) => c.code === activeCode) || validCities[0]
    const activeName = activeCity?.name || 'Amritsar'
    const finalCode = activeCity?.code || activeCode

    setCityCode(finalCode)
    prevCityCodeRef.current = finalCode
    setName(`${activeName} Surge Zone`)
    setCode(`${finalCode}_SURGE`)
    setHasManuallyEditedCode(false)
    setIsActive(true)
    setToolMode('draw')
    const activeCenter =
      (finalCode && CITY_COORDINATE_FALLBACKS[finalCode]) || { lat: 31.634, lng: 74.8723 }
    setCoordinates(generateCirclePolygon(activeCenter, 2.0, 8))
    setFitTrigger((prev) => prev + 1)
  }, [cities, initialCityCode])

  // Reset form whenever modal opens in create mode
  const wasOpenRef = useRef(false)
  useEffect(() => {
    if (isOpen && !wasOpenRef.current && !isEdit) {
      resetForm()
    }
    wasOpenRef.current = isOpen
  }, [isOpen, isEdit, resetForm])

  // Track city change and immediately reseed geometry, name, and camera
  useEffect(() => {
    if (!isEdit && cityCode) {
      if (prevCityCodeRef.current !== cityCode) {
        setCoordinates(generateCirclePolygon(cityCenter, 2.0, 8))
        setName(`${cityName} Surge Zone`)
        setCode(`${cityCode}_SURGE`)
        setHasManuallyEditedCode(false)
        setFitTrigger((prev) => prev + 1)
        prevCityCodeRef.current = cityCode
      }
    }
  }, [isEdit, cityCode, cityName, cityCenter])

  // Automatically suggest name & code based on selected city if not edited
  useEffect(() => {
    if (!zoneId && cityName && cityName !== 'City') {
      setName((prev) => (!prev || prev.includes('Surge Zone') ? `${cityName} Surge Zone` : prev))
      setCode((prev) => (!prev || prev.endsWith('_SURGE') ? `${cityCode || 'ZONE'}_SURGE` : prev))
    }
  }, [cityName, cityCode, zoneId])

  // Contextual Service Zones in this City
  const { zones: existingServiceZones } = useCityZonesWithBoundaries(cityCode)

  // Contextual Existing Surge Zones
  const [existingSurgeZones, setExistingSurgeZones] = useState<SurgeZoneDetail[]>([])
  useEffect(() => {
    let cancelled = false
    void listSurgeZones()
      .then(async (list) => {
        if (cancelled) return
        const citySurge = list.filter((s) => s.cityCode === cityCode && s.id !== zoneId)
        const detailed = await Promise.all(
          citySurge.map(async (item) => {
            try {
              return await getSurgeZone(item.id)
            } catch {
              return null
            }
          }),
        )
        if (!cancelled) {
          setExistingSurgeZones(detailed.filter((d): d is SurgeZoneDetail => Boolean(d?.boundary?.length)))
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [cityCode, zoneId])

  // Categorized Existing Zones
  const airportZones = useMemo(
    () => existingServiceZones.filter((z) => z.zoneType === 'AIRPORT' && z.boundary?.[0]?.length >= 3),
    [existingServiceZones],
  )
  const restrictedZones = useMemo(
    () => existingServiceZones.filter((z) => z.zoneType === 'RESTRICTED' && z.boundary?.[0]?.length >= 3),
    [existingServiceZones],
  )
  const serviceZones = useMemo(
    () => existingServiceZones.filter((z) => z.zoneType === 'SERVICE' && z.boundary?.[0]?.length >= 3),
    [existingServiceZones],
  )

  // Initialize City Selection
  useEffect(() => {
    const validCities = cities.filter((c) => c.code !== 'GLOBAL')
    if (!validCities.length) return
    if (!cityCode || !validCities.some((c) => c.code === cityCode)) {
      const preferred =
        (initialCityCode && validCities.find((c) => c.code === initialCityCode)) ||
        validCities[0]
      if (preferred) {
        setCityCode(preferred.code)
      }
    }
  }, [cities, cityCode, initialCityCode])

  // Auto-generate code when city or name changes
  useEffect(() => {
    if (!hasManuallyEditedCode && cityCode) {
      const prefix = cityCode
      const suffix = name
        .replace(new RegExp(`^${cityName}`, 'i'), '')
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .toUpperCase()
      const gen = suffix ? `${prefix}_${suffix}` : `${prefix}_SURGE`
      setCode(gen.replace(/_SURGE_SURGE$/, '_SURGE'))
    }
  }, [cityCode, cityName, name, hasManuallyEditedCode])

  // Seed default 8-point polygon centered on city
  useEffect(() => {
    if (!isEdit && (!coordinates || !coordinates[0]?.length) && cityCenter) {
      const defaultRing = generateCirclePolygon(cityCenter, 2.0, 8)
      setCoordinates(defaultRing)
    }
  }, [isEdit, coordinates, cityCenter])

  // Load existing zone data for edit mode
  useEffect(() => {
    if (isEdit && zoneId) {
      void getSurgeZone(zoneId).then((data) => {
        if (data) {
          setName(data.name)
          setCityCode(data.cityCode)
          setIsActive(data.isActive)
          if (data.boundary?.[0]?.length >= 3) {
            setCoordinates(data.boundary)
          }
        }
      })
    }
  }, [isEdit, zoneId])

  // Unique vertices excluding duplicate closing point
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

  const pointsCount = uniqueVertices.length > 0 ? uniqueVertices.length : 0

  const areaKm2 = useMemo(() => {
    const a = calculatePolygonAreaKm2(coordinates)
    return a > 0 ? a : 0
  }, [coordinates])

  const perimeterKm = useMemo(() => {
    const p = calculatePolygonPerimeterKm(coordinates)
    return p > 0 ? p : 0
  }, [coordinates])

  // Centroid for Zone Center Badge
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
    return cityCenter
  }, [uniqueVertices, cityCenter])

  // LatLng arrays for rendering
  const cityBoundaryLatLngs = useMemo(() => {
    if (!cityBoundary?.[0] || cityBoundary[0].length < 3) return null
    return cityBoundary[0].map(([lng, lat]) => [lat, lng] as [number, number])
  }, [cityBoundary])

  const zonePolygonLatLngs = useMemo(() => {
    if (!coordinates?.[0] || coordinates[0].length < 3) return null
    return coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number])
  }, [coordinates])

  // Validation Flags
  const isInsideCity = useMemo(() => {
    if (!cityBoundary?.[0] || !coordinates?.[0] || coordinates[0].length < 3) return false
    return coordinates[0].every(([lng, lat]) => isPointInsidePolygon({ lng, lat }, cityBoundary))
  }, [cityBoundary, coordinates])

  const noIntersections = useMemo(() => !hasSelfIntersections(coordinates), [coordinates])
  const isAreaValid = areaKm2 > 0.05
  const allConnected = Boolean(coordinates?.[0] && coordinates[0].length >= 4)
  const isOverallValid = isInsideCity && noIntersections && isAreaValid && allConnected

  // Map Click to Add Point
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
    [coordinates, toolMode],
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
    [coordinates],
  )

  // Action: Draw Circle
  const handleDrawCircle = () => {
    setToolMode('circle')
    const circle = generateCirclePolygon(newZoneCenter, 2.0, 8)
    setCoordinates(circle)
  }

  // Action: Delete last vertex
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

  // Action: Clear All
  const handleClearAll = () => {
    setCoordinates(null)
    setToolMode('draw')
  }

  // Action: Fit to City
  const handleFitToCity = () => {
    setFitTrigger((prev) => prev + 1)
  }

  // Open JSON Editor Modal
  const handleOpenJsonEditor = () => {
    const geoJson = {
      type: 'Polygon',
      coordinates: coordinates || [],
    }
    setJsonText(JSON.stringify(geoJson, null, 2))
    setJsonError(null)
    setIsJsonModalOpen(true)
  }

  // Apply JSON Changes
  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText)
      if (parsed.type !== 'Polygon' || !Array.isArray(parsed.coordinates)) {
        throw new Error('Expected GeoJSON geometry of type Polygon with coordinates array')
      }
      setCoordinates(parsed.coordinates)
      setIsJsonModalOpen(false)
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON')
    }
  }

  // Handle Form Submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setFormError(null)

    if (!cityCode) {
      setFormError('Please select a city.')
      return
    }
    if (!name.trim()) {
      setFormError('Please enter a zone name.')
      return
    }
    if (!coordinates?.[0]?.length || coordinates[0].length < 3) {
      setFormError('Please draw a valid zone polygon on the map.')
      return
    }
    if (!noIntersections) {
      setFormError('The drawn zone geometry has self-intersections. Please adjust the vertices.')
      return
    }

    try {
      setIsSubmitting(true)
      if (isEdit && zoneId) {
        await updateSurgeZone(zoneId, {
          name: name.trim(),
          isActive,
          coordinates,
        })
        const updated = await getSurgeZone(zoneId)
        void qc.invalidateQueries({ queryKey: ['surge-zones'] })
        void qc.invalidateQueries({ queryKey: ['surge-zone', zoneId] })
        showToastSuccess(
          'Surge Zone Updated',
          `Surge zone "${name.trim()}" has been updated successfully.`,
        )
        onSuccess?.(updated)
        onClose()
      } else {
        const created = await createSurgeZone({
          cityCode,
          name: name.trim(),
          coordinates,
        })
        void qc.invalidateQueries({ queryKey: ['surge-zones'] })
        showToastSuccess(
          'Surge Zone Created',
          `Surge zone "${name.trim()}" has been created successfully for ${cityName}.`,
        )
        resetForm()
        onSuccess?.(created)
        onClose()
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ??
        (err as Error)?.message ??
        'Failed to save surge zone'
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen && !isStandalonePage) return null

  const modalBody = (
    <div className="w-full bg-white flex flex-col flex-1 overflow-hidden">
      {/* ── Top Header matching screenshot ──────────────────────── */}
      <div className="shrink-0 px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Create Surge Zone</span>
            </h1>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Define an area where dynamic pricing (surge) will be applied during specific time windows.
            </p>
          </div>
        </div>

        {!isStandalonePage && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── Error Banner ────────────────────────────────────────── */}
      {formError && (
        <div className="mx-5 mt-2.5 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {formError}
        </div>
      )}

      {/* ── Main 2-Column Content Layout (no scroll) ────────────── */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ── LEFT COLUMN: Zone Information & Surge Config ─────── */}
          <div className="lg:col-span-4 space-y-3.5">
            {/* 1. Zone Information Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2 text-slate-900">
                <MapPin className="w-4 h-4 text-[#1F2B6D]" />
                <h2 className="text-sm font-bold">Zone Information</h2>
              </div>

              {/* City Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  City <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={cityCode}
                    onChange={(e) => {
                      const newCode = e.target.value
                      setCityCode(newCode)
                      setHasManuallyEditedCode(false)
                      const targetCity = cities.find((c) => c.code === newCode)
                      const targetName = targetCity?.name || newCode
                      setName(`${targetName} Surge Zone`)
                      setCode(`${newCode}_SURGE`)
                      const newCenter =
                        CITY_COORDINATE_FALLBACKS[newCode] || { lat: 31.634, lng: 74.8723 }
                      setCoordinates(generateCirclePolygon(newCenter, 2.0, 8))
                      setFitTrigger((prev) => prev + 1)
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
                  >
                    {cities
                      .filter((c) => c.code !== 'GLOBAL')
                      .map((c) => (
                        <option key={c.id} value={c.code}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Zone Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Zone Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`e.g. ${cityName || 'City'} Surge Zone`}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              {/* Zone Code */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Zone Code
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase())
                      setHasManuallyEditedCode(true)
                    }}
                    placeholder={`${cityCode || 'CITY'}_SURGE`}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-24 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                  <div className="absolute right-2.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md pointer-events-none">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                    <span>Available</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-normal leading-normal">
                  Auto-generated from city and zone name. You can edit if needed.
                </p>
              </div>

              {/* Active Toggle */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <div>
                  <span className="text-xs font-semibold text-slate-800">Zone Status</span>
                  <p className="text-[11px] text-slate-500">Enable or disable surge pricing in this area</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isActive ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                  title={isActive ? 'Deactivate Zone' : 'Activate Zone'}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Dynamic Surge Guidance Note */}
            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100/90 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs text-blue-950">
                <p className="font-semibold text-blue-900">Dynamic Multipliers</p>
                <p className="text-[11px] text-blue-800/90 leading-relaxed font-normal">
                  Surge multipliers (1.0x – 2.0x) and active time windows are scheduled under{' '}
                  <span className="font-semibold text-blue-900">Pricing Management &gt; Surge Windows</span>.
                </p>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Map, Geometry & Validation ─────────── */}
          <div className="lg:col-span-8 flex flex-col space-y-3">
            {/* 3. Define Zone on Map Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-2.5">
              {/* Header and Edit JSON */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-slate-900">
                    <MapIcon className="w-4 h-4 text-[#1F2B6D]" />
                    <h2 className="text-sm font-bold">Define Zone on Map</h2>
                  </div>
                  <p className="text-xs text-slate-500 font-normal mt-0.5">
                    Draw a polygon or circle on the map to define the surge zone boundary.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenJsonEditor}
                  className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Edit JSON</span>
                </button>
              </div>

              {/* Map Toolbar */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setToolMode('draw')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    toolMode === 'draw'
                      ? 'bg-[#1F2B6D] text-white shadow-xs'
                      : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Hexagon className="w-3.5 h-3.5" />
                  <span>Draw Polygon</span>
                </button>

                <button
                  type="button"
                  onClick={handleDrawCircle}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    toolMode === 'circle'
                      ? 'bg-[#1F2B6D] text-white shadow-xs'
                      : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Circle className="w-3.5 h-3.5" />
                  <span>Draw Circle</span>
                </button>

                <button
                  type="button"
                  onClick={() => setToolMode('edit')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    toolMode === 'edit'
                      ? 'bg-[#1F2B6D] text-white shadow-xs'
                      : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>

                <button
                  type="button"
                  onClick={handleFitToCity}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Fit to City</span>
                </button>
              </div>

              {/* Map Container */}
              <div className="relative w-full h-[255px] lg:h-[265px] rounded-xl overflow-hidden border border-slate-200/90">
                <MapContainer
                  key={`surge-map-editor-${cityCode}-${cityCenter.lat.toFixed(4)}-${cityCenter.lng.toFixed(4)}`}
                  center={[cityCenter.lat, cityCenter.lng]}
                  zoom={12}
                  style={{ width: '100%', height: '100%' }}
                  zoomControl={false}
                >
                  <TileLayer url={TILE_URLS[baseLayer]} attribution="&copy; OpenStreetMap" />

                  <MapController
                    cityBoundary={cityBoundary}
                    coordinates={coordinates}
                    center={cityCenter}
                    isDrawing={toolMode === 'draw'}
                    onMapClick={handleMapClick}
                    fitTrigger={fitTrigger}
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
                        fillOpacity: 0.12,
                        dashArray: '5, 5',
                      }}
                    />
                  )}

                  {/* 2. Existing Airport Zones */}
                  {showAirportZones &&
                    airportZones.map((z) => (
                      <Polygon
                        key={`ap-${z.id}`}
                        positions={z.boundary[0].map(([lng, lat]) => [lat, lng] as [number, number])}
                        pathOptions={{
                          color: '#059669',
                          weight: 2,
                          fillColor: '#10B981',
                          fillOpacity: 0.25,
                        }}
                      />
                    ))}

                  {/* 3. Existing Restricted Zones */}
                  {showRestrictedZones &&
                    restrictedZones.map((z) => (
                      <Polygon
                        key={`rz-${z.id}`}
                        positions={z.boundary[0].map(([lng, lat]) => [lat, lng] as [number, number])}
                        pathOptions={{
                          color: '#D97706',
                          weight: 2,
                          fillColor: '#F59E0B',
                          fillOpacity: 0.25,
                        }}
                      />
                    ))}

                  {/* 4. Existing Service Zones */}
                  {showServiceZones &&
                    serviceZones.map((z) => (
                      <Polygon
                        key={`sz-${z.id}`}
                        positions={z.boundary[0].map(([lng, lat]) => [lat, lng] as [number, number])}
                        pathOptions={{
                          color: '#8B5CF6',
                          weight: 2,
                          fillColor: '#A78BFA',
                          fillOpacity: 0.22,
                        }}
                      />
                    ))}

                  {/* 5. Existing Surge Zones */}
                  {showSurgeZones &&
                    existingSurgeZones.map((z) => (
                      <Polygon
                        key={`ex-surge-${z.id}`}
                        positions={z.boundary[0].map(([lng, lat]) => [lat, lng] as [number, number])}
                        pathOptions={{
                          color: '#7C3AED',
                          weight: 2,
                          fillColor: '#C084FC',
                          fillOpacity: 0.26,
                        }}
                      />
                    ))}

                  {/* 6. Active New Surge Zone Polygon */}
                  {zonePolygonLatLngs && (
                    <Polygon
                      positions={zonePolygonLatLngs}
                      pathOptions={{
                        color: '#2563EB',
                        weight: 2.8,
                        fillColor: '#3B82F6',
                        fillOpacity: 0.42,
                      }}
                    />
                  )}

                  {/* Drawing in-progress dashed preview line */}
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

                  {/* City Center Label */}
                  <Marker
                    position={[cityCenter.lat + 0.005, cityCenter.lng - 0.008]}
                    icon={createCityLabelIcon(cityName)}
                  />

                  {/* Active Zone Label Badge */}
                  {zonePolygonLatLngs && (
                    <Marker
                      position={[newZoneCenter.lat, newZoneCenter.lng]}
                      icon={createZoneBadgeIcon(name || `${cityName} Surge Zone`)}
                    />
                  )}
                </MapContainer>

                {/* Floating Layers Selector Overlay (Top Right) */}
                <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-md p-2.5 pointer-events-auto text-xs font-semibold space-y-1.5 min-w-[150px]">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-800">
                    <input
                      type="checkbox"
                      checked={showCityBoundary}
                      onChange={(e) => setShowCityBoundary(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block"></span>
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
                      <span className="w-2.5 h-2.5 rounded bg-purple-400 inline-block"></span>
                      <span>Service Zones</span>
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
                      <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
                      <span>Airport Zones</span>
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
                      <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span>
                      <span>Restricted Zones</span>
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
                    <input
                      type="checkbox"
                      checked={showSurgeZones}
                      onChange={(e) => setShowSurgeZones(e.target.checked)}
                      className="rounded text-violet-600 focus:ring-violet-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-violet-500 inline-block"></span>
                      <span>Surge Zones</span>
                    </span>
                  </label>
                </div>

                {/* Floating Base Layer Switcher (Bottom Right) */}
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

                {/* Floating Scale Indicator (Bottom Left) */}
                <div className="absolute bottom-3 left-3 z-[400] pointer-events-none">
                  <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-200/90 text-[10.5px] font-bold text-slate-800 shadow-xs flex items-center gap-2">
                    <span className="w-10 border-b-2 border-slate-800 inline-block"></span>
                    <span>5 km</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row under Map: Zone Geometry & Validation */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* 4. Zone Geometry Card */}
              <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs space-y-2">
                <div className="flex items-center gap-2 text-slate-900">
                  <Hexagon className="w-4 h-4 text-[#1F2B6D]" />
                  <h3 className="text-xs font-bold">Zone Geometry</h3>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/70 border border-slate-100">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium leading-none">Points</p>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">{pointsCount}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/70 border border-slate-100">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium leading-none">Area</p>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">{areaKm2} km²</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/70 border border-slate-100">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                      <Link2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium leading-none">Perimeter</p>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">{perimeterKm} km</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Validation Card */}
              <div
                className={`md:col-span-5 border rounded-2xl p-3 shadow-2xs space-y-1.5 ${
                  isOverallValid
                    ? 'bg-emerald-50/70 border-emerald-100/90'
                    : 'bg-amber-50/70 border-amber-200/90'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    className={`w-4 h-4 ${
                      isOverallValid ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  />
                  <h3
                    className={`text-xs font-bold ${
                      isOverallValid ? 'text-emerald-800' : 'text-amber-900'
                    }`}
                  >
                    Validation {isOverallValid ? 'Passed' : 'Issues'}
                  </h3>
                </div>

                <div className="space-y-1 text-[11px] font-medium">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isInsideCity ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    />
                    <span className={isInsideCity ? 'text-slate-700' : 'text-red-700 font-semibold'}>
                      {isInsideCity
                        ? 'Zone is completely inside city boundary'
                        : 'Zone extends outside city boundary'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        noIntersections ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    />
                    <span className={noIntersections ? 'text-slate-700' : 'text-red-700 font-semibold'}>
                      Valid geometry (no self-intersections)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isAreaValid ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    />
                    <span className={isAreaValid ? 'text-slate-700' : 'text-red-700 font-semibold'}>
                      Minimum area requirement met ({areaKm2} km²)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        allConnected ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    />
                    <span className={allConnected ? 'text-slate-700' : 'text-red-700 font-semibold'}>
                      All points connected ({pointsCount} vertices)
                    </span>
                  </div>
                </div>

                {!isInsideCity && (
                  <div className="mt-2 pt-2 border-t border-amber-200/80 text-[10.5px] text-amber-900 leading-snug flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>The surge zone boundary extends outside {cityName}&apos;s registered city boundary. Drag the vertices inside the blue boundary line.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer matching screenshot ──────────────────────────── */}
      <div className="shrink-0 px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-white">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={isSubmitting || !isOverallValid}
          className="px-6 py-2 bg-[#1F2B6D] hover:bg-[#162055] disabled:opacity-50 text-white rounded-xl font-semibold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving…</span>
            </>
          ) : (
            <>
              <span>{isEdit ? 'Save Changes' : 'Create Surge Zone'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* ── Edit JSON Modal ─────────────────────────────────────── */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-[600] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Code className="w-4 h-4 text-[#1F2B6D]" />
                <span>Edit GeoJSON Geometry</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsJsonModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {jsonError && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                {jsonError}
              </p>
            )}

            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={12}
              className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(jsonText)
                  setCopiedGeoJson(true)
                  setTimeout(() => setCopiedGeoJson(false), 2000)
                }}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                {copiedGeoJson ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsJsonModalOpen(false)}
                  className="px-4 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyJson}
                  className="px-4 py-1.5 bg-[#1F2B6D] hover:bg-[#162055] text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (isStandalonePage) {
    return (
      <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {modalBody}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-6xl xl:max-w-7xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden my-auto"
      >
        {modalBody}
      </div>
    </div>
  )
}

export default CreateSurgeZoneModal
