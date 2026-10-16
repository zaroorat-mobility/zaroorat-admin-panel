import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { loadGoogleMapsSdk, onGoogleMapsAuthError } from './google-maps-loader'
import { AlertTriangle, Loader2, Plus, Minus, Crosshair } from 'lucide-react'

export interface OverlayZoneItem {
  id: string
  name?: string
  zoneType?: 'SERVICE' | 'AIRPORT' | 'RESTRICTED' | 'SURGE' | string
  boundary: number[][][]
  color?: string
  fillColor?: string
  fillOpacity?: number
}

export interface GoogleZoneDrawingMapProps {
  coordinates?: number[][][] | null
  onChange?: (coords: number[][][] | null) => void
  cityBoundary?: number[][][] | null
  center: { lat: number; lng: number }
  cityName?: string
  zoneName?: string
  zoneType?: string
  height?: string
  className?: string
  mapType?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid'
  apiKey?: string
  toolMode?: 'draw' | 'edit' | 'pan'
  overlayZones?: OverlayZoneItem[]
  showCityBoundary?: boolean
  showOverlayZones?: boolean
  flyToTarget?: { lat: number; lng: number; zoom?: number; timestamp?: number } | null
  fitTrigger?: number
  searchPin?: { lat: number; lng: number; name: string } | null
}

const ZONE_PALETTE: Record<string, { stroke: string; fill: string; fillOpacity: number }> = {
  SERVICE:    { stroke: '#2563EB', fill: '#3B82F6', fillOpacity: 0.38 },
  AIRPORT:    { stroke: '#059669', fill: '#10B981', fillOpacity: 0.32 },
  RESTRICTED: { stroke: '#D97706', fill: '#F59E0B', fillOpacity: 0.32 },
  SURGE:      { stroke: '#7C3AED', fill: '#A855F7', fillOpacity: 0.38 },
}

function ringToGooglePath(ring: number[][]): google.maps.LatLngLiteral[] {
  return ring.map(([lng, lat]) => ({ lat, lng }))
}

function googlePathToRing(path: google.maps.MVCArray<google.maps.LatLng>): number[][][] {
  const points: [number, number][] = []
  for (let i = 0; i < path.getLength(); i++) {
    const pt = path.getAt(i)
    points.push([Number(pt.lng().toFixed(6)), Number(pt.lat().toFixed(6))])
  }
  if (points.length >= 3) {
    const first = points[0]
    const last = points[points.length - 1]
    if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
      points.push([first[0], first[1]])
    }
  }
  return [points]
}

export const GoogleZoneDrawingMap: React.FC<GoogleZoneDrawingMapProps> = memo(({
  coordinates,
  onChange,
  cityBoundary,
  center,
  cityName,
  zoneName: _zoneName,
  zoneType = 'SERVICE',
  height = '440px',
  className = '',
  mapType = 'roadmap',
  apiKey,
  toolMode = 'draw',
  overlayZones = [],
  showCityBoundary = true,
  showOverlayZones = true,
  flyToTarget,
  fitTrigger = 0,
  searchPin,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const activePolyRef = useRef<google.maps.Polygon | null>(null)
  const cityPolyRef = useRef<google.maps.Polygon | null>(null)
  const overlayPolysRef = useRef<Map<string, google.maps.Polygon>>(new Map())
  const searchMarkerRef = useRef<google.maps.Marker | null>(null)
  const syncingRef = useRef(false)

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    return onGoogleMapsAuthError((err) => {
      setLoadError(err)
    })
  }, [])

  // Update base map layer type
  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.google?.maps) return
    const typeMap: Record<string, google.maps.MapTypeId> = {
      roadmap: google.maps.MapTypeId.ROADMAP,
      satellite: google.maps.MapTypeId.SATELLITE,
      terrain: google.maps.MapTypeId.TERRAIN,
      hybrid: google.maps.MapTypeId.HYBRID,
    }
    map.setMapTypeId(typeMap[mapType] || google.maps.MapTypeId.ROADMAP)
  }, [mapType])

  // Attach path listeners to active polygon so dragging/inserting vertices calls onChange
  const attachPathListeners = useCallback(
    (poly: google.maps.Polygon) => {
      const path = poly.getPath()
      const emitChange = () => {
        if (syncingRef.current) return
        const newCoords = googlePathToRing(path)
        onChange?.(newCoords)
      }
      path.addListener('set_at', emitChange)
      path.addListener('insert_at', emitChange)
      path.addListener('remove_at', emitChange)
    },
    [onChange]
  )

  // Initialize Map
  useEffect(() => {
    let isCancelled = false

    const initMap = async () => {
      if (!containerRef.current) return
      setIsLoading(true)
      setLoadError(null)

      try {
        const google = await loadGoogleMapsSdk(apiKey)
        const computedCenter =
          (cityBoundary?.[0]?.length
            ? {
                lat: cityBoundary[0].reduce((s, p) => s + p[1], 0) / cityBoundary[0].length,
                lng: cityBoundary[0].reduce((s, p) => s + p[0], 0) / cityBoundary[0].length,
              }
            : null) ||
          (coordinates?.[0]?.length
            ? {
                lat: coordinates[0].reduce((s, p) => s + p[1], 0) / coordinates[0].length,
                lng: coordinates[0].reduce((s, p) => s + p[0], 0) / coordinates[0].length,
              }
            : null) ||
          center
        const initialCenter = center || computedCenter

        const map = new google.maps.Map(containerRef.current, {
          center: initialCenter,
          zoom: 12,
          mapTypeId:
            mapType === 'satellite'
              ? google.maps.MapTypeId.SATELLITE
              : mapType === 'terrain'
              ? google.maps.MapTypeId.TERRAIN
              : google.maps.MapTypeId.ROADMAP,
          mapTypeControl: false,
          fullscreenControl: true,
          streetViewControl: false,
          zoomControl: false,
          gestureHandling: 'greedy',
        })

        // Click on map to add vertex in 'draw' mode
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return
          if (toolMode !== 'draw') return

          const newLng = Number(e.latLng.lng().toFixed(6))
          const newLat = Number(e.latLng.lat().toFixed(6))

          const currentRing = coordinates?.[0] ? [...coordinates[0]] : []
          // If ring is closed (first === last), remove the closing point before adding
          if (
            currentRing.length > 2 &&
            currentRing[0][0] === currentRing[currentRing.length - 1][0] &&
            currentRing[0][1] === currentRing[currentRing.length - 1][1]
          ) {
            currentRing.pop()
          }

          currentRing.push([newLng, newLat])

          // Close the ring if >= 3 points
          if (currentRing.length >= 3) {
            currentRing.push([currentRing[0][0], currentRing[0][1]])
          }

          onChange?.([currentRing])
        })

        mapRef.current = map
        setIsLoading(false)
      } catch (err: unknown) {
        if (!isCancelled) {
          setLoadError(err instanceof Error ? err.message : 'Google Maps failed to load')
          setIsLoading(false)
        }
      }
    }

    void initMap()

    return () => {
      isCancelled = true
    }
  }, [apiKey])

  // Sync City Boundary reference polygon
  useEffect(() => {
    const map = mapRef.current
    if (!map || isLoading || !window.google?.maps) return

    if (cityPolyRef.current) {
      cityPolyRef.current.setMap(null)
      cityPolyRef.current = null
    }

    if (showCityBoundary && cityBoundary?.[0] && cityBoundary[0].length >= 3) {
      const path = ringToGooglePath(cityBoundary[0])
      cityPolyRef.current = new window.google.maps.Polygon({
        paths: path,
        strokeColor: '#2563EB',
        strokeOpacity: 0.9,
        strokeWeight: 2.5,
        fillColor: '#60A5FA',
        fillOpacity: 0.12,
        map,
        clickable: false,
        zIndex: 1,
      })
    }
  }, [cityBoundary, showCityBoundary, isLoading])

  // Sync Overlay Zones (Existing zones, Airport zones, Restricted zones, etc.)
  useEffect(() => {
    const map = mapRef.current
    if (!map || isLoading || !window.google?.maps) return

    // Clean up previous overlay polygons
    overlayPolysRef.current.forEach((p) => p.setMap(null))
    overlayPolysRef.current.clear()

    if (showOverlayZones && overlayZones.length > 0) {
      overlayZones.forEach((z) => {
        if (!z.boundary?.[0] || z.boundary[0].length < 3) return
        const palette = ZONE_PALETTE[z.zoneType || 'SERVICE'] || ZONE_PALETTE.SERVICE
        const stroke = z.color || palette.stroke
        const fill = z.fillColor || palette.fill
        const opacity = z.fillOpacity ?? palette.fillOpacity

        const poly = new window.google.maps.Polygon({
          paths: ringToGooglePath(z.boundary[0]),
          strokeColor: stroke,
          strokeOpacity: 0.85,
          strokeWeight: 2,
          fillColor: fill,
          fillOpacity: opacity,
          map,
          clickable: true,
          zIndex: 2,
        })
        overlayPolysRef.current.set(z.id, poly)
      })
    }
  }, [overlayZones, showOverlayZones, isLoading])

  // Sync Active Zone Polygon
  useEffect(() => {
    const map = mapRef.current
    if (!map || isLoading || !window.google?.maps) return

    syncingRef.current = true

    const palette = ZONE_PALETTE[zoneType] || ZONE_PALETTE.SERVICE
    const isEditable = toolMode === 'edit'

    if (coordinates?.[0] && coordinates[0].length >= 3) {
      const pathCoords = ringToGooglePath(coordinates[0])

      if (!activePolyRef.current) {
        const poly = new window.google.maps.Polygon({
          paths: pathCoords,
          strokeColor: palette.stroke,
          strokeOpacity: 1.0,
          strokeWeight: 2.8,
          fillColor: palette.fill,
          fillOpacity: palette.fillOpacity,
          editable: isEditable,
          draggable: false,
          map,
          zIndex: 10,
        })
        attachPathListeners(poly)
        activePolyRef.current = poly
      } else {
        activePolyRef.current.setPaths(pathCoords)
        activePolyRef.current.setOptions({
          strokeColor: palette.stroke,
          fillColor: palette.fill,
          fillOpacity: palette.fillOpacity,
          editable: isEditable,
        })
      }
    } else {
      if (activePolyRef.current) {
        activePolyRef.current.setMap(null)
        activePolyRef.current = null
      }
    }

    syncingRef.current = false
  }, [coordinates, toolMode, zoneType, isLoading, attachPathListeners])

  // Sync Search Pin Marker
  useEffect(() => {
    const map = mapRef.current
    if (!map || isLoading || !window.google?.maps) return

    if (searchMarkerRef.current) {
      searchMarkerRef.current.setMap(null)
      searchMarkerRef.current = null
    }

    if (searchPin) {
      searchMarkerRef.current = new window.google.maps.Marker({
        position: { lat: searchPin.lat, lng: searchPin.lng },
        map,
        title: searchPin.name,
        animation: window.google.maps.Animation.DROP,
        zIndex: 20,
      })
    }
  }, [searchPin, isLoading])

  // Camera flyToTarget
  useEffect(() => {
    const map = mapRef.current
    if (!map || isLoading || !flyToTarget) return

    map.panTo({ lat: flyToTarget.lat, lng: flyToTarget.lng })
    if (flyToTarget.zoom) {
      map.setZoom(flyToTarget.zoom)
    }
  }, [flyToTarget, isLoading])

  // Fit bounds triggered by button
  useEffect(() => {
    const map = mapRef.current
    if (!map || isLoading || !window.google?.maps) return

    const targetPoly = cityBoundary?.[0]?.length ? cityBoundary : coordinates
    if (targetPoly?.[0] && targetPoly[0].length >= 3) {
      const bounds = new window.google.maps.LatLngBounds()
      targetPoly[0].forEach(([lng, lat]) => bounds.extend({ lat, lng }))
      map.fitBounds(bounds, { top: 30, right: 30, bottom: 30, left: 30 })
    } else {
      map.setCenter({ lat: center.lat, lng: center.lng })
      map.setZoom(12)
    }
  }, [fitTrigger, cityBoundary, coordinates, center, isLoading])

  // Camera controls
  const handleZoomIn = () => {
    const map = mapRef.current
    if (map) map.setZoom((map.getZoom() || 12) + 1)
  }

  const handleZoomOut = () => {
    const map = mapRef.current
    if (map) map.setZoom((map.getZoom() || 12) - 1)
  }

  const handleCenterCity = () => {
    const map = mapRef.current
    if (map) {
      map.panTo({ lat: center.lat, lng: center.lng })
      map.setZoom(12)
    }
  }

  return (
    <div className={`relative w-full overflow-hidden rounded-xl border border-slate-200/90 bg-slate-900 ${className}`} style={{ height }}>
      {/* Google Maps Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* High-DPI Floating Zoom & Center Controls */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-1.5 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-lg border border-slate-200/90 shadow-sm flex flex-col overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100 flex items-center justify-center cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleCenterCity}
          className="p-1.5 bg-white/95 backdrop-blur-md hover:bg-slate-50 border border-slate-200/90 rounded-lg text-slate-700 shadow-sm transition-colors flex items-center justify-center cursor-pointer"
          title={`Center on ${cityName || 'City'}`}
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[450]">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/90 shadow-lg border border-slate-200 text-xs font-semibold text-slate-800">
            <Loader2 className="w-4 h-4 animate-spin text-[#1F2B6D]" />
            <span>Loading Google Maps Web SDK...</span>
          </div>
        </div>
      )}

      {/* Error Notice */}
      {loadError && (
        <div className="absolute bottom-3 left-3 right-3 p-3 rounded-lg bg-amber-500/95 text-white text-xs border border-amber-600 flex items-center gap-2 shadow-lg z-[450]">
          <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
          <p className="flex-1">{loadError}</p>
        </div>
      )}
    </div>
  )
})
