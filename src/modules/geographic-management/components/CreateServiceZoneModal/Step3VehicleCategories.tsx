import React, { useEffect, useMemo } from 'react'
import {
  Car,
  Bike,
  Truck,
  Check,
  Info,
  MapPin,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { useVehicleTypes } from '../../hooks'

export interface VehicleCategoryItem {
  id: string
  code: string
  name: string
  description: string
  passengerCapacity?: number | null
  isActive?: boolean
}

// Custom TukTuk / Auto Rickshaw Icon matching design
const AutoRickshawIcon = ({ className = 'w-7 h-7 text-[#1F2B6D]' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 16h14v2a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-2z" />
    <path d="M4 16V9a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v7" />
    <path d="M6 11h12" />
    <circle cx="7.5" cy="18" r="1.5" />
    <circle cx="16.5" cy="18" r="1.5" />
    <line x1="12" y1="5" x2="12" y2="11" />
  </svg>
)

// Custom Carpool Icon with passengers
const CarpoolIcon = ({ className = 'w-7 h-7 text-[#1F2B6D]' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
    <circle cx="9" cy="4" r="1.5" />
    <circle cx="15" cy="4" r="1.5" />
  </svg>
)

interface Step3VehicleCategoriesProps {
  selectedCategoryIds: string[]
  setSelectedCategoryIds: (ids: string[]) => void
  cityName: string
}

export const Step3VehicleCategories: React.FC<Step3VehicleCategoriesProps> = ({
  selectedCategoryIds,
  setSelectedCategoryIds,
  cityName: _cityName,
}) => {
  const { data: rawTypes = [], isLoading, isError, error } = useVehicleTypes()

  // Map backend vehicle types into displayable categories
  const categories: VehicleCategoryItem[] = useMemo(() => {
    return rawTypes.map((v) => {
      let description = ''
      const code = v.code.toUpperCase()
      if (code.includes('BIKE')) {
        description = 'Two wheeler rides for fast travel.'
      } else if (code.includes('AUTO')) {
        description = 'Auto rickshaw rides for city travel.'
      } else if (code.includes('ECONOMY') || code.includes('MINI')) {
        description = 'Affordable car rides for everyday travel.'
      } else if (code.includes('PREMIUM') || code.includes('SEDAN')) {
        description = 'Premium cars for comfort travel.'
      } else if (code.includes('CARPOOL')) {
        description = 'Shared rides with multiple passengers.'
      } else if (code.includes('PARCEL')) {
        description = 'For goods and package delivery.'
      } else {
        description = v.passengerCapacity
          ? `Capacity: ${v.passengerCapacity} passenger${v.passengerCapacity > 1 ? 's' : ''}.`
          : 'Standard vehicle category for urban mobility.'
      }

      return {
        id: v.id,
        code: v.code,
        name: v.name,
        description,
        passengerCapacity: v.passengerCapacity,
        isActive: v.isActive,
      }
    })
  }, [rawTypes])

  // Automatically select all active vehicle categories by default if nothing selected yet
  useEffect(() => {
    if (categories.length > 0 && selectedCategoryIds.length === 0) {
      const activeIds = categories.filter((c) => c.isActive !== false).map((c) => c.id)
      setSelectedCategoryIds(activeIds.length > 0 ? activeIds : categories.map((c) => c.id))
    }
  }, [categories, selectedCategoryIds.length, setSelectedCategoryIds])

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds(
      selectedCategoryIds.includes(id)
        ? selectedCategoryIds.filter((item) => item !== id)
        : [...selectedCategoryIds, id],
    )
  }

  const handleSelectAll = () => {
    if (selectedCategoryIds.length === categories.length) {
      setSelectedCategoryIds([])
    } else {
      setSelectedCategoryIds(categories.map((c) => c.id))
    }
  }

  const renderCategoryIcon = (code: string, isSelected: boolean) => {
    const c = code.toUpperCase()
    const colorClass = isSelected ? 'text-[#1F2B6D]' : 'text-slate-700'
    if (c.includes('BIKE')) return <Bike className={`w-8 h-8 ${colorClass}`} />
    if (c.includes('AUTO')) return <AutoRickshawIcon className={`w-8 h-8 ${colorClass}`} />
    if (c.includes('CARPOOL')) return <CarpoolIcon className={`w-8 h-8 ${colorClass}`} />
    if (c.includes('PARCEL')) return <Truck className={`w-8 h-8 ${colorClass}`} />
    return <Car className={`w-8 h-8 ${colorClass}`} />
  }

  // Selected categories list for right column
  const selectedList = useMemo(() => {
    return categories.filter((c) => selectedCategoryIds.includes(c.id))
  }, [categories, selectedCategoryIds])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#1F2B6D]" />
        <p className="text-xs font-semibold text-slate-600">Loading active vehicle types from database...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-center space-y-2">
        <AlertTriangle className="w-6 h-6 text-red-600 mx-auto" />
        <p className="text-xs font-bold text-red-900">Failed to load vehicle types from server</p>
        <p className="text-[11px] text-red-600">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Section Header matching screenshot ────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1F2B6D] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Vehicle Categories</h3>
            <p className="text-xs text-slate-500">
              Select which vehicle categories are allowed in this zone.
            </p>
          </div>
        </div>

        {categories.length > 0 && (
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-[#1F2B6D] transition-colors shadow-2xs cursor-pointer"
          >
            {selectedCategoryIds.length === categories.length ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {/* ── 2-Column Layout matching screenshot ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ── LEFT COLUMN: Category Cards + Important Info ──────── */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {categories.length === 0 ? (
            <div className="p-8 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
              No vehicle types found in the database. Please ensure vehicle types are seeded in the system.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((cat) => {
                const isSelected = selectedCategoryIds.includes(cat.id)
                return (
                  <div
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`relative p-4 rounded-xl border text-center flex flex-col items-center justify-between cursor-pointer transition-all select-none min-h-[148px] ${
                      isSelected
                        ? 'border-blue-400 bg-blue-50/30 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    {/* Top-Right Checkbox Indicator */}
                    <div className="absolute top-2.5 right-2.5">
                      {isSelected ? (
                        <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center text-white shadow-2xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded border border-slate-300 bg-white" />
                      )}
                    </div>

                    {/* Centered Category Icon */}
                    <div className="mt-1 flex items-center justify-center h-10">
                      {renderCategoryIcon(cat.code, isSelected)}
                    </div>

                    {/* Category Title & Description */}
                    <div className="mt-2 space-y-1">
                      <p
                        className={`text-xs font-bold leading-tight ${
                          isSelected ? 'text-[#1F2B6D]' : 'text-slate-800'
                        }`}
                      >
                        {cat.name}
                      </p>
                      <p className="text-[10.5px] text-slate-500 leading-snug">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Important Information Callout Card matching screenshot */}
          <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3.5 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs text-slate-700 leading-relaxed">
              <p className="font-bold text-[#1F2B6D] mb-1">Important Information</p>
              <ul className="space-y-1 text-[11px] text-slate-600">
                <li>• If you do not select any vehicle categories, all vehicle types will be allowed in this zone.</li>
                <li>• You can configure vehicle type specific pricing rules later.</li>
                <li>• Vehicle category availability can be changed anytime by editing the zone.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Selected Categories & Coverage Preview ── */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3.5">
          {/* Card 1: Selected Categories */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900">
              Selected Categories ({selectedList.length})
            </h4>

            {selectedList.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center italic">
                No categories selected (all will be allowed by default).
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {selectedList.map((cat) => (
                  <div key={cat.id} className="py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 flex items-center justify-center text-[#1F2B6D]">
                        {cat.code.includes('BIKE') && <Bike className="w-4 h-4" />}
                        {cat.code.includes('AUTO') && <AutoRickshawIcon className="w-4 h-4" />}
                        {cat.code.includes('CAB_ECONOMY') && <Car className="w-4 h-4" />}
                        {cat.code.includes('CAB_PREMIUM') && <Car className="w-4 h-4" />}
                        {cat.code.includes('CARPOOL') && <CarpoolIcon className="w-4 h-4" />}
                        {cat.code.includes('PARCEL') && <Truck className="w-4 h-4" />}
                      </div>
                      <span className="text-xs font-bold text-slate-800">{cat.name}</span>
                    </div>

                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 2: Category Coverage Preview */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs space-y-2.5">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <MapPin className="w-3.5 h-3.5 text-[#1F2B6D]" />
                <span>Category Coverage Preview</span>
              </div>
              <p className="text-[10.5px] text-slate-500 mt-0.5">
                These vehicles will be available for rides in this zone once it is active.
              </p>
            </div>

            {selectedList.length === 0 ? (
              <div className="p-3 bg-slate-50 rounded-lg text-center text-xs text-slate-500">
                All vehicle categories will be available.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {selectedList.map((cat) => (
                  <div
                    key={`preview-${cat.id}`}
                    className="p-2.5 bg-slate-50/70 border border-slate-200/70 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-[#1F2B6D]">
                        {cat.code.includes('BIKE') && <Bike className="w-4 h-4" />}
                        {cat.code.includes('AUTO') && <AutoRickshawIcon className="w-4 h-4" />}
                        {cat.code.includes('CAB_ECONOMY') && <Car className="w-4 h-4" />}
                        {cat.code.includes('CAB_PREMIUM') && <Car className="w-4 h-4" />}
                        {cat.code.includes('CARPOOL') && <CarpoolIcon className="w-4 h-4" />}
                        {cat.code.includes('PARCEL') && <Truck className="w-4 h-4" />}
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 leading-tight">
                        {cat.name}
                      </span>
                    </div>

                    <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      Enabled
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Step3VehicleCategories
