import React, { memo } from 'react'
import { GoogleZoneEditor } from '@/shared/components/maps/google/GoogleZoneEditor'
import { useMapClientConfig } from '@/shared/hooks/useMapClientConfig'
import type { LatLngPoint } from './geoUtils'

export type MapLayerType = 'map' | 'satellite' | 'terrain'

export interface CityBoundaryEditorMapProps {
  center: LatLngPoint
  cityName: string
  boundaryType?: 'official' | 'radius' | 'polygon'
  coordinates?: number[][][] | null
  onChangeCoordinates: (coords: number[][][]) => void
  onCenterChange?: (center: LatLngPoint) => void
  drawMode: 'draw' | 'edit' | 'idle'
  height?: string
}

export const CityBoundaryEditorMap: React.FC<CityBoundaryEditorMapProps> = memo(({
  center,
  coordinates,
  onChangeCoordinates,
  onCenterChange,
  drawMode,
  height = '480px',
}) => {
  const { data: mapConfig } = useMapClientConfig()
  const googleKey =
    mapConfig?.providers.google?.clientSdkKey ||
    (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GOOGLE_MAPS_API_KEY : '') ||
    ''

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border shadow-sm" style={{ height }}>
      <GoogleZoneEditor
        coordinates={coordinates}
        center={{ lat: center.lat, lng: center.lng }}
        onChange={onChangeCoordinates}
        onCenterChange={(newCenter) => onCenterChange?.({ lat: newCenter.lat, lng: newCenter.lng })}
        height={height}
        editable={drawMode !== 'idle'}
        allowCenterPick={true}
        apiKey={googleKey}
      />
    </div>
  )
})

CityBoundaryEditorMap.displayName = 'CityBoundaryEditorMap'
