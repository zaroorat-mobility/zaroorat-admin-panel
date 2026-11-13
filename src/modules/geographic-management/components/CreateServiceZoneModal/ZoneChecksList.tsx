import React from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { ZoneCheck } from '../CreateCityModal/geoUtils'

export const ZoneChecksList: React.FC<{ checks: ZoneCheck[] }> = ({ checks }) => (
  <div className="space-y-1.5 text-xs font-medium pl-0.5">
    {checks.map((check) => (
      <div
        key={check.label}
        className={`flex items-center gap-2 ${check.ok ? 'text-emerald-900' : 'text-red-700'}`}
      >
        {check.ok ? (
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
        ) : (
          <XCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
        )}
        <span>{check.label}</span>
      </div>
    ))}
  </div>
)
