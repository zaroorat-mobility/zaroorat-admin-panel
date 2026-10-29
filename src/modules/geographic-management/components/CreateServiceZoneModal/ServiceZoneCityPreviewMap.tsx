import React, { memo } from 'react'
import { GoogleZoneViewer } from '@/shared/components/maps/google/GoogleZoneViewer'
import type { LatLngPoint } from '../CreateCityModal/geoUtils'

export interface ServiceZoneCityPreviewMapProps {
  center: LatLngPoint
  cityName: string
  boundary?: number[][][] | null
  height?: string
  zoom?: number
}

export const ServiceZoneCityPreviewMap: React.FC<ServiceZoneCityPreviewMapProps> = memo(({
  center,
  cityName,
  boundary,
  height = '320px',
  zoom = 11,
}) => {
  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border shadow-inner" style={{ height }}>
      <GoogleZoneViewer
        coordinates={boundary}
        center={{ lat: center.lat, lng: center.lng }}
        height={height}
        zoom={zoom}
        zoneName={cityName}
      />
    </div>
  )
})

ServiceZoneCityPreviewMap.displayName = 'ServiceZoneCityPreviewMap'
