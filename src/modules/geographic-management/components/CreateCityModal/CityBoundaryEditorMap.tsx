import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  Polyline,
  CircleMarker,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, Compass, Maximize2, Minimize2, Scan, Loader2 } from 'lucide-react'
import { useMapClientConfig } from '@/shared/hooks/useMapClientConfig'
import { resolveMapTileLayer } from '@/shared/utils/map-tiles'
import type { LatLngPoint } from './geoUtils'

export type MapLayerType = 'map' | 'satellite' | 'terrain'

interface CityBoundaryEditorMapProps {
  center: LatLngPoint
  cityName: string
  boundaryType: 'official' | 'radius' | 'polygon'
  coordinates?: number[][][] | null
  onChangeCoordinates: (coords: number[][][]) => void
  onCenterChange?: (center: LatLngPoint) => void
  drawMode: 'draw' | 'edit' | 'idle'
  height?: string
}

const LAYER_TILES: Record<MapLayerType, { url: string; attribution: string }> = {
  map: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
  },
}

function MapController({
  center,
  coordinates,
  isDrawing,
  onMapClick,
}: {
  center: LatLngPoint
  coordinates?: number[][][] | null
  isDrawing: boolean
  onMapClick: (point: [number, number]) => void
}) {
  const map = useMap()
  const initialFitDone = useRef(false)
  const prevCenter = useRef(center)

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 120)
    return () => clearTimeout(timer)
  }, [map])

  // Fit bounds on first load or when center significantly moves
  useEffect(() => {
    const centerMoved =
      Math.abs(prevCenter.current.lat - center.lat) > 0.001 ||
      Math.abs(prevCenter.current.lng - center.lng) > 0.001

    if (!initialFitDone.current || centerMoved) {
      if (coordinates?.[0]?.length && coordinates[0].length >= 3) {
        const bounds = coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number])
        map.fitBounds(bounds, { padding: [36, 36] })
      } else {
        map.setView([center.lat, center.lng], 12)
      }
      initialFitDone.current = true
      prevCenter.current = center
    }
  }, [center, coordinates, map])

  useMapEvents({
    click(e) {
      if (isDrawing) {
        onMapClick([Number(e.latlng.lng.toFixed(6)), Number(e.latlng.lat.toFixed(6))])
      }
    },
  })

  return null
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

const vertexEditIcon = L.divIcon({
  className: 'polygon-vertex-handle-edit',
  html: `
    <div style="
      width: 12px;
      height: 12px;
      background: #FFFFFF;
      border: 2.5px solid #1F2B6D;
      border-radius: 50%;
      box-shadow: 0 2px 5px rgba(0,0,0,0.35);
      cursor: grab;
      transition: transform 0.1s ease;
    "></div>
  `,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

export const CityBoundaryEditorMap: React.FC<CityBoundaryEditorMapProps> = ({
  center,
  cityName,
  boundaryType,
  coordinates,
  onChangeCoordinates,
  onCenterChange,
  drawMode,
  height = '310px',
}) => {
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('map')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  const { data: mapConfig } = useMapClientConfig()
  const defaultTile = useMemo(() => resolveMapTileLayer(mapConfig), [mapConfig])

  const currentTileLayer = useMemo(() => {
    if (activeLayer === 'map') return defaultTile
    return LAYER_TILES[activeLayer]
  }, [activeLayer, defaultTile])

  const pinIcon = useMemo(() => createCityPinIcon(cityName), [cityName])

  // LatLng coordinates for Leaflet Polygon
  const polygonLatLngs = useMemo(() => {
    if (!coordinates?.[0] || coordinates[0].length < 3) return null
    return coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number])
  }, [coordinates])

  // Unique vertices (omit closing duplicate)
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

  const handleMapClick = useCallback(
    (point: [number, number]) => {
      if (boundaryType !== 'polygon' || drawMode !== 'draw') return

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
        onChangeCoordinates([closed])
      } else {
        onChangeCoordinates([currentRing])
      }
    },
    [boundaryType, coordinates, drawMode, onChangeCoordinates],
  )

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
      onChangeCoordinates([ring])
    },
    [coordinates, onChangeCoordinates],
  )

  const handleFitBounds = () => {
    if (!mapInstanceRef.current) return
    if (coordinates?.[0]?.length && coordinates[0].length >= 3) {
      const bounds = coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number])
      mapInstanceRef.current.fitBounds(bounds, { padding: [36, 36], animate: true })
    } else {
      mapInstanceRef.current.setView([center.lat, center.lng], 12, { animate: true })
    }
  }

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation && onCenterChange) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newCenter = {
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
          }
          onCenterChange(newCenter)
          mapInstanceRef.current?.setView([newCenter.lat, newCenter.lng], 13, { animate: true })
        },
        (err) => {
          console.warn('Geolocation error:', err.message)
        },
        { enableHighAccuracy: true, timeout: 5000 },
      )
    }
  }

  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim() || isSearching) return
    setIsSearching(true)
    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=1`,
      )
      if (res.ok) {
        const data = await res.json()
        if (data.features?.[0]?.geometry?.coordinates) {
          const [lng, lat] = data.features[0].geometry.coordinates
          const foundCenter = { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) }
          onCenterChange?.(foundCenter)
          mapInstanceRef.current?.setView([foundCenter.lat, foundCenter.lng], 13, { animate: true })
        }
      }
    } catch (err) {
      console.error('Location search failed:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-xl overflow-hidden border border-slate-200/90 bg-slate-100 flex flex-col shadow-inner"
    >
      {/* Top Search & Actions Bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-[400] flex items-center justify-between gap-2 pointer-events-none">
        {/* Search form */}
        <form
          onSubmit={handleSearchLocation}
          className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md rounded-lg border border-slate-200/90 shadow-sm px-2.5 py-1 w-56 sm:w-64 pointer-events-auto"
        >
          {isSearching ? (
            <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
          ) : (
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
          <input
            type="text"
            placeholder="Search location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400"
          />
        </form>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            title="Locate Current Position"
            className="flex items-center gap-1 bg-white/95 backdrop-blur-md hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Current</span>
          </button>

          {/* Layer Switcher */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-lg p-0.5 shadow-sm flex items-center gap-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveLayer('map')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                activeLayer === 'map'
                  ? 'bg-[#1F2B6D] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Map
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('satellite')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                activeLayer === 'satellite'
                  ? 'bg-[#1F2B6D] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('terrain')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                activeLayer === 'terrain'
                  ? 'bg-[#1F2B6D] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Terrain
            </button>
          </div>

          {/* Fit Boundary */}
          <button
            type="button"
            onClick={handleFitBounds}
            title="Fit Boundary to View"
            className="p-1.5 bg-white/95 backdrop-blur-md hover:bg-slate-50 border border-slate-200/90 text-slate-600 hover:text-[#1F2B6D] rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Scan className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={handleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-1.5 bg-white/95 backdrop-blur-md hover:bg-slate-50 border border-slate-200/90 text-slate-600 hover:text-[#1F2B6D] rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div style={{ height }}>
        <MapContainer
          key={`${center.lat},${center.lng}-${activeLayer}`}
          center={[center.lat, center.lng]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          ref={(ref) => {
            if (ref) mapInstanceRef.current = ref
          }}
        >
          <TileLayer attribution={currentTileLayer.attribution} url={currentTileLayer.url} />

          <MapController
            center={center}
            coordinates={coordinates}
            isDrawing={drawMode === 'draw'}
            onMapClick={handleMapClick}
          />

          {/* In-progress drawing polyline when only 2 points exist */}
          {coordinates?.[0] && coordinates[0].length === 2 && (
            <Polyline
              positions={coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number])}
              pathOptions={{ color: '#2563EB', weight: 2.5, dashArray: '6, 6' }}
            />
          )}

          {/* Closed Polygon */}
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

          {/* Interactive Draggable Vertex Handles in EDIT mode */}
          {boundaryType === 'polygon' &&
            drawMode === 'edit' &&
            uniqueVertices.map(([lng, lat], idx) => (
              <Marker
                key={`vertex-edit-${idx}`}
                position={[lat, lng]}
                icon={vertexEditIcon}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target
                    const newPos = marker.getLatLng()
                    handleVertexDrag(idx, newPos)
                  },
                }}
              />
            ))}

          {/* Sleek static vertex markers when NOT in edit mode (only if <= 24 vertices to eliminate beaded ring) */}
          {boundaryType === 'polygon' &&
            drawMode !== 'edit' &&
            uniqueVertices.length > 0 &&
            uniqueVertices.length <= 24 &&
            uniqueVertices.map(([lng, lat], idx) => (
              <CircleMarker
                key={`vertex-view-${idx}`}
                center={[lat, lng]}
                radius={3.5}
                pathOptions={{
                  color: '#1F2B6D',
                  fillColor: '#FFFFFF',
                  fillOpacity: 1,
                  weight: 1.5,
                }}
              />
            ))}

          <Marker position={[center.lat, center.lng]} icon={pinIcon} />
        </MapContainer>
      </div>

      {/* Map Floating Status Pill & Scale Indicator */}
      <div className="absolute bottom-2 left-2.5 right-2.5 z-[400] flex items-center justify-between pointer-events-none">
        {drawMode === 'draw' && (
          <div className="bg-[#1F2B6D]/95 text-white text-[11px] font-medium px-3 py-1 rounded-full shadow-lg backdrop-blur-md flex items-center gap-1.5 pointer-events-auto border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Click map to add boundary points</span>
          </div>
        )}
        {drawMode === 'edit' && (
          <div className="bg-slate-900/95 text-white text-[11px] font-medium px-3 py-1 rounded-full shadow-lg backdrop-blur-md flex items-center gap-1.5 pointer-events-auto border border-white/20">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Drag white control handles to reshape</span>
          </div>
        )}
        {drawMode === 'idle' && boundaryType === 'radius' && (
          <div className="bg-slate-900/80 text-white text-[10.5px] font-medium px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-md flex items-center gap-1.5 pointer-events-auto">
            <span>Radius: Circular coverage zone</span>
          </div>
        )}
        {drawMode === 'idle' && boundaryType === 'official' && (
          <div className="bg-slate-900/80 text-white text-[10.5px] font-medium px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-md flex items-center gap-1.5 pointer-events-auto">
            <span>Official: Municipal boundary</span>
          </div>
        )}
        <div className="ml-auto bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-200/90 text-[10.5px] font-semibold text-slate-700 shadow-xs pointer-events-auto">
          <span className="w-7 border-b-2 border-slate-700 inline-block mr-1.5 align-middle"></span>
          <span>5 km</span>
        </div>
      </div>
    </div>
  )
}

