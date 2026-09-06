import React, { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Navigation, RefreshCw, Zap } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { api, API_ENDPOINTS } from '@/infrastructure/api'
import { useMapClientConfig } from '@/shared/hooks/useMapClientConfig'
import { OSM_TILE_LAYER, resolveMapTileLayer } from '@/shared/utils/map-tiles'

// Fix Leaflet default icon paths in React
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom DivIcons for crisp, high-DPI custom markers
const createCustomIcon = (color: string, label: string) =>
  L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 800; font-size: 11px;">
          ${label}
        </div>
        <div style="position: absolute; bottom: -6px; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${color};"></div>
      </div>
    `,
    iconSize: [32, 38],
    iconAnchor: [16, 38],
  })

const pickupIcon = createCustomIcon('#10B981', 'P')
const dropoffIcon = createCustomIcon('#EF4444', 'D')
const testPinIcon = createCustomIcon('#6366F1', 'T')

/**
 * `provider` is the only source that verifies anything: it is the tile layer the
 * backend actually serves to browsers, built from the configured client SDK key.
 * The others are reference basemaps, named after the service that really serves
 * them — they are never presented as the provider's own tiles.
 */
export type TileSource = 'provider' | 'osm' | 'dark' | 'satellite'

type ReferenceBasemap = Exclude<TileSource, 'provider'>

const REFERENCE_BASEMAPS: Record<
  ReferenceBasemap,
  { label: string; url: string; attribution: string }
> = {
  osm: {
    label: 'OSM',
    url: OSM_TILE_LAYER.url,
    attribution: OSM_TILE_LAYER.attribution,
  },
  dark: {
    label: 'CARTO dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
  },
  satellite: {
    label: 'Esri satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
}

interface MapStudioPreviewProps {
  providerName: string
}

// Helper component to recenter map when center state changes
const RecenterMap: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom, { animate: true })
  }, [center, zoom, map])
  return null
}

// Map Click Listener to update dropoff / test coordinates
const MapClickListener: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({
  onMapClick,
}) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

/**
 * Reports whether the provider's tiles actually loaded. Without this the preview
 * cannot tell a working SDK key from a rejected one — both leave a grey map.
 */
const TileLoadWatcher: React.FC<{ onError: () => void }> = ({ onError }) => {
  const map = useMap()
  useEffect(() => {
    map.on('tileerror', onError)
    return () => {
      map.off('tileerror', onError)
    }
  }, [map, onError])
  return null
}

type ProviderTileState = 'loading' | 'ok' | 'unavailable' | 'error'
type RouteState = 'loading' | 'ok' | 'unavailable'

interface RouteResponse {
  distanceMeters: number
  durationSeconds: number
  providerName: string
  path?: Array<{ latitude: number; longitude: number }>
}

export const MapStudioPreview: React.FC<MapStudioPreviewProps> = ({ providerName }) => {
  // Center default: Srinagar Lal Chowk [34.0837, 74.7973]
  const DEFAULT_CENTER: [number, number] = [34.0837, 74.7973]
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER)
  const [zoom, setZoom] = useState<number>(13)

  const { data: clientConfig, isLoading: isLoadingConfig } = useMapClientConfig()

  // The exact layer the backend hands to browsers. `resolveMapTileLayer` falls
  // back to OSM when no provider layer can be built, so an OSM url coming back
  // means "this provider has no browser tile mechanism configured" — not success.
  const providerLayer = useMemo(() => {
    if (!clientConfig) return null
    const layer = resolveMapTileLayer(clientConfig)
    return layer.url === OSM_TILE_LAYER.url ? null : layer
  }, [clientConfig])

  const [source, setSource] = useState<TileSource>('provider')
  const [tileFailed, setTileFailed] = useState(false)

  // A new layer deserves a fresh verdict.
  useEffect(() => {
    setTileFailed(false)
  }, [providerLayer?.url])

  const providerTileState: ProviderTileState = isLoadingConfig
    ? 'loading'
    : !providerLayer
      ? 'unavailable'
      : tileFailed
        ? 'error'
        : 'ok'

  // Never leave the selector pointing at a layer that does not exist.
  const effectiveSource: TileSource = source === 'provider' && !providerLayer ? 'osm' : source

  const activeLayer =
    effectiveSource === 'provider' && providerLayer
      ? providerLayer
      : REFERENCE_BASEMAPS[effectiveSource as ReferenceBasemap]

  // Interactive markers state
  const [pickupPos, setPickupPos] = useState<[number, number]>([34.0837, 74.7973])
  const [dropoffPos, setDropoffPos] = useState<[number, number]>([34.0988, 74.8065])
  const [testPinPos] = useState<[number, number]>([34.075, 74.789])
  const [showRoute, setShowRoute] = useState<boolean>(true)

  // Routing comes from the configured provider via the backend, never a third party.
  const [routePath, setRoutePath] = useState<[number, number][]>([])
  const [roadDistanceKm, setRoadDistanceKm] = useState<number | null>(null)
  const [roadEtaMins, setRoadEtaMins] = useState<number | null>(null)
  const [routeProvider, setRouteProvider] = useState<string | null>(null)
  const [routeState, setRouteState] = useState<RouteState>('loading')
  const [routeMessage, setRouteMessage] = useState<string | null>(null)

  // Straight-line distance, shown only where it is labelled as such.
  const calculateDistance = (p1: [number, number], p2: [number, number]): number => {
    const R = 6371
    const dLat = ((p2[0] - p1[0]) * Math.PI) / 180
    const dLon = ((p2[1] - p1[1]) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((p1[0] * Math.PI) / 180) *
        Math.cos((p2[0] * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return parseFloat((R * c).toFixed(2))
  }

  const straightDistanceKm = calculateDistance(pickupPos, dropoffPos)

  useEffect(() => {
    let isMounted = true
    setRouteState('loading')

    const fetchRoute = async () => {
      try {
        const res = await api.post<{ data: RouteResponse }>(API_ENDPOINTS.maps.route, {
          originLat: pickupPos[0],
          originLng: pickupPos[1],
          destinationLat: dropoffPos[0],
          destinationLng: dropoffPos[1],
        })
        if (!isMounted) return
        const route = res.data.data
        setRoutePath((route.path ?? []).map((c) => [c.latitude, c.longitude] as [number, number]))
        setRoadDistanceKm(parseFloat((route.distanceMeters / 1000).toFixed(2)))
        setRoadEtaMins(Math.max(1, Math.round(route.durationSeconds / 60)))
        setRouteProvider(route.providerName)
        setRouteMessage(null)
        setRouteState('ok')
      } catch (err) {
        if (!isMounted) return
        setRoutePath([])
        setRoadDistanceKm(null)
        setRoadEtaMins(null)
        setRouteProvider(null)
        setRouteMessage(err instanceof Error ? err.message : 'Routing request failed')
        setRouteState('unavailable')
      }
    }

    const timer = setTimeout(fetchRoute, 250)
    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [pickupPos, dropoffPos])

  const handleResetView = () => {
    setCenter(DEFAULT_CENTER)
    setZoom(13)
    setPickupPos([34.0837, 74.7973])
    setDropoffPos([34.0988, 74.8065])
  }

  const handleMapClick = (lat: number, lng: number) => {
    setDropoffPos([lat, lng])
  }

  const providerStatus: Record<ProviderTileState, { text: string; dot: string; tone: string }> = {
    loading: {
      text: 'Checking provider tile configuration...',
      dot: 'bg-slate-400',
      tone: 'text-slate-300',
    },
    ok: {
      text: `SUCCESS - ${providerName} tiles served with the configured client SDK key`,
      dot: 'bg-emerald-400',
      tone: 'text-emerald-300',
    },
    unavailable: {
      text: `NOT AVAILABLE - no browser tile layer configured for ${providerName}`,
      dot: 'bg-amber-400',
      tone: 'text-amber-300',
    },
    error: {
      text: `ERROR - ${providerName} rejected the tile request (check the client SDK key)`,
      dot: 'bg-red-400',
      tone: 'text-red-300',
    },
  }

  const status = providerStatus[providerTileState]

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
      {/* Studio Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Interactive Map Studio
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {effectiveSource === 'provider' ? (
                <>
                  Tiles served by{' '}
                  <span className="font-semibold capitalize text-primary">{providerName}</span> from
                  the configured client SDK key
                </>
              ) : (
                <>
                  Reference basemap (
                  {REFERENCE_BASEMAPS[effectiveSource as ReferenceBasemap].label}) — not{' '}
                  {providerName}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Tile source switcher & map controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-200/70 dark:bg-slate-900 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSource('provider')}
              disabled={!providerLayer}
              title={
                providerLayer
                  ? `Live ${providerName} tiles`
                  : `No browser tile layer configured for ${providerName}`
              }
              className={`px-2.5 py-1 rounded-md transition-all capitalize disabled:opacity-40 disabled:cursor-not-allowed ${
                effectiveSource === 'provider'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {providerName}
            </button>
            {(Object.keys(REFERENCE_BASEMAPS) as ReferenceBasemap[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSource(key)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  effectiveSource === key
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {REFERENCE_BASEMAPS[key].label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleResetView}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
            title="Reset Map Bounds"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Display Container */}
      <div className="relative flex-1 min-h-[380px] w-full bg-slate-900">
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', minHeight: '380px' }}
        >
          <RecenterMap center={center} zoom={zoom} />
          <MapClickListener onMapClick={handleMapClick} />
          {effectiveSource === 'provider' ? (
            <TileLoadWatcher onError={() => setTileFailed(true)} />
          ) : null}
          <TileLayer
            key={activeLayer.url}
            url={activeLayer.url}
            attribution={activeLayer.attribution}
            maxZoom={19}
          />

          {/* Pickup Marker */}
          <Marker
            position={pickupPos}
            icon={pickupIcon}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target
                const pos = marker.getLatLng()
                setPickupPos([pos.lat, pos.lng])
              },
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 text-xs">
                <span className="font-bold text-emerald-600">Pickup Location</span>
                <br />
                {pickupPos[0].toFixed(4)}°, {pickupPos[1].toFixed(4)}°
              </div>
            </Popup>
          </Marker>

          {/* Dropoff Marker */}
          <Marker
            position={dropoffPos}
            icon={dropoffIcon}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target
                const pos = marker.getLatLng()
                setDropoffPos([pos.lat, pos.lng])
              },
            }}
          >
            <Popup>
              <div className="p-1 text-xs">
                <span className="font-bold text-red-600">Dropoff Destination</span>
                <br />
                {dropoffPos[0].toFixed(4)}°, {dropoffPos[1].toFixed(4)}°
              </div>
            </Popup>
          </Marker>

          {/* Static test pin — not a real driver position */}
          <Marker position={testPinPos} icon={testPinIcon}>
            <Popup>
              <div className="p-1 text-xs">
                <span className="font-bold text-primary">Static test pin</span>
                <br />
                Fixed reference point, not a live driver
              </div>
            </Popup>
          </Marker>

          {/* Route line: provider geometry when available, otherwise a dashed straight line */}
          {showRoute && (
            <>
              <Polyline
                positions={routePath.length > 0 ? routePath : [pickupPos, dropoffPos]}
                pathOptions={{ color: '#2B317A', weight: 8, opacity: 0.25 }}
              />
              <Polyline
                positions={routePath.length > 0 ? routePath : [pickupPos, dropoffPos]}
                pathOptions={{
                  color: '#2B317A',
                  weight: 5,
                  opacity: 0.9,
                  dashArray: routePath.length > 1 ? undefined : '8, 8',
                }}
              />
            </>
          )}
        </MapContainer>

        {/* Floating route overlay */}
        <div className="absolute top-4 left-4 z-[500] p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-lg text-xs space-y-2 max-w-xs select-none">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
            <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              {routeState === 'loading'
                ? 'Requesting route...'
                : routeState === 'ok'
                  ? `Road route — ${routeProvider}`
                  : 'Routing not available'}
            </span>
            <button
              type="button"
              onClick={() => setShowRoute(!showRoute)}
              className="text-[10px] font-semibold text-primary hover:underline"
            >
              {showRoute ? 'Hide Line' : 'Show Line'}
            </button>
          </div>

          {routeState === 'ok' ? (
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">
                  Road distance
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {roadDistanceKm} km
                </span>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">
                  Provider ETA
                </span>
                <span className="font-extrabold text-primary text-sm">~{roadEtaMins} mins</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-[11px]">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">
                  Straight-line distance (not a road route)
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {straightDistanceKm} km
                </span>
              </div>
              {routeState === 'unavailable' && routeMessage ? (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-snug">
                  {routeMessage}
                </p>
              ) : null}
            </div>
          )}

          <p className="text-[10px] text-slate-400 pt-0.5">
            Drag a pin or click the map to request a route from the configured provider.
          </p>
        </div>

        {/* Truthful tile status pill */}
        <div className="absolute bottom-4 left-4 z-[500] px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-800 text-white text-[11px] font-medium flex items-center gap-2 max-w-[calc(100%-2rem)]">
          <span className={`w-2 h-2 rounded-full shrink-0 ${status.dot}`}></span>
          <span className={status.tone}>{status.text}</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300 font-mono shrink-0">
            {dropoffPos[0].toFixed(4)}, {dropoffPos[1].toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default MapStudioPreview
