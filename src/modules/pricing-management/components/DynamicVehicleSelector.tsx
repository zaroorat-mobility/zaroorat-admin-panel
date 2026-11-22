import React, { useMemo, useState } from 'react'
import { Bike, Car, Check, Search } from 'lucide-react'
import {
  vehicleTypeLabel,
  type VehicleTypeDto,
} from '@/modules/geographic-management/hooks/useVehicleTypes'

const AutoIllustration = () => (
  <svg
    viewBox="0 0 120 80"
    className="w-20 h-14 sm:w-24 sm:h-16 select-none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse cx="60" cy="74" rx="42" ry="3.5" fill="#000" fillOpacity="0.12" />
    <circle cx="82" cy="62" r="11" fill="#1E293B" />
    <circle cx="82" cy="62" r="6" fill="#94A3B8" />
    <circle cx="82" cy="62" r="2.5" fill="#0F172A" />
    <circle cx="34" cy="64" r="9" fill="#1E293B" />
    <circle cx="34" cy="64" r="5" fill="#94A3B8" />
    <circle cx="34" cy="64" r="2" fill="#0F172A" />
    <path d="M34 64L42 45" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
    <path
      d="M26 50L38 46H82C89 46 95 51 95 57V62C95 64 93 66 91 66H70C69 58 63 54 55 54C47 54 41 58 40 66H26C24 66 22 64 22 62L23 54C23 51.5 24.3 50.3 26 50Z"
      fill="#0284C7"
    />
    <path d="M38 46H82V52H32L38 46Z" fill="#0369A1" />
    <rect x="42" y="44" width="46" height="5" rx="1.5" fill="#F8FAFC" />
    <path
      d="M26 38C28 26 36 20 48 19H80C88 19 93 24 94 32L93 46H86V38C86 34 83 31 79 31H45C41 31 38 34 38 38V46H28L26 38Z"
      fill="#1E293B"
    />
    <path d="M48 21H78C84 21 88 24 90 30" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M28 38L32 23C33 21.5 35 21 37 21H44V39H30C28.8 39 28 38.6 28 38Z"
      fill="#BAE6FD"
      fillOpacity="0.85"
    />
    <path d="M32 37L39 27" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="48" y="25" width="34" height="15" rx="3" fill="#E2E8F0" fillOpacity="0.3" stroke="#334155" strokeWidth="1" />
    <path d="M22 51C21 51 20 52 20 53.5C20 55 21 56 22 56V51Z" fill="#FACC15" />
  </svg>
)

const BikeIllustration = () => (
  <svg
    viewBox="0 0 120 80"
    className="w-20 h-14 sm:w-24 sm:h-16 select-none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse cx="60" cy="73" rx="44" ry="3.5" fill="#000" fillOpacity="0.12" />
    <circle cx="28" cy="58" r="14" fill="#0F172A" />
    <circle cx="28" cy="58" r="9" fill="#E2E8F0" />
    <circle cx="28" cy="58" r="4" fill="#334155" />
    <line x1="28" y1="49" x2="28" y2="67" stroke="#94A3B8" strokeWidth="1.5" />
    <line x1="19" y1="58" x2="37" y2="58" stroke="#94A3B8" strokeWidth="1.5" />
    <circle cx="92" cy="58" r="14" fill="#0F172A" />
    <circle cx="92" cy="58" r="9" fill="#E2E8F0" />
    <circle cx="92" cy="58" r="4" fill="#334155" />
    <line x1="92" y1="49" x2="92" y2="67" stroke="#94A3B8" strokeWidth="1.5" />
    <line x1="83" y1="58" x2="101" y2="58" stroke="#94A3B8" strokeWidth="1.5" />
    <path d="M48 61H30C28 61 27 60 27 58V57" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
    <path d="M30 61H42" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
    <rect x="46" y="47" width="18" height="15" rx="3" fill="#334155" />
    <line x1="48" y1="51" x2="62" y2="51" stroke="#475569" strokeWidth="1.5" />
    <line x1="48" y1="55" x2="62" y2="55" stroke="#475569" strokeWidth="1.5" />
    <path d="M28 58L48 50L64 50L92 58" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
    <path d="M48 50L60 36" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
    <path d="M92 58L82 28" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
    <path d="M56 36C56 32 62 28 72 28C77 28 82 31 82 34L76 43H57L56 36Z" fill="#2563EB" />
    <path d="M60 31C64 30 70 30 75 32" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M36 38C40 37 46 36 56 36L57 41C48 42 42 43 36 41C34.5 40.5 34.5 38.5 36 38Z" fill="#0F172A" />
    <path d="M79 27L85 24H89" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="88" cy="28" r="3.5" fill="#38BDF8" />
  </svg>
)

const CabIllustration = () => (
  <svg
    viewBox="0 0 120 80"
    className="w-20 h-14 sm:w-24 sm:h-16 select-none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse cx="60" cy="72" rx="46" ry="3.5" fill="#000" fillOpacity="0.14" />
    <circle cx="34" cy="61" r="11" fill="#0F172A" />
    <circle cx="34" cy="61" r="6.5" fill="#E2E8F0" />
    <circle cx="34" cy="61" r="2.5" fill="#475569" />
    <circle cx="86" cy="61" r="11" fill="#0F172A" />
    <circle cx="86" cy="61" r="6.5" fill="#E2E8F0" />
    <circle cx="86" cy="61" r="2.5" fill="#475569" />
    <path
      d="M14 55C14 52 16 50 19 49L30 47L42 32C45 28 50 26 56 26H78C82 26 86 28 89 31L101 45L106 47C109 48 111 50 111 53V58C111 60 109 61 107 61H97C96 55 91 51 85 51C79 51 74 55 73 61H47C46 55 41 51 35 51C29 51 24 55 23 61H16C14.5 61 14 60 14 58V55Z"
      fill="#FFFFFF"
      stroke="#CBD5E1"
      strokeWidth="1.5"
    />
    <path d="M15 57H23M47 57H73M97 57H110" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
    <path d="M78 28H85L97 44H78V28Z" fill="#38BDF8" fillOpacity="0.35" stroke="#94A3B8" strokeWidth="1" />
    <path d="M45 34L54 28H75V44H41L45 34Z" fill="#38BDF8" fillOpacity="0.35" stroke="#94A3B8" strokeWidth="1" />
    <line x1="64" y1="28" x2="64" y2="44" stroke="#64748B" strokeWidth="1.5" />
    <path d="M106 48L111 50V54L105 52Z" fill="#FACC15" />
    <path d="M14 51L17 50V54L14 53Z" fill="#EF4444" />
    <rect x="57" y="47" width="5" height="1.5" rx="0.75" fill="#94A3B8" />
    <rect x="74" y="47" width="5" height="1.5" rx="0.75" fill="#94A3B8" />
  </svg>
)

function fallbackIllustration(codeOrName: string) {
  const key = codeOrName.toLowerCase()
  if (key.includes('auto') || key.includes('rickshaw') || key.includes('tuk')) {
    return <AutoIllustration />
  }
  if (key.includes('bike') || key.includes('moto') || key.includes('scooter') || key.includes('two')) {
    return <BikeIllustration />
  }
  return <CabIllustration />
}

function compactIcon(codeOrName: string, isSelected: boolean) {
  const key = codeOrName.toLowerCase()
  const cls = `w-4 h-4 shrink-0 ${isSelected ? 'text-[#1F2B6D] dark:text-blue-300' : 'text-slate-500'}`
  if (key.includes('bike') || key.includes('moto') || key.includes('scooter') || key.includes('two')) {
    return <Bike className={cls} strokeWidth={2} />
  }
  return <Car className={cls} strokeWidth={2} />
}

export interface DynamicVehicleSelectorProps {
  vehicles: VehicleTypeDto[]
  selectedIds: string[]
  onChange: (nextIds: string[]) => void
  /** 'cards' = illustrated cards (Tax & GST); 'compact' = tight pill tiles (Surge Rules). */
  variant?: 'cards' | 'compact'
  isLoading?: boolean
  error?: string
}

export const DynamicVehicleSelector: React.FC<DynamicVehicleSelectorProps> = ({
  vehicles,
  selectedIds,
  onChange,
  variant = 'cards',
  isLoading = false,
  error,
}) => {
  const [search, setSearch] = useState('')
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})

  const activeVehicles = useMemo(
    () =>
      vehicles
        .filter((v) => v.isActive || selectedIds.includes(v.id))
        .slice()
        .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999) || a.name.localeCompare(b.name)),
    [vehicles, selectedIds],
  )

  const filteredVehicles = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return activeVehicles
    return activeVehicles.filter(
      (v) =>
        vehicleTypeLabel(v).toLowerCase().includes(q) ||
        v.code.toLowerCase().includes(q),
    )
  }, [activeVehicles, search])

  const allIds = useMemo(() => activeVehicles.map((v) => v.id), [activeVehicles])
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id))
  const isLargeCatalog = activeVehicles.length > 6

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-pulse">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
        ))}
      </div>
    )
  }

  if (activeVehicles.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
        No active vehicle types configured in Vehicle Management yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Selection Toolbar: Live Count + Select All / Clear + Search (auto-shown for 7+ vehicles) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-[#1F2B6D] dark:text-blue-300 border border-blue-100 dark:border-blue-900/40">
            {allSelected
              ? `All Vehicles (${allIds.length})`
              : `${selectedIds.length} of ${allIds.length} selected`}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isLargeCatalog && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vehicles..."
                className="h-7 pl-8 pr-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#1F2B6D] w-44"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => onChange(allIds)}
            disabled={allSelected}
            className="text-[11px] font-bold text-[#1F2B6D] dark:text-blue-300 hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer disabled:cursor-default"
          >
            Select All
          </button>
          <span className="text-slate-300 dark:text-slate-600 text-xs">·</span>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={selectedIds.length === 0}
            className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 disabled:opacity-40 cursor-pointer disabled:cursor-default"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Vehicle Grid — auto-scrolls cleanly when catalog grows beyond 6 vehicles */}
      <div
        className={
          variant === 'compact'
            ? `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 ${isLargeCatalog ? 'max-h-60 overflow-y-auto pr-1' : ''}`
            : `grid grid-cols-1 sm:grid-cols-3 ${isLargeCatalog ? 'lg:grid-cols-4 max-h-64 overflow-y-auto pr-1' : ''} gap-3.5 sm:gap-4`
        }
      >
        {filteredVehicles.map((v) => {
          const isSelected = selectedIds.includes(v.id)
          const label = vehicleTypeLabel(v)
          const showUploadedImage = Boolean(v.imageUrl) && !failedImages[v.id]

          if (variant === 'compact') {
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => toggleOne(v.id)}
                className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer select-none text-left ${
                  isSelected
                    ? 'border-2 border-[#1F2B6D] bg-[#1F2B6D]/5 text-[#1F2B6D] dark:bg-[#1F2B6D]/15 dark:text-blue-300 dark:border-blue-400 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {showUploadedImage ? (
                    <img
                      src={v.imageUrl!}
                      alt={label}
                      onError={() => setFailedImages((prev) => ({ ...prev, [v.id]: true }))}
                      className="w-6 h-6 object-contain shrink-0 rounded"
                    />
                  ) : (
                    compactIcon(`${v.code} ${v.name}`, isSelected)
                  )}
                  <span className="text-xs sm:text-sm font-bold truncate">{label}</span>
                </div>

                {isSelected ? (
                  <span className="w-4 h-4 rounded-full bg-[#1F2B6D] dark:bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                ) : (
                  <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                )}
              </button>
            )
          }

          return (
            <div
              key={v.id}
              onClick={() => toggleOne(v.id)}
              className={`relative rounded-xl p-3.5 sm:p-4 flex flex-col items-center justify-between border cursor-pointer transition-all duration-150 select-none ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/20 ring-1 ring-blue-500/20 shadow-2xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Top-right checkbox */}
              <div className="w-full flex justify-end">
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              {/* Live Admin Image or SVG Fallback */}
              <div className="my-1.5 flex items-center justify-center h-16 w-full">
                {showUploadedImage ? (
                  <img
                    src={v.imageUrl!}
                    alt={label}
                    onError={() => setFailedImages((prev) => ({ ...prev, [v.id]: true }))}
                    className="max-h-14 max-w-[96px] object-contain select-none"
                  />
                ) : (
                  fallbackIllustration(`${v.code} ${v.name}`)
                )}
              </div>

              {/* Vehicle Label + Code */}
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-1 text-center leading-tight">
                {label}
              </span>
              {v.badge && (
                <span className="text-[10px] font-semibold text-slate-400 mt-0.5">{v.badge}</span>
              )}
            </div>
          )
        })}

        {filteredVehicles.length === 0 && (
          <div className="col-span-full py-4 text-center text-xs text-slate-400">
            No vehicle types match &ldquo;{search}&rdquo;.
          </div>
        )}
      </div>

      {error && <p className="text-[10.5px] text-rose-500 font-medium">{error}</p>}
    </div>
  )
}
