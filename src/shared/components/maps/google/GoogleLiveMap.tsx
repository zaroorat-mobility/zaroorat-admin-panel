import React, { memo, useEffect, useRef, useState, useCallback } from 'react'
import { loadGoogleMapsSdk, onGoogleMapsAuthError } from './google-maps-loader'
import { useGoogleMapsKey } from '@/shared/hooks/useGoogleMapsKey'
import type { LiveMapProps } from '../LiveMap'
import { Navigation, AlertTriangle, Layers, LocateFixed } from 'lucide-react'
import { cn } from '@/shared/utils'

const MARKER_COLORS: Record<string, string> = {
  driver: '#2563EB',
  pickup: '#10B981',
  drop: '#EF4444',
  ride: '#8B5CF6',
  default: '#64748B',
}

function createMarkerIconSvg(color: string, kind: string = 'default', stale: boolean = false): string {
  if (kind === 'driver') {
    // Crisp SVG car/arrow icon for active drivers
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="16" fill="${color}" fill-opacity="${stale ? '0.6' : '1'}" stroke="#ffffff" stroke-width="3" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
        <path d="M18 8 L25 24 L18 20 L11 24 Z" fill="#ffffff"/>
      </svg>
    `)}`
  }

  if (kind === 'pickup') {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="13" fill="#10B981" stroke="#ffffff" stroke-width="3" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
        <circle cx="16" cy="16" r="5" fill="#ffffff"/>
      </svg>
    `)}`
  }

  if (kind === 'drop') {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="38" viewBox="0 0 32 38">
        <path d="M16 2 C8.3 2 2 8.3 2 16 C2 26 16 36 16 36 C16 36 30 26 30 16 C30 8.3 23.7 2 16 2 Z" fill="#EF4444" stroke="#ffffff" stroke-width="2.5" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.35))"/>
        <circle cx="16" cy="15" r="5" fill="#ffffff"/>
      </svg>
    `)}`
  }

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" fill="${color}" stroke="#ffffff" stroke-width="2.5" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.3))"/>
    </svg>
  `)}`
}

export type GoogleLiveMapProps = LiveMapProps

export const GoogleLiveMap: React.FC<GoogleLiveMapProps> = memo(({
  markers = [],
  routes = [],
  center,
  zoom = 13,
  height = '480px',
  className,
  showRecenter = true,
  ariaLabel = 'Google Maps Fleet View',
}) => {
  const { apiKey, isResolving } = useGoogleMapsKey()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null)
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const polylinesRef = useRef<google.maps.Polyline[]>([])
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [trafficEnabled, setTrafficEnabled] = useState(false)

  // Listen for Google Maps auth errors (e.g. invalid key or domain)
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

        const derivedLat = markers?.[0]?.lat ?? routes?.[0]?.pickup.lat
        const derivedLng = markers?.[0]?.lng ?? routes?.[0]?.pickup.lng
        const initialCenter = center
          ? { lat: center[0], lng: center[1] }
          : derivedLat !== undefined && derivedLng !== undefined
          ? { lat: derivedLat, lng: derivedLng }
          : { lat: 20.5937, lng: 78.9629 }

        const map = new google.maps.Map(containerRef.current, {
          center: initialCenter,
          zoom,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            position: google.maps.ControlPosition.TOP_LEFT,
          },
          fullscreenControl: true,
          fullscreenControlOptions: {
            position: google.maps.ControlPosition.RIGHT_TOP,
          },
          streetViewControl: false,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
          },
          gestureHandling: 'greedy',
        })

        infoWindowRef.current = new google.maps.InfoWindow()
        mapRef.current = map
        setIsLoading(false)
      } catch (err) {
        if (!isCancelled) {
          setLoadError(err instanceof Error ? err.message : 'Google Maps could not be initialized')
          setIsLoading(false)
        }
      }
    }

    initMap()

    return () => {
      isCancelled = true
    }
  }, [apiKey, isResolving])

  // Toggle Live Traffic Layer
  const toggleTraffic = useCallback(() => {
    if (!mapRef.current) return
    if (!trafficLayerRef.current) {
      trafficLayerRef.current = new google.maps.TrafficLayer()
    }

    if (trafficEnabled) {
      trafficLayerRef.current.setMap(null)
      setTrafficEnabled(false)
    } else {
      trafficLayerRef.current.setMap(mapRef.current)
      setTrafficEnabled(true)
    }
  }, [trafficEnabled])

  // Center / Fit Bounds
  const handleRecenter = useCallback(() => {
    const map = mapRef.current
    if (!map) return

    const bounds = new google.maps.LatLngBounds()
    let hasPoints = false

    markers.forEach((m) => {
      bounds.extend({ lat: m.lat, lng: m.lng })
      hasPoints = true
    })

    routes.forEach((r) => {
      if (r.pickup) {
        bounds.extend({ lat: r.pickup.lat, lng: r.pickup.lng })
        hasPoints = true
      }
      if (r.drop) {
        bounds.extend({ lat: r.drop.lat, lng: r.drop.lng })
        hasPoints = true
      }
      if (r.driverLocation) {
        bounds.extend({ lat: r.driverLocation.lat, lng: r.driverLocation.lng })
        hasPoints = true
      }
    })

    if (hasPoints) {
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 })
    } else if (center) {
      map.setCenter({ lat: center[0], lng: center[1] })
      map.setZoom(zoom)
    }
  }, [markers, routes, center, zoom])

  // Update Markers
  useEffect(() => {
    const map = mapRef.current
    if (!map || isLoading) return

    const currentMarkers = markersRef.current
    const activeMarkerIds = new Set<string>()

    markers.forEach((m) => {
      activeMarkerIds.add(m.id)
      const color = m.color || MARKER_COLORS[m.kind || 'default'] || MARKER_COLORS.default
      const iconUrl = createMarkerIconSvg(color, m.kind, m.stale)

      let marker = currentMarkers.get(m.id)
      if (!marker) {
        marker = new google.maps.Marker({
          position: { lat: m.lat, lng: m.lng },
          map,
          title: m.label || `Marker ${m.id}`,
          icon: {
            url: iconUrl,
            scaledSize: m.kind === 'drop' ? new google.maps.Size(32, 38) : new google.maps.Size(32, 32),
            anchor: m.kind === 'drop' ? new google.maps.Point(16, 38) : new google.maps.Point(16, 16),
          },
          optimized: true,
        })

        marker.addListener('click', () => {
          if (!infoWindowRef.current) return
          const detailsHtml = m.details && m.details.length > 0
            ? m.details.map((d) => `<div style="font-size:12px;color:#475569;margin-top:2px;">${d}</div>`).join('')
            : ''
          const content = `
            <div style="font-family:system-ui,sans-serif;padding:4px 6px;">
              <div style="font-weight:700;font-size:13px;color:#0F172A;">${m.label || m.id}</div>
              <div style="font-size:11px;color:#64748B;margin-top:2px;text-transform:uppercase;letter-spacing:0.5px;">Type: ${m.kind || 'Point'}</div>
              ${detailsHtml}
            </div>
          `
          infoWindowRef.current.setContent(content)
          infoWindowRef.current.open(map, marker)
        })

        currentMarkers.set(m.id, marker)
      } else {
        marker.setPosition({ lat: m.lat, lng: m.lng })
        marker.setIcon({
          url: iconUrl,
          scaledSize: m.kind === 'drop' ? new google.maps.Size(32, 38) : new google.maps.Size(32, 32),
          anchor: m.kind === 'drop' ? new google.maps.Point(16, 38) : new google.maps.Point(16, 16),
        })
      }
    })

    // Clean up removed markers
    currentMarkers.forEach((marker, id) => {
      if (!activeMarkerIds.has(id)) {
        marker.setMap(null)
        currentMarkers.delete(id)
      }
    })
  }, [markers, isLoading])

  // Update Routes / Polylines
  useEffect(() => {
    const map = mapRef.current
    if (!map || isLoading) return

    // Clear old polylines
    polylinesRef.current.forEach((p) => p.setMap(null))
    polylinesRef.current = []

    routes.forEach((route) => {
      let pathCoords: google.maps.LatLngLiteral[] = []
      if (route.path && route.path.length > 0) {
        pathCoords = route.path.map((p) => ({ lat: p.lat, lng: p.lng }))
      } else if (route.pickup && route.drop) {
        pathCoords = [
          { lat: route.pickup.lat, lng: route.pickup.lng },
          { lat: route.drop.lat, lng: route.drop.lng },
        ]
      }

      if (pathCoords.length > 1) {
        const polyline = new google.maps.Polyline({
          path: pathCoords,
          geodesic: true,
          strokeColor: '#2563EB',
          strokeOpacity: 0.85,
          strokeWeight: 4,
          map,
        })
        polylinesRef.current.push(polyline)
      }
    })
  }, [routes, isLoading])

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className={cn('rounded-xl overflow-hidden border border-border relative bg-slate-100 dark:bg-slate-900', className)}
      style={{ height }}
    >
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating Toolbar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTraffic}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md border transition-all',
            trafficEnabled
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          )}
          title="Toggle live Google Traffic layer"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Traffic</span>
        </button>

        {showRecenter && (
          <button
            type="button"
            onClick={handleRecenter}
            className="p-2 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-md text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all"
            title="Fit to points"
          >
            <LocateFixed className="w-4 h-4 text-primary" />
          </button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-2">
            <Navigation className="w-6 h-6 text-primary animate-spin" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Loading Google Maps Web SDK...</span>
          </div>
        </div>
      )}

      {/* Auth / Load Error Overlay */}
      {loadError && (
        <div className="absolute bottom-3 left-3 right-3 z-30 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2 shadow-lg backdrop-blur-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}
    </div>
  )
})

GoogleLiveMap.displayName = 'GoogleLiveMap'
export default GoogleLiveMap
