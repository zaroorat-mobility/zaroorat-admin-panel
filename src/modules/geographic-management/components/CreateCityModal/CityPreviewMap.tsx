import React, { memo } from 'react'
import { GoogleZoneViewer } from '@/shared/components/maps/google/GoogleZoneViewer'
import { useMapClientConfig } from '@/shared/hooks/useMapClientConfig'
import type { LatLngPoint } from './geoUtils'

export interface CityPreviewMapProps {
  center: LatLngPoint
  cityName: string
  boundary?: number[][][] | null
  height?: string
  zoom?: number
  onViewOnMap?: () => void
}

export const CityPreviewMap: React.FC<CityPreviewMapProps> = memo(({
  center,
  cityName,
  boundary,
  height = '280px',
  zoom = 12,
}) => {
  const { data: mapConfig } = useMapClientConfig()
  const googleKey =
    mapConfig?.providers.google?.clientSdkKey ||
    (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GOOGLE_MAPS_API_KEY : '') ||
    ''

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border shadow-inner" style={{ height }}>
      <GoogleZoneViewer
        coordinates={boundary}
        center={{ lat: center.lat, lng: center.lng }}
        height={height}
        zoom={zoom}
        zoneName={cityName}
        apiKey={googleKey}
      />
    </div>
  )
})

CityPreviewMap.displayName = 'CityPreviewMap'
