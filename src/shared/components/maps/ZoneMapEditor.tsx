import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import 'leaflet/dist/leaflet.css'

import { useMapClientConfig } from '@/shared/hooks/useMapClientConfig'
import { resolveMapTileLayer } from '@/shared/utils/map-tiles'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// @ts-expect-error leaflet icon patch
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  iconShadow: markerShadow,
})

interface ZoneMapEditorProps {
  coordinates?: number[][][] | null
  referenceCoordinates?: number[][][] | null
  center?: { lat: number; lng: number } | null
  onChange?: (coordinates: number[][][]) => void
  onCenterChange?: (center: { lat: number; lng: number }) => void
  height?: string
  editable?: boolean
  allowCenterPick?: boolean
}

function fitMapToBounds(map: L.Map, polygons: Array<number[][][] | null | undefined>) {
  const points: [number, number][] = []
  for (const polygon of polygons) {
    if (polygon?.[0]?.length) {
      points.push(...ringToLatLngs(polygon[0]))
    }
  }
  if (points.length > 0) {
    map.fitBounds(points, { padding: [24, 24] })
  }
}

function ringToLatLngs(ring: number[][]): [number, number][] {
  return ring.map(([lng, lat]) => [lat, lng] as [number, number])
}

function latLngsToRing(latlngs: L.LatLng[]): number[][][] {
  const ring = latlngs.map((ll) => [ll.lng, ll.lat] as [number, number])
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
    ring.push([first[0], first[1]])
  }
  return [ring]
}

function getPolygonLatLngs(layer: L.Polygon): L.LatLng[] {
  const latlngs = layer.getLatLngs()
  const outer = latlngs[0]
  if (Array.isArray(outer)) {
    return outer as L.LatLng[]
  }
  return latlngs as L.LatLng[]
}

function GeomanEditor({
  coordinates,
  referenceCoordinates,
  center,
  onChange,
  onCenterChange,
  editable = true,
  allowCenterPick = false,
}: {
  coordinates?: number[][][] | null
  referenceCoordinates?: number[][][] | null
  center?: { lat: number; lng: number } | null
  onChange?: (coordinates: number[][][]) => void
  onCenterChange?: (center: { lat: number; lng: number }) => void
  editable?: boolean
  allowCenterPick?: boolean
}) {
  const map = useMap()
  const polygonRef = useRef<L.Polygon | null>(null)
  const centerMarkerRef = useRef<L.Marker | null>(null)
  const syncingRef = useRef(false)

  const emitPolygon = useCallback(
    (layer: L.Polygon) => {
      if (syncingRef.current) return
      onChange?.(latLngsToRing(getPolygonLatLngs(layer)))
    },
    [onChange],
  )

  const clearPolygon = useCallback(() => {
    if (polygonRef.current) {
      map.removeLayer(polygonRef.current)
      polygonRef.current = null
    }
  }, [map])

  const attachPolygon = useCallback(
    (layer: L.Polygon) => {
      clearPolygon()
      polygonRef.current = layer
      if (editable) {
        layer.pm.enable({ allowSelfIntersection: false })
      }
      layer.on('pm:edit', () => emitPolygon(layer))
      layer.on('pm:dragend', () => emitPolygon(layer))
    },
    [clearPolygon, editable, emitPolygon],
  )

  useEffect(() => {
    if (!editable) return

    map.pm.addControls({
      position: 'topleft',
      drawMarker: allowCenterPick,
      drawPolygon: true,
      drawPolyline: false,
      drawRectangle: false,
      drawCircle: false,
      drawCircleMarker: false,
      drawText: false,
      editMode: true,
      dragMode: true,
      cutPolygon: false,
      removalMode: true,
      rotateMode: false,
    })

    const onCreate = (event: { shape: string; layer: L.Layer }) => {
      if (event.shape === 'Polygon') {
        attachPolygon(event.layer as L.Polygon)
        emitPolygon(event.layer as L.Polygon)
        return
      }
      if (event.shape === 'Marker' && allowCenterPick) {
        if (centerMarkerRef.current) {
          map.removeLayer(centerMarkerRef.current)
        }
        const marker = event.layer as L.Marker
        centerMarkerRef.current = marker
        const { lat, lng } = marker.getLatLng()
        onCenterChange?.({ lat, lng })
      }
    }

    const onRemove = (event: { layer: L.Layer }) => {
      if (event.layer === polygonRef.current) {
        polygonRef.current = null
        onChange?.([])
      }
    }

    map.on('pm:create', onCreate)
    map.on('pm:remove', onRemove)

    return () => {
      map.pm.removeControls()
      map.off('pm:create', onCreate)
      map.off('pm:remove', onRemove)
      clearPolygon()
      if (centerMarkerRef.current) {
        map.removeLayer(centerMarkerRef.current)
        centerMarkerRef.current = null
      }
    }
  }, [
    allowCenterPick,
    attachPolygon,
    clearPolygon,
    editable,
    emitPolygon,
    map,
    onCenterChange,
    onChange,
  ])

  useEffect(() => {
    if (!referenceCoordinates?.[0]?.length) return

    const refLayer = L.polygon(ringToLatLngs(referenceCoordinates[0]), {
      color: '#64748b',
      weight: 2,
      dashArray: '8 6',
      fillColor: '#94a3b8',
      fillOpacity: 0.08,
      interactive: false,
    }).addTo(map)

    if (!coordinates?.[0]?.length) {
      fitMapToBounds(map, [referenceCoordinates])
    }

    return () => {
      map.removeLayer(refLayer)
    }
  }, [coordinates, map, referenceCoordinates])

  useEffect(() => {
    if (!coordinates?.[0]?.length || coordinates[0].length < 3) {
      clearPolygon()
      if (referenceCoordinates?.[0]?.length) {
        fitMapToBounds(map, [referenceCoordinates])
      }
      return
    }

    const positions = ringToLatLngs(coordinates[0])
    syncingRef.current = true

    if (polygonRef.current) {
      polygonRef.current.setLatLngs(positions)
    } else {
      const poly = L.polygon(positions, { color: '#2563eb', weight: 2 })
      poly.addTo(map)
      attachPolygon(poly)
    }

    fitMapToBounds(map, [referenceCoordinates, coordinates])
    syncingRef.current = false
  }, [attachPolygon, clearPolygon, coordinates, map, referenceCoordinates])

  useEffect(() => {
    if (!allowCenterPick) return

    if (!center) {
      if (centerMarkerRef.current) {
        map.removeLayer(centerMarkerRef.current)
        centerMarkerRef.current = null
      }
      return
    }

    const pos: [number, number] = [center.lat, center.lng]
    if (centerMarkerRef.current) {
      centerMarkerRef.current.setLatLng(pos)
    } else {
      const marker = L.marker(pos).addTo(map)
      centerMarkerRef.current = marker
    }
  }, [allowCenterPick, center, map])

  return null
}

export const ZoneMapEditor: React.FC<ZoneMapEditorProps> = ({
  coordinates,
  referenceCoordinates,
  center,
  onChange,
  onCenterChange,
  height = '400px',
  editable = true,
  allowCenterPick = false,
}) => {
  const [jsonText, setJsonText] = useState('')
  const [showJson, setShowJson] = useState(false)
  const { data: mapConfig } = useMapClientConfig()
  const tileLayer = useMemo(() => resolveMapTileLayer(mapConfig), [mapConfig])

  useEffect(() => {
    if (coordinates?.[0]?.length) {
      setJsonText(JSON.stringify(coordinates, null, 2))
    } else {
      setJsonText('')
    }
  }, [coordinates])

  const mapCenter = useMemo<[number, number]>(() => {
    if (center) return [center.lat, center.lng]
    if (coordinates?.[0]?.[0]) {
      const [lng, lat] = coordinates[0][0]
      return [lat, lng]
    }
    if (referenceCoordinates?.[0]?.[0]) {
      const [lng, lat] = referenceCoordinates[0][0]
      return [lat, lng]
    }
    return [20.5937, 78.9629]
  }, [center, coordinates, referenceCoordinates])

  const mapKey = useMemo(() => {
    const ref = referenceCoordinates?.[0]?.map(([lng, lat]) => `${lng},${lat}`).join('|') ?? 'no-ref'
    const zone = coordinates?.[0]?.map(([lng, lat]) => `${lng},${lat}`).join('|') ?? 'no-zone'
    return `${ref}::${zone}`
  }, [coordinates, referenceCoordinates])

  const applyJson = () => {
    if (!jsonText.trim()) {
      onChange?.([])
      return
    }
    try {
      const value = JSON.parse(jsonText) as number[][][]
      if (value?.[0]?.length >= 3) {
        onChange?.(value)
      }
    } catch {
      // keep current map state until JSON is valid
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {editable
            ? 'Use the map toolbar to draw, edit, drag, or delete the boundary polygon.'
            : 'Boundary preview'}
          {allowCenterPick ? ' Use the marker tool to set the city center.' : ''}
          {editable && referenceCoordinates?.[0]?.length ? (
            <span className="block mt-1">Dashed outline = selected city boundary. Draw your zone inside it.</span>
          ) : null}
        </p>
        <button
          type="button"
          className="text-xs font-semibold text-primary underline"
          onClick={() => setShowJson((v) => !v)}
        >
          {showJson ? 'Hide JSON' : 'Edit JSON'}
        </button>
      </div>
      <div className="rounded-xl overflow-hidden border border-border" style={{ height }}>
        <MapContainer key={mapKey} center={mapCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution={tileLayer.attribution} url={tileLayer.url} />
          <GeomanEditor
            coordinates={coordinates}
            referenceCoordinates={referenceCoordinates}
            center={center}
            onChange={onChange}
            onCenterChange={onCenterChange}
            editable={editable}
            allowCenterPick={allowCenterPick}
          />
        </MapContainer>
      </div>
      {showJson && (
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">
            Polygon coordinates (GeoJSON rings: [[[lng, lat], ...]])
          </label>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            onBlur={applyJson}
            rows={6}
            placeholder="[[[lng, lat], ...]]"
            className="w-full p-2 text-xs font-mono border border-border rounded-lg bg-slate-50 dark:bg-slate-950"
          />
        </div>
      )}
    </div>
  )
}

export default ZoneMapEditor
