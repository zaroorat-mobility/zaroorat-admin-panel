import React, { useEffect, useState } from 'react'
import { Shield, Save } from 'lucide-react'
import { getCities } from '../../api'
import { useUpdateCitySurgeCap } from '../../hooks'
import type { CityOption } from '../../fare-rules/types'
import { useToast } from '@/shared/context/toast/ToastContext'

interface CitySurgeCapsCardProps {
  canWrite: boolean
}

export const CitySurgeCapsCard: React.FC<CitySurgeCapsCardProps> = ({ canWrite }) => {
  const toast = useToast()
  const [cities, setCities] = useState<CityOption[]>([])
  const [draftCaps, setDraftCaps] = useState<Record<string, string>>({})
  const { mutateAsync: updateCap, isPending } = useUpdateCitySurgeCap()

  useEffect(() => {
    let active = true
    void getCities()
      .then((list) => {
        if (!active) return
        const filtered = list.filter((c) => c.code !== 'GLOBAL')
        setCities(filtered)
        const initial: Record<string, string> = {}
        for (const c of filtered) {
          initial[c.code] = String(c.maxSurgeMultiplier ?? 2)
        }
        setDraftCaps(initial)
      })
      .catch(() => {
        if (active) setCities([])
      })
    return () => {
      active = false
    }
  }, [])

  if (cities.length === 0) return null

  const handleSave = async (city: CityOption) => {
    const parsed = Number(draftCaps[city.code])
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 2) {
      toast.error('Invalid surge cap', 'City surge cap must be between 1.0x and 2.0x.')
      return
    }
    try {
      const saved = await updateCap({ cityCode: city.code, maxSurgeMultiplier: parsed })
      setCities((prev) =>
        prev.map((c) =>
          c.code === city.code ? { ...c, maxSurgeMultiplier: saved.maxSurgeMultiplier } : c,
        ),
      )
      toast.success('Surge cap updated', `${city.name} (${city.code}) cap set to ${saved.maxSurgeMultiplier}x.`)
    } catch {
      toast.error('Update failed', `Could not update surge cap for ${city.name}.`)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" />
        <div>
          <h3 className="text-sm font-bold text-[#1F2B6D] dark:text-white leading-tight">
            City Surge Multipliers Cap (Legal Limit)
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Maximum multiplier allowed per city (1.0x – 2.0x platform ceiling). Enforced live on every quote and booking.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cities.map((city) => {
          const current = draftCaps[city.code] ?? String(city.maxSurgeMultiplier ?? 2)
          const unchanged = Number(current) === (city.maxSurgeMultiplier ?? 2)
          return (
            <div
              key={city.id}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {city.name}
                </p>
                <p className="text-[10px] font-mono text-slate-500">{city.code}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="number"
                  min={1}
                  max={2}
                  step={0.1}
                  disabled={!canWrite || isPending}
                  value={current}
                  onChange={(e) =>
                    setDraftCaps((prev) => ({ ...prev, [city.code]: e.target.value }))
                  }
                  aria-label={`${city.name} surge cap`}
                  className="w-16 px-2 py-1 text-xs font-semibold text-right border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
                />
                <span className="text-xs font-bold text-slate-500">x</span>
                {canWrite && (
                  <button
                    type="button"
                    disabled={isPending || unchanged}
                    onClick={() => void handleSave(city)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#1F2B6D] text-white hover:bg-[#182258] disabled:opacity-40 cursor-pointer transition"
                  >
                    <Save className="w-3 h-3" />
                    <span>Save</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
