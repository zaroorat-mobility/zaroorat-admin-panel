import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { loadGoogleMapsSdk, onGoogleMapsAuthError } from './google-maps-loader'
import { useGoogleMapsKey } from '@/shared/hooks/useGoogleMapsKey'
import { AlertTriangle, Loader2, Navigation } from 'lucide-react'

export interface GoogleZoneViewerProps {
  coordinates?: number[][][] | null
  referenceCoordinates?: number[][][] | null
  center?: { lat: number; lng: number } | null
  zoom?: number
  height?: string
  className?: string
  zoneName?: string
  zoneType?: string
}

const ZONE_PALETTE: Record<string, { stroke: string; fill: string; fillOpacity: number }> = {
  SERVICE:    { stroke: '#16a34a', fill: '#22c55e', fillOpacity: 0.28 },
  AIRPORT:    { stroke: '#ea580c', fill: '#f97316', fillOpacity: 0.32 },
  RESTRICTED: { stroke: '#dc2626', fill: '#ef4444', fillOpacity: 0.35 },
  SURGE:      { stroke: '#9333ea', fill: '#a855f7', fillOpacity: 0.35 },
}

export const GoogleZoneViewer: React.FC<GoogleZoneViewerProps> = memo(({
  coordinates,
  referenceCoordinates,
  center,
  zoom = 13,
  height = '400px',
  className = '',
  zoneName,
  zoneType = 'SERVICE',
}) => {
  const { apiKey, isResolving } = useGoogleMapsKey()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const polygonRef = useRef<google.maps.Polygon | null>(null)
  const referencePolygonRef = useRef<google.maps.Polygon | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

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

        const derivedCenter =
          (coordinates?.[0]?.length
            ? {
                lat: coordinates[0].reduce((s, p) => s + p[1], 0) / coordinates[0].length,
                lng: coordinates[0].reduce((s, p) => s + p[0], 0) / coordinates[0].length,
              }
            : null) ||
          (referenceCoordinates?.[0]?.length
            ? {
                lat: referenceCoordinates[0].reduce((s, p) => s + p[1], 0) / referenceCoordinates[0].length,
                lng: referenceCoordinates[0].reduce((s, p) => s + p[0], 0) / referenceCoordinates[0].length,
              }
            : null)
        const initialCenter = center || derivedCenter || { lat: 20.5937, lng: 78.9629 }

        const map = new google.maps.Map(containerRef.current, {
          center: initialCenter,
          zoom,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapTypeControl: true,
          fullscreenControl: true,
          streetViewControl: false,
          zoomControl: true,
          gestureHandling: 'greedy',
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

  // Sync Reference Polygon (City Boundary)
  useEffect(() => {
    const map = mapRef.current
    if (!map || isLoading || !window.google?.maps) return

    if (referencePolygonRef.current) {
      referencePolygonRef.current.setMap(null)
      referencePolygonRef.current = null
    }

    if (referenceCoordinates?.[0] && referenceCoordinates[0].length >= 3) {
      const path = referenceCoordinates[0].map(([lng, lat]) => ({ lat, lng }))
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
      referencePolygonRef.current = poly
    }
  }, [referenceCoordinates, isLoading])

  // Sync Zone Polygon & Center Marker
  useEffect(() => {
    const map = mapRef.current
    if (!map || isLoading || !window.google?.maps) return

    if (polygonRef.current) {
      polygonRef.current.setMap(null)
      polygonRef.current = null
    }
    if (markerRef.current) {
      markerRef.current.setMap(null)
      markerRef.current = null
    }

    const bounds = new google.maps.LatLngBounds()
    let hasPoints = false

    if (coordinates?.[0] && coordinates[0].length >= 3) {
      const path = coordinates[0].map(([lng, lat]) => {
        const pt = { lat, lng }
        bounds.extend(pt)
        hasPoints = true
        return pt
      })

      const palette = ZONE_PALETTE[zoneType] || ZONE_PALETTE.SERVICE

      const poly = new google.maps.Polygon({
        map,
        paths: path,
        strokeColor: palette.stroke,
        strokeWeight: 2.5,
        strokeOpacity: 0.9,
        fillColor: palette.fill,
        fillOpacity: palette.fillOpacity,
        zIndex: 2,
      })
      polygonRef.current = poly

      // Add Centroid / Name Marker
      let markerPos = center
      if (!markerPos && path.length > 0) {
        let sLat = 0
        let sLng = 0
        path.forEach((p) => {
          sLat += p.lat
          sLng += p.lng
        })
        markerPos = { lat: sLat / path.length, lng: sLng / path.length }
      }

      if (markerPos) {
        const marker = new google.maps.Marker({
          map,
          position: markerPos,
          title: zoneName || 'Zone',
          label: zoneName
            ? {
                text: zoneName,
                color: '#1E293B',
                fontSize: '11px',
                fontWeight: '700',
              }
            : undefined,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5,
            fillColor: palette.stroke,
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
          zIndex: 3,
        })
        markerRef.current = marker
      }
    }

    if (!hasPoints && referenceCoordinates?.[0] && referenceCoordinates[0].length >= 3) {
      referenceCoordinates[0].forEach(([lng, lat]) => {
        bounds.extend({ lat, lng })
        hasPoints = true
      })
    }

    if (hasPoints) {
      map.fitBounds(bounds, { top: 30, right: 30, bottom: 30, left: 30 })
    } else if (center) {
      map.setCenter(center)
      map.setZoom(zoom)
    }
  }, [coordinates, referenceCoordinates, center, zoneName, zoneType, isLoading, zoom])

  const handleRecenter = useCallback(() => {
    if (!mapRef.current) return
    if (center) {
      mapRef.current.setCenter(center)
      mapRef.current.setZoom(zoom)
    }
  }, [center, zoom])

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm ${className}`}
      style={{ height }}
    >
      <div ref={containerRef} className="h-full w-full" />

      {center && !isLoading && !loadError && (
        <button
          type="button"
          onClick={handleRecenter}
          className="absolute right-3 bottom-3 z-10 flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/95 px-3 py-2 text-xs font-semibold text-foreground shadow-md backdrop-blur-md transition-all hover:bg-muted active:scale-95"
          title="Recenter Map"
        >
          <Navigation className="h-3.5 w-3.5 text-primary" />
          <span>Center</span>
        </button>
      )}

      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-xs font-medium text-muted-foreground">Loading Google Maps Web SDK...</p>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/90 p-6 text-center backdrop-blur-md">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">Google Maps Error</h4>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">{loadError}</p>
        </div>
      )}
    </div>
  )
})

GoogleZoneViewer.displayName = 'GoogleZoneViewer'
