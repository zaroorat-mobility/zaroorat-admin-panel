import React, { memo, useEffect, useRef, useState, useCallback } from 'react'
import { loadGoogleMapsSdk, onGoogleMapsAuthError } from './google-maps-loader'
import { Trash2, Edit3, MapPin, AlertTriangle, Navigation, CheckCircle2 } from 'lucide-react'

export interface GoogleZoneEditorProps {
  coordinates?: number[][][] | null
  referenceCoordinates?: number[][][] | null
  center?: { lat: number; lng: number } | null
  onChange?: (coordinates: number[][][]) => void
  onCenterChange?: (center: { lat: number; lng: number }) => void
  height?: string
  editable?: boolean
  allowCenterPick?: boolean
  apiKey?: string
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
  // Ensure closed polygon ring
  const first = points[0]
  const last = points[points.length - 1]
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
    points.push([first[0], first[1]])
  }
  return [points]
}

interface DrawingManagerInstance extends google.maps.MVCObject {
  setMap(map: google.maps.Map | null): void
  setDrawingMode(mode: any): void
  getDrawingMode(): any
  setOptions(options: any): void
}

export const GoogleZoneEditor: React.FC<GoogleZoneEditorProps> = memo(({
  coordinates,
  referenceCoordinates,
  center,
  onChange,
  onCenterChange,
  height = '500px',
  editable = true,
  allowCenterPick = false,
  apiKey,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const drawingManagerRef = useRef<DrawingManagerInstance | null>(null)
  const polygonRef = useRef<google.maps.Polygon | null>(null)
  const referencePolygonRef = useRef<google.maps.Polygon | null>(null)
  const centerMarkerRef = useRef<google.maps.Marker | null>(null)
  const syncingRef = useRef(false)

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [areaKm2, setAreaKm2] = useState<number | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // Listen for Google Maps auth errors
  useEffect(() => {
    return onGoogleMapsAuthError((err) => {
      setLoadError(err)
    })
  }, [])

  // Calculate polygon area
  const updateArea = useCallback((poly: google.maps.Polygon) => {
    if (!window.google?.maps?.geometry?.spherical) return
    const path = poly.getPath()
    if (path.getLength() >= 3) {
      const areaM2 = window.google.maps.geometry.spherical.computeArea(path)
      setAreaKm2(Number((areaM2 / 1_000_000).toFixed(2)))
    } else {
      setAreaKm2(null)
    }
  }, [])

  // Attach vertex listeners so dragging any point updates parent state
  const attachPathListeners = useCallback(
    (poly: google.maps.Polygon) => {
      const path = poly.getPath()
      const emitChange = () => {
        if (syncingRef.current) return
        updateArea(poly)
        onChange?.(googlePathToRing(path))
      }

      path.addListener('set_at', emitChange)
      path.addListener('insert_at', emitChange)
      path.addListener('remove_at', emitChange)
    },
    [onChange, updateArea]
  )

  // Clear current active polygon
  const handleClearPolygon = useCallback(() => {
    if (polygonRef.current) {
      polygonRef.current.setMap(null)
      polygonRef.current = null
    }
    setAreaKm2(null)
    onChange?.([])
    if (drawingManagerRef.current && editable) {
      drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON)
      setIsDrawing(true)
    }
  }, [onChange, editable])

  // Initialize Map & DrawingManager
  useEffect(() => {
    let isCancelled = false

    const initEditor = async () => {
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
          zoom: 13,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapTypeControl: true,
          fullscreenControl: true,
          streetViewControl: false,
          zoomControl: true,
          gestureHandling: 'greedy',
        })

        // Configure Google Maps Drawing Manager
        const drawingManager = new (google.maps.drawing as any).DrawingManager({
          drawingMode: null,
          drawingControl: false, // We use custom high-DPI controls
          polygonOptions: {
            fillColor: '#3B82F6',
            fillOpacity: 0.35,
            strokeWeight: 2.5,
            strokeColor: '#1D4ED8',
            clickable: true,
            editable,
            zIndex: 2,
          },
        }) as DrawingManagerInstance

        drawingManager.setMap(map)

        // Capture newly drawn polygon
        google.maps.event.addListener(
          drawingManager,
          'polygoncomplete',
          (newPolygon: google.maps.Polygon) => {
            // Remove previous polygon if any
            if (polygonRef.current) {
              polygonRef.current.setMap(null)
            }

            polygonRef.current = newPolygon
            newPolygon.setEditable(editable)
            attachPathListeners(newPolygon)
            updateArea(newPolygon)
            onChange?.(googlePathToRing(newPolygon.getPath()))

            // Turn off drawing mode once polygon is completed
            drawingManager.setDrawingMode(null)
            setIsDrawing(false)
          }
        )

        // Click to set Center Pin if enabled
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!allowCenterPick || !e.latLng) return
          const newCenter = { lat: e.latLng.lat(), lng: e.latLng.lng() }
          onCenterChange?.(newCenter)
        })

        mapRef.current = map
        drawingManagerRef.current = drawingManager
        setIsLoading(false)
      } catch (err) {
        if (!isCancelled) {
          setLoadError(err instanceof Error ? err.message : 'Google Maps could not be initialized')
          setIsLoading(false)
        }
      }
    }

    initEditor()

    return () => {
      isCancelled = true
    }
  }, [apiKey, editable, allowCenterPick, attachPathListeners, onChange, onCenterChange, updateArea])

  // Sync Coordinates from Parent Prop
  useEffect(() => {
    const map = mapRef.current
    if (!map || isLoading) return

    syncingRef.current = true

    if (coordinates && coordinates[0] && coordinates[0].length >= 3) {
      const pathCoords = ringToGooglePath(coordinates[0])

      if (!polygonRef.current) {
        polygonRef.current = new google.maps.Polygon({
          paths: pathCoords,
          fillColor: '#3B82F6',
          fillOpacity: 0.35,
          strokeWeight: 2.5,
          strokeColor: '#1D4ED8',
          editable,
          map,
          zIndex: 2,
        })
        attachPathListeners(polygonRef.current)
      } else {
        polygonRef.current.setPaths(pathCoords)
      }

      updateArea(polygonRef.current)

      // Fit map to polygon bounds on initial load
      const bounds = new google.maps.LatLngBounds()
      pathCoords.forEach((pt) => bounds.extend(pt))
      map.fitBounds(bounds, { top: 30, right: 30, bottom: 30, left: 30 })

      if (drawingManagerRef.current) {
        drawingManagerRef.current.setDrawingMode(null)
        setIsDrawing(false)
      }
    } else {
      if (polygonRef.current) {
        polygonRef.current.setMap(null)
        polygonRef.current = null
      }
      setAreaKm2(null)
      // If no polygon and editable, activate drawing tool
      if (drawingManagerRef.current && editable) {
        drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON)
        setIsDrawing(true)
      }
    }

    syncingRef.current = false
  }, [coordinates, editable, isLoading, attachPathListeners, updateArea])

  // Sync Reference Polygon (e.g. parent City boundary)
  useEffect(() => {
    const map = mapRef.current
    if (!map || isLoading) return

    if (referenceCoordinates && referenceCoordinates[0] && referenceCoordinates[0].length >= 3) {
      const refPath = ringToGooglePath(referenceCoordinates[0])
      if (!referencePolygonRef.current) {
        referencePolygonRef.current = new google.maps.Polygon({
          paths: refPath,
          fillColor: '#94A3B8',
          fillOpacity: 0.12,
          strokeWeight: 2,
          strokeColor: '#64748B',
          clickable: false,
          editable: false,
          map,
          zIndex: 1,
        })
      } else {
        referencePolygonRef.current.setPaths(refPath)
      }
    } else if (referencePolygonRef.current) {
      referencePolygonRef.current.setMap(null)
      referencePolygonRef.current = null
    }
  }, [referenceCoordinates, isLoading])

  // Sync Center Marker
  useEffect(() => {
    const map = mapRef.current
    if (!map || isLoading) return

    if (center && allowCenterPick) {
      if (!centerMarkerRef.current) {
        centerMarkerRef.current = new google.maps.Marker({
          position: center,
          map,
          draggable: true,
          title: 'Zone Operating Center',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#EF4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2.5,
          },
        })

        centerMarkerRef.current.addListener('dragend', () => {
          const pos = centerMarkerRef.current?.getPosition()
          if (pos) {
            onCenterChange?.({ lat: pos.lat(), lng: pos.lng() })
          }
        })
      } else {
        centerMarkerRef.current.setPosition(center)
      }
    } else if (centerMarkerRef.current) {
      centerMarkerRef.current.setMap(null)
      centerMarkerRef.current = null
    }
  }, [center, allowCenterPick, isLoading, onCenterChange])

  return (
    <div className="relative rounded-xl overflow-hidden border border-border bg-slate-100 dark:bg-slate-900" style={{ height }}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Editor Controls Overlay */}
      {editable && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          {areaKm2 !== null && (
            <div className="px-3 py-1.5 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-md text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{areaKm2} km²</span>
            </div>
          )}

          {isDrawing ? (
            <div className="px-3 py-1.5 rounded-lg bg-blue-600 text-white border border-blue-500 shadow-md text-xs font-semibold flex items-center gap-1.5 animate-pulse">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Click on map to draw points</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleClearPolygon}
              className="px-3 py-1.5 rounded-lg bg-white/95 dark:bg-slate-900/95 text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-800 shadow-md text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1.5 transition-all"
              title="Redraw Polygon"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Redraw Zone</span>
            </button>
          )}
        </div>
      )}

      {/* Center Pick Indicator */}
      {allowCenterPick && (
        <div className="absolute bottom-3 left-3 z-10 px-3 py-1.5 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-md text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-red-500" />
          <span>Click anywhere to position zone dispatch center</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-2">
            <Navigation className="w-6 h-6 text-primary animate-spin" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Loading Google Maps Drawing Tools...</span>
          </div>
        </div>
      )}

      {/* Auth / Error state */}
      {loadError && (
        <div className="absolute bottom-3 left-3 right-3 z-30 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2 shadow-lg backdrop-blur-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}
    </div>
  )
})

GoogleZoneEditor.displayName = 'GoogleZoneEditor'
export default GoogleZoneEditor
