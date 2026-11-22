import React, { useState } from 'react'
import { Map, Maximize2 } from 'lucide-react'
import { GoogleZoneViewer } from '@/shared/components/maps/google/GoogleZoneViewer'

interface ZonePreviewCardProps {
  zoneName?: string
  boundary?: number[][][] | null
  center?: { lat: number; lng: number } | null
}

export const ZonePreviewCard: React.FC<ZonePreviewCardProps> = ({
  zoneName = 'Selected Zone',
  boundary,
  center,
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

  const hasRealBoundary = Boolean(boundary && boundary.length > 0 && boundary[0].length >= 3)

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
      {/* Header matching Fare Rule design */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
          <Map className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-[#1F2B6D] dark:text-white leading-tight">
            Zone Preview
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight">
            Geographic coverage for this surge multiplier.
          </p>
        </div>
      </div>

      {/* Map Display Container */}
      <div
        className={`relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 transition-all ${
          isFullscreen ? 'fixed inset-4 z-50 h-auto shadow-2xl' : 'h-48 sm:h-52'
        }`}
      >
        {hasRealBoundary ? (
          <GoogleZoneViewer
            coordinates={boundary}
            center={center}
            height={isFullscreen ? '100%' : '208px'}
            zoom={13}
            zoneName={zoneName}
            zoneType="SURGE"
          />
        ) : (
          <div className="relative w-full h-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-center px-4 gap-2">
            <div className="px-3 py-1 rounded-md bg-[#1F2B6D] text-white text-[11px] font-bold shadow-sm tracking-tight">
              {zoneName}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[240px]">
              Polygon boundary not configured for this zone; surge applies across the selected zone scope.
            </p>
          </div>
        )}

        {hasRealBoundary && (
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/95 dark:bg-slate-800/95 border border-slate-200/90 dark:border-slate-700 shadow-2xs flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

export default ZonePreviewCard