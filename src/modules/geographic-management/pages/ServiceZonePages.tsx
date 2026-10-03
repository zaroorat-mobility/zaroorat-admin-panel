import React, { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import {
  Layers,
  Car,
  Bike,
  Truck,
  CheckCircle2,
  XCircle,
  Edit2,
  Plus,
  Minus,
  Crosshair,
  Compass,
  Scan,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
  FileText,
  Loader2,
  Copy,
  Check,
} from 'lucide-react'
import { MapContainer, TileLayer, Polygon, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  useCities,
  useServiceZone,
  useActivateServiceZone,
  useDeactivateServiceZone,
  useVehicleTypes,
} from '../hooks'
import { useCityMapContext } from '../hooks/useCityMapContext'
import {
  calculatePolygonAreaKm2,
  calculatePolygonPerimeterKm,
  type LatLngPoint,
} from '../components/CreateCityModal/geoUtils'
import { CreateServiceZoneModal } from '../components/CreateServiceZoneModal'

type BaseLayerType = 'map' | 'satellite' | 'terrain'

const TILE_URLS: Record<BaseLayerType, string> = {
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  map: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  terrain: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
}

// Auto Rickshaw Icon
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

// Carpool Icon
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

function MapController({
  coordinates,
  center,
}: {
  coordinates?: number[][][] | null
  center: LatLngPoint
}) {
  const map = useMap()

  useEffect(() => {
    map.invalidateSize()
    if (coordinates?.[0]?.length && coordinates[0].length >= 3) {
      const bounds = coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number])
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 })
    } else {
      map.setView([center.lat, center.lng], 13)
    }
  }, [center, coordinates, map])

  return null
}

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
        onClick={() => map.setView([center.lat, center.lng], 13, { animate: true })}
        className="p-1.5 bg-white/95 backdrop-blur-md hover:bg-slate-50 border border-slate-200/90 rounded-lg text-slate-700 shadow-sm transition-colors flex items-center justify-center cursor-pointer"
        title="Center Zone"
      >
        <Crosshair className="w-3.5 h-3.5" />
      </button>
    </div>
  )
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

// ─── Create Service Zone Page Route ──────────────────────────────────
export const ServiceZoneFormPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <PageWrapper>
      <CreateServiceZoneModal
        isOpen={true}
        onClose={() => navigate('/geographic-management/service-zones')}
        onSuccess={(created) => navigate(`/geographic-management/service-zones/${created.id}`)}
      />
    </PageWrapper>
  )
}

// ─── Edit Service Zone Page Route ────────────────────────────────────
export const ServiceZoneEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  return (
    <PageWrapper>
      <CreateServiceZoneModal
        isOpen={true}
        zoneId={id}
        onClose={() => navigate(`/geographic-management/service-zones/${id}`)}
        onSuccess={() => navigate(`/geographic-management/service-zones/${id}`)}
      />
    </PageWrapper>
  )
}

// ─── Service Zone Detail Page ────────────────────────────────────────
export const ServiceZoneDetailPage: React.FC<{ zoneId: string }> = ({ zoneId }) => {
  const navigate = useNavigate()
  const { data: zone, isLoading, refetch } = useServiceZone(zoneId)
  const { data: cities = [] } = useCities(true)
  const { data: allVehicleTypes = [] } = useVehicleTypes()

  const activateZone = useActivateServiceZone()
  const deactivateZone = useDeactivateServiceZone()

  const [baseLayer, setBaseLayer] = useState<BaseLayerType>('satellite')
  const [showCityBoundary, setShowCityBoundary] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [copiedGeoJson, setCopiedGeoJson] = useState(false)

  const { referenceBoundary, cityCenter } = useCityMapContext(zone?.cityCode ?? '', cities)

  const areaKm2 = useMemo(() => {
    if (!zone?.boundary) return 0
    return calculatePolygonAreaKm2(zone.boundary)
  }, [zone?.boundary])

  const perimeterKm = useMemo(() => {
    if (!zone?.boundary) return 0
    return calculatePolygonPerimeterKm(zone.boundary)
  }, [zone?.boundary])

  const pointsCount = useMemo(() => {
    if (!zone?.boundary?.[0] || zone.boundary[0].length === 0) return 0
    const first = zone.boundary[0][0]
    const last = zone.boundary[0][zone.boundary[0].length - 1]
    return first[0] === last[0] && first[1] === last[1]
      ? zone.boundary[0].length - 1
      : zone.boundary[0].length
  }, [zone?.boundary])

  // Centroid of zone
  const zoneCenter = useMemo<LatLngPoint>(() => {
    if (zone?.boundary?.[0] && zone.boundary[0].length > 0) {
      const ring = zone.boundary[0]
      const sum = ring.reduce(
        (acc, [lng, lat]) => ({ lng: acc.lng + lng, lat: acc.lat + lat }),
        { lng: 0, lat: 0 },
      )
      return {
        lng: sum.lng / ring.length,
        lat: sum.lat / ring.length,
      }
    }
    return cityCenter ?? { lat: 34.0837, lng: 74.7973 }
  }, [zone?.boundary, cityCenter])

  // LatLng for city boundary reference
  const cityBoundaryLatLngs = useMemo(() => {
    if (!referenceBoundary?.[0] || referenceBoundary[0].length < 3) return null
    return referenceBoundary[0].map(([lng, lat]) => [lat, lng] as [number, number])
  }, [referenceBoundary])

  // LatLng for service zone polygon
  const zonePolygonLatLngs = useMemo(() => {
    if (!zone?.boundary?.[0] || zone.boundary[0].length < 3) return null
    return zone.boundary[0].map(([lng, lat]) => [lat, lng] as [number, number])
  }, [zone?.boundary])

  // Colors based on zone type
  const zoneColors = useMemo(() => {
    if (zone?.zoneType === 'AIRPORT') {
      return { border: '#10B981', fill: '#34D399', badgeBg: '#059669', badgeSymbol: '✈' }
    }
    if (zone?.zoneType === 'RESTRICTED') {
      return { border: '#F59E0B', fill: '#FBBF24', badgeBg: '#D97706', badgeSymbol: '⛔' }
    }
    return { border: '#8B5CF6', fill: '#A78BFA', badgeBg: '#7C3AED', badgeSymbol: '' }
  }, [zone?.zoneType])

  // Supported vehicle types resolved from catalog
  const supportedVehicles = useMemo(() => {
    if (!zone) return []
    if (!zone.vehicleTypeIds || zone.vehicleTypeIds.length === 0) {
      return allVehicleTypes
    }
    return allVehicleTypes.filter((vt) => zone.vehicleTypeIds.includes(vt.id))
  }, [zone, allVehicleTypes])

  const renderVehicleIcon = (code: string) => {
    const c = code.toUpperCase()
    if (c.includes('BIKE')) return <Bike className="w-4 h-4 text-[#1F2B6D]" />
    if (c.includes('AUTO')) return <AutoRickshawIcon className="w-4 h-4 text-[#1F2B6D]" />
    if (c.includes('CARPOOL')) return <CarpoolIcon className="w-4 h-4 text-[#1F2B6D]" />
    if (c.includes('PARCEL')) return <Truck className="w-4 h-4 text-[#1F2B6D]" />
    return <Car className="w-4 h-4 text-[#1F2B6D]" />
  }

  const handleToggleStatus = async () => {
    if (!zone) return
    if (zone.isActive) {
      await deactivateZone.mutateAsync(zone.id)
    } else {
      await activateZone.mutateAsync(zone.id)
    }
    refetch()
  }

  const geoJsonString = useMemo(() => {
    if (!zone?.boundary) return '{}'
    return JSON.stringify({ type: 'Polygon', coordinates: zone.boundary }, null, 2)
  }, [zone?.boundary])

  const handleCopyGeoJson = () => {
    void navigator.clipboard.writeText(geoJsonString)
    setCopiedGeoJson(true)
    setTimeout(() => setCopiedGeoJson(false), 2000)
  }

  if (isLoading || !zone) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1F2B6D]" />
          <p className="text-sm font-semibold text-slate-600">Loading service zone details...</p>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      {/* ── Page Header matching modern design ─────────────────── */}
      <PageHeader
        title={zone.name}
        description={`${zone.code} · ${zone.cityCode} · Zone Type: ${zone.zoneType}`}
        onBack={() => navigate('/geographic-management/service-zones')}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Zone</span>
            </button>

            <button
              type="button"
              disabled={activateZone.isPending || deactivateZone.isPending}
              onClick={handleToggleStatus}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer ${
                zone.isActive
                  ? 'border border-amber-200 bg-amber-50 hover:bg-amber-100/80 text-amber-800'
                  : 'border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800'
              }`}
            >
              {zone.isActive ? (
                <>
                  <ToggleLeft className="w-4 h-4 text-amber-700" />
                  <span>Deactivate</span>
                </>
              ) : (
                <>
                  <ToggleRight className="w-4 h-4 text-emerald-700" />
                  <span>Activate</span>
                </>
              )}
            </button>

            <Link
              to={`/pricing-management/fare-rules?cityCode=${zone.cityCode}&serviceZoneId=${zone.id}`}
              className="px-4 py-2 rounded-xl bg-[#1F2B6D] hover:bg-[#182258] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Linked Fare Rules ({zone.fareRuleCount ?? 0})</span>
            </Link>
          </div>
        }
      />

      <div className="space-y-4 mt-4">
        {/* ── Key Metrics Cards Row ─────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Zone Type */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${zoneColors.border}15`, color: zoneColors.border }}
            >
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Zone Type
              </p>
              <p className="text-sm font-extrabold text-slate-900 mt-0.5">{zone.zoneType}</p>
            </div>
          </div>

          {/* Card 2: Operations */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1F2B6D] flex items-center justify-center shrink-0 border border-blue-100">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Operations
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-xs font-bold">
                <span className={zone.allowsPickup ? 'text-emerald-700' : 'text-slate-400'}>
                  {zone.allowsPickup ? 'Pickups' : 'No Pickup'}
                </span>
                <span className="text-slate-300">•</span>
                <span className={zone.allowsDropoff ? 'text-emerald-700' : 'text-slate-400'}>
                  {zone.allowsDropoff ? 'Drop-offs' : 'No Drop'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Boundary Area */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Coverage Area
              </p>
              <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                {areaKm2.toFixed(2)} km²
                <span className="text-xs font-normal text-slate-500 ml-1.5">
                  ({pointsCount} pts)
                </span>
              </p>
            </div>
          </div>

          {/* Card 4: Status */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                zone.isActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {zone.isActive ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Zone Status
              </p>
              <p
                className={`text-sm font-extrabold mt-0.5 ${
                  zone.isActive ? 'text-emerald-700' : 'text-slate-500'
                }`}
              >
                {zone.isActive ? 'Active Zone' : 'Inactive Zone'}
              </p>
            </div>
          </div>
        </div>

        {/* ── 2-Column Main Section (Map + Details) ────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* ── LEFT COLUMN: Interactive Map (col-span-8) ──────── */}
          <div className="lg:col-span-8 space-y-3">
            <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-900 shadow-sm h-[480px] [&_.leaflet-control-attribution]:hidden">
              <MapContainer
                key={`zone-detail-${zone.id}-${baseLayer}`}
                center={[zoneCenter.lat, zoneCenter.lng]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer attribution="" url={TILE_URLS[baseLayer]} />
                <MapController coordinates={zone.boundary} center={zoneCenter} />
                <MapControls center={zoneCenter} />

                {/* Reference City Boundary */}
                {showCityBoundary && cityBoundaryLatLngs && (
                  <Polygon
                    positions={cityBoundaryLatLngs}
                    pathOptions={{
                      color: '#2563EB',
                      weight: 2,
                      dashArray: '6, 6',
                      fillColor: '#60A5FA',
                      fillOpacity: 0.08,
                    }}
                  />
                )}

                {/* Service Zone Polygon */}
                {zonePolygonLatLngs && (
                  <Polygon
                    positions={zonePolygonLatLngs}
                    pathOptions={{
                      color: zoneColors.border,
                      weight: 3,
                      fillColor: zoneColors.fill,
                      fillOpacity: 0.38,
                    }}
                  />
                )}

                {/* Zone Centroid Badge */}
                {zonePolygonLatLngs && (
                  <Marker
                    position={[zoneCenter.lat, zoneCenter.lng]}
                    icon={createZoneBadgeIcon(
                      zone.name,
                      zoneColors.badgeBg,
                      '#FFFFFF',
                      zoneColors.badgeSymbol,
                    )}
                  />
                )}
              </MapContainer>

              {/* Floating Legend */}
              <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-md p-2.5 pointer-events-auto text-xs font-semibold space-y-1.5 min-w-[150px]">
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

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-slate-800">
                  <span
                    className="w-2.5 h-2.5 rounded"
                    style={{ backgroundColor: zoneColors.border }}
                  ></span>
                  <span>{zone.zoneType} Zone</span>
                </div>
              </div>

              {/* Layer Switcher */}
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

              {/* Scale Indicator */}
              <div className="absolute bottom-3 left-3 z-[400] pointer-events-none">
                <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-200/90 text-[10.5px] font-bold text-slate-800 shadow-xs flex items-center gap-2">
                  <span className="w-10 border-b-2 border-slate-800 inline-block"></span>
                  <span>2 km</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Details & Vehicle Categories (col-span-4) ── */}
          <div className="lg:col-span-4 space-y-3.5">
            {/* Card 1: Supported Vehicle Categories */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#1F2B6D] text-white flex items-center justify-center shrink-0">
                    <Car className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Supported Vehicle Types</h4>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {supportedVehicles.length} Enabled
                </span>
              </div>

              {supportedVehicles.length === 0 ? (
                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 text-center">
                  All vehicle categories are allowed by default.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {supportedVehicles.map((vt) => (
                    <div
                      key={vt.id}
                      className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/60 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center">
                          {renderVehicleIcon(vt.code)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{vt.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{vt.code}</p>
                        </div>
                      </div>

                      <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card 2: GIS Spatial Metrics */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#1F2B6D] text-white flex items-center justify-center shrink-0">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">GIS Geometry Details</h4>
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
                  <p className="text-base font-extrabold text-slate-900">
                    {areaKm2.toFixed(2)} km²
                  </p>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-slate-500">
                    <RotateCcw className="w-3.5 h-3.5 text-[#1F2B6D]" />
                    <span className="text-[10.5px] font-semibold text-slate-500">Perimeter</span>
                  </div>
                  <p className="text-base font-extrabold text-slate-900">
                    {perimeterKm.toFixed(1)} km
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">GeoJSON Polygon</span>
                <button
                  type="button"
                  onClick={handleCopyGeoJson}
                  className="text-xs font-bold text-[#1F2B6D] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedGeoJson ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Coordinates</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Card 3: Linked Fare Rules */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#1F2B6D] text-white flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Linked Pricing Rules</h4>
                </div>
                <span className="text-xs font-extrabold text-slate-900">
                  {zone.fareRuleCount ?? 0} active
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Zone-specific base fares, distance rates, and surge multipliers configured for this
                boundary.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <Link
                  to={`/pricing-management/fare-rules?cityCode=${zone.cityCode}&serviceZoneId=${zone.id}`}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
                >
                  View Rules
                </Link>
                <Link
                  to={`/pricing-management/fare-rules/new?cityCode=${zone.cityCode}&serviceZoneId=${zone.id}`}
                  className="px-3 py-1.5 rounded-lg bg-[#1F2B6D] hover:bg-[#182258] text-xs font-bold text-white transition-colors"
                >
                  + Add Rule
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Zone Modal Overlay ────────────────────────────── */}
      {isEditModalOpen && (
        <CreateServiceZoneModal
          isOpen={isEditModalOpen}
          zoneId={zone.id}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false)
            refetch()
          }}
        />
      )}
    </PageWrapper>
  )
}

export default ServiceZoneFormPage
