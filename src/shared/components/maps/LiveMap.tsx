import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, CircleMarker, useMap, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { MapPin, Navigation } from 'lucide-react'
import { cn } from '@/shared/utils'
import { useMapClientConfig } from '@/shared/hooks/useMapClientConfig'
import { OSM_TILE_LAYER, resolveMapTileLayer, type MapTileLayerConfig } from '@/shared/utils/map-tiles'
import { isValidCoordinate } from '@/shared/utils/polyline'

// @ts-expect-error leaflet icon patch
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  iconShadowUrl: markerShadow,
})

export type LiveMapMarkerKind = 'driver' | 'pickup' | 'drop' | 'ride' | 'default'

export interface LiveMapMarker {
  id: string
  lat: number
  lng: number
  /** Accessible name and hover title of the marker. */
  label?: string
  kind?: LiveMapMarkerKind
  /** Overrides the kind colour. */
  color?: string
  /** Drawn as a dashed hollow ring: the position is older than its freshness threshold. */
  stale?: boolean
  /** Popup lines for the selected marker (click or Enter); the popup survives data refreshes. */
  details?: string[]
}

export interface LiveMapRoute {
  id: string
  pickup: { lat: number; lng: number; label?: string }
  drop: { lat: number; lng: number; label?: string }
  driverLocation?: { lat: number; lng: number } | null
  /** Road-following route geometry; when absent, a straight line is drawn. */
  path?: Array<{ lat: number; lng: number }> | null
}

export interface LiveMapProps {
  markers?: LiveMapMarker[]
  routes?: LiveMapRoute[]
  /** Initial center; otherwise the initial view is fitted to the real points. */
  center?: [number, number]
  zoom?: number
  height?: string
  className?: string
  tileUrl?: string
  tileAttribution?: string
  hideNotice?: boolean
  /** Adds a "Center map" button. The map never re-fits by itself after it is created. */
  showRecenter?: boolean
  /** Accessible name of the map region. */
  ariaLabel?: string
}

const MARKER_COLORS: Record<LiveMapMarkerKind, string> = {
  driver: '#2563eb',
  pickup: '#10b981',
  drop: '#ef4444',
  ride: '#8b5cf6',
  default: '#64748b',
}

const FIT_OPTIONS: L.FitBoundsOptions = { padding: [40, 40], maxZoom: 15 }

/** Fits the view to real points: one point is centered, several are bounded. */
export function fitMapToPoints(map: L.Map, points: Array<[number, number]>, singleZoom = 14): void {
  if (points.length === 0) return
  if (points.length === 1) map.setView(points[0], Math.max(map.getZoom() ?? singleZoom, singleZoom))
  else map.fitBounds(points, FIT_OPTIONS)
}

// One icon per (colour, stale): a marker keeps the same icon object across renders, so
// react-leaflet never replaces its DOM element unless the state actually changed.
const iconCache = new Map<string, L.DivIcon>()
export function dotIcon(color: string, stale = false): L.DivIcon {
  const key = `${color}|${stale}`
  let icon = iconCache.get(key)
  if (!icon) {
    const style = stale
      ? `width:14px;height:14px;background:#fff;border:3px dashed ${color};opacity:.9`
      : `width:12px;height:12px;background:${color};border:2px solid #fff`
    icon = L.divIcon({
      className: '',
      html: `<div style="border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.35);${style}"></div>`,
      iconSize: stale ? [14, 14] : [12, 12],
      iconAnchor: stale ? [7, 7] : [6, 6],
    })
    iconCache.set(key, icon)
  }
  return icon
}

function sameMarker(a: LiveMapMarker, b: LiveMapMarker): boolean {
  return (
    a.id === b.id &&
    a.lat === b.lat &&
    a.lng === b.lng &&
    a.kind === b.kind &&
    a.color === b.color &&
    a.stale === b.stale &&
    a.label === b.label &&
    (a.details ?? []).join('\n') === (b.details ?? []).join('\n')
  )
}

interface MapMarkerProps {
  marker: LiveMapMarker
  selected: boolean
  onSelect: (id: string) => void
  onDeselect: (id: string) => void
}

/** Popup body as text nodes: backend strings (names, plates) are never parsed as HTML. */
function popupContent(lines: string[]): HTMLElement {
  const body = document.createElement('div')
  lines.forEach((line, i) => {
    const row = document.createElement('div')
    if (i === 0) row.className = 'font-semibold'
    row.textContent = line
    body.appendChild(row)
  })
  return body
}

/**
 * Re-renders only when this marker's own data or selection changed; its position array and
 * event handlers stay stable. Only the selected marker carries a popup, so N markers cost
 * one popup, and Leaflet moves it with the marker when the driver moves.
 *
 * The popup is driven on the Leaflet marker directly rather than as a react-leaflet <Popup>
 * child: a child's unmount (including StrictMode's simulated one) closes the popup and fires
 * the same `popupclose` a user's close does, which would clear the selection.
 */
const MapMarker = memo(
  function MapMarker({ marker, selected, onSelect, onDeselect }: MapMarkerProps) {
    const { id, lat, lng, label } = marker
    const position = useMemo<[number, number]>(() => [lat, lng], [lat, lng])
    const icon = dotIcon(marker.color ?? MARKER_COLORS[marker.kind ?? 'default'], marker.stale)
    const ref = useRef<L.Marker | null>(null)
    const eventHandlers = useMemo(
      () => ({
        click: () => onSelect(id),
        // Leaflet gives the marker role="button" and a tab stop, but only a bound popup
        // reacts to Enter; select on Enter / Space like any button (a second press closes).
        keypress: (e: L.LeafletKeyboardEvent) => {
          if (e.originalEvent.key !== 'Enter' && e.originalEvent.key !== ' ') return
          e.originalEvent.preventDefault()
          onSelect(id)
        },
        popupclose: () => onDeselect(id),
      }),
      [id, onSelect, onDeselect],
    )

    const detailsKey = (marker.details ?? []).join('\n')
    useEffect(() => {
      const leafletMarker = ref.current
      if (!leafletMarker) return
      if (selected && detailsKey) {
        const content = popupContent(detailsKey.split('\n'))
        if (leafletMarker.getPopup()) leafletMarker.setPopupContent(content)
        else leafletMarker.bindPopup(content)
        if (!leafletMarker.isPopupOpen()) leafletMarker.openPopup()
      } else if (leafletMarker.getPopup()) {
        leafletMarker.closePopup()
        leafletMarker.unbindPopup()
      }
    }, [selected, detailsKey])

    // Leaflet applies `title` only when it creates the element (and again on setIcon);
    // keep the accessible name current as the driver's state changes.
    useEffect(() => {
      const el = ref.current?.getElement()
      if (!el || !label) return
      el.setAttribute('title', label)
      el.setAttribute('aria-label', label)
    }, [label, icon])

    return (
      <Marker ref={ref} position={position} icon={icon} title={label} keyboard eventHandlers={eventHandlers} />
    )
  },
  (prev, next) =>
    prev.selected === next.selected &&
    prev.onSelect === next.onSelect &&
    prev.onDeselect === next.onDeselect &&
    sameMarker(prev.marker, next.marker),
)

function FallbackTileLayer({
  primary,
  onFallback,
}: {
  primary: MapTileLayerConfig
  onFallback: () => void
}) {
  const map = useMap()
  const [useFallback, setUseFallback] = useState(false)
  const layer = useFallback ? OSM_TILE_LAYER : primary

  useEffect(() => {
    if (useFallback) return

    const handleTileError = () => {
      setUseFallback(true)
      onFallback()
    }

    map.on('tileerror', handleTileError)
    return () => {
      map.off('tileerror', handleTileError)
    }
  }, [map, onFallback, useFallback])

  return <TileLayer attribution={layer.attribution} url={layer.url} />
}

export const LiveMap: React.FC<LiveMapProps> = ({
  markers = [],
  routes = [],
  center,
  zoom = 12,
  height = '420px',
  className,
  tileUrl,
  tileAttribution,
  hideNotice = false,
  showRecenter = false,
  ariaLabel = 'Map',
}) => {
  const { data: mapConfig } = useMapClientConfig()
  const [didFallback, setDidFallback] = useState(false)
  const mapRef = useRef<L.Map | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const select = useCallback((id: string) => setSelectedId(id), [])
  // Closing a popup clears the selection only if it is still this marker's: switching
  // markers closes the previous popup after the new one was selected.
  const deselect = useCallback((id: string) => setSelectedId((current) => (current === id ? null : current)), [])

  const tileLayer = useMemo(() => {
    if (tileUrl) {
      return {
        url: tileUrl,
        attribution: tileAttribution ?? '',
      }
    }
    return resolveMapTileLayer(mapConfig)
  }, [mapConfig, tileAttribution, tileUrl])

  // Real, valid coordinates only: they decide the initial view and what "center" fits.
  const allPoints = useMemo(() => {
    const pts: Array<[number, number]> = []
    const add = (lat: number, lng: number) => {
      if (isValidCoordinate(lat, lng)) pts.push([lat, lng])
    }
    for (const m of markers) add(m.lat, m.lng)
    for (const r of routes) {
      if (r.path && r.path.length > 0) {
        for (const p of r.path) add(p.lat, p.lng)
      } else {
        add(r.pickup.lat, r.pickup.lng)
        add(r.drop.lat, r.drop.lng)
      }
      if (r.driverLocation) add(r.driverLocation.lat, r.driverLocation.lng)
    }
    return pts
  }, [markers, routes])
  const pointsRef = useRef(allPoints)
  pointsRef.current = allPoints

  // A selected driver who left the data (e.g. went off duty) is no longer selected.
  const selectedPresent = selectedId !== null && markers.some((m) => m.id === selectedId)
  useEffect(() => {
    if (selectedId !== null && !selectedPresent) setSelectedId(null)
  }, [selectedId, selectedPresent])

  const usingOsmFallback = tileLayer.url === OSM_TILE_LAYER.url || didFallback

  // No real coordinate and no explicit center: nothing to show, and no made-up place to show.
  if (allPoints.length === 0 && !center) {
    return (
      <div
        className={cn(
          'rounded-xl border border-border bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-2 text-center p-6',
          className,
        )}
        style={{ height }}
      >
        <MapPin className="h-6 w-6 text-slate-500" aria-hidden="true" />
        <p className="text-xs text-slate-600 dark:text-slate-300">No locations to display.</p>
      </div>
    )
  }

  // Read once, when the map is created. react-leaflet ignores later changes to
  // center/bounds, which is what leaves pan and zoom to the user after that.
  const initialView = center
    ? { center, zoom }
    : allPoints.length === 1
      ? { center: allPoints[0], zoom: Math.max(zoom, 14) }
      : { bounds: L.latLngBounds(allPoints), boundsOptions: FIT_OPTIONS }

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className={cn('rounded-xl overflow-hidden border border-border relative', className)}
      style={{ height }}
    >
      {!hideNotice && usingOsmFallback && mapConfig?.primaryProvider === 'ola' && !mapConfig.providers.ola.clientSdkKey && (
        <div className="absolute top-2 left-12 z-[1000] rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] text-amber-800 shadow-sm">
          Using OpenStreetMap — configure an Ola Maps API key under Platform → Maps.
        </div>
      )}
      {!hideNotice && usingOsmFallback && mapConfig?.primaryProvider === 'ola' && mapConfig.providers.ola.clientSdkKey && (
        <div className="absolute top-2 left-12 z-[1000] rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] text-amber-800 shadow-sm">
          Ola map tiles failed to load — showing OpenStreetMap fallback.
        </div>
      )}
      {!hideNotice && usingOsmFallback && mapConfig?.primaryProvider === 'mappls' && !mapConfig.providers.mappls.clientSdkKey && (
        <div className="absolute top-2 left-12 z-[1000] rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] text-amber-800 shadow-sm">
          Using OpenStreetMap — configure a Mappls REST API key under Platform → Maps.
        </div>
      )}
      {!hideNotice && usingOsmFallback && mapConfig?.primaryProvider === 'mappls' && mapConfig.providers.mappls.clientSdkKey && (
        <div className="absolute top-2 left-12 z-[1000] rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] text-amber-800 shadow-sm">
          Mappls tiles failed to load — showing OpenStreetMap fallback.
        </div>
      )}
      {showRecenter && (
        <button
          type="button"
          onClick={() => mapRef.current && fitMapToPoints(mapRef.current, pointsRef.current)}
          className="absolute top-2.5 right-2.5 z-[1000] p-1.5 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-600 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 transition-colors"
          title="Center map"
          aria-label="Center map on all shown locations"
        >
          <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
      <MapContainer ref={mapRef} {...initialView} zoomControl={false} style={{ height: '100%', width: '100%' }}>
        <ZoomControl position="bottomright" />
        {tileLayer.url === OSM_TILE_LAYER.url ? (
          <TileLayer attribution={tileLayer.attribution} url={tileLayer.url} />
        ) : (
          <FallbackTileLayer primary={tileLayer} onFallback={() => setDidFallback(true)} />
        )}

        {routes.map((route) => {
          const hasRoadPath = route.path && route.path.length >= 2
          const fallbackLine: [number, number][] = [[route.pickup.lat, route.pickup.lng]]
          if (route.driverLocation) {
            fallbackLine.push([route.driverLocation.lat, route.driverLocation.lng])
          }
          fallbackLine.push([route.drop.lat, route.drop.lng])

          const line: [number, number][] = hasRoadPath
            ? route.path!.map((p) => [p.lat, p.lng] as [number, number])
            : fallbackLine

          return (
            <React.Fragment key={route.id}>
              <Polyline
                positions={line}
                pathOptions={{
                  color: '#6366f1',
                  weight: hasRoadPath ? 4 : 3,
                  opacity: hasRoadPath ? 0.9 : 0.75,
                  ...(hasRoadPath ? {} : { dashArray: '6 8' }),
                }}
              />
              <Marker position={[route.pickup.lat, route.pickup.lng]} icon={dotIcon(MARKER_COLORS.pickup)} />
              <Marker position={[route.drop.lat, route.drop.lng]} icon={dotIcon(MARKER_COLORS.drop)} />
              {route.driverLocation ? (
                <CircleMarker
                  center={[route.driverLocation.lat, route.driverLocation.lng]}
                  radius={8}
                  pathOptions={{ color: MARKER_COLORS.driver, fillColor: MARKER_COLORS.driver, fillOpacity: 0.9 }}
                />
              ) : null}
            </React.Fragment>
          )
        })}

        {markers.map((marker) =>
          isValidCoordinate(marker.lat, marker.lng) ? (
            <MapMarker
              key={marker.id}
              marker={marker}
              selected={marker.id === selectedId}
              onSelect={select}
              onDeselect={deselect}
            />
          ) : null,
        )}
      </MapContainer>
    </div>
  )
}

export default LiveMap
