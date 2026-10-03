import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  MapPin,
  Search,
  Lock,
  ExternalLink,
  Info,
  FileText,
  X,
  ChevronDown,
  Scan,
  Loader2,
} from 'lucide-react'
import * as Flags from 'country-flag-icons/react/3x2'
import { CityPreviewMap } from './CityPreviewMap'
import {
  searchLiveCities,
  getInitialCitiesForState,
  type LiveCityItem,
} from '../../services/geocodingService'
import type { LatLngPoint } from './geoUtils'
import type { State } from '../../types'

interface Step1CityInformationProps {
  country: string
  setCountry: (v: string) => void
  stateId: string
  setStateId: (v: string) => void
  selectedStateCode: string
  setSelectedStateCode: (v: string) => void
  statesList: State[]
  cityName: string
  setCityName: (v: string) => void
  cityCode: string
  setCityCode: (v: string) => void
  timezone: string
  setTimezone: (v: string) => void
  currency: string
  setCurrency: (v: string) => void
  isActive: boolean
  setIsActive: (v: boolean) => void
  center: LatLngPoint
  onSelectOfficialCity: (city: LiveCityItem) => void
}

export const Step1CityInformation: React.FC<Step1CityInformationProps> = ({
  country,
  stateId,
  setStateId,
  selectedStateCode,
  setSelectedStateCode,
  statesList,
  cityName,
  setCityName,
  cityCode,
  setCityCode,
  timezone,
  setTimezone,
  currency,
  setCurrency,
  isActive,
  setIsActive,
  center,
  onSelectOfficialCity,
}) => {
  const [citySearch, setCitySearch] = useState('')
  const [baseCities, setBaseCities] = useState<LiveCityItem[]>([])
  const [remoteCities, setRemoteCities] = useState<LiveCityItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const isInitialMount = useRef(true)

  const selectedStateObj = useMemo(
    () => statesList.find((s) => s.id === stateId),
    [statesList, stateId],
  )

  // 1. Initial load of cities whenever the selected state changes
  useEffect(() => {
    let isCancelled = false
    if (!selectedStateCode) return

    const loadStateCities = async () => {
      setIsLoading(true)
      try {
        const results = await getInitialCitiesForState(selectedStateCode, selectedStateObj?.name)
        if (!isCancelled && results.length > 0) {
          setBaseCities(results)
          setRemoteCities([])
          // Auto-select the first city on initial mount if not already populated
          if (isInitialMount.current && !cityName) {
            onSelectOfficialCity(results[0])
            setCityName(results[0].name)
            setCityCode(results[0].code)
          }
        }
      } catch {
        // Handled
      } finally {
        if (!isCancelled) setIsLoading(false)
        isInitialMount.current = false
      }
    }

    loadStateCities()
    return () => {
      isCancelled = true
    }
  }, [selectedStateCode, selectedStateObj?.name])

  // 2. Debounced search for live OpenStreetMap results when query is typed
  useEffect(() => {
    const trimmed = citySearch.trim()
    if (trimmed.length < 2) {
      setRemoteCities([])
      return
    }

    const abortController = new AbortController()
    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const results = await searchLiveCities(
          trimmed,
          selectedStateObj?.name,
          abortController.signal,
        )
        if (!abortController.signal.aborted) {
          setRemoteCities(results)
        }
      } catch {
        // Ignored if cancelled
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }, 250)

    return () => {
      clearTimeout(timer)
      abortController.abort()
    }
  }, [citySearch, selectedStateObj?.name])

  // 3. Compute displayed cities: Instant local filter + deduplicated live remote matches
  const displayedCities = useMemo(() => {
    const trimmed = citySearch.trim().toLowerCase()
    if (!trimmed) {
      return baseCities
    }

    // Instant local substring matching across name, district, or code
    const localMatches = baseCities.filter(
      (c) =>
        c.name.toLowerCase().includes(trimmed) ||
        c.code.toLowerCase().includes(trimmed) ||
        c.district.toLowerCase().includes(trimmed),
    )

    // Append remote OpenStreetMap matches without duplicating items
    const seenNames = new Set(localMatches.map((m) => m.name.toLowerCase()))
    const additionalRemote = remoteCities.filter((r) => !seenNames.has(r.name.toLowerCase()))

    return [...localMatches, ...additionalRemote]
  }, [baseCities, remoteCities, citySearch])

  const handleStateChange = async (newStateId: string) => {
    setStateId(newStateId)
    setCitySearch('')
    const st = statesList.find((s) => s.id === newStateId)
    if (st) {
      setSelectedStateCode(st.code)
      setIsLoading(true)
      try {
        const results = await getInitialCitiesForState(st.code, st.name)
        setBaseCities(results)
        setRemoteCities([])
        if (results.length > 0) {
          handleCitySelect(results[0])
        } else {
          setCityName(st.name)
          setCityCode(st.code)
        }
      } catch {
        // Handled
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleCitySelect = (item: LiveCityItem) => {
    onSelectOfficialCity(item)
    setCityName(item.name)
    setCityCode(item.code)
  }

  const handleOpenGoogleMaps = () => {
    window.open(`https://www.google.com/maps?q=${center.lat},${center.lng}`, '_blank')
  }

  return (
    <div className="flex gap-4 h-full overflow-hidden">
      {/* ════════════════════════════════════════════════
          LEFT COLUMN — City Information + Auto-filled details
          Sized to fit screen completely with ZERO scroll
      ════════════════════════════════════════════════ */}
      <div className="w-[430px] shrink-0 flex flex-col gap-2.5 overflow-hidden">
        {/* ── CARD 1: City Information ── */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shrink-0">
          <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-slate-100">
            <div className="w-8 h-8 rounded-full bg-[#EEF4FF] text-[#1F2B6D] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">City Information</p>
              <p className="text-[11px] text-slate-500 leading-tight">
                Select country, state/UT and a city from official master data.
              </p>
            </div>
          </div>

          <div className="px-4 py-2.5 space-y-2">
            {/* Country */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Country <span className="text-red-500">*</span>
              </label>
              <div className="mt-0.5 flex items-center justify-between border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-xs font-semibold text-slate-800">
                <div className="flex items-center gap-2">
                  <Flags.IN className="w-4 h-3 rounded-xs object-cover" />
                  <span>{country || 'India'}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* State */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                State / Union Territory <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-0.5">
                <select
                  value={stateId}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1.5 focus:ring-[#1F2B6D]/25 focus:border-[#1F2B6D] appearance-none cursor-pointer pr-7"
                >
                  <option value="">Select State or Union Territory</option>
                  {statesList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* City */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  City <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] font-medium text-slate-400">
                  {displayedCities.length} {displayedCities.length === 1 ? 'city' : 'cities'}
                </span>
              </div>
              <div className="relative mt-0.5">
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#1F2B6D] animate-spin absolute left-3 top-1/2 -translate-y-1/2" />
                ) : (
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                )}
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Search city by name or code..."
                  className="w-full pl-9 pr-8 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-1.5 focus:ring-[#1F2B6D]/25 focus:border-[#1F2B6D]"
                />
                {citySearch && (
                  <button
                    type="button"
                    onClick={() => setCitySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* City list: rigidly fixed at 82px height (2 items), scrolls for more, ZERO layout shift */}
              <div
                className="mt-1 border border-slate-200 rounded-lg overflow-y-auto h-[82px] bg-white divide-y divide-slate-100"
                style={{ scrollbarWidth: 'thin' }}
              >
                {isLoading && displayedCities.length === 0 ? (
                  <div className="h-full flex items-center justify-center gap-2 px-3 text-xs text-slate-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1F2B6D]" />
                    <span>Searching cities...</span>
                  </div>
                ) : displayedCities.length === 0 ? (
                  <div className="h-full flex items-center justify-center px-3 text-xs text-slate-400 text-center">
                    No cities found matching &quot;{citySearch}&quot;
                  </div>
                ) : (
                  displayedCities.map((item) => {
                    const isSel =
                      item.code === cityCode ||
                      item.name.toLowerCase() === cityName.trim().toLowerCase()
                    return (
                      <button
                        key={`${item.stateCode}-${item.name}-${item.code}`}
                        type="button"
                        onClick={() => handleCitySelect(item)}
                        className={`w-full text-left flex items-center justify-between px-3 py-1.5 transition-colors cursor-pointer ${
                          isSel
                            ? 'bg-[#EEF4FF] border-l-[3px] border-l-[#1F2B6D]'
                            : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <MapPin
                            className={`w-3.5 h-3.5 shrink-0 ${isSel ? 'text-[#1F2B6D]' : 'text-slate-400'}`}
                          />
                          <div className="min-w-0 truncate">
                            <p
                              className={`text-xs font-semibold leading-tight truncate ${isSel ? 'text-[#1F2B6D]' : 'text-slate-900'}`}
                            >
                              {item.name}
                            </p>
                            <p className="text-[10px] text-slate-500 leading-tight truncate">
                              {item.district}, {item.stateName || selectedStateObj?.name || item.stateCode}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 shrink-0 ml-2">
                          {item.code}
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD 2: Auto-filled City Details ── */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shrink-0">
          <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-slate-100">
            <div className="w-8 h-8 rounded-full bg-[#1F2B6D] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">Auto-filled City Details</p>
              <p className="text-[11px] text-slate-500 leading-tight">
                Information is populated from official reference data and can be adjusted if required.
              </p>
            </div>
          </div>

          <div className="px-4 py-2.5 space-y-2">
            {/* Name + Code */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">City Name</label>
                <input
                  type="text"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  placeholder="e.g. Bengaluru"
                  className="mt-0.5 w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-1.5 focus:ring-[#1F2B6D]/25"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">City Code</label>
                <div className="relative mt-0.5">
                  <input
                    type="text"
                    value={cityCode}
                    onChange={(e) => setCityCode(e.target.value.toUpperCase())}
                    placeholder="e.g. BLR"
                    maxLength={10}
                    className="w-full border border-slate-200 rounded-lg px-3 pr-8 py-1.5 text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none focus:ring-1.5 focus:ring-[#1F2B6D]/25 uppercase"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Timezone + Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Timezone</label>
                <div className="relative mt-0.5">
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-1.5 focus:ring-[#1F2B6D]/25 appearance-none cursor-pointer pr-7"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (UTC+05:30)</option>
                    <option value="UTC">UTC</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Currency</label>
                <div className="relative mt-0.5 flex items-center border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white gap-1.5">
                  <Flags.IN className="w-4 h-3 rounded-xs object-cover shrink-0" />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-900 bg-transparent focus:outline-none appearance-none cursor-pointer pr-4"
                  >
                    <option value="INR">INR — Indian Rupee (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-semibold text-slate-600">Status</label>
              <div className="mt-0.5 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative w-9 h-5 rounded-full transition-colors shrink-0 cursor-pointer ${
                    isActive ? 'bg-[#1F2B6D]' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      isActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900">
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-slate-500">
                    Active cities will be available for operations.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          RIGHT COLUMN — map + Next step + summary
          Sized to fit screen completely with ZERO scroll
      ════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col gap-2.5 min-w-0 overflow-hidden">
        {/* City Preview */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shrink-0">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[#EEF4FF] text-[#1F2B6D] flex items-center justify-center">
                <Scan className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">City Preview</p>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Preview the selected location on the map.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md whitespace-nowrap">
                <MapPin className="w-3.5 h-3.5 text-[#1F2B6D]" />
                <span>
                  Center: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleOpenGoogleMaps}
                className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer"
              >
                View on Map <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="px-4 py-2.5">
            <CityPreviewMap center={center} cityName={cityName} height="185px" zoom={11} />
          </div>
        </div>

        {/* Next Step */}
        <div className="bg-[#EEF4FF] border border-[#D0E0FC] rounded-xl px-4 py-2.5 flex items-center gap-2.5 shrink-0">
          <Info className="w-4 h-4 text-[#1F2B6D] shrink-0" />
          <p className="text-xs text-slate-600 leading-tight">
            <span className="font-bold text-[#1F2B6D]">Next Step </span>
            In the next step, you can define the city boundary using official boundary, radius or custom polygon.
          </p>
        </div>

        {/* Selected Location Summary */}
        <div className="bg-white border border-slate-200 rounded-xl flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 shrink-0">
            <FileText className="w-4 h-4 text-slate-500" />
            <h4 className="text-xs font-bold text-slate-800">Selected Location Summary</h4>
          </div>
          <div className="px-4 py-1.5 overflow-hidden">
            {[
              { label: 'Country', value: country || 'India' },
              { label: 'State / Union Territory', value: selectedStateObj?.name || '—' },
              { label: 'City', value: cityName || '—' },
              { label: 'City Code', value: cityCode || '—', mono: true },
              {
                label: 'Center Coordinates',
                value: `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`,
                mono: true,
              },
              { label: 'Timezone', value: timezone },
              { label: 'Currency', value: currency === 'INR' ? 'INR — Indian Rupee (₹)' : currency },
            ].map(({ label, value, mono }) => (
              <div
                key={label}
                className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0"
              >
                <span className="text-xs text-slate-500">{label}</span>
                <span
                  className={`text-xs font-semibold text-slate-800 text-right max-w-[56%] truncate ${mono ? 'font-mono' : ''}`}
                >
                  {value}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center py-1.5">
              <span className="text-xs text-slate-500">Status</span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Step1CityInformation
