import React from 'react'
import { Navigation } from 'lucide-react'

export interface MapPlaceholderProps {
  center?: [number, number]
  zoom?: number
  className?: string
}

/**
 * Enterprise Map Mockup component for dispatcher and trip views
 */
export const MapPlaceholder: React.FC<MapPlaceholderProps> = ({
  center = [12.9716, 77.5946], // default Bengaluru
  zoom = 12,
  className = 'h-96 w-full',
}) => {
  return (
    <div className={`relative rounded-xl overflow-hidden border border-slate-200 dark:border-dark-800 bg-slate-100 dark:bg-dark-950 flex items-center justify-center ${className}`}>
      {/* Gridlines styling representing a map grid */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="z-10 text-center space-y-2 p-6 max-w-sm glass-panel rounded-xl">
        <Navigation className="h-8 w-8 mx-auto text-brand-600 dark:text-brand-500 animate-bounce" />
        <h4 className="text-sm font-semibold text-slate-800 dark:text-dark-200">Interactive Map Interface</h4>
        <p className="text-xs text-slate-500 dark:text-dark-400">
          Showing coordinates: {center[0].toFixed(4)}° N, {center[1].toFixed(4)}° E at Zoom {zoom}
        </p>
      </div>

      <div className="absolute bottom-4 right-4 text-xs font-semibold px-2 py-1 bg-slate-900/80 text-white rounded">
        Google Maps API Wrapper
      </div>
    </div>
  )
}
export default MapPlaceholder
