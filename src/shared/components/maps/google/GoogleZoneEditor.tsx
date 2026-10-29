import React, { memo, useEffect, useRef, useState, useCallback } from 'react'
import { loadGoogleMapsSdk, onGoogleMapsAuthError } from './google-maps-loader'
import { appendVertex, latLngsToRing, openRing, ringToLatLngs, type LngLat } from './polygon-ring'
import { useGoogleMapsKey } from '@/shared/hooks/useGoogleMapsKey'
import { Trash2, Edit3, MapPin, AlertTriangle, Navigation, CheckCircle2, Check } from 'lucide-react'

export interface GoogleZoneEditorProps {
  coordinates?: number[][][] | null
  referenceCoordinates?: number[][][] | null
  center?: { lat: number; lng: number } | null
  onChange?: (coordinates: number[][][]) => void
  onCenterChange?: (center: { lat: number; lng: number }) => void
  height?: string
  editable?: boolean
  allowCenterPick?: boolean
}

const POLYGON_STYLE = {
  fillColor: '#3B82F6',
  fillOpacity: 0.35,
  strokeWeight: 2.5,
  strokeColor: '#1D4ED8',
  zIndex: 2,
}

function googlePathToRing(path: google.maps.MVCArray<google.maps.LatLng>): number[][][] {
  return [latLngsToRing(path.getArray().map((p) => ({ lat: p.lat(), lng: p.lng() })))]
}

const sameRing = (a?: number[][][] | null, b?: number[][][] | null) =>
  JSON.stringify(a?.[0] ?? []) === JSON.stringify(b?.[0] ?? [])

/**
 * Boundary editor on Google Maps. While drawing, each map click adds a vertex (the ring is
 * emitted once it has 3); after Finish, the polygon's vertices can be dragged and midpoints
 * pulled out to add vertices. Drawing uses plain map clicks: Google removed DrawingManager
 * in May 2026.
 */
export const GoogleZoneEditor: React.FC<GoogleZoneEditorProps> = memo(({
  coordinates,
  referenceCoordinates,
  center,
  onChange,
  onCenterChange,
  height = '500px',
  editable = true,
  allowCenterPick = false,
}) => {
  const { apiKey, isResolving } = useGoogleMapsKey()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const polygonRef = useRef<google.maps.Polygon | null>(null)
  const referencePolygonRef = useRef<google.maps.Polygon | null>(null)
  const centerMarkerRef = useRef<google.maps.Marker | null>(null)
  const draftLineRef = useRef<google.maps.Polyline | null>(null)
  const draftDotsRef = useRef<google.maps.Marker[]>([])
  const syncingRef = useRef(false)
  // The ring this editor last emitted: an equal `coordinates` prop is our own echo, not an outside change.
  const lastEmittedRef = useRef<number[][][] | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [areaKm2, setAreaKm2] = useState<number | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [draft, setDraft] = useState<LngLat[]>([])

  // The map's click listener is registered once; it reads the current values through refs.
  const onChangeRef = useRef(onChange)
  const onCenterChangeRef = useRef(onCenterChange)
  const allowCenterPickRef = useRef(allowCenterPick)
  const isDrawingRef = useRef(isDrawing)
  const draftRef = useRef(draft)
  onChangeRef.current = onChange
  onCenterChangeRef.current = onCenterChange
  allowCenterPickRef.current = allowCenterPick
  isDrawingRef.current = isDrawing
  draftRef.current = draft

  const emit = useCallback((ring: number[][][]) => {
    lastEmittedRef.current = ring
    onChangeRef.current?.(ring)
  }, [])

  useEffect(() => {
    return onGoogleMapsAuthError((err) => {
      setLoadError(err)
    })
  }, [])

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

  // Vertex drags and midpoint inserts update the parent. setPaths() replaces the path, so this
  // runs again after every setPaths().
  const attachPathListeners = useCallback(
    (poly: google.maps.Polygon) => {
      const path = poly.getPath()
      const emitChange = () => {
        if (syncingRef.current) return
        updateArea(poly)
        emit(googlePathToRing(path))
      }
      path.addListener('set_at', emitChange)
      path.addListener('insert_at', emitChange)
      path.addListener('remove_at', emitChange)
    },
    [emit, updateArea]
  )

  const handleClearPolygon = useCallback(() => {
    if (polygonRef.current) {
      polygonRef.current.setMap(null)
      polygonRef.current = null
    }
    setAreaKm2(null)
    draftRef.current = []
    setDraft([])
    emit([])
    if (editable) setIsDrawing(true)
  }, [editable, emit])

  const handleFinishDrawing = useCallback(() => {
    draftRef.current = []
    setDraft([])
    setIsDrawing(false)
  }, [])

  // Initialize Map
  useEffect(() => {
    if (isResolving) return
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

        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return
          const point = { lat: e.latLng.lat(), lng: e.latLng.lng() }
          if (isDrawingRef.current) {
            const ring = appendVertex(draftRef.current, point)
            const vertices = openRing(ring)
            draftRef.current = vertices
            setDraft(vertices)
            if (vertices.length >= 3) emit([ring])
            return
          }
          if (allowCenterPickRef.current) onCenterChangeRef.current?.(point)
        })

        mapRef.current = map
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
  }, [apiKey, isResolving, emit])

  // Sync Coordinates from Parent Prop
  useEffect(() => {
    const map = mapRef.current
    if (!map || isLoading) return

    const ownEcho = sameRing(coordinates, lastEmittedRef.current)
    // A boundary set from outside (official boundary, radius, JSON) ends any drawing in progress.
    if (!ownEcho && isDrawing && (coordinates?.[0]?.length ?? 0) >= 3) {
      draftRef.current = []
      setDraft([])
      setIsDrawing(false)
      return
    }

    syncingRef.current = true

    if (coordinates && coordinates[0] && coordinates[0].length >= 3) {
      const pathCoords = ringToLatLngs(coordinates[0])
      // Editing while drawing would turn clicks into vertex handles; clicks must reach the map.
      const interactive = editable && !isDrawing

      if (!polygonRef.current) {
        polygonRef.current = new google.maps.Polygon({
          ...POLYGON_STYLE,
          paths: pathCoords,
          editable: interactive,
          clickable: interactive,
          map,
        })
        attachPathListeners(polygonRef.current)
      } else {
        // After a vertex drag the polygon already has this path; replacing it would drop the drag.
        if (!sameRing(googlePathToRing(polygonRef.current.getPath()), coordinates)) {
          polygonRef.current.setPaths(pathCoords)
          attachPathListeners(polygonRef.current)
        }
        polygonRef.current.setOptions({ editable: interactive, clickable: interactive })
      }

      updateArea(polygonRef.current)

      if (!ownEcho) {
        const bounds = new google.maps.LatLngBounds()
        pathCoords.forEach((pt) => bounds.extend(pt))
        map.fitBounds(bounds, { top: 30, right: 30, bottom: 30, left: 30 })
      }
    } else {
      if (polygonRef.current) {
        polygonRef.current.setMap(null)
        polygonRef.current = null
      }
      setAreaKm2(null)
    }

    syncingRef.current = false
  }, [coordinates, editable, isDrawing, isLoading, attachPathListeners, updateArea])

  // Drawing starts by itself when there is no boundary, and stops when editing is turned off.
  useEffect(() => {
    if (isLoading) return
    const hasPolygon = (coordinates?.[0]?.length ?? 0) >= 3
    if (editable && !hasPolygon && !isDrawing) setIsDrawing(true)
    if (!editable && isDrawing) handleFinishDrawing()
  }, [coordinates, editable, isDrawing, isLoading, handleFinishDrawing])

  // Points placed so far while drawing
  useEffect(() => {
    const map = mapRef.current
    if (!map || isLoading) return

    draftLineRef.current?.setMap(null)
    draftLineRef.current = null
    draftDotsRef.current.forEach((dot) => dot.setMap(null))
    draftDotsRef.current = []
    if (!isDrawing || draft.length === 0) return

    const path = ringToLatLngs(draft)
    if (path.length >= 2) {
      draftLineRef.current = new google.maps.Polyline({
        path,
        map,
        clickable: false,
        strokeColor: POLYGON_STYLE.strokeColor,
        strokeWeight: 2,
        zIndex: 3,
      })
    }
    draftDotsRef.current = path.map(
      (position) =>
        new google.maps.Marker({
          position,
          map,
          clickable: false,
          zIndex: 4,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 4,
            fillColor: '#ffffff',
            fillOpacity: 1,
            strokeColor: POLYGON_STYLE.strokeColor,
            strokeWeight: 2,
          },
        })
    )
  }, [draft, isDrawing, isLoading])

  // Sync Reference Polygon (e.g. parent City boundary)
  useEffect(() => {
    const map = mapRef.current
    if (!map || isLoading) return

    if (referenceCoordinates && referenceCoordinates[0] && referenceCoordinates[0].length >= 3) {
      const refPath = ringToLatLngs(referenceCoordinates[0])
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
            onCenterChangeRef.current?.({ lat: pos.lat(), lng: pos.lng() })
          }
        })
      } else {
        centerMarkerRef.current.setPosition(center)
      }
    } else if (centerMarkerRef.current) {
      centerMarkerRef.current.setMap(null)
      centerMarkerRef.current = null
    }
  }, [center, allowCenterPick, isLoading])

  return (
    <div className="relative rounded-xl overflow-hidden border border-border bg-slate-100 dark:bg-slate-900" style={{ height }}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Editor Controls Overlay */}
      {editable && !isLoading && !loadError && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          {areaKm2 !== null && (
            <div className="px-3 py-1.5 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-md text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{areaKm2} km²</span>
            </div>
          )}

          {isDrawing ? (
            <>
              <div className="px-3 py-1.5 rounded-lg bg-blue-600 text-white border border-blue-500 shadow-md text-xs font-semibold flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" />
                <span>
                  {draft.length < 3
                    ? `Click on map to draw points (${draft.length}/3)`
                    : 'Click to add more points'}
                </span>
              </div>
              {draft.length >= 3 && (
                <button
                  type="button"
                  onClick={handleFinishDrawing}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white border border-emerald-500 shadow-md text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1.5 transition-all"
                  title="Finish drawing and edit the vertices"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Finish</span>
                </button>
              )}
            </>
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
      {allowCenterPick && !isDrawing && (
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
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Loading Google Maps...</span>
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
