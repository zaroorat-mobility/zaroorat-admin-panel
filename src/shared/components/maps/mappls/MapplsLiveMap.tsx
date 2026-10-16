import React, { memo, useEffect, useRef, useState, useCallback } from 'react'
import { loadMapplsSdk } from './mappls-loader'
import type { LiveMapMarker, LiveMapRoute } from '../LiveMap'
import { Navigation, AlertTriangle, Loader2 } from 'lucide-react'

export interface MapplsLiveMapProps {
  markers?: LiveMapMarker[]
  routes?: LiveMapRoute[]
  center?: [number, number]
  zoom?: number
  height?: string
  className?: string
  showRecenter?: boolean
  apiKey: string
}

export const MapplsLiveMap: React.FC<MapplsLiveMapProps> = memo(({
  markers = [],
  routes = [],
  center,
  zoom = 12,
  height = '100%',
  className = '',
  showRecenter = true,
  apiKey,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const polylinesRef = useRef<any[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Initialize Map
  useEffect(() => {
    let isCancelled = false
    const container = containerRef.current
    if (!container) return

    setIsLoading(true)
    setLoadError(null)

    loadMapplsSdk(apiKey)
      .then((mappls) => {
        if (isCancelled || !containerRef.current) return

        const derivedLat = markers?.[0]?.lat ?? routes?.[0]?.pickup.lat
        const derivedLng = markers?.[0]?.lng ?? routes?.[0]?.pickup.lng
        const initialCenter = center
          ? [center[0], center[1]]
          : derivedLat !== undefined && derivedLng !== undefined
          ? [derivedLat, derivedLng]
          : [20.5937, 78.9629]

        // Create unique container ID if needed by Mappls
        if (!container.id) {
          container.id = `mappls-container-${Date.now()}`
        }

        try {
          const map = new mappls.Map(container.id, {
            center: initialCenter,
            zoom: zoom || 12,
            zoomControl: true,
            hybrid: false,
          })

          mapRef.current = map
          setIsLoading(false)
        } catch (err: any) {
          setLoadError(err?.message || 'Failed to initialize Mappls map canvas')
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setLoadError(err?.message || 'Failed to load Mappls Web SDK')
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
      if (mapRef.current && typeof mapRef.current.remove === 'function') {
        try {
          mapRef.current.remove()
        } catch {}
      }
      mapRef.current = null
    }
  }, [apiKey])

  // Sync Markers
  useEffect(() => {
    const map = mapRef.current
    const mappls = (window as any).mappls
    if (!map || !mappls) return

    // Clean up old markers
    markersRef.current.forEach((m) => {
      try {
        if (typeof m.remove === 'function') m.remove()
      } catch {}
    })
    markersRef.current = []

    // Render new markers
    markers.forEach((marker) => {
      try {
        const markerObj = new mappls.Marker({
          map,
          position: { lat: marker.lat, lng: marker.lng },
          fitbounds: false,
          popupHtml: marker.label ? `<div style="padding:4px 8px;font-size:12px;">${marker.label}</div>` : undefined,
        })
        markersRef.current.push(markerObj)
      } catch (e) {
        console.warn('[MapplsLiveMap] Marker creation error:', e)
      }
    })
  }, [markers, isLoading])

  // Sync Polylines
  useEffect(() => {
    const map = mapRef.current
    const mappls = (window as any).mappls
    if (!map || !mappls) return

    polylinesRef.current.forEach((p) => {
      try {
        if (typeof p.remove === 'function') p.remove()
      } catch {}
    })
    polylinesRef.current = []

    routes.forEach((route) => {
      const pathCoords = route.path && route.path.length > 0
        ? route.path.map((pt) => ({ lat: pt.lat, lng: pt.lng }))
        : [
            { lat: route.pickup.lat, lng: route.pickup.lng },
            { lat: route.drop.lat, lng: route.drop.lng },
          ]

      try {
        const poly = new mappls.Polyline({
          map,
          paths: pathCoords,
          strokeColor: '#3B82F6',
          strokeWeight: 4,
          strokeOpacity: 0.8,
        })
        polylinesRef.current.push(poly)
      } catch (e) {
        console.warn('[MapplsLiveMap] Polyline creation error:', e)
      }
    })
  }, [routes, isLoading])

  // Recenter handler
  const handleRecenter = useCallback(() => {
    const map = mapRef.current
    if (!map) return

    if (markers.length > 0) {
      const first = markers[0]
      if (typeof map.setCenter === 'function') {
        map.setCenter({ lat: first.lat, lng: first.lng })
        map.setZoom(14)
      }
    } else if (center) {
      if (typeof map.setCenter === 'function') {
        map.setCenter({ lat: center[0], lng: center[1] })
        map.setZoom(zoom)
      }
    }
  }, [markers, center, zoom])

  return (
    <div className={`relative w-full overflow-hidden rounded-xl border border-border bg-card ${className}`} style={{ height }}>
      {/* Map Target Canvas */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Recenter Button */}
      {showRecenter && !isLoading && !loadError && (
        <button
          type="button"
          onClick={handleRecenter}
          className="absolute right-3 bottom-3 z-10 flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/95 px-3 py-2 text-xs font-semibold text-foreground shadow-md backdrop-blur-md transition-all hover:bg-muted active:scale-95"
          title="Recenter Mappls map"
        >
          <Navigation className="h-3.5 w-3.5 text-primary" />
          <span>Recenter</span>
        </button>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-xs font-medium text-muted-foreground">Loading Mappls Vector Maps...</p>
        </div>
      )}

      {/* Error Overlay */}
      {loadError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/90 p-6 text-center backdrop-blur-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">Mappls Map Error</h4>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">{loadError}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Please verify the Mappls Client SDK Key in Settings &gt; Map Providers.
          </p>
        </div>
      )}
    </div>
  )
})

MapplsLiveMap.displayName = 'MapplsLiveMap'
