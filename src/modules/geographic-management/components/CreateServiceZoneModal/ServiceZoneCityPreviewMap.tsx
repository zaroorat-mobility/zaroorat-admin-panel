import React, { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Polygon, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Plus, Minus, Crosshair } from 'lucide-react'
import { useMapClientConfig } from '@/shared/hooks/useMapClientConfig'
import { resolveMapTileLayer } from '@/shared/utils/map-tiles'
import type { LatLngPoint } from '../CreateCityModal/geoUtils'

interface ServiceZoneCityPreviewMapProps {
  center: LatLngPoint
  cityName: string
  boundary?: number[][][] | null
  height?: string
  zoom?: number
}

function MapUpdater({
  boundary,
  center,
  zoom = 11,
}: {
  boundary?: number[][][] | null
  center: LatLngPoint
  zoom?: number
}) {
  const map = useMap()
  const prevCenter = useRef(center)

  useEffect(() => {
    map.invalidateSize()
    if (boundary?.[0]?.length && boundary[0].length >= 3) {
      const bounds = boundary[0].map(([lng, lat]) => [lat, lng] as [number, number])
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 13 })
    } else {
      map.setView([center.lat, center.lng], zoom)
    }

    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 150)
    return () => clearTimeout(timer)
  }, [boundary, center, map, zoom])

  useEffect(() => {
    const centerChanged =
      Math.abs(prevCenter.current.lat - center.lat) > 0.001 ||
      Math.abs(prevCenter.current.lng - center.lng) > 0.001

    if (centerChanged) {
      if (boundary?.[0]?.length && boundary[0].length >= 3) {
        const bounds = boundary[0].map(([lng, lat]) => [lat, lng] as [number, number])
        map.fitBounds(bounds, { padding: [28, 28], maxZoom: 13, animate: true })
      } else {
        map.setView([center.lat, center.lng], zoom, { animate: true })
      }
      prevCenter.current = center
    }
  }, [center, boundary, map, zoom])

  return null
}

function MapControls({ center, zoom = 11 }: { center: LatLngPoint; zoom?: number }) {
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
        onClick={() => map.setView([center.lat, center.lng], zoom, { animate: true })}
        className="p-1.5 bg-white/95 backdrop-blur-md hover:bg-slate-50 border border-slate-200/90 rounded-lg text-slate-700 shadow-sm transition-colors flex items-center justify-center cursor-pointer"
        title="Center City View"
      >
        <Crosshair className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

const createCityCenterLabelIcon = (cityName: string) => {
  return L.divIcon({
    className: 'custom-city-center-label',
    html: `
      <div style="
        font-family: inherit;
        font-weight: 800;
        font-size: 14px;
        color: #0f172a;
        text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff;
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

export const ServiceZoneCityPreviewMap: React.FC<ServiceZoneCityPreviewMapProps> = ({
  center,
  cityName,
  boundary,
  height = '275px',
  zoom = 11,
}) => {
  const { data: mapConfig } = useMapClientConfig()
  const tileLayer = useMemo(() => resolveMapTileLayer(mapConfig), [mapConfig])
  const labelIcon = useMemo(() => createCityCenterLabelIcon(cityName), [cityName])

  const polygonLatLngs = useMemo(() => {
    if (!boundary?.[0] || boundary[0].length < 3) return null
    return boundary[0].map(([lng, lat]) => [lat, lng] as [number, number])
  }, [boundary])

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-slate-200/90 bg-slate-100 shadow-inner [&_.leaflet-control-attribution]:hidden"
      style={{ height }}
    >
      <MapContainer
        key={`sz-city-map-${center.lat.toFixed(4)}-${center.lng.toFixed(4)}`}
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer attribution="" url={tileLayer.url} />
        <MapUpdater boundary={boundary} center={center} zoom={zoom} />
        <MapControls center={center} zoom={zoom} />

        {polygonLatLngs && (
          <Polygon
            positions={polygonLatLngs}
            pathOptions={{
              color: '#2563EB',
              weight: 2.5,
              fillColor: '#60A5FA',
              fillOpacity: 0.18,
            }}
          />
        )}

        <Marker position={[center.lat, center.lng]} icon={labelIcon} />
      </MapContainer>

      {/* Floating Legend on Top Right matching screenshot */}
      <div className="absolute top-2.5 right-2.5 z-[400] bg-white/95 backdrop-blur-md rounded-lg border border-slate-200/90 shadow-md p-2 pointer-events-auto text-[11px] font-semibold space-y-1.5 min-w-[125px]">
        <div className="flex items-center gap-2 text-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-100"></span>
          <span>City Boundary</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-white"></span>
          <span>Service Zones</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-amber-500 bg-white"></span>
          <span>Airport Zones</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-red-500 bg-white"></span>
          <span>Restricted Zones</span>
        </div>
      </div>

      {/* Bottom Right: Scale indicator */}
      <div className="absolute bottom-2 right-2.5 z-[400] pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-slate-200/90 text-[10px] font-semibold text-slate-700 shadow-xs flex items-center gap-1.5">
          <span className="w-6 border-b-2 border-slate-700 inline-block align-middle"></span>
          <span>5 km</span>
        </div>
      </div>
    </div>
  )
}

export default ServiceZoneCityPreviewMap
