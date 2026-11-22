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
  SlidersHorizontal,
  AlertTriangle,
} from 'lucide-react'
import type { FareRule, ServiceZoneOption, CityOption } from '../types'
import { useVehicleTypes, vehicleTypeLabel } from '@/modules/geographic-management/hooks/useVehicleTypes'
import { useFareRules } from '../../hooks'
import { FareRulePreviewCard } from './FareRulePreviewCard'
import { FareRuleConflictModal } from './FareRuleConflictModal'
import { getCities, getServiceZones } from '../../api'
import DatePicker from '@/shared/components/ui/DatePicker'
import { Button } from '@/shared/components/ui/Button'

function numToInput(value: number | null | undefined): string {
  return value != null && Number.isFinite(value) ? String(value) : ''
}

function parseInputNum(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

interface FareRuleWizardFormProps {
  initialValues?: FareRule | null
  mode?: 'create' | 'edit'
  presetCityCode?: string
  presetServiceZoneId?: string
  onSubmit: (data: Omit<FareRule, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'serviceZoneName'>) => void
  loading?: boolean
  error?: unknown
}

export const FareRuleWizardForm: React.FC<FareRuleWizardFormProps> = ({
  initialValues,
  mode,
  presetCityCode,
  presetServiceZoneId,
  onSubmit,
  loading = false,
  error,
}) => {
  const navigate = useNavigate()
  const isEditMode = mode ? mode === 'edit' : Boolean(initialValues?.id)

  // 1. Basic Details (Blank on Create; pre-filled only on Edit / Duplicate / Preset)
  const { data: vehicleCatalog = [] } = useVehicleTypes()

  const [vehicleType, setVehicleType] = useState<string>(initialValues?.vehicleType ?? '')
  const [cityCode, setCityCode] = useState<string>(
    initialValues?.cityCode ?? presetCityCode ?? '',
  )
  const [serviceZoneId, setServiceZoneId] = useState<string>(
    initialValues?.serviceZoneId ?? presetServiceZoneId ?? '',
  )
  const [cities, setCities] = useState<CityOption[]>([])
  const [serviceZones, setServiceZones] = useState<ServiceZoneOption[]>([])
  const [conflictModalOpen, setConflictModalOpen] = useState<boolean>(false)

  // Query live active fare rules (limit <= 100 per backend listFareRulesQuerySchema)
  const { data: existingRulesResp } = useFareRules(
    cityCode ? { status: 'active', cityCode, limit: 100 } : { status: 'active', limit: 100 },
  )

  // 2. Fare Configuration (String-backed so Create starts genuinely empty with placeholders)
  const [baseFareStr, setBaseFareStr] = useState<string>(numToInput(initialValues?.baseFare))
  const [minimumFareStr, setMinimumFareStr] = useState<string>(numToInput(initialValues?.minimumFare))
  const [perKmRateStr, setPerKmRateStr] = useState<string>(numToInput(initialValues?.perKmRate))
  const [perMinuteRateStr, setPerMinuteRateStr] = useState<string>(
    numToInput(initialValues?.perMinuteRate),
  )

  // 3. Optional Charges (Off and blank by default on Create)
  const [waitingChargeEnabled, setWaitingChargeEnabled] = useState<boolean>(
    initialValues ? (initialValues.waitingChargePerMinute ?? 0) > 0 : false,
  )
  const [freeWaitingStr, setFreeWaitingStr] = useState<string>(
    initialValues ? numToInput(initialValues.freeWaitingMinutes) : '',
  )
  const [waitingChargeStr, setWaitingChargeStr] = useState<string>(
    initialValues ? numToInput(initialValues.waitingChargePerMinute) : '',
  )

  const [bookingFeeEnabled, setBookingFeeEnabled] = useState<boolean>(
    initialValues ? (initialValues.bookingFee ?? 0) > 0 : false,
  )
  const [bookingFeeStr, setBookingFeeStr] = useState<string>(
    initialValues && (initialValues.bookingFee ?? 0) > 0
      ? numToInput(initialValues.bookingFee)
      : '',
  )

  // 4. Validity & Status
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

  // Field validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Active vehicle choices: exclude retired unless initial rule is already on it
  const vehicleChoices = useMemo(() => {
    return vehicleCatalog.filter(
      (v) => v.isActive || v.code === initialValues?.vehicleType || v.id === initialValues?.vehicleType,
    )
  }, [vehicleCatalog, initialValues])

  // Load cities catalog
  useEffect(() => {
    void getCities()
      .then(setCities)
      .catch(() => setCities([]))
  }, [])

  // Load service zones when city changes
  useEffect(() => {
    if (!cityCode || cityCode === 'GLOBAL') {
      setServiceZones([])
      if (!presetServiceZoneId) setServiceZoneId('')
      return
    }
    void getServiceZones(cityCode)
      .then((zones) => {
        setServiceZones(zones)
        if (presetServiceZoneId && zones.some((z) => z.id === presetServiceZoneId)) {
          setServiceZoneId(presetServiceZoneId)
        }
      })
      .catch(() => setServiceZones([]))
  }, [cityCode, presetServiceZoneId])

  const baseFareNum = parseInputNum(baseFareStr)
  const minimumFareNum = parseInputNum(minimumFareStr)
  const perKmRateNum = parseInputNum(perKmRateStr)
  const perMinuteRateNum = parseInputNum(perMinuteRateStr)
  const freeWaitingNum = parseInputNum(freeWaitingStr)
  const waitingChargeNum = parseInputNum(waitingChargeStr)
  const bookingFeeNum = parseInputNum(bookingFeeStr)

  const isPreviewReady =
    baseFareNum !== null &&
    minimumFareNum !== null &&
    perKmRateNum !== null &&
    perMinuteRateNum !== null

  // Detect existing active fare rule for the exact same (Vehicle + City + Service Zone) on Create
  const conflictingActiveRule = useMemo(() => {
    if (isEditMode || !vehicleType || !cityCode) return null
    const allRules = existingRulesResp?.data ?? []
    const targetZone = serviceZoneId || null
    const newFromMs = effectiveFrom ? new Date(effectiveFrom).getTime() : Date.now()
    const newToMs = effectiveTo ? new Date(effectiveTo).getTime() : Number.POSITIVE_INFINITY

    return (
      allRules.find((r) => {
        if (r.status !== 'active') return false
        if (r.vehicleType.toUpperCase() !== vehicleType.toUpperCase()) return false
        if ((r.cityCode || 'GLOBAL').toUpperCase() !== cityCode.toUpperCase()) return false
        if ((r.serviceZoneId ?? null) !== targetZone) return false
        const rService = (r.serviceType ?? 'instant').toLowerCase()
        if (rService !== 'instant') return false
        const rFromMs = new Date(r.effectiveFrom).getTime()
        const rToMs = r.effectiveTo ? new Date(r.effectiveTo).getTime() : Number.POSITIVE_INFINITY
        return rToMs > newFromMs && rFromMs < newToMs
      }) ?? null
    )
  }, [isEditMode, vehicleType, cityCode, serviceZoneId, effectiveFrom, effectiveTo, existingRulesResp?.data])

  // Synthesize display rule name preview matching server toDto logic
  const selectedZone = serviceZones.find((z) => z.id === serviceZoneId)
  const syntheticRuleName = useMemo(() => {
    const parts = [vehicleType || 'VEHICLE', cityCode || 'GLOBAL']
    parts.push('Instant')
    if (selectedZone) parts.push(selectedZone.name)
    return parts.join(' · ')
  }, [vehicleType, cityCode, selectedZone])

  const validate = (): boolean => {
    const errs: Record<string, string> = {}

    if (!vehicleType) errs.vehicleType = 'Select a vehicle type.'
    if (!cityCode) errs.cityCode = 'Select a city or All Cities (Global).'

    if (baseFareNum === null) errs.baseFare = 'Base fare is required.'
    else if (baseFareNum < 0) errs.baseFare = 'Base fare cannot be negative.'

    if (minimumFareNum === null) errs.minimumFare = 'Minimum fare is required.'
    else if (minimumFareNum < 0) errs.minimumFare = 'Minimum fare cannot be negative.'
    else if (baseFareNum !== null && minimumFareNum < baseFareNum) {
      errs.minimumFare = 'Minimum fare must be greater than or equal to Base fare.'
    }

    if (perKmRateNum === null) errs.perKmRate = 'Per Km rate is required.'
    else if (perKmRateNum < 0) errs.perKmRate = 'Per Km rate cannot be negative.'

    if (perMinuteRateNum === null) errs.perMinuteRate = 'Per minute rate is required.'
    else if (perMinuteRateNum < 0) errs.perMinuteRate = 'Per minute rate cannot be negative.'

    if (waitingChargeEnabled) {
      if (freeWaitingNum === null) errs.freeWaitingMinutes = 'Free waiting minutes required.'
      else if (freeWaitingNum < 0) errs.freeWaitingMinutes = 'Cannot be negative.'
      if (waitingChargeNum === null) errs.waitingChargePerMinute = 'Waiting charge required.'
      else if (waitingChargeNum < 0) errs.waitingChargePerMinute = 'Cannot be negative.'
    }

    if (bookingFeeEnabled) {
      if (bookingFeeNum === null) errs.bookingFee = 'Enter a booking fee amount.'
      else if (bookingFeeNum < 0) errs.bookingFee = 'Booking fee cannot be negative.'
    }

    if (!effectiveFrom) {
      errs.effectiveFrom = 'Effective From start date is required.'
    }
    if (effectiveTo && effectiveTo < effectiveFrom) {
      errs.effectiveTo = 'Effective To date cannot be earlier than Effective From date.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEditMode && isActive && conflictingActiveRule) {
      setConflictModalOpen(true)
      return
    }
    if (!validate()) return

    onSubmit({
      ruleName: syntheticRuleName,
      vehicleType,
      cityCode,
      serviceType: 'instant',
      serviceZoneId: serviceZoneId || null,
      baseFare: baseFareNum!,
      minimumFare: minimumFareNum!,
      perKmRate: perKmRateNum!,
      perMinuteRate: perMinuteRateNum!,
      freeWaitingMinutes: waitingChargeEnabled ? (freeWaitingNum ?? 0) : 0,
      waitingChargePerMinute: waitingChargeEnabled ? (waitingChargeNum ?? 0) : 0,
      bookingFee: bookingFeeEnabled ? (bookingFeeNum ?? 0) : 0,
      platformFeePct: 0,
      platformFeeFlat: 0, // no hidden flat fee; passenger fixed charges use optional Booking Fee
      taxRatePct: null, // resolved live from Tax & Commission
      commissionRatePct: null, // managed centrally in Tax & Commission
      status: isActive ? 'active' : 'inactive',
      effectiveFrom: new Date(effectiveFrom).toISOString(),
      effectiveTo: effectiveTo ? new Date(effectiveTo).toISOString() : undefined,
    })
  }

  const serverErrorInfo = useMemo(() => {
    if (!error) return { code: null as string | null, message: null as string | null }
    const maybe = error as {
      response?: { status?: number; data?: { error?: { code?: string; message?: string }; message?: string } }
      message?: string
    }
    const code = maybe?.response?.data?.error?.code ?? null
    const status = maybe?.response?.status ?? null
    const message =
      maybe?.response?.data?.error?.message ||
      maybe?.response?.data?.message ||
      (error instanceof Error ? error.message : null)
    const isConflict = status === 409 || code === 'FARE_RULE_CONFLICT'
    return { code: isConflict ? 'FARE_RULE_CONFLICT' : code, message }
  }, [error])

  useEffect(() => {
    if (serverErrorInfo.code === 'FARE_RULE_CONFLICT') {
      setConflictModalOpen(true)
    }
  }, [serverErrorInfo.code, error])

  const serverErrorMessage =
    serverErrorInfo.code === 'FARE_RULE_CONFLICT' ? null : serverErrorInfo.message

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5 text-left">
      {/* Server Error Alert Banner */}
      {serverErrorMessage && (
        <div className="p-3 mb-2 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Submission Error:</span>
            <p className="mt-0.5 leading-relaxed">{serverErrorMessage}</p>
          </div>
        </div>
      )}

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 lg:gap-4 items-start">
        {/* Left Column (5 Stacked Cards) */}
        <div className="lg:col-span-8 space-y-2.5 sm:space-y-3">
          {/* CARD 1: Basic Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
            {/* Header matching Geographic & Driver Management */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#1F2B6D] dark:text-white leading-tight">Basic Details</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight">
                  Choose vehicle, city and service zone for this fare rule.
                </p>
              </div>
            </div>

            {/* Inputs: 3 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-0.5">
              {/* Vehicle Type */}
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Vehicle Type <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Car className="h-4 w-4" />
                  </div>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] appearance-none h-10 shadow-2xs cursor-pointer"
                  >
                    <option value="" disabled>Select vehicle...</option>
                    {vehicleChoices.map((v) => (
                      <option key={v.id} value={v.code}>
                        {vehicleTypeLabel(v)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
                {errors.vehicleType && (
                  <p className="text-[10.5px] text-rose-500 font-medium">{errors.vehicleType}</p>
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
                    onChange={(e) => setCityCode(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] appearance-none h-10 shadow-2xs cursor-pointer"
                  >
                    <option value="" disabled>Select city...</option>
                    <option value="GLOBAL">All Cities (Global)</option>
                    {cities.map((c) => (
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

              {/* Service Zone */}
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Service Zone <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Map className="h-4 w-4" />
                  </div>
                  <select
                    value={serviceZoneId}
                    onChange={(e) => setServiceZoneId(e.target.value)}
                    disabled={!cityCode || cityCode === 'GLOBAL' || serviceZones.length === 0}
                    className="w-full pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] appearance-none h-10 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!cityCode
                        ? 'Select a city first'
                        : cityCode === 'GLOBAL'
                          ? 'Global (All Zones)'
                          : 'All Zones (Citywide)'}
                    </option>
                    {serviceZones.map((z) => (
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

            {/* Live Duplicate Active Rule Guard Banner */}
            {conflictingActiveRule && isActive && (
              <div className="mt-2 p-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 dark:text-amber-200 space-y-0.5 min-w-0">
                    <p className="font-bold">
                      Active fare rule already exists for this vehicle &amp; location (v{conflictingActiveRule.version})
                    </p>
                    <p className="text-[11.5px] text-amber-800/90 dark:text-amber-300/90 leading-snug">
                      Current live tariff: <strong>₹{conflictingActiveRule.baseFare}</strong> base ·{' '}
                      <strong>₹{conflictingActiveRule.minimumFare}</strong> min ·{' '}
                      <strong>₹{conflictingActiveRule.perKmRate}/km</strong> ·{' '}
                      <strong>₹{conflictingActiveRule.perMinuteRate}/min</strong>. Edit the existing rule to create{' '}
                      <strong>v{conflictingActiveRule.version + 1}</strong> cleanly, or pick a different zone/vehicle.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/pricing-management/fare-rules/${conflictingActiveRule.id}/edit`)}
                  className="shrink-0 bg-[#1F2B6D] hover:bg-[#182258] text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer whitespace-nowrap"
                >
                  Edit Existing Rule →
                </button>
              </div>
            )}
          </div>

          {/* CARD 2: Fare Configuration */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
            {/* Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 font-bold text-[#1F2B6D] dark:text-blue-400 text-sm font-mono">
                ₹
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#1F2B6D] dark:text-white leading-tight">Fare Configuration</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight">
                  Set the core fare components to calculate the ride amount.
                </p>
              </div>
            </div>

            {/* Inputs: 4 Columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-0.5">
              {/* Base Fare */}
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Base Fare <span className="text-rose-500">*</span>
                  </label>
                  <span title="Initial fee charged at the start of every trip." className="cursor-help text-slate-400 hover:text-slate-600">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-bold text-slate-500 font-mono pointer-events-none select-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={baseFareStr}
                    placeholder="e.g., 40"
                    onChange={(e) => setBaseFareStr(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] h-10 shadow-2xs transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                {errors.baseFare && (
                  <p className="text-[10.5px] text-rose-500 font-medium">{errors.baseFare}</p>
                )}
              </div>

              {/* Minimum Fare */}
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Minimum Fare <span className="text-rose-500">*</span>
                  </label>
                  <span title="The minimum subtotal below which the fare cannot fall." className="cursor-help text-slate-400 hover:text-slate-600">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-bold text-slate-500 font-mono pointer-events-none select-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={minimumFareStr}
                    placeholder="e.g., 60"
                    onChange={(e) => setMinimumFareStr(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] h-10 shadow-2xs transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                {errors.minimumFare && (
                  <p className="text-[10.5px] text-rose-500 font-medium">{errors.minimumFare}</p>
                )}
              </div>

              {/* Per Km Rate */}
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Per Km Rate <span className="text-rose-500">*</span>
                  </label>
                  <span title="Tariff billed per kilometer traveled." className="cursor-help text-slate-400 hover:text-slate-600">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono pointer-events-none select-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={perKmRateStr}
                    placeholder="e.g., 12"
                    onChange={(e) => setPerKmRateStr(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full pl-8 pr-11 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] h-10 shadow-2xs transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium pointer-events-none select-none">
                    /km
                  </span>
                </div>
                {errors.perKmRate && (
                  <p className="text-[10.5px] text-rose-500 font-medium">{errors.perKmRate}</p>
                )}
              </div>

              {/* Per Minute Rate */}
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Per Minute Rate <span className="text-rose-500">*</span>
                  </label>
                  <span title="Tariff billed per minute of ride duration." className="cursor-help text-slate-400 hover:text-slate-600">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono pointer-events-none select-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={perMinuteRateStr}
                    placeholder="e.g., 1.5"
                    onChange={(e) => setPerMinuteRateStr(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full pl-8 pr-11 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] h-10 shadow-2xs transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium pointer-events-none select-none">
                    /min
                  </span>
                </div>
                {errors.perMinuteRate && (
                  <p className="text-[10.5px] text-rose-500 font-medium">{errors.perMinuteRate}</p>
                )}
              </div>
            </div>
          </div>

          {/* CARD 3: Optional Charges */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
            {/* Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <SlidersHorizontal className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#1F2B6D] dark:text-white leading-tight">Optional Charges</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight">
                  Enable or disable additional charges for this fare rule.
                </p>
              </div>
            </div>

            {/* 2 Sub-boxes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-0.5">
              {/* Box 1: Waiting Charge */}
              <div className="border border-slate-200/90 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  {/* Custom Switch Button matching Geographic */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={waitingChargeEnabled}
                    onClick={() => setWaitingChargeEnabled(!waitingChargeEnabled)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                      waitingChargeEnabled ? 'bg-[#1F2B6D]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                        waitingChargeEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-slate-100 leading-tight">Waiting Charge</span>
                      <span title="Fee applied when passenger makes captain wait beyond the free period." className="cursor-help text-slate-400 hover:text-slate-600">
                        <Info className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-400 dark:text-slate-400 leading-tight">
                      Charge when driver waits after free time.
                    </p>
                  </div>
                </div>

                {/* Sub-inputs */}
                <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                      Free Waiting
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        disabled={!waitingChargeEnabled}
                        value={freeWaitingStr}
                        placeholder="e.g., 3"
                        onChange={(e) => setFreeWaitingStr(e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-full h-9 pl-3 pr-10 py-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none select-none">
                        min
                      </span>
                    </div>
                    {errors.freeWaitingMinutes && (
                      <p className="text-[10.5px] text-rose-500 font-medium">{errors.freeWaitingMinutes}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                      Charge
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono pointer-events-none select-none">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        disabled={!waitingChargeEnabled}
                        value={waitingChargeStr}
                        placeholder="e.g., 2"
                        onChange={(e) => setWaitingChargeStr(e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-full h-9 pl-7 pr-11 py-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 pointer-events-none select-none">
                        /min
                      </span>
                    </div>
                    {errors.waitingChargePerMinute && (
                      <p className="text-[10.5px] text-rose-500 font-medium">{errors.waitingChargePerMinute}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Box 2: Booking Fee */}
              <div className="border border-slate-200/90 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  {/* Custom Switch Button matching Geographic */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={bookingFeeEnabled}
                    onClick={() => setBookingFeeEnabled(!bookingFeeEnabled)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                      bookingFeeEnabled ? 'bg-[#1F2B6D]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                        bookingFeeEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-slate-100 leading-tight">Booking Fee</span>
                      <span title="Fixed booking fee applied per ride." className="cursor-help text-slate-400 hover:text-slate-600">
                        <Info className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight">
                      Additional fixed charge per ride.
                    </p>
                  </div>
                </div>

                {/* Sub-input */}
                <div className="pt-0.5 space-y-1">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono pointer-events-none select-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      disabled={!bookingFeeEnabled}
                      value={bookingFeeStr}
                      placeholder="e.g., 10"
                      onChange={(e) => setBookingFeeStr(e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full h-9 pl-7 pr-3 py-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  {errors.bookingFee && (
                    <p className="text-[10.5px] text-rose-500 font-medium">{errors.bookingFee}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CARD 4: Validity & Status */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
            {/* Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#1F2B6D] dark:text-white leading-tight">Validity & Status</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight">
                  Set the effective period and status for this fare rule.
                </p>
              </div>
            </div>

            {/* Inputs: 3 items (items-start for clean top alignment) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0.5 items-start">
              {/* Effective From with Shared DatePicker */}
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Effective From <span className="text-rose-500">*</span>
                </label>
                <DatePicker
                  value={effectiveFrom}
                  onChange={(val) => setEffectiveFrom(val)}
                  placeholder="01 Jan 2026"
                  iconPosition="left"
                  error={errors.effectiveFrom}
                />
              </div>

              {/* Effective To with Shared DatePicker */}
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Effective To
                </label>
                <DatePicker
                  value={effectiveTo}
                  onChange={(val) => setEffectiveTo(val)}
                  placeholder="Select date (optional)"
                  iconPosition="left"
                  error={errors.effectiveTo}
                />
              </div>

              {/* Status Toggle matching Geographic */}
              <div className="space-y-1">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 block">Status</span>
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

        {/* Right Column (Sidebar with Fare Preview & Quick Info) */}
        <div className="lg:col-span-4 space-y-2.5 sm:space-y-3">
          <FareRulePreviewCard
            baseFare={baseFareNum ?? 0}
            minimumFare={minimumFareNum ?? 0}
            perKmRate={perKmRateNum ?? 0}
            perMinuteRate={perMinuteRateNum ?? 0}
            freeWaitingMinutes={freeWaitingNum ?? 0}
            waitingChargePerMinute={waitingChargeNum ?? 0}
            bookingFee={bookingFeeNum ?? 0}
            waitingChargeEnabled={waitingChargeEnabled}
            bookingFeeEnabled={bookingFeeEnabled}
            platformFeeFlat={0}
            cityCode={cityCode || null}
            serviceZoneId={serviceZoneId || null}
            vehicleType={vehicleType || null}
            isReady={isPreviewReady}
          />
        </div>
      </div>

      {/* Bottom Action Footer Bar with Custom Theme Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 mt-2.5 sm:mt-3">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => navigate('/pricing-management/fare-rules')}
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
          {loading ? 'Saving...' : isEditMode ? 'Update Fare Rule' : 'Create Fare Rule'}
        </Button>
      </div>

      {/* Custom Production Conflict Popup */}
      <FareRuleConflictModal
        isOpen={conflictModalOpen}
        existingRule={conflictingActiveRule}
        fallbackMessage={serverErrorInfo.message}
        onClose={() => setConflictModalOpen(false)}
        onEditExisting={(ruleId) => {
          setConflictModalOpen(false)
          navigate(`/pricing-management/fare-rules/${ruleId}/edit`)
        }}
      />
    </form>
  )
}

export default FareRuleWizardForm
