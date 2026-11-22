import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layers,
  Car,
  MapPin,
  Map,
  ChevronDown,
  Info,
  Calendar,
  Zap,
  Clock,
  Flag,
  Check,
  AlertTriangle,
} from 'lucide-react'
import type { SurgeRule } from '../types'
import { useFareRules, useSurgeRules, useSurgeZones } from '../../hooks'
import { useCities, useCity } from '@/modules/geographic-management/hooks'
import {
  useVehicleTypes,
  vehicleTypeLabel,
} from '@/modules/geographic-management/hooks/useVehicleTypes'
import { DynamicVehicleSelector } from '../../components/DynamicVehicleSelector'
import DatePicker from '@/shared/components/ui/DatePicker'
import { Button } from '@/shared/components/ui/Button'
import { ZonePreviewCard } from './ZonePreviewCard'
import { SurgeFarePreviewCard } from './SurgeFarePreviewCard'
import { SurgeRuleConflictModal } from './SurgeRuleConflictModal'

export const MULTIPLIER_PRESETS = [1.1, 1.2, 1.3, 1.5, 1.8, 2.0] as const
export const SURGE_PRESETS = [1.2, 1.5, 1.8, 2.0] as const

// Matches backend peak-window.ts: 0 = Sun, 1 = Mon, ..., 6 = Sat
const DAY_OPTIONS = [
  { num: 1, label: 'Mon' },
  { num: 2, label: 'Tue' },
  { num: 3, label: 'Wed' },
  { num: 4, label: 'Thu' },
  { num: 5, label: 'Fri' },
  { num: 6, label: 'Sat' },
  { num: 0, label: 'Sun' },
] as const

export function surgeMultiplierError(multiplier: number): string | null {
  if (!(multiplier > 1)) return 'Surge must be above 1.0x. At 1.0x riders pay the normal fare.'
  if (multiplier > 3) return 'Surge cannot be above 3.0x.'
  return null
}

function parseHhMm(val: string | null | undefined): number | null {
  if (!val) return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(val.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (!Number.isInteger(h) || !Number.isInteger(min) || h > 23 || min > 59) return null
  return h * 60 + min
}

function peakTimesOverlap(
  aPeak: boolean,
  aStart: string | null | undefined,
  aEnd: string | null | undefined,
  bPeak: boolean,
  bStart: string | null | undefined,
  bEnd: string | null | undefined,
): boolean {
  if (!aPeak || !bPeak) return true
  const segs = (s: string | null | undefined, e: string | null | undefined) => {
    const start = parseHhMm(s)
    const end = parseHhMm(e)
    if (start === null || end === null) return [[0, 1440]]
    if (start < end) return [[start, end]]
    if (start > end) return [[start, 1440], [0, end]]
    return [[0, 1440]]
  }
  const sa = segs(aStart, aEnd)
  const sb = segs(bStart, bEnd)
  return sa.some(([a1, a2]) => sb.some(([b1, b2]) => a1 < b2 && b1 < a2))
}

interface SurgeRuleWizardFormProps {
  initialValues?: SurgeRule | null
  onSubmit: (data: Omit<SurgeRule, 'id' | 'createdAt' | 'updatedAt'>) => void
  loading?: boolean
  error?: unknown
}

export const SurgeRuleWizardForm: React.FC<SurgeRuleWizardFormProps> = ({
  initialValues,
  onSubmit,
  loading = false,
  error,
}) => {
  const navigate = useNavigate()
  const isEditMode = Boolean(initialValues?.id)

  // 1. Live Catalogs from PostgreSQL
  const { data: surgeZones = [], isLoading: zonesLoading } = useSurgeZones()
  const { data: cities = [] } = useCities(true)
  const { data: vehicleCatalog = [], isLoading: vehiclesLoading } = useVehicleTypes()

  const activeCities = useMemo(
    () => cities.filter((c) => c.code.toUpperCase() !== 'GLOBAL'),
    [cities],
  )
  const activeVehicles = useMemo(
    () => vehicleCatalog.filter((v) => v.isActive),
    [vehicleCatalog],
  )
  const allVehicleIds = useMemo(() => activeVehicles.map((v) => v.id), [activeVehicles])

  // 2. Basic Details state (Blank on Create; pre-filled only on Edit)
  const [ruleName, setRuleName] = useState<string>(initialValues?.ruleName || '')
  const [cityCode, setCityCode] = useState<string>(initialValues?.cityCode || '')
  const [zoneId, setZoneId] = useState<string>(initialValues?.zoneId || '')
  const [conflictModalOpen, setConflictModalOpen] = useState<boolean>(false)

  const selectedCityObj = useMemo(
    () => activeCities.find((c) => c.code.toUpperCase() === cityCode.toUpperCase()) ?? null,
    [activeCities, cityCode],
  )
  const { data: cityDetail } = useCity(selectedCityObj?.id ?? '')
  const citySurgeCap = cityDetail?.maxSurgeMultiplier ?? null

  // Filter zones for selected city, hiding duplicate "Citywide" rows since blank = Citywide
  const cityZones = useMemo(() => {
    if (!cityCode || cityCode === 'GLOBAL') return []
    return surgeZones.filter((z) => {
      if (z.cityCode.toUpperCase() !== cityCode.toUpperCase()) return false
      const isDuplicateCitywide =
        z.name.toLowerCase().includes('citywide') && z.id !== initialValues?.zoneId
      return !isDuplicateCitywide
    })
  }, [surgeZones, cityCode, initialValues?.zoneId])

  const selectedZone = useMemo(
    () => surgeZones.find((z) => z.id === zoneId) ?? null,
    [surgeZones, zoneId],
  )

  const selectedCityName = selectedCityObj?.name ?? (cityCode || '')

  // 3. Vehicle Types state (Blank on Create; pre-filled on Edit)
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>(() => {
    if (initialValues?.vehicleTypeIds && initialValues.vehicleTypeIds.length > 0) {
      return initialValues.vehicleTypeIds
    }
    return []
  })

  // If editing an "All vehicles" rule (empty vehicleTypeIds), populate all live IDs once loaded
  useEffect(() => {
    if (
      initialValues &&
      (!initialValues.vehicleTypeIds || initialValues.vehicleTypeIds.length === 0) &&
      allVehicleIds.length > 0 &&
      selectedVehicleIds.length === 0
    ) {
      setSelectedVehicleIds(allVehicleIds)
    }
  }, [initialValues, allVehicleIds, selectedVehicleIds.length])

  // 4. Surge Configuration (Multiplier — blank on Create until explicitly chosen/typed)
  const [multiplierStr, setMultiplierStr] = useState<string>(
    initialValues?.multiplier != null ? String(initialValues.multiplier) : '',
  )
  const multiplier = useMemo(() => {
    const trimmed = multiplierStr.trim()
    if (!trimmed) return null
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : null
  }, [multiplierStr])

  // 5. When to Apply? state (2 truthful backend-backed modes: SCHEDULE vs CONTINUOUS)
  const [applyMode, setApplyMode] = useState<'SCHEDULE' | 'CONTINUOUS'>(() =>
    initialValues
      ? initialValues.isPeakHourOnly || Boolean(initialValues.peakHourStart)
        ? 'SCHEDULE'
        : 'CONTINUOUS'
      : 'SCHEDULE',
  )
  const [selectedDayNums, setSelectedDayNums] = useState<number[]>(() => {
    if (!initialValues) return []
    if (initialValues.daysOfWeek && initialValues.daysOfWeek.length > 0) {
      return initialValues.daysOfWeek
    }
    return initialValues.isPeakHourOnly ? [1, 2, 3, 4, 5, 6, 0] : []
  })
  const [startTime, setStartTime] = useState<string>(
    initialValues?.peakHourStart || '',
  )
  const [endTime, setEndTime] = useState<string>(
    initialValues?.peakHourEnd || '',
  )
  const [eventStartTime, setEventStartTime] = useState<string>(
    initialValues && !initialValues.isPeakHourOnly ? initialValues.startTime || '' : '',
  )
  const [eventEndTime, setEventEndTime] = useState<string>(
    initialValues && !initialValues.isPeakHourOnly ? initialValues.endTime || '' : '',
  )

  const toggleDay = (dayNum: number) => {
    setSelectedDayNums((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum],
    )
  }

  // 6. Validity & Status state
  const [effectiveFrom, setEffectiveFrom] = useState<string>(
    initialValues?.effectiveFrom
      ? initialValues.effectiveFrom.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  )
  const [effectiveTo, setEffectiveTo] = useState<string>(
    initialValues?.effectiveTo ? initialValues.effectiveTo.slice(0, 10) : '',
  )
  const [isActive, setIsActive] = useState<boolean>(
    initialValues ? initialValues.status === 'active' : true,
  )

  // Live active Fare Rules for server-priced Surge Preview (zero hardcoded ₹60!)
  const { data: fareRulesResp } = useFareRules(
    cityCode ? { status: 'active', cityCode, limit: 100 } : { status: 'active', limit: 100 },
  )
  const { data: globalFareRulesResp } = useFareRules({ status: 'active', cityCode: 'GLOBAL', limit: 100 })

  const primarySelectedVehicle = useMemo(() => {
    if (selectedVehicleIds.length === 0) return activeVehicles[0] ?? null
    return vehicleCatalog.find((v) => v.id === selectedVehicleIds[0]) ?? null
  }, [selectedVehicleIds, activeVehicles, vehicleCatalog])

  const referenceFareRule = useMemo(() => {
    const cityRules = fareRulesResp?.data ?? []
    const globalRules = globalFareRulesResp?.data ?? []
    const targetCode = primarySelectedVehicle?.code?.toUpperCase()
    if (targetCode) {
      const cityMatch = cityRules.find((r) => r.vehicleType.toUpperCase() === targetCode)
      if (cityMatch) return cityMatch
      const globalMatch = globalRules.find((r) => r.vehicleType.toUpperCase() === targetCode)
      if (globalMatch) return globalMatch
    }
    return cityRules[0] ?? globalRules[0] ?? null
  }, [fareRulesResp?.data, globalFareRulesResp?.data, primarySelectedVehicle])

  // Live active Surge Rules for duplicate/overlap conflict guard
  const { data: activeSurgeResp } = useSurgeRules(
    cityCode ? { status: 'active', cityCode, limit: 100 } : { status: 'active', limit: 100 },
  )

  const conflictingActiveSurge = useMemo(() => {
    if (isEditMode || !isActive || !cityCode) return null
    const allActive = activeSurgeResp?.data ?? []
    const targetZoneId = zoneId || null
    const allSelected =
      allVehicleIds.length > 0 && allVehicleIds.every((id) => selectedVehicleIds.includes(id))
    const targetVehicles = allSelected ? [] : selectedVehicleIds
    const targetDays = applyMode === 'SCHEDULE' ? selectedDayNums : []
    const newStartMs = effectiveFrom
      ? new Date(
          `${effectiveFrom}T${applyMode === 'CONTINUOUS' && eventStartTime ? `${eventStartTime}:00` : '00:00:00'}`,
        ).getTime()
      : Date.now()
    const newEndMs =
      applyMode === 'CONTINUOUS'
        ? effectiveTo
          ? eventEndTime
            ? new Date(`${effectiveTo}T${eventEndTime}:00`).getTime()
            : new Date(`${effectiveTo}T00:00:00`).getTime() + 24 * 60 * 60 * 1000
          : eventEndTime && effectiveFrom
            ? new Date(`${effectiveFrom}T${eventEndTime}:00`).getTime()
            : Number.POSITIVE_INFINITY
        : effectiveTo
          ? new Date(`${effectiveTo}T00:00:00`).getTime() + 24 * 60 * 60 * 1000
          : Number.POSITIVE_INFINITY

    return (
      allActive.find((r) => {
        if (r.status !== 'active') return false
        const rZone = r.zoneId ?? null
        if (rZone !== targetZoneId) return false
        if (!targetZoneId && (r.cityCode || '').toUpperCase() !== cityCode.toUpperCase()) return false

        const rFromDate = r.effectiveFrom.slice(0, 10)
        const rStartMs = new Date(
          `${rFromDate}T${!r.isPeakHourOnly && r.startTime ? `${r.startTime}:00` : '00:00:00'}`,
        ).getTime()
        const rEndMs = r.effectiveTo
          ? !r.isPeakHourOnly && r.endTime
            ? new Date(`${r.effectiveTo.slice(0, 10)}T${r.endTime}:00`).getTime()
            : new Date(`${r.effectiveTo.slice(0, 10)}T00:00:00`).getTime() + 24 * 60 * 60 * 1000
          : Number.POSITIVE_INFINITY
        if (!(rEndMs > newStartMs && rStartMs < newEndMs)) return false

        const rVehicles = r.vehicleTypeIds ?? []
        const vehiclesOverlap =
          targetVehicles.length === 0 ||
          rVehicles.length === 0 ||
          targetVehicles.some((id) => rVehicles.includes(id))
        if (!vehiclesOverlap) return false

        const rDays = r.daysOfWeek ?? []
        const daysOverlap =
          targetDays.length === 0 ||
          rDays.length === 0 ||
          targetDays.some((d) => rDays.includes(d))
        if (!daysOverlap) return false

        return peakTimesOverlap(
          applyMode === 'SCHEDULE',
          startTime,
          endTime,
          Boolean(r.isPeakHourOnly),
          r.peakHourStart,
          r.peakHourEnd,
        )
      }) ?? null
    )
  }, [
    isEditMode,
    isActive,
    cityCode,
    zoneId,
    allVehicleIds,
    selectedVehicleIds,
    applyMode,
    selectedDayNums,
    effectiveFrom,
    effectiveTo,
    startTime,
    endTime,
    eventStartTime,
    eventEndTime,
    activeSurgeResp?.data,
  ])

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const errs: Record<string, string> = {}

    if (!ruleName.trim()) errs.ruleName = 'Rule name is required.'
    if (!cityCode) errs.cityCode = 'City is required.'
    if (selectedVehicleIds.length === 0) {
      errs.vehicles = 'Please select at least one vehicle type.'
    }
    if (multiplier === null || multiplier <= 1 || multiplier > 3.0) {
      errs.multiplier = 'Enter or select a surge multiplier between 1.05x and 3.0x.'
    }
    if (applyMode === 'SCHEDULE') {
      if (selectedDayNums.length === 0) {
        errs.days = 'Select at least one day of the week.'
      }
      if (!startTime || !endTime) {
        errs.timeRange = 'Start time and end time are required for a scheduled surge.'
      }
    } else if (applyMode === 'CONTINUOUS') {
      const sameSingleDay = !effectiveTo || effectiveTo === effectiveFrom
      if (sameSingleDay && eventStartTime && eventEndTime && eventEndTime <= eventStartTime) {
        errs.eventTimeRange =
          'End time must be after start time on the same day (or select a later Effective To date).'
      } else if (sameSingleDay && !eventStartTime && eventEndTime === '00:00') {
        errs.eventTimeRange = 'End time must be after 00:00 on the same day.'
      }
    }
    if (!effectiveFrom) {
      errs.effectiveFrom = 'Effective From date is required.'
    }
    if (effectiveTo && effectiveTo < effectiveFrom) {
      errs.effectiveTo = 'Effective To date cannot be earlier than Effective From.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEditMode && isActive && conflictingActiveSurge) {
      setConflictModalOpen(true)
      return
    }
    if (!validate()) return

    const allSelected =
      allVehicleIds.length > 0 && allVehicleIds.every((id) => selectedVehicleIds.includes(id))
    const selectedVehicleLabels = vehicleCatalog
      .filter((v) => selectedVehicleIds.includes(v.id))
      .map((v) => vehicleTypeLabel(v))

    const allDaysSelected = selectedDayNums.length === 7
    const isScheduled = applyMode === 'SCHEDULE'

    onSubmit({
      ruleName: ruleName.trim(),
      zoneId: zoneId || undefined,
      zoneName: selectedZone?.name || `${selectedCityName} (Citywide)`,
      cityCode,
      // Empty vehicleTypeIds = all vehicles per M-08 surge.schema.ts
      vehicleTypeIds: allSelected ? [] : selectedVehicleIds,
      vehicleLabel:
        allSelected || selectedVehicleLabels.length === 0
          ? 'All vehicles'
          : selectedVehicleLabels.join(', '),
      multiplier: multiplier!,
      peakHourStart: isScheduled ? startTime : null,
      peakHourEnd: isScheduled ? endTime : null,
      isPeakHourOnly: isScheduled,
      // Empty daysOfWeek = every day; otherwise exact 0..6 array persisted to PostgreSQL
      daysOfWeek: isScheduled ? (allDaysSelected ? [] : selectedDayNums) : [],
      // Keep startTime/endTime undefined for recurring peak-hour schedules so Effective From -> Effective To
      // spans full calendar days (never expiring after Day 1 at endTime!).
      // For Continuous / Event Window, pass optional exact event start/end times (blank = full day 00:00-23:59).
      startTime: isScheduled ? undefined : eventStartTime || undefined,
      endTime: isScheduled ? undefined : eventEndTime || undefined,
      effectiveFrom,
      effectiveTo: effectiveTo || undefined,
      status: isActive ? 'active' : 'inactive',
    })
  }

  const serverErrorInfo = useMemo(() => {
    if (!error) return { code: null as string | null, message: null as string | null }
    const maybe = error as {
      response?: {
        status?: number
        data?: { error?: { code?: string; message?: string }; message?: string }
      }
      message?: string
    }
    const code = maybe?.response?.data?.error?.code ?? null
    const status = maybe?.response?.status ?? null
    const message =
      maybe?.response?.data?.error?.message ||
      maybe?.response?.data?.message ||
      (error instanceof Error ? error.message : null)
    const isConflict = status === 409 || code === 'SURGE_WINDOW_CONFLICT'
    return { code: isConflict ? 'SURGE_WINDOW_CONFLICT' : code, message }
  }, [error])

  useEffect(() => {
    if (serverErrorInfo.code === 'SURGE_WINDOW_CONFLICT') {
      setConflictModalOpen(true)
    }
  }, [serverErrorInfo.code, error])

  const serverErrorMessage =
    serverErrorInfo.code === 'SURGE_WINDOW_CONFLICT' ? null : serverErrorInfo.message

  const previewZoneName = selectedZone?.name || (selectedCityName ? `${selectedCityName} (Citywide)` : 'Selected Zone')
  const previewBoundary = selectedZone?.boundary ?? (!zoneId ? cityDetail?.boundary : null)
  const previewCenter = selectedZone?.center ?? (!zoneId ? cityDetail?.center : null)
  const exceedsCityCap = citySurgeCap != null && multiplier != null && multiplier > citySurgeCap

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5 text-left">
      {/* Server Error Alert Banner (Non-conflict errors) */}
      {serverErrorMessage && (
        <div className="p-3 mb-2 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Submission Error:</span>
            <p className="mt-0.5 leading-relaxed">{serverErrorMessage}</p>
          </div>
        </div>
      )}

      {/* Main 2-Column Responsive Layout matching Fare Rule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 lg:gap-4 items-start">
        {/* Left Column (5 Stacked Cards) */}
        <div className="lg:col-span-8 space-y-2.5 sm:space-y-3">
          {/* CARD 1: Basic Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#1F2B6D] dark:text-white leading-tight">
                  1. Basic Details
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight">
                  Set rule name, target city and surge zone coverage.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-0.5">
              {/* Rule Name */}
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Rule Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g., Evening Peak Surge"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] h-10 shadow-2xs"
                />
                {errors.ruleName && (
                  <p className="text-[10.5px] text-rose-500 font-medium">{errors.ruleName}</p>
                )}
              </div>

              {/* City */}
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  City <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <select
                    value={cityCode}
                    onChange={(e) => {
                      setCityCode(e.target.value)
                      setZoneId('')
                    }}
                    className="w-full pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] appearance-none h-10 shadow-2xs cursor-pointer"
                  >
                    <option value="">Select city...</option>
                    {activeCities.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
                {errors.cityCode && (
                  <p className="text-[10.5px] text-rose-500 font-medium">{errors.cityCode}</p>
                )}
              </div>

              {/* Surge Zone */}
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Surge Zone <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Map className="h-4 w-4" />
                  </div>
                  <select
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                    disabled={!cityCode || zonesLoading}
                    className="w-full pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] appearance-none h-10 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!cityCode ? 'Select a city first' : `Citywide (${selectedCityName})`}
                    </option>
                    {cityZones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Overlap Conflict Banner */}
            {conflictingActiveSurge && (
              <div className="mt-2 p-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 dark:text-amber-200 space-y-0.5 min-w-0">
                    <p className="font-bold">
                      Overlapping active surge rule exists: {conflictingActiveSurge.ruleName} (
                      {conflictingActiveSurge.multiplier.toFixed(2)}x)
                    </p>
                    <p className="text-[11.5px] text-amber-800/90 dark:text-amber-300/90 leading-snug">
                      This zone, vehicle, and schedule already have an active surge multiplier. Edit
                      the existing rule or choose a non-overlapping day/time window.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/pricing-management/surge-rules/${conflictingActiveSurge.id}/edit`)
                  }
                  className="shrink-0 bg-[#1F2B6D] hover:bg-[#182258] text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer whitespace-nowrap"
                >
                  Edit Existing Rule →
                </button>
              </div>
            )}
          </div>

          {/* CARD 2: Vehicle Types */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Car className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#1F2B6D] dark:text-white leading-tight">
                  2. Vehicle Types
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight">
                  Select the vehicle types this surge rule will apply to.
                </p>
              </div>
            </div>

            <DynamicVehicleSelector
              vehicles={vehicleCatalog}
              selectedIds={selectedVehicleIds}
              onChange={setSelectedVehicleIds}
              variant="compact"
              isLoading={vehiclesLoading}
              error={errors.vehicles}
            />
          </div>

          {/* CARD 3: Surge Configuration */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#1F2B6D] dark:text-white leading-tight">
                    3. Surge Configuration
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight">
                    Configure the multiplier rate applied during surge windows.
                  </p>
                </div>
              </div>
              {citySurgeCap != null && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
                  {selectedCityName} Legal Cap: {citySurgeCap.toFixed(1)}x
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-0.5 items-start">
              <div className="md:col-span-8 space-y-2">
                <div className="flex items-center gap-1">
                  <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Fare Multiplier <span className="text-rose-500">*</span>
                  </label>
                  <span
                    title="The factor by which regular base, distance, and time rates are multiplied."
                    className="cursor-help text-slate-400 hover:text-slate-600"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {MULTIPLIER_PRESETS.map((val) => {
                    const isSelected = multiplier === val
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setMultiplierStr(val.toFixed(1))}
                        className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#1F2B6D] text-white shadow-xs'
                            : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {val.toFixed(1)}x
                      </button>
                    )
                  })}

                  {/* Custom Multiplier Input */}
                  <div className="relative w-28">
                    <input
                      type="number"
                      min="1.05"
                      max="3.0"
                      step="0.05"
                      value={multiplierStr}
                      placeholder="Custom"
                      onChange={(e) => setMultiplierStr(e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full h-9 pl-3 pr-7 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono pointer-events-none">
                      x
                    </span>
                  </div>
                </div>
                {errors.multiplier && (
                  <p className="text-[10.5px] text-rose-500 font-medium">{errors.multiplier}</p>
                )}
              </div>

              <div className="md:col-span-4 p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-[#1F2B6D] dark:text-slate-200 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                  <Info className="w-3 h-3 text-[#1F2B6D] dark:text-slate-200" />
                </div>
                <p className="leading-tight text-[11px]">
                  {multiplier !== null && multiplier > 1 ? (
                    <>
                      Ride fares will be{' '}
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {multiplier.toFixed(2)}x
                      </span>{' '}
                      normal fare during this window.
                    </>
                  ) : (
                    'Select a preset or enter a custom multiplier above 1.0x.'
                  )}
                </p>
              </div>
            </div>

            {exceedsCityCap && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2 text-[11.5px] text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Cap Notice:</strong> {selectedCityName}&apos;s configured legal cap is{' '}
                  <strong>{citySurgeCap.toFixed(1)}x</strong>. Live rides in {selectedCityName} will
                  be clamped to {citySurgeCap.toFixed(1)}x unless the city surge cap is raised.
                </span>
              </div>
            )}
          </div>

          {/* CARD 4: When to Apply? */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#1F2B6D] dark:text-white leading-tight">
                  4. When to Apply?
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight">
                  Choose recurring peak hours or a continuous event/manual window.
                </p>
              </div>
            </div>

            {/* 2 Truthful Backend-Backed Mode Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
              <button
                type="button"
                onClick={() => setApplyMode('SCHEDULE')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  applyMode === 'SCHEDULE'
                    ? 'border-2 border-[#1F2B6D] bg-[#1F2B6D]/5 text-[#1F2B6D] dark:bg-[#1F2B6D]/15 dark:border-blue-400 dark:text-blue-300 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-[#1F2B6D]/10 dark:bg-blue-400/20 flex items-center justify-center text-[#1F2B6D] dark:text-blue-300">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold leading-tight">Scheduled (Days &amp; Peak Hours)</span>
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug">
                  Apply automatically on selected days &amp; daily hours (supports overnight e.g. 22:00 – 02:00)
                </p>
              </button>

              <button
                type="button"
                onClick={() => setApplyMode('CONTINUOUS')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  applyMode === 'CONTINUOUS'
                    ? 'border-2 border-[#1F2B6D] bg-[#1F2B6D]/5 text-[#1F2B6D] dark:bg-[#1F2B6D]/15 dark:border-blue-400 dark:text-blue-300 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <Flag className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold leading-tight">Continuous / Event Window</span>
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug">
                  Apply continuously across the entire Effective From → Effective To period (events, festivals, manual override)
                </p>
              </button>
            </div>

            {applyMode === 'SCHEDULE' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 items-start">
                {/* Days of the Week */}
                <div className="md:col-span-7 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Days <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setSelectedDayNums([1, 2, 3, 4, 5])}
                        className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Weekdays
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        type="button"
                        onClick={() => setSelectedDayNums([6, 0])}
                        className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Weekend
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        type="button"
                        onClick={() => setSelectedDayNums([1, 2, 3, 4, 5, 6, 0])}
                        className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        All Days
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {DAY_OPTIONS.map((d) => {
                      const isDaySelected = selectedDayNums.includes(d.num)
                      return (
                        <button
                          key={d.num}
                          type="button"
                          onClick={() => toggleDay(d.num)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            isDaySelected
                              ? 'bg-[#1F2B6D]/10 text-[#1F2B6D] dark:bg-blue-400/20 dark:text-blue-300 border border-[#1F2B6D]/30 dark:border-blue-400/40'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          <span>{d.label}</span>
                          {isDaySelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                        </button>
                      )
                    })}
                  </div>
                  {errors.days && (
                    <p className="text-[10.5px] text-rose-500 font-medium">{errors.days}</p>
                  )}
                </div>

                {/* Daily Time Range */}
                <div className="md:col-span-5 space-y-1.5">
                  <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Daily Peak Hours <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Clock className="h-3.5 w-3.5" />
                      </div>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full pl-8 pr-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] h-10 shadow-2xs"
                      />
                    </div>
                    <span className="text-slate-400 font-bold">-</span>
                    <div className="relative flex-1">
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Clock className="h-3.5 w-3.5" />
                      </div>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full pl-8 pr-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] h-10 shadow-2xs"
                      />
                    </div>
                  </div>
                  {errors.timeRange && (
                    <p className="text-[10.5px] text-rose-500 font-medium">{errors.timeRange}</p>
                  )}
                </div>
              </div>
            )}

            {applyMode === 'CONTINUOUS' && (
              <div className="pt-2 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                  <div className="md:col-span-6 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                        Event Hours <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      {(eventStartTime || eventEndTime) && (
                        <button
                          type="button"
                          onClick={() => {
                            setEventStartTime('')
                            setEventEndTime('')
                          }}
                          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Reset to Full Day
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Clock className="h-3.5 w-3.5" />
                        </div>
                        <input
                          type="time"
                          value={eventStartTime}
                          onChange={(e) => setEventStartTime(e.target.value)}
                          aria-label="Event Start Time"
                          className="w-full pl-8 pr-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] h-10 shadow-2xs"
                        />
                      </div>
                      <span className="text-slate-400 font-bold">-</span>
                      <div className="relative flex-1">
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Clock className="h-3.5 w-3.5" />
                        </div>
                        <input
                          type="time"
                          value={eventEndTime}
                          onChange={(e) => setEventEndTime(e.target.value)}
                          aria-label="Event End Time"
                          className="w-full pl-8 pr-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] h-10 shadow-2xs"
                        />
                      </div>
                    </div>
                    {errors.eventTimeRange && (
                      <p className="text-[10.5px] text-rose-500 font-medium">{errors.eventTimeRange}</p>
                    )}
                  </div>

                  <div className="md:col-span-6 p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 md:mt-5">
                    <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-[#1F2B6D] dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Info className="w-3 h-3" />
                    </div>
                    <p className="leading-snug text-[11px]">
                      {eventStartTime || eventEndTime ? (
                        <>
                          Active continuously from{' '}
                          <strong className="text-slate-800 dark:text-slate-200 font-mono">
                            {eventStartTime || '00:00'}
                          </strong>{' '}
                          on start date until{' '}
                          <strong className="text-slate-800 dark:text-slate-200 font-mono">
                            {eventEndTime || '23:59'}
                          </strong>{' '}
                          on {effectiveTo ? 'Effective To' : 'Effective From'}.
                        </>
                      ) : (
                        'Leave blank to apply all day (00:00 – 23:59) across Effective From → Effective To, or enter exact event hours (e.g., 18:00 – 22:00).'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CARD 5: Validity & Status */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#1F2B6D] dark:text-white leading-tight">
                  5. Validity &amp; Status
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight">
                  Set effective duration and live state for this surge rule.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0.5 items-start">
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Effective From <span className="text-rose-500">*</span>
                </label>
                <DatePicker
                  value={effectiveFrom}
                  onChange={(val) => setEffectiveFrom(val)}
                  placeholder="Select start date"
                  iconPosition="left"
                  error={errors.effectiveFrom}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Effective To (Optional)
                </label>
                <DatePicker
                  value={effectiveTo}
                  onChange={(val) => setEffectiveTo(val)}
                  placeholder="No end date"
                  iconPosition="left"
                  error={errors.effectiveTo}
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Status
                </span>
                <div className="flex items-center gap-2.5 h-10">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isActive}
                    onClick={() => setIsActive(!isActive)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                      isActive ? 'bg-[#1F2B6D]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                        isActive ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar with Live Zone Preview & Live Server Surge Preview) */}
        <div className="lg:col-span-4 space-y-2.5 sm:space-y-3">
          <ZonePreviewCard
            zoneName={previewZoneName}
            boundary={previewBoundary}
            center={previewCenter}
          />

          <SurgeFarePreviewCard
            multiplier={multiplier}
            zoneName={previewZoneName}
            cityCode={cityCode || null}
            vehicleCode={primarySelectedVehicle?.code ?? null}
            referenceFareRule={referenceFareRule}
          />
        </div>
      </div>

      {/* Bottom Action Footer Bar */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 mt-2.5 sm:mt-3">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => navigate('/pricing-management/surge-rules')}
          className="text-xs sm:text-sm font-bold px-5 h-10 rounded-xl cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          disabled={loading}
          className="text-xs sm:text-sm font-bold px-7 h-10 rounded-xl shadow-sm cursor-pointer bg-[#1F2B6D] hover:bg-[#182255] text-white"
        >
          {loading ? 'Saving...' : isEditMode ? 'Update Surge Rule' : 'Create Surge Rule'}
        </Button>
      </div>

      <SurgeRuleConflictModal
        isOpen={conflictModalOpen}
        existingRule={conflictingActiveSurge}
        fallbackMessage={serverErrorInfo.message}
        onClose={() => setConflictModalOpen(false)}
        onEditExisting={(ruleId) => {
          setConflictModalOpen(false)
          navigate(`/pricing-management/surge-rules/${ruleId}/edit`)
        }}
      />
    </form>
  )
}

export default SurgeRuleWizardForm
