import React from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface CityLoadStatusProps {
  failed: boolean
  cityName: string
  onRetry: () => void
}

/** Shown in place of the map until the selected city's Operating Area has really loaded. */
export const CityLoadStatus: React.FC<CityLoadStatusProps> = ({ failed, cityName, onRetry }) => {
  const city = cityName || 'this city'
  if (!failed) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
        <Loader2 className="w-7 h-7 animate-spin text-[#1F2B6D]" />
        <p className="text-xs font-semibold text-slate-600">Loading {city}…</p>
      </div>
    )
  }
  return (
    <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-center space-y-2">
      <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto" />
      <p className="text-xs font-bold text-amber-950">
        Could not load the Operating Area for {city}
      </p>
      <p className="text-[11px] text-amber-900">
        Check that this city has an Operating Area in Cities, then try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-1.5 bg-white hover:bg-slate-50 border border-amber-300 rounded-lg text-xs font-bold text-amber-950 transition-colors cursor-pointer"
      >
        Try again
      </button>
    </div>
  )
}
