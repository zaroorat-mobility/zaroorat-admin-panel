import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { loadGoogleMapsSdk, onGoogleMapsAuthError } from './google-maps-loader'
import { useGoogleMapsKey } from '@/shared/hooks/useGoogleMapsKey'
import { AlertTriangle, Loader2, Navigation } from 'lucide-react'

export interface GeographicZoneItem {
  id: string
  name: string
  zoneType: 'SERVICE' | 'AIRPORT' | 'RESTRICTED' | 'SURGE' | string
  boundary?: number[][][] | null
  isActive?: boolean
}

export interface GoogleGeographicMapProps {
  center: { lat: number; lng: number }
  zoom?: number
  height?: string
  className?: string
  cityBoundary?: number[][][] | null
  zones?: GeographicZoneItem[]
  visibleZoneTypes?: {
    SERVICE?: boolean
    AIRPORT?: boolean
    RESTRICTED?: boolean
    SURGE?: boolean
    [key: string]: boolean | undefined
  }
  selectedZoneType?: string
  mapType?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid'
  onZoneClick?: (zoneId: string) => void
  onMapClick?: (coords: { lat: number; lng: number }) => void
}

const ZONE_PALETTE: Record<string, { stroke: string; fill: string; fillOpacity: number }> = {
  SERVICE:    { stroke: '#16a34a', fill: '#22c55e', fillOpacity: 0.28 },
  AIRPORT:    { stroke: '#ea580c', fill: '#f97316', fillOpacity: 0.32 },
  RESTRICTED: { stroke: '#dc2626', fill: '#ef4444', fillOpacity: 0.35 },
  SURGE:      { stroke: '#9333ea', fill: '#a855f7', fillOpacity: 0.35 },
}

function computeCentroid(ring: number[][]): { lat: number; lng: number } {
  if (!ring || ring.length === 0) return { lat: 0, lng: 0 }
  let sumLat = 0
  let sumLng = 0
  for (const [lng, lat] of ring) {
    sumLat += lat
    sumLng += lng
  }
  return { lat: sumLat / ring.length, lng: sumLng / ring.length }
}

export const GoogleGeographicMap: React.FC<GoogleGeographicMapProps> = memo(({
  center,
  zoom = 12,
  height = '480px',
  className = '',
  cityBoundary,
  zones = [],
  visibleZoneTypes = { SERVICE: true, AIRPORT: true, RESTRICTED: true, SURGE: true },
  selectedZoneType = 'ALL',
  mapType = 'roadmap',
  onZoneClick,
  onMapClick,
}) => {
  const { apiKey, isResolving } = useGoogleMapsKey()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const cityPolyRef = useRef<google.maps.Polygon | null>(null)
  const zonePolysRef = useRef<Map<string, google.maps.Polygon>>(new Map())
  const zoneMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map())

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeMapType, setActiveMapType] = useState(mapType)

  useEffect(() => {
    setActiveMapType(mapType)
  }, [mapType])

  useEffect(() => {
    return onGoogleMapsAuthError((err) => {
      setLoadError(err)
    })
  }, [])

  // Initialize Map
  useEffect(() => {
    if (isResolving) return
    let isCancelled = false

    const initMap = async () => {
      if (!containerRef.current) return
      setIsLoading(true)
      setLoadError(null)

      try {
        const google = await loadGoogleMapsSdk(apiKey)
        if (isCancelled || !containerRef.current) return

        const derivedCenter = zones?.[0]?.boundary?.[0]?.length
          ? {
              lat: zones[0].boundary[0].reduce((s, p) => s + p[1], 0) / zones[0].boundary[0].length,
              lng: zones[0].boundary[0].reduce((s, p) => s + p[0], 0) / zones[0].boundary[0].length,
            }
          : null
        const initialCenter = center || derivedCenter || { lat: 20.5937, lng: 78.9629 }

        const map = new google.maps.Map(containerRef.current, {
          center: initialCenter,
          zoom,
          mapTypeId: activeMapType,
          mapTypeControl: true,
          fullscreenControl: true,
          streetViewControl: false,
          zoomControl: true,
          gestureHandling: 'greedy',
        })

        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return
          onMapClick?.({ lat: e.latLng.lat(), lng: e.latLng.lng() })
        })

        mapRef.current = map
        setIsLoading(false)
      } catch (err: unknown) {
        if (!isCancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to initialize Google Maps')
          setIsLoading(false)
        }
      }
    }

    initMap()

    return () => {
      isCancelled = true
    }
  }, [apiKey, isResolving])

  // Update map type
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setMapTypeId(activeMapType)
    }
  }, [activeMapType])

  // Update Center & Zoom
  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.setCenter(center)
      if (zoom) mapRef.current.setZoom(zoom)
    }
  }, [center.lat, center.lng, zoom])

  // Sync City Boundary
  useEffect(() => {
    const map = mapRef.current
    if (!map || isLoading || !window.google?.maps) return

    if (cityPolyRef.current) {
      cityPolyRef.current.setMap(null)
      cityPolyRef.current = null
    }

    if (cityBoundary?.[0] && cityBoundary[0].length >= 3) {
      const path = cityBoundary[0].map(([lng, lat]) => ({ lat, lng }))
      const poly = new google.maps.Polygon({
        map,
        paths: path,
        strokeColor: '#2563EB',
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: '#3B82F6',
        fillOpacity: 0.08,
        zIndex: 1,
        clickable: false,
      })
      cityPolyRef.current = poly
    }
  }, [cityBoundary, isLoading])

  // Sync Zone Polygons & Centroid Badges
  useEffect(() => {
    const map = mapRef.current
    if (!map || isLoading || !window.google?.maps) return

    // Clean up old
    zonePolysRef.current.forEach((p) => p.setMap(null))
    zonePolysRef.current.clear()
    zoneMarkersRef.current.forEach((m) => m.setMap(null))
    zoneMarkersRef.current.clear()

    const bounds = new google.maps.LatLngBounds()
    let hasPoints = false

    zones.forEach((zone) => {
      const type = zone.zoneType || 'SERVICE'
      const isVisible = visibleZoneTypes[type] ?? true
      const matchesFilter = selectedZoneType === 'ALL' || selectedZoneType === type

      if (!isVisible || !matchesFilter) return

      const outerRing = zone.boundary?.[0]
      if (!outerRing || outerRing.length < 3) return

      const path = outerRing.map(([lng, lat]) => {
        const pt = { lat, lng }
        bounds.extend(pt)
        hasPoints = true
        return pt
      })

      const palette = ZONE_PALETTE[type] || ZONE_PALETTE.SERVICE

      const poly = new google.maps.Polygon({
        map,
        paths: path,
        strokeColor: palette.stroke,
        strokeWeight: 2.2,
        strokeOpacity: 0.9,
        fillColor: palette.fill,
        fillOpacity: palette.fillOpacity,
        zIndex: 2,
        clickable: true,
      })

      poly.addListener('click', () => {
        onZoneClick?.(zone.id)
      })

      zonePolysRef.current.set(zone.id, poly)

      // Add Centroid Marker
      const centroid = computeCentroid(outerRing)
      const marker = new google.maps.Marker({
        map,
        position: centroid,
        title: zone.name,
        label: {
          text: zone.name,
          color: '#1E293B',
          fontSize: '11px',
          fontWeight: '700',
          className: 'google-zone-badge-label',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: palette.stroke,
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        zIndex: 3,
      })

      marker.addListener('click', () => {
        onZoneClick?.(zone.id)
      })

      zoneMarkersRef.current.set(zone.id, marker)
    })

    // If city boundary has points and no zones, fit to boundary
    if (!hasPoints && cityBoundary?.[0] && cityBoundary[0].length >= 3) {
      cityBoundary[0].forEach(([lng, lat]) => {
        bounds.extend({ lat, lng })
        hasPoints = true
      })
    }

    if (hasPoints) {
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 })
    }
  }, [zones, cityBoundary, visibleZoneTypes, selectedZoneType, isLoading, onZoneClick])

  // Recenter Handler
  const handleRecenter = useCallback(() => {
    if (!mapRef.current) return
    mapRef.current.setCenter(center)
    mapRef.current.setZoom(zoom)
  }, [center, zoom])

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm ${className}`}
      style={{ height }}
    >
      {/* Map Target Canvas */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Recenter & Map Controls */}
      {!isLoading && !loadError && (
        <div className="absolute right-3.5 bottom-3.5 z-10 flex items-center gap-2">
          {/* Layer switcher shortcuts */}
          <div className="flex items-center rounded-lg border border-border/80 bg-background/95 p-0.5 shadow-md backdrop-blur-md">
            {(['roadmap', 'satellite', 'terrain', 'hybrid'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setActiveMapType(type)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold capitalize transition-all ${
                  activeMapType === type
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRecenter}
            className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/95 px-3 py-2 text-xs font-semibold text-foreground shadow-md backdrop-blur-md transition-all hover:bg-muted active:scale-95"
            title="Recenter Map"
          >
            <Navigation className="h-3.5 w-3.5 text-primary" />
            <span>Center</span>
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-xs font-medium text-muted-foreground">Loading Google Maps Web SDK...</p>
        </div>
      )}

      {/* Error Overlay */}
      {loadError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/90 p-6 text-center backdrop-blur-md">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">Google Maps Authorization</h4>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">{loadError}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Configure your active Google Maps API key in Settings &gt; Map Providers.
          </p>
        </div>
      )}
    </div>
  )
})

GoogleGeographicMap.displayName = 'GoogleGeographicMap'
