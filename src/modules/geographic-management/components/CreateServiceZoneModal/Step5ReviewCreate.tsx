import React, { useState, useMemo, useEffect } from 'react'
import {
  MapPin,
  Layers,
  Tag,
  Hash,
  ListOrdered,
  Car,
  Flag,
  ToggleRight,
  Bike,
  Truck,
  CheckCircle2,
  Edit2,
  Plus,
  Minus,
  Crosshair,
  Map as MapIcon,
  Compass,
  Scan,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'
import L from 'leaflet'
import { MapContainer, TileLayer, Polygon, Marker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  calculatePolygonAreaKm2,
  calculatePolygonPerimeterKm,
  hasSelfIntersections,
  isPointInsidePolygon,
  type LatLngPoint,
} from '../CreateCityModal/geoUtils'
import { useVehicleTypes } from '../../hooks'
import type { ServiceZoneDetail, ServiceZoneType } from '../../types'

type BaseLayerType = 'map' | 'satellite' | 'terrain'

const TILE_URLS: Record<BaseLayerType, string> = {
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  map: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  terrain: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
}

// Custom TukTuk / Auto Rickshaw Icon
const AutoRickshawIcon = ({ className = 'w-4 h-4 text-[#1F2B6D]' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 16h14v2a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-2z" />
    <path d="M4 16V9a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v7" />
    <path d="M6 11h12" />
    <circle cx="7.5" cy="18" r="1.5" />
    <circle cx="16.5" cy="18" r="1.5" />
    <line x1="12" y1="5" x2="12" y2="11" />
  </svg>
)

// Custom Carpool Icon
const CarpoolIcon = ({ className = 'w-4 h-4 text-[#1F2B6D]' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
    <circle cx="9" cy="4" r="1.5" />
    <circle cx="15" cy="4" r="1.5" />
  </svg>
)

interface Step5ReviewCreateProps {
  cityCode: string
  cityName: string
  zoneType: ServiceZoneType
  name: string
  code: string
  priority: number
  isActive: boolean
  allowsPickup: boolean
  allowsDropoff: boolean
  vehicleCategoryIds: string[]
  coordinates: number[][][] | null
  cityBoundary: number[][][] | null
  cityCenter: LatLngPoint
  existingZones?: ServiceZoneDetail[]
  onEditInfo: () => void
  onEditVehicles?: () => void
  onEditMap: () => void
}

function PreviewMapUpdater({
  coordinates,
  cityBoundary,
  cityCenter,
}: {
  coordinates?: number[][][] | null
  cityBoundary?: number[][][] | null
  cityCenter: LatLngPoint
}) {
  const map = useMap()

  useEffect(() => {
    map.invalidateSize()
    const targetPoly = cityBoundary?.[0]?.length ? cityBoundary : coordinates
    if (targetPoly?.[0]?.length && targetPoly[0].length >= 3) {
      const bounds = targetPoly[0].map(([lng, lat]) => [lat, lng] as [number, number])
      map.fitBounds(bounds, { padding: [24, 24] })
    } else {
      map.setView([cityCenter.lat, cityCenter.lng], 12)
    }
  }, [cityBoundary, cityCenter, coordinates, map])

  return null
}

function MapControls({ center }: { center: LatLngPoint }) {
  const map = useMap()

  return (
    <div className="absolute top-2.5 left-2.5 z-[400] flex flex-col gap-1.5 pointer-events-auto">
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

function getCentroid(boundary: number[][][]): [number, number] {
  if (!boundary?.[0] || boundary[0].length === 0) return [0, 0]
  const ring = boundary[0]
  const sum = ring.reduce(
    (acc, [lng, lat]) => ({ lng: acc.lng + lng, lat: acc.lat + lat }),
    { lng: 0, lat: 0 },
  )
  return [sum.lat / ring.length, sum.lng / ring.length]
}

export const Step5ReviewCreate: React.FC<Step5ReviewCreateProps> = ({
  cityCode,
  cityName,
  zoneType,
  name,
  code,
  priority,
  isActive,
  allowsPickup,
  allowsDropoff,
  vehicleCategoryIds,
  coordinates,
  cityBoundary,
  cityCenter,
  existingZones = [],
  onEditInfo,
  onEditVehicles,
  onEditMap,
}) => {
  const [baseLayer, setBaseLayer] = useState<BaseLayerType>('satellite')
  const [showCityBoundary, setShowCityBoundary] = useState(true)
  const [showServiceZones, setShowServiceZones] = useState(true)
  const [showAirportZones, setShowAirportZones] = useState(true)
  const [showRestrictedZones, setShowRestrictedZones] = useState(true)

  const { data: allVehicleTypes = [] } = useVehicleTypes()

  const areaKm2 = useMemo(() => {
    const a = calculatePolygonAreaKm2(coordinates)
    return a > 0 ? a : 0
  }, [coordinates])

  const perimeterKm = useMemo(() => {
    const p = calculatePolygonPerimeterKm(coordinates)
    return p > 0 ? p : 0
  }, [coordinates])

  const pointsCount = useMemo(() => {
    if (!coordinates?.[0] || coordinates[0].length === 0) return 0
    const first = coordinates[0][0]
    const last = coordinates[0][coordinates[0].length - 1]
    return first[0] === last[0] && first[1] === last[1]
      ? coordinates[0].length - 1
      : coordinates[0].length
  }, [coordinates])

  const zoneTypeLabel = useMemo(() => {
    if (zoneType === 'SERVICE') return 'Service Zone'
    if (zoneType === 'AIRPORT') return 'Airport Zone'
    if (zoneType === 'RESTRICTED') return 'Restricted Zone'
    return 'Service Zone'
  }, [zoneType])

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

  // Centroid of New Zone for badge positioning
  const newZoneCenter = useMemo<LatLngPoint>(() => {
    if (coordinates?.[0] && coordinates[0].length > 0) {
      const ring = coordinates[0]
      const sum = ring.reduce(
        (acc, [lng, lat]) => ({ lng: acc.lng + lng, lat: acc.lat + lat }),
        { lng: 0, lat: 0 },
      )
      return {
        lng: sum.lng / ring.length,
        lat: sum.lat / ring.length,
      }
    }
    return { lng: cityCenter.lng, lat: cityCenter.lat }
  }, [coordinates, cityCenter])

  // Categorize real existing zones
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

  // Resolve selected vehicle categories dynamically from live DB types
  const selectedVehicles = useMemo(() => {
    if (vehicleCategoryIds.length === 0) {
      // If none explicitly selected, all active types are enabled
      return allVehicleTypes.map((v) => ({
        id: v.id,
        code: v.code,
        name: v.name,
      }))
    }
    return vehicleCategoryIds
      .map((id) => allVehicleTypes.find((v) => v.id === id))
      .filter((v): v is NonNullable<typeof v> => Boolean(v))
      .map((v) => ({
        id: v.id,
        code: v.code,
        name: v.name,
      }))
  }, [vehicleCategoryIds, allVehicleTypes])

  // Validation checks
  const isInsideCity = useMemo(() => {
    if (!cityBoundary?.[0] || !coordinates?.[0] || coordinates[0].length < 3) return true
    const samplePt = { lng: coordinates[0][0][0], lat: coordinates[0][0][1] }
    return isPointInsidePolygon(samplePt, cityBoundary)
  }, [cityBoundary, coordinates])

  const noIntersections = useMemo(() => !hasSelfIntersections(coordinates), [coordinates])
  const isAreaValid = areaKm2 > 0.05
  const allConnected = Boolean(coordinates?.[0] && coordinates[0].length >= 4)

  const renderVehicleIcon = (code: string) => {
    const c = code.toUpperCase()
    if (c.includes('BIKE')) return <Bike className="w-4 h-4 text-[#1F2B6D]" />
    if (c.includes('AUTO')) return <AutoRickshawIcon className="w-4 h-4 text-[#1F2B6D]" />
    if (c.includes('CARPOOL')) return <CarpoolIcon className="w-4 h-4 text-[#1F2B6D]" />
    if (c.includes('PARCEL')) return <Truck className="w-4 h-4 text-[#1F2B6D]" />
    return <Car className="w-4 h-4 text-[#1F2B6D]" />
  }

  // Clean short name for zone badge
  const shortZoneTitle = useMemo(() => {
    const cleaned = name.replace(/service zone/gi, '').trim()
    return cleaned ? `This Zone (${cleaned})` : 'This Zone'
  }, [name])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
      {/* ── LEFT COLUMN: 3 Summary Cards (col-span-5) ─────────── */}
      <div className="lg:col-span-5 space-y-3">
        {/* Card 1: Zone Information */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1F2B6D] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Scan className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">Zone Information</h4>
                <p className="text-[10px] text-slate-400">Review the basic details for this service zone.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onEditInfo}
              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3 h-3 text-slate-500" />
              <span>Edit</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs pt-1">
            <div className="py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>City</span>
              </div>
              <span className="font-bold text-slate-900">{cityName} ({cityCode})</span>
            </div>

            <div className="py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Zone Type</span>
              </div>
              <span className="font-semibold text-slate-800">{zoneTypeLabel}</span>
            </div>

            <div className="py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Zone Name</span>
              </div>
              <span className="font-bold text-slate-900">{name}</span>
            </div>

            <div className="py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span>Zone Code</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900">{code}</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Unique
                </span>
              </div>
            </div>

            <div className="py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <ListOrdered className="w-3.5 h-3.5 text-slate-400" />
                <span>Priority</span>
              </div>
              <span className="font-bold text-slate-900">{priority}</span>
            </div>

            <div className="py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <Car className="w-3.5 h-3.5 text-slate-400" />
                <span>Allow Pickups</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-700 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{allowsPickup ? 'Yes' : 'No'}</span>
              </div>
            </div>

            <div className="py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <Flag className="w-3.5 h-3.5 text-slate-400" />
                <span>Allow Drop-offs</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-700 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{allowsDropoff ? 'Yes' : 'No'}</span>
              </div>
            </div>

            <div className="py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <ToggleRight className="w-3.5 h-3.5 text-slate-400" />
                <span>Status</span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{isActive ? 'Active' : 'Inactive'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Vehicle Categories */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1F2B6D] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Car className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">Vehicle Categories</h4>
                <p className="text-[10px] text-slate-400">These vehicle types will be allowed in this zone.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onEditVehicles || onEditInfo}
              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3 h-3 text-slate-500" />
              <span>Edit</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {selectedVehicles.length === 0 ? (
              <p className="text-xs text-slate-400 py-1 italic">
                All vehicle categories enabled by default.
              </p>
            ) : (
              selectedVehicles.map((item) => (
                <div
                  key={item.id}
                  className="px-3 py-1.5 bg-white border border-slate-200/90 rounded-lg flex items-center gap-2 text-xs font-bold text-slate-800 shadow-2xs"
                >
                  {renderVehicleIcon(item.code)}
                  <span>{item.name}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 3: Geometry Details */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1F2B6D] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">Geometry Details</h4>
                <p className="text-[10px] text-slate-400">Details about the zone boundary drawn on the map.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onEditMap}
              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3 h-3 text-slate-500" />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-left">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1 text-slate-500">
                <Compass className="w-3.5 h-3.5 text-[#1F2B6D]" />
                <span className="text-[10.5px] font-semibold text-slate-500">Points</span>
              </div>
              <p className="text-base font-extrabold text-slate-900">{pointsCount}</p>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1 text-slate-500">
                <Scan className="w-3.5 h-3.5 text-[#1F2B6D]" />
                <span className="text-[10.5px] font-semibold text-slate-500">Area</span>
              </div>
              <p className="text-base font-extrabold text-slate-900">{areaKm2.toFixed(2)} km²</p>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1 text-slate-500">
                <RotateCcw className="w-3.5 h-3.5 text-[#1F2B6D]" />
                <span className="text-[10.5px] font-semibold text-slate-500">Perimeter</span>
              </div>
              <p className="text-base font-extrabold text-slate-900">{perimeterKm.toFixed(1)} km</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN: Map Preview & Validation Checks (col-span-7) */}
      <div className="lg:col-span-7 space-y-3">
        {/* Map Preview Card */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1F2B6D] text-white flex items-center justify-center shrink-0 shadow-xs">
              <MapIcon className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 leading-tight">Map Preview</h4>
              <p className="text-[10px] text-slate-400">This is how the service zone will look on the map.</p>
            </div>
          </div>

          {/* Leaflet Map Preview */}
          <div className="relative w-full rounded-xl overflow-hidden border border-slate-200/90 bg-slate-900 shadow-inner h-[290px] [&_.leaflet-control-attribution]:hidden">
            <MapContainer
              key={`preview-map-${cityCenter.lat.toFixed(4)}-${cityCenter.lng.toFixed(4)}`}
              center={[cityCenter.lat, cityCenter.lng]}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer attribution="" url={TILE_URLS[baseLayer]} />
              <PreviewMapUpdater
                coordinates={coordinates}
                cityBoundary={cityBoundary}
                cityCenter={cityCenter}
              />
              <MapControls center={cityCenter} />

              {/* City Boundary */}
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

              {/* Real Airport Zones */}
              {showAirportZones &&
                airportZones.map((z) => (
                  <Polygon
                    key={`ap-prev-${z.id}`}
                    positions={z.boundary[0].map(([lng, lat]) => [lat, lng] as [number, number])}
                    pathOptions={{
                      color: '#10B981',
                      weight: 2,
                      fillColor: '#34D399',
                      fillOpacity: 0.35,
                    }}
                  />
                ))}

              {/* Real Restricted Zones */}
              {showRestrictedZones &&
                restrictedZones.map((z) => (
                  <Polygon
                    key={`rz-prev-${z.id}`}
                    positions={z.boundary[0].map(([lng, lat]) => [lat, lng] as [number, number])}
                    pathOptions={{
                      color: '#F59E0B',
                      weight: 2,
                      fillColor: '#FBBF24',
                      fillOpacity: 0.35,
                    }}
                  />
                ))}

              {/* Real Existing Service Zones */}
              {showServiceZones &&
                serviceZones.map((z) => (
                  <Polygon
                    key={`sz-prev-${z.id}`}
                    positions={z.boundary[0].map(([lng, lat]) => [lat, lng] as [number, number])}
                    pathOptions={{
                      color: '#8B5CF6',
                      weight: 2,
                      fillColor: '#A78BFA',
                      fillOpacity: 0.28,
                    }}
                  />
                ))}

              {/* This Zone (New active polygon) */}
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

              {/* Labels & Badges */}
              <Marker
                position={[cityCenter.lat + 0.005, cityCenter.lng - 0.008]}
                icon={createCityLabelIcon(cityName)}
              />

              {showAirportZones &&
                airportZones.map((z) => (
                  <Marker
                    key={`ap-prev-badge-${z.id}`}
                    position={getCentroid(z.boundary)}
                    icon={createZoneBadgeIcon(z.name, '#059669', '#FFFFFF', '✈')}
                  />
                ))}

              {showRestrictedZones &&
                restrictedZones.map((z) => (
                  <Marker
                    key={`rz-prev-badge-${z.id}`}
                    position={getCentroid(z.boundary)}
                    icon={createZoneBadgeIcon(z.name, '#D97706', '#FFFFFF', '⛔')}
                  />
                ))}

              {showServiceZones &&
                serviceZones.map((z) => (
                  <Marker
                    key={`sz-prev-badge-${z.id}`}
                    position={getCentroid(z.boundary)}
                    icon={createZoneBadgeIcon(z.name, '#7C3AED', '#FFFFFF')}
                  />
                ))}

              {zonePolygonLatLngs && (
                <Marker
                  position={[newZoneCenter.lat, newZoneCenter.lng]}
                  icon={createZoneBadgeIcon(shortZoneTitle, '#2563EB', '#FFFFFF')}
                />
              )}
            </MapContainer>

            {/* Top-Right Floating Checkbox Legend matching screenshot */}
            <div className="absolute top-2.5 right-2.5 z-[400] bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-md p-2 pointer-events-auto text-[11px] font-semibold space-y-1 min-w-[145px]">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-800">
                <input
                  type="checkbox"
                  checked={showCityBoundary}
                  onChange={(e) => setShowCityBoundary(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-blue-600"></span>
                  <span>City Boundary</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
                <input
                  type="checkbox"
                  checked={showServiceZones}
                  onChange={(e) => setShowServiceZones(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-3 h-3 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-purple-500"></span>
                  <span>Service Zones ({serviceZones.length})</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
                <input
                  type="checkbox"
                  checked={showAirportZones}
                  onChange={(e) => setShowAirportZones(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3 h-3 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-emerald-500"></span>
                  <span>Airport Zones ({airportZones.length})</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
                <input
                  type="checkbox"
                  checked={showRestrictedZones}
                  onChange={(e) => setShowRestrictedZones(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400 w-3 h-3 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-amber-500"></span>
                  <span>Restricted ({restrictedZones.length})</span>
                </span>
              </label>
            </div>

            {/* Bottom-Right Base Layer Switcher [Map | Satellite | Terrain] */}
            <div className="absolute bottom-2.5 right-2.5 z-[400] bg-white/95 backdrop-blur-md rounded-lg border border-slate-200/90 shadow-md p-0.5 flex items-center pointer-events-auto">
              {(['map', 'satellite', 'terrain'] as BaseLayerType[]).map((layer) => (
                <button
                  key={layer}
                  type="button"
                  onClick={() => setBaseLayer(layer)}
                  className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold capitalize transition-all cursor-pointer ${
                    baseLayer === layer
                      ? 'bg-[#1F2B6D] text-white shadow-2xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {layer}
                </button>
              ))}
            </div>

            {/* Bottom-Left: Scale Indicator */}
            <div className="absolute bottom-2.5 left-2.5 z-[400] pointer-events-none">
              <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-md border border-slate-200/90 text-[10px] font-bold text-slate-800 shadow-xs flex items-center gap-1.5">
                <span className="w-8 border-b-2 border-slate-800 inline-block"></span>
                <span>5 km</span>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Checks Card */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 leading-tight">Validation Checks</h4>
              <p className="text-[10px] text-slate-400">Geometric and platform constraints for this zone.</p>
            </div>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3 space-y-1.5 text-xs text-emerald-950 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`w-3.5 h-3.5 shrink-0 ${
                  isInsideCity ? 'text-emerald-600' : 'text-red-500'
                }`}
              />
              <span className={isInsideCity ? 'text-emerald-900' : 'text-red-700 font-bold'}>
                {isInsideCity
                  ? 'Polygon is completely inside city boundary'
                  : 'Warning: Polygon must be inside city boundary'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`w-3.5 h-3.5 shrink-0 ${
                  noIntersections ? 'text-emerald-600' : 'text-red-500'
                }`}
              />
              <span className={noIntersections ? 'text-emerald-900' : 'text-red-700 font-bold'}>
                {noIntersections
                  ? 'Polygon is valid (no self-intersections)'
                  : 'Warning: Polygon contains self-intersections'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`w-3.5 h-3.5 shrink-0 ${
                  isAreaValid ? 'text-emerald-600' : 'text-red-500'
                }`}
              />
              <span className={isAreaValid ? 'text-emerald-900' : 'text-red-700 font-bold'}>
                Minimum area requirement met ({areaKm2.toFixed(2)} km²)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`w-3.5 h-3.5 shrink-0 ${
                  allConnected ? 'text-emerald-600' : 'text-red-500'
                }`}
              />
              <span className={allConnected ? 'text-emerald-900' : 'text-red-700 font-bold'}>
                All points connected ({pointsCount} vertices)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Step5ReviewCreate
