import React, { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Polygon, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Plus, Minus, Crosshair } from 'lucide-react'
import { useMapClientConfig } from '@/shared/hooks/useMapClientConfig'
import { resolveMapTileLayer } from '@/shared/utils/map-tiles'
import type { LatLngPoint } from './geoUtils'

interface CityPreviewMapProps {
  center: LatLngPoint
  cityName: string
  boundary?: number[][][] | null
  height?: string
  zoom?: number
  onViewOnMap?: () => void
}

function MapUpdater({
  center,
  zoom = 12,
  boundary,
}: {
  center: LatLngPoint
  zoom?: number
  boundary?: number[][][] | null
}) {
  const map = useMap()

  useEffect(() => {
    map.invalidateSize()
    if (boundary?.[0]?.length && boundary[0].length >= 3) {
      const bounds = boundary[0].map(([lng, lat]) => [lat, lng] as [number, number])
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 })
    } else {
      map.setView([center.lat, center.lng], zoom, { animate: false })
    }

    const timer = setTimeout(() => {
      map.invalidateSize()
      if (boundary?.[0]?.length && boundary[0].length >= 3) {
        const bounds = boundary[0].map(([lng, lat]) => [lat, lng] as [number, number])
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 })
      } else {
        map.setView([center.lat, center.lng], zoom, { animate: false })
      }
    }, 120)

    return () => clearTimeout(timer)
  }, [boundary, center.lat, center.lng, map, zoom])

  return null
}

function MapControls({ center, zoom = 12 }: { center: LatLngPoint; zoom?: number }) {
  const map = useMap()

  return (
    <>
      {/* Top Left: Zoom and Locate Buttons */}
      <div className="absolute top-2 left-2 z-[400] flex flex-col gap-1 pointer-events-auto">
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
          title="Center on City"
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Right: Clean Scale */}
      <div className="absolute bottom-2 right-2.5 z-[400] flex items-center gap-1 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-slate-200/90 text-[10px] font-semibold text-slate-700 shadow-xs flex items-center gap-1.5">
          <span className="w-6 border-b-2 border-slate-700 inline-block align-middle"></span>
          <span>5 km</span>
        </div>
      </div>
    </>
  )
}

const createCityPinIcon = (cityName: string) => {
  return L.divIcon({
    className: 'custom-city-pin-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; pointer-events: none; transform: translate(-50%, -100%);">
        <div style="
          background: #1F2B6D;
          color: white;
          padding: 2.5px 8px;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 11px;
          box-shadow: 0 4px 10px rgba(15, 23, 42, 0.25);
          white-space: nowrap;
          margin-bottom: 2px;
          border: 1.5px solid #ffffff;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        ">
          <span style="display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: #38bdf8;"></span>
          ${cityName || 'City Center'}
        </div>
        <div style="
          width: 18px;
          height: 18px;
          background: #1F2B6D;
          border: 2px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 4px; height: 4px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

export const CityPreviewMap: React.FC<CityPreviewMapProps> = ({
  center,
  cityName,
  boundary,
  height = '280px',
  zoom = 12,
}) => {
  const { data: mapConfig } = useMapClientConfig()
  const tileLayer = useMemo(() => resolveMapTileLayer(mapConfig), [mapConfig])
  const pinIcon = useMemo(() => createCityPinIcon(cityName), [cityName])

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
        key={`preview-map-${center.lat.toFixed(4)}-${center.lng.toFixed(4)}-${zoom}`}
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer attribution="" url={tileLayer.url} />
        <MapUpdater center={center} zoom={zoom} boundary={boundary} />
        <MapControls center={center} zoom={zoom} />

        {polygonLatLngs && (
          <Polygon
            positions={polygonLatLngs}
            pathOptions={{
              color: '#1F2B6D',
              weight: 2.5,
              fillColor: '#3B82F6',
              fillOpacity: 0.18,
            }}
          />
        )}

        <Marker position={[center.lat, center.lng]} icon={pinIcon} />
      </MapContainer>
    </div>
  )
}

export default CityPreviewMap

