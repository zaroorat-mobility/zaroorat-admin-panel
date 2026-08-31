import React, { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, CircleMarker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { cn } from '@/shared/utils'
import { useMapClientConfig } from '@/shared/hooks/useMapClientConfig'
import { resolveMapTileLayer } from '@/shared/utils/map-tiles'

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
  const { data: mapConfig } = useMapClientConfig()
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
      pts.push([r.pickup.lat, r.pickup.lng], [r.drop.lat, r.drop.lng])
      if (r.driverLocation) {
        pts.push([r.driverLocation.lat, r.driverLocation.lng])
      }
    }
    return pts
  }, [markers, routes])

  const mapCenter = useMemo<[number, number]>(() => {
    if (center) return center
    if (allPoints.length > 0) return allPoints[0]
    return [20.5937, 78.9629]
  }, [allPoints, center])

  const mapKey = allPoints.map((p) => p.join(',')).join('|') || 'default'

  return (
    <div className={cn('rounded-xl overflow-hidden border border-border', className)} style={{ height }}>
      <MapContainer key={mapKey} center={mapCenter} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution={tileLayer.attribution} url={tileLayer.url} />
        <FitBounds points={allPoints} />

        {routes.map((route) => {
          const line: [number, number][] = [[route.pickup.lat, route.pickup.lng]]
          if (route.driverLocation) {
            line.push([route.driverLocation.lat, route.driverLocation.lng])
          }
          line.push([route.drop.lat, route.drop.lng])

          return (
            <React.Fragment key={route.id}>
              <Polyline positions={line} pathOptions={{ color: '#6366f1', weight: 3, opacity: 0.75, dashArray: '6 8' }} />
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
