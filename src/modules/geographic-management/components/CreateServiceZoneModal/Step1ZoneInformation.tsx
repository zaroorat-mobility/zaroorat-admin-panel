import React, { useMemo } from 'react'
import {
  MapPin,
  Layers,
  Tag,
  Hash,
  ListOrdered,
  RotateCw,
  Car,
  Flag,
  Info,
  CheckCircle2,
  AlertCircle,
  Scan,
} from 'lucide-react'
import { ServiceZoneCityPreviewMap } from './ServiceZoneCityPreviewMap'
import { calculatePolygonAreaKm2, type LatLngPoint } from '../CreateCityModal/geoUtils'
import type { CityListItem, ServiceZoneListItem, ServiceZoneType } from '../../types'

interface Step1ZoneInformationProps {
  cities: CityListItem[]
  cityCode: string
  setCityCode: (code: string) => void
  zoneType: ServiceZoneType
  setZoneType: (type: ServiceZoneType) => void
  name: string
  setName: (name: string) => void
  code: string
  setCode: (code: string) => void
  priority: number
  setPriority: (priority: number) => void
  isActive: boolean
  setIsActive: (active: boolean) => void
  allowsPickup: boolean
  setAllowsPickup: (v: boolean) => void
  allowsDropoff: boolean
  setAllowsDropoff: (v: boolean) => void
  cityBoundary: number[][][] | null
  cityCenter: LatLngPoint
  cityName: string
  existingZones?: ServiceZoneListItem[]
}

export const Step1ZoneInformation: React.FC<Step1ZoneInformationProps> = ({
  cities,
  cityCode,
  setCityCode,
  zoneType,
  setZoneType,
  name,
  setName,
  code,
  setCode,
  priority,
  setPriority,
  isActive,
  setIsActive,
  allowsPickup,
  setAllowsPickup,
  allowsDropoff,
  setAllowsDropoff,
  cityBoundary,
  cityCenter,
  cityName,
  existingZones = [],
}) => {
  // Regenerate code from cityCode + name with collision avoidance
  const handleRegenerateCode = () => {
    const prefix = (cityCode || 'ZONE').trim().toUpperCase()
    const typeTag = zoneType === 'AIRPORT' ? 'AP' : zoneType === 'RESTRICTED' ? 'RZ' : 'SZ'
    const slug = name
      .trim()
      .replace(/zone/gi, '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')

    let candidate = slug ? `${prefix}_${slug}` : `${prefix}_${typeTag}_01`
    let counter = 1
    while (existingZones.some((z) => z.code.trim().toUpperCase() === candidate)) {
      counter++
      candidate = slug
        ? `${prefix}_${slug}_${String(counter).padStart(2, '0')}`
        : `${prefix}_${typeTag}_${String(counter).padStart(2, '0')}`
    }
    setCode(candidate)
  }

  // Calculate city boundary area in km²
  const cityAreaKm2 = useMemo(() => {
    if (!cityBoundary) return 294.8
    const a = calculatePolygonAreaKm2(cityBoundary)
    return a > 0 ? a : 294.8
  }, [cityBoundary])

  // Check code uniqueness against existing database zones for this city
  const normalizedCode = code.trim().toUpperCase()
  const isCodeTaken = useMemo(() => {
    if (!normalizedCode) return false
    return existingZones.some(
      (z) => z.code.trim().toUpperCase() === normalizedCode,
    )
  }, [existingZones, normalizedCode])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* ── LEFT COLUMN: Form Fields (col-span-6) ───────────── */}
      <div className="lg:col-span-6 space-y-3.5">
        {/* Section Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1F2B6D] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Scan className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Zone Information</h3>
            <p className="text-xs text-slate-500">Provide basic details for this service zone.</p>
          </div>
        </div>

        {/* Row 1: City & Zone Type */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={cityCode}
                onChange={(e) => setCityCode(e.target.value)}
                className="w-full pl-9 pr-7 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] transition-colors cursor-pointer appearance-none"
              >
                {cities
                  .filter((c) => c.code !== 'GLOBAL')
                  .map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                ▼
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Select the city where this zone will be created.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Zone Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={zoneType}
                onChange={(e) => setZoneType(e.target.value as ServiceZoneType)}
                className="w-full pl-9 pr-7 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] transition-colors cursor-pointer appearance-none"
              >
                <option value="SERVICE">Service Zone</option>
                <option value="AIRPORT">Airport Zone</option>
                <option value="RESTRICTED">Restricted Zone</option>
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                ▼
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Type of zone that defines service availability.</p>
          </div>
        </div>

        {/* Row 2: Zone Name */}
        <div>
          <label className="block text-xs font-bold text-slate-900 mb-1">
            Zone Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`e.g. ${cityName || 'City'} Central Zone`}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] transition-colors"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Display name for this zone (e.g., Downtown, Airport, etc.).</p>
        </div>

        {/* Row 3: Zone Code */}
        <div>
          <label className="block text-xs font-bold text-slate-900 mb-1">
            Zone Code <span className="text-red-500">*</span>
          </label>
          <div className="relative flex items-center">
            <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
              placeholder={`e.g. ${cityCode || 'ZONE'}_SZ_01`}
              className={`w-full pl-9 pr-28 py-2 bg-white border rounded-lg text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-colors ${
                isCodeTaken
                  ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-slate-200 focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D]'
              }`}
            />
            <div className="absolute right-2 flex items-center gap-1.5">
              {isCodeTaken ? (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-rose-600" />
                  Already in use
                </span>
              ) : normalizedCode ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Available
                </span>
              ) : null}
              <button
                type="button"
                onClick={handleRegenerateCode}
                title="Regenerate code"
                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-[#1F2B6D] transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {isCodeTaken ? (
              <span className="text-red-500 font-semibold">
                This code already exists for {cityName}. Please choose a unique zone code.
              </span>
            ) : (
              'Automatically generated from city and name. Must be unique within the city.'
            )}
          </p>
        </div>

        {/* Row 4: Priority & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">Priority</label>
            <div className="relative">
              <ListOrdered className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="number"
                min="1"
                max="100"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] transition-colors"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Higher priority zones take precedence when zones overlap.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">Status</label>
            <div className="relative">
              <div
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                  isActive ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
              <select
                value={isActive ? 'active' : 'inactive'}
                onChange={(e) => setIsActive(e.target.value === 'active')}
                className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-[#1F2B6D] focus:ring-1 focus:ring-[#1F2B6D] transition-colors cursor-pointer appearance-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                ▼
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">You can deactivate this zone later.</p>
          </div>
        </div>

        {/* Row 5: Allow Pickups & Drop-offs Toggle Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1F2B6D] flex items-center justify-center shrink-0 border border-blue-100/70">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">Allow Pickups</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                  Riders can be picked up within this zone.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAllowsPickup(!allowsPickup)}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                allowsPickup ? 'bg-[#1F2B6D]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  allowsPickup ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1F2B6D] flex items-center justify-center shrink-0 border border-blue-100/70">
                <Flag className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">Allow Drop-offs</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                  Riders can be dropped off within this zone.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAllowsDropoff(!allowsDropoff)}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                allowsDropoff ? 'bg-[#1F2B6D]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  allowsDropoff ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Row 6: Important Notes */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 flex items-start gap-2.5">
          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-3.5 h-3.5" />
          </div>
          <div className="text-[11px] text-slate-600 leading-relaxed">
            <p className="font-bold text-[#1F2B6D] mb-0.5">Important Notes</p>
            <ul className="space-y-0.5 text-[10.5px]">
              <li>• The zone geometry must be within the selected city boundary.</li>
              <li>• You can assign multiple vehicle categories in the next step.</li>
              <li>• The zone code must be unique within the city.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN: Map & Selected City Details (col-span-6) ── */}
      <div className="lg:col-span-6 space-y-3.5">
        {/* Section Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1F2B6D] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Scan className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">City Boundary Preview</h3>
            <p className="text-xs text-slate-500">
              This shows the selected city boundary. You will draw the service zone inside this boundary in later steps.
            </p>
          </div>
        </div>

        {/* City Boundary Map Preview with Legend */}
        <ServiceZoneCityPreviewMap
          center={cityCenter}
          cityName={cityName}
          boundary={cityBoundary}
          height="280px"
          zoom={11}
        />

        {/* Selected City Details Card */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
            <MapPin className="w-4 h-4 text-[#1F2B6D]" />
            <span>Selected City Details</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-500">City</span>
              <span className="font-bold text-slate-900">
                {cityName} ({cityCode})
              </span>
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-500">City Boundary Area</span>
              <span className="font-bold text-slate-900">~ {cityAreaKm2.toFixed(1)} km²</span>
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-500">Coordinate System</span>
              <span className="font-semibold text-slate-700">WGS84 (EPSG:4326)</span>
            </div>
            <div className="py-1.5 flex justify-between items-center">
              <span className="text-slate-500">Boundary Source</span>
              <span className="font-semibold text-slate-700">City administrative boundary</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Step1ZoneInformation
