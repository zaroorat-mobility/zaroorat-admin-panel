import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, CircleMarker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { cn } from '@/shared/utils'
import { useMapClientConfig } from '@/shared/hooks/useMapClientConfig'
import { OSM_TILE_LAYER, resolveMapTileLayer, type MapTileLayerConfig } from '@/shared/utils/map-tiles'

// @ts-expect-error leaflet icon patch
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  iconShadowUrl: markerShadow,
})

export type LiveMapMarkerKind = 'driver' | 'pickup' | 'drop' | 'ride' | 'default'

export interface LiveMapMarker {
  id: string
  lat: number
  lng: number
  label?: string
  kind?: LiveMapMarkerKind
}

export interface LiveMapRoute {
  id: string
  pickup: { lat: number; lng: number; label?: string }
  drop: { lat: number; lng: number; label?: string }
  driverLocation?: { lat: number; lng: number } | null
  /** Road-following route geometry; when absent, a straight line is drawn. */
  path?: Array<{ lat: number; lng: number }> | null
}

export interface LiveMapProps {
  markers?: LiveMapMarker[]
  routes?: LiveMapRoute[]
  center?: [number, number]
  zoom?: number
  height?: string
  className?: string
  tileUrl?: string
  tileAttribution?: string
}

const MARKER_COLORS: Record<LiveMapMarkerKind, string> = {
  driver: '#2563eb',
  pickup: '#10b981',
  drop: '#ef4444',
  ride: '#8b5cf6',
  default: '#64748b',
}

function FitBounds({ points }: { points: Array<[number, number]> }) {
  const map = useMap()

  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], Math.max(map.getZoom(), 14))
      return
    }
    map.fitBounds(points, { padding: [40, 40], maxZoom: 15 })
  }, [map, points])

  return null
}

function createDotIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

function FallbackTileLayer({
  primary,
  onFallback,
}: {
  primary: MapTileLayerConfig
  onFallback: () => void
}) {
  const map = useMap()
  const [useFallback, setUseFallback] = useState(false)
  const layer = useFallback ? OSM_TILE_LAYER : primary

  useEffect(() => {
    if (useFallback) return

    const handleTileError = () => {
      setUseFallback(true)
      onFallback()
    }

    map.on('tileerror', handleTileError)
    return () => {
      map.off('tileerror', handleTileError)
    }
  }, [map, onFallback, useFallback])

  return <TileLayer attribution={layer.attribution} url={layer.url} />
}

export const LiveMap: React.FC<LiveMapProps> = ({
  markers = [],
  routes = [],
  center,
  zoom = 12,
  height = '420px',
  className,
  tileUrl,
  tileAttribution,
}) => {
  const { data: mapConfig, isLoading: isLoadingConfig } = useMapClientConfig()
  const [didFallback, setDidFallback] = useState(false)

  const tileLayer = useMemo(() => {
    if (tileUrl) {
      return {
        url: tileUrl,
        attribution: tileAttribution ?? '',
      }
    }
    return resolveMapTileLayer(mapConfig)
  }, [mapConfig, tileAttribution, tileUrl])

  const allPoints = useMemo(() => {
    const pts: Array<[number, number]> = []
    for (const m of markers) {
      if (Number.isFinite(m.lat) && Number.isFinite(m.lng)) {
        pts.push([m.lat, m.lng])
      }
    }
    for (const r of routes) {
      if (r.path && r.path.length > 0) {
        for (const p of r.path) {
          if (Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
            pts.push([p.lat, p.lng])
          }
        }
      } else {
        pts.push([r.pickup.lat, r.pickup.lng], [r.drop.lat, r.drop.lng])
      }
      if (r.driverLocation) {
        pts.push([r.driverLocation.lat, r.driverLocation.lng])
      }
    }
    return pts
  }, [markers, routes])

  const mapCenter = useMemo<[number, number]>(() => {
    if (center) return center
    if (allPoints.length > 0) return allPoints[0]
    return [34.0837, 74.7973] // Srinagar default for ops maps
  }, [allPoints, center])

  const mapKey = [
    allPoints.map((p) => p.join(',')).join('|') || 'default',
    tileLayer.url,
    didFallback ? 'osm-fallback' : 'primary',
    isLoadingConfig ? 'loading' : 'ready',
  ].join('::')

  const usingOsmFallback = tileLayer.url === OSM_TILE_LAYER.url || didFallback

  return (
    <div className={cn('rounded-xl overflow-hidden border border-border relative', className)} style={{ height }}>
      {usingOsmFallback && mapConfig?.primaryProvider === 'ola' && !mapConfig.providers.ola.apiKey && (
        <div className="absolute top-2 left-12 z-[1000] rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] text-amber-800 shadow-sm">
          Using OpenStreetMap — configure an Ola Maps API key under Platform → Maps.
        </div>
      )}
      {usingOsmFallback && mapConfig?.primaryProvider === 'ola' && mapConfig.providers.ola.apiKey && (
        <div className="absolute top-2 left-12 z-[1000] rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] text-amber-800 shadow-sm">
          Ola map tiles failed to load — showing OpenStreetMap fallback.
        </div>
      )}
      {usingOsmFallback && mapConfig?.primaryProvider === 'mappls' && !mapConfig.providers.mappls.apiKey && (
        <div className="absolute top-2 left-12 z-[1000] rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] text-amber-800 shadow-sm">
          Using OpenStreetMap — configure a Mappls REST API key under Platform → Maps.
        </div>
      )}
      {usingOsmFallback && mapConfig?.primaryProvider === 'mappls' && mapConfig.providers.mappls.apiKey && (
        <div className="absolute top-2 left-12 z-[1000] rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] text-amber-800 shadow-sm">
          Mappls tiles failed to load — showing OpenStreetMap fallback.
        </div>
      )}
      <MapContainer key={mapKey} center={mapCenter} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        {tileLayer.url === OSM_TILE_LAYER.url ? (
          <TileLayer attribution={tileLayer.attribution} url={tileLayer.url} />
        ) : (
          <FallbackTileLayer primary={tileLayer} onFallback={() => setDidFallback(true)} />
        )}
        <FitBounds points={allPoints} />

        {routes.map((route) => {
          const hasRoadPath = route.path && route.path.length >= 2
          const fallbackLine: [number, number][] = [[route.pickup.lat, route.pickup.lng]]
          if (route.driverLocation) {
            fallbackLine.push([route.driverLocation.lat, route.driverLocation.lng])
          }
          fallbackLine.push([route.drop.lat, route.drop.lng])

          const line: [number, number][] = hasRoadPath
            ? route.path!.map((p) => [p.lat, p.lng] as [number, number])
            : fallbackLine

          return (
            <React.Fragment key={route.id}>
              <Polyline
                positions={line}
                pathOptions={{
                  color: '#6366f1',
                  weight: hasRoadPath ? 4 : 3,
                  opacity: hasRoadPath ? 0.9 : 0.75,
                  ...(hasRoadPath ? {} : { dashArray: '6 8' }),
                }}
              />
              <Marker
                position={[route.pickup.lat, route.pickup.lng]}
                icon={createDotIcon(MARKER_COLORS.pickup)}
              />
              <Marker position={[route.drop.lat, route.drop.lng]} icon={createDotIcon(MARKER_COLORS.drop)} />
              {route.driverLocation ? (
                <CircleMarker
                  center={[route.driverLocation.lat, route.driverLocation.lng]}
                  radius={8}
                  pathOptions={{ color: MARKER_COLORS.driver, fillColor: MARKER_COLORS.driver, fillOpacity: 0.9 }}
                />
              ) : null}
            </React.Fragment>
          )
        })}

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={createDotIcon(MARKER_COLORS[marker.kind ?? 'default'])}
          />
        ))}
      </MapContainer>
    </div>
  )
}

export default LiveMap
