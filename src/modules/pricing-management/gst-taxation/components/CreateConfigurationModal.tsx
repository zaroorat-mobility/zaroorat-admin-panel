import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeft,
  Percent,
  Layers,
  Coins,
  Tag,
  Sliders,
  Calculator,
  Info,
  CheckCircle2,
  Car,
  MapPin,
  Calendar,
  Check,
  X,
  ChevronDown,
  Shield,
  Clock,
  Zap,
  Rocket,
} from 'lucide-react'
import DatePicker from '@/shared/components/ui/DatePicker'
import {
  vehicleTypeLabel,
  type VehicleTypeDto,
} from '@/modules/geographic-management/hooks/useVehicleTypes'
import { DynamicVehicleSelector } from '../../components/DynamicVehicleSelector'
import type { TaxCommissionItem } from '../types'

interface CreateConfigurationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: Omit<TaxCommissionItem, 'id' | 'createdAt'>) => void
  initialValues?: TaxCommissionItem | null
  vehicleOptions?: VehicleTypeDto[]
  cityOptions?: Array<{ code: string; name: string }>
  zoneOptions?: Array<{ id: string; name: string; cityCode: string }>
}

// Helper to convert formatted date like "16 Nov 2026" or "1 Dec 2026" or ISO "2026-11-16" to "YYYY-MM-DD"
function toIsoDate(str: string): string {
  if (!str) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  const parsed = new Date(str)
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear()
    const m = String(parsed.getMonth() + 1).padStart(2, '0')
    const d = String(parsed.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return ''
}

// Helper to convert "YYYY-MM-DD" to human readable "16 Nov 2026"
function toDisplayDate(iso: string): string {
  if (!iso) return ''
  const parts = iso.split('-').map(Number)
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return iso
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Helper to convert time like "12:00 AM" or "02:30 PM" to "HH:mm" (24h)
function toIsoTime(str: string): string {
  if (!str) return '00:00'
  if (/^\d{2}:\d{2}$/.test(str)) return str
  const match = str.match(/(\d+):(\d+)\s*(AM|PM)?/i)
  if (!match) return '00:00'
  let hours = parseInt(match[1], 10)
  const minutes = match[2]
  const modifier = match[3] ? match[3].toUpperCase() : null
  if (modifier === 'PM' && hours < 12) hours += 12
  if (modifier === 'AM' && hours === 12) hours = 0
  return `${String(hours).padStart(2, '0')}:${minutes}`
}

// Helper to convert "HH:mm" (24h) to "hh:mm AM/PM"
function toDisplayTime(isoTime: string): string {
  if (!isoTime) return '12:00 AM'
  if (/\b(AM|PM)\b/i.test(isoTime)) return isoTime.trim().replace(/\s+/g, ' ').toUpperCase()
  const [hStr, mStr] = isoTime.split(':')
  let hours = parseInt(hStr, 10)
  const minutes = (mStr || '00').replace(/\D/g, '').padStart(2, '0').slice(0, 2)
  if (isNaN(hours)) return isoTime
  const modifier = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${hours < 10 ? '0' : ''}${hours}:${minutes} ${modifier}`
}

export const CreateConfigurationModal: React.FC<CreateConfigurationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialValues,
  vehicleOptions = [],
  cityOptions = [],
  zoneOptions = [],
}) => {
  const activeVehicles = React.useMemo(
    () =>
      vehicleOptions
        .filter((v) => v.isActive)
        .slice()
        .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999) || a.name.localeCompare(b.name)),
    [vehicleOptions],
  )

  const allVehicleIds = React.useMemo(() => activeVehicles.map((v) => v.id), [activeVehicles])

  const availableCityNames = React.useMemo(() => {
    const live = cityOptions
      .filter((c) => c.code.toUpperCase() !== 'GLOBAL')
      .map((c) => c.name)
    return live.length > 0 ? live : []
  }, [cityOptions])

  const [currentStep, setCurrentStep] = useState<number>(1)
  const [stepError, setStepError] = useState<string | null>(null)

  // Step 1: Rates State (Blank on Create; pre-filled only on Edit)
  const [commissionRateStr, setCommissionRateStr] = useState<string>(
    initialValues?.commissionRate != null ? String(initialValues.commissionRate) : '',
  )
  const [commissionEnabled, setCommissionEnabled] = useState<boolean>(true)
  const [gstRateStr, setGstRateStr] = useState<string>(
    initialValues?.gstRate != null ? String(initialValues.gstRate) : '',
  )
  const [gstEnabled, setGstEnabled] = useState<boolean>(true)
  const [applyOnBookingFee, setApplyOnBookingFee] = useState<boolean>(
    initialValues?.includeBookingFee ?? false,
  )
  const [roundOffDeduction, setRoundOffDeduction] = useState<boolean>(
    initialValues?.roundOffRupee ?? false,
  )

  // Step 2: Applicability State (keyed strictly by live PostgreSQL vehicleTypeId UUIDs)
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>(allVehicleIds)
  const [geographicScope, setGeographicScope] = useState<
    'ALL_CITIES' | 'SELECTED_CITIES'
  >('ALL_CITIES')
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [selectedZones, setSelectedZones] = useState<string[]>([])
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false)
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false)
  const cityTriggerRef = useRef<HTMLDivElement>(null)
  const zoneTriggerRef = useRef<HTMLDivElement>(null)
  const [cityMenuRect, setCityMenuRect] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null)
  const [zoneMenuRect, setZoneMenuRect] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null)

  useLayoutEffect(() => {
    if (!isCityDropdownOpen) {
      setCityMenuRect(null)
      return
    }
    const update = () => {
      const el = cityTriggerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const spaceBelow = Math.max(140, window.innerHeight - rect.bottom - 16)
      setCityMenuRect({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(260, spaceBelow),
      })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [isCityDropdownOpen, selectedCities.length])

  useLayoutEffect(() => {
    if (!isZoneDropdownOpen) {
      setZoneMenuRect(null)
      return
    }
    const update = () => {
      const el = zoneTriggerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const spaceBelow = Math.max(140, window.innerHeight - rect.bottom - 16)
      setZoneMenuRect({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(260, spaceBelow),
      })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [isZoneDropdownOpen, selectedZones.length])

  // Step 3: Rules & Schedule State
  const [effectiveFromDate, setEffectiveFromDate] = useState<string>(() => {
    return new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  })
  const [effectiveFromTime, setEffectiveFromTime] = useState<string>('12:00 AM')
  const [effectiveToDate, setEffectiveToDate] = useState<string>('')
  const [noEndDate, setNoEndDate] = useState<boolean>(true)
  const [isConfirmed, setIsConfirmed] = useState<boolean>(true)

  // Synchronize initial values and lock window scroll when opened
  useEffect(() => {
    if (isOpen) {
      window.scrollTo(0, 0)
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      const defaultDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })

      setCurrentStep(1)
      setStepError(null)
      setCommissionRateStr(
        initialValues?.commissionRate != null ? String(initialValues.commissionRate) : '',
      )
      setCommissionEnabled(true)
      setGstRateStr(initialValues?.gstRate != null ? String(initialValues.gstRate) : '')
      setGstEnabled(true)
      setApplyOnBookingFee(initialValues?.includeBookingFee ?? false)
      setRoundOffDeduction(initialValues?.roundOffRupee ?? false)

      // Populate selectedVehicleIds strictly from live PostgreSQL UUIDs (blank on Create; pre-filled on Edit)
      if (!initialValues) {
        setSelectedVehicleIds([])
      } else {
        const initIds = (initialValues.applicableVehicleIds ?? []).filter(Boolean)
        if (initIds.length > 0) {
          setSelectedVehicleIds(initIds)
        } else {
          const rawNames = (initialValues.applicableVehicles ?? []).filter(
            (v) => v && v.toLowerCase() !== 'all vehicles',
          )
          const matched = rawNames
            .map((label) => {
              const norm = label.toLowerCase().trim()
              return activeVehicles.find(
                (v) =>
                  vehicleTypeLabel(v).toLowerCase() === norm ||
                  v.name.toLowerCase() === norm ||
                  v.code.toLowerCase() === norm,
              )?.id
            })
            .filter((id): id is string => Boolean(id))
          setSelectedVehicleIds(matched.length > 0 ? matched : allVehicleIds)
        }
      }

      const rawInitCities = (initialValues?.applicableCities ?? []).filter(
        (c) => c && c.toLowerCase() !== 'all cities',
      )
      if (!initialValues || rawInitCities.length === 0) {
        setGeographicScope('ALL_CITIES')
        setSelectedCities([])
      } else {
        setGeographicScope('SELECTED_CITIES')
        setSelectedCities(rawInitCities)
      }

      const rawInitZones = (initialValues?.applicableZones ?? []).filter(
        (z) => z && z.toLowerCase() !== 'all zones',
      )
      setSelectedZones(rawInitZones)
      setEffectiveFromDate(
        initialValues?.effectiveFrom
          ? initialValues.effectiveFrom.split(',')[0].trim()
          : defaultDate,
      )
      setEffectiveFromTime('12:00 AM')
      setEffectiveToDate(initialValues?.effectiveTo ?? '')
      setNoEndDate(!initialValues?.effectiveTo)
      setIsConfirmed(true)

      return () => {
        document.body.style.overflow = prevOverflow
      }
    }
  }, [isOpen, initialValues, allVehicleIds, activeVehicles])

  if (!isOpen) return null

  // Computed values
  const parsedCommission =
    commissionRateStr.trim() !== '' && Number.isFinite(Number(commissionRateStr))
      ? Number(commissionRateStr)
      : null
  const parsedGst =
    gstRateStr.trim() !== '' && Number.isFinite(Number(gstRateStr))
      ? Number(gstRateStr)
      : null
  const effectiveCommission = commissionEnabled ? (parsedCommission ?? 0) : 0
  const effectiveGst = gstEnabled ? (parsedGst ?? 0) : 0
  const totalDeduction = Number((effectiveCommission + effectiveGst).toFixed(2))

  // Example calculation for a ₹1,000 ride
  const sampleRideBase = 1000
  const sampleGstAmount = (sampleRideBase * effectiveGst) / 100
  const sampleCustomerPays = sampleRideBase + sampleGstAmount
  const sampleCommissionDeduction = (sampleRideBase * effectiveCommission) / 100
  const sampleGstDeduction = sampleGstAmount
  const rawDriverEarning = sampleCustomerPays - sampleCommissionDeduction - sampleGstDeduction
  const sampleDriverEarning = roundOffDeduction ? Math.round(rawDriverEarning) : rawDriverEarning

  const handleNext = () => {
    if (currentStep === 1) {
      if (commissionEnabled && (parsedCommission === null || parsedCommission < 0 || parsedCommission > 50)) {
        setStepError('Enter a valid Platform Commission rate between 0% and 50%.')
        return
      }
      if (gstEnabled && (parsedGst === null || parsedGst < 0 || parsedGst > 28)) {
        setStepError('Enter a valid Ride GST Recovery rate between 0% and 28%.')
        return
      }
    }
    if (currentStep === 2) {
      if (selectedVehicleIds.length === 0) {
        setStepError('Select at least one vehicle type (or click Select All).')
        return
      }
      if (geographicScope === 'SELECTED_CITIES' && selectedCities.length === 0) {
        setStepError('Select at least one city, or switch to All Cities.')
        return
      }
    }
    setStepError(null)
    if (currentStep < 4) setCurrentStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setStepError(null)
    if (currentStep > 1) setCurrentStep((prev) => prev - 1)
    else onClose()
  }

  const selectedVehicleObjects = vehicleOptions.filter((v) => selectedVehicleIds.includes(v.id))
  const allVehiclesSelected =
    allVehicleIds.length > 0 && allVehicleIds.every((id) => selectedVehicleIds.includes(id))
  const selectedVehicleLabels = selectedVehicleObjects.map((v) => vehicleTypeLabel(v))

  const handleFinish = (e?: React.FormEvent, isDraft = false) => {
    if (e) e.preventDefault()
    const isAll = selectedVehicleIds.length === 0 || allVehiclesSelected
    const finalVehicles = isAll ? ['All Vehicles'] : selectedVehicleLabels
    const finalVehicleIds = isAll ? [] : selectedVehicleIds
    const finalCities =
      geographicScope === 'ALL_CITIES'
        ? ['All Cities']
        : selectedCities.filter((c) => c.toLowerCase() !== 'all cities')
    const finalZones =
      selectedZones.length === 0
        ? ['All Zones']
        : selectedZones.filter((z) => z.toLowerCase() !== 'all zones')

    onSave({
      version: initialValues?.version || 'v1',
      isCurrent: !isDraft,
      commissionRate: effectiveCommission,
      gstRate: effectiveGst,
      totalDeduction,
      applicableVehicles: finalVehicles,
      applicableVehicleIds: finalVehicleIds,
      applicableCities: finalCities.length > 0 ? finalCities : ['All Cities'],
      applicableZones: finalZones,
      effectiveFrom: `${toDisplayDate(effectiveFromDate)}, ${toDisplayTime(effectiveFromTime)}`,
      effectiveTo: noEndDate ? null : (effectiveToDate.trim() ? toDisplayDate(effectiveToDate.trim()) : null),
      applicationRule: 'Apply to new rides (rides accepted after effective date)',
      includeBookingFee: applyOnBookingFee,
      roundOffRupee: roundOffDeduction,
      status: isDraft ? 'inactive' : 'active',
    })
  }

  const toggleCity = (c: string) => {
    setSelectedCities((prev) => {
      const cleaned = prev.filter((item) => item.toLowerCase() !== 'all cities')
      const next = cleaned.includes(c) ? cleaned.filter((item) => item !== c) : [...cleaned, c]
      const nextCodes = new Set(
        cityOptions
          .filter((city) => next.includes(city.name))
          .map((city) => city.code.toUpperCase()),
      )
      setSelectedZones((prevZones) =>
        prevZones.filter((zName) => {
          const match = zoneOptions.find((z) => z.name === zName)
          return match ? nextCodes.has(match.cityCode.toUpperCase()) : false
        }),
      )
      if (next.length === 0) {
        setIsZoneDropdownOpen(false)
      }
      return next
    })
  }

  const toggleZone = (z: string) => {
    setSelectedZones((prev) => {
      const cleaned = prev.filter((item) => item.toLowerCase() !== 'all zones')
      return cleaned.includes(z) ? cleaned.filter((item) => item !== z) : [...cleaned, z]
    })
  }

  // Render via portal directly into document.body to prevent parent container layout shifts
  return createPortal(
    <div className="fixed inset-0 z-[100] m-0 p-2 sm:p-4 md:p-6 bg-black/65 backdrop-blur-xs flex items-center justify-center overflow-hidden">
      {/* Backdrop click dismiss */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Dialog Container */}
      <div
        className="relative z-10 w-full max-w-[96vw] sm:max-w-[94vw] md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1420px] bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150"
        style={{ height: 'min(94dvh, 880px)' }}
      >
        {/* ─── Top Header (Matching Geographic Management Standards) ─────── */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-7 lg:px-8 pt-4 sm:pt-5 pb-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-2xs cursor-pointer"
              title={currentStep > 1 ? 'Back to previous step' : 'Cancel and close'}
            >
              <ArrowLeft className="w-5 h-5 text-slate-800 dark:text-slate-200" strokeWidth={2.2} />
            </button>
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Create New Configuration
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Configure deduction rates, applicability, rules and activate.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* ─── Stepper Progress Bar (Matching Geographic Management) ─────── */}
        <div className="shrink-0 px-5 sm:px-7 lg:px-8 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-between min-w-[560px] sm:min-w-0 gap-2">
            {/* Step 1 */}
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep > 1
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : currentStep === 1
                    ? 'bg-[#1F2B6D] text-white shadow-xs'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
              >
                {currentStep > 1 ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : 1}
              </div>
              <span
                className={`text-xs sm:text-sm font-bold ${currentStep >= 1
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-400 dark:text-slate-500'
                  }`}
              >
                Configure Rates
              </span>
            </div>

            <div
              className={`flex-1 h-[2px] mx-3 transition-colors ${currentStep >= 2 ? 'bg-[#1F2B6D]' : 'bg-slate-200 dark:bg-slate-800'
                }`}
            />

            {/* Step 2 */}
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep > 2
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : currentStep === 2
                    ? 'bg-[#1F2B6D] text-white shadow-xs ring-4 ring-blue-500/10'
                    : 'border border-slate-300 dark:border-slate-700 text-slate-500 bg-white dark:bg-slate-800'
                  }`}
              >
                {currentStep > 2 ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : 2}
              </div>
              <span
                className={`text-xs sm:text-sm font-bold ${currentStep === 2
                  ? 'text-[#1F2B6D] dark:text-blue-400'
                  : currentStep > 2
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-400 dark:text-slate-500'
                  }`}
              >
                Applicability
              </span>
            </div>

            <div
              className={`flex-1 h-[2px] mx-3 transition-colors ${currentStep >= 3 ? 'bg-[#1F2B6D]' : 'bg-slate-200 dark:bg-slate-800'
                }`}
            />

            {/* Step 3 */}
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep > 3
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : currentStep === 3
                    ? 'bg-[#1F2B6D] text-white shadow-xs ring-4 ring-blue-500/10'
                    : 'border border-slate-300 dark:border-slate-700 text-slate-500 bg-white dark:bg-slate-800'
                  }`}
              >
                {currentStep > 3 ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : 3}
              </div>
              <span
                className={`text-xs sm:text-sm font-bold ${currentStep === 3
                  ? 'text-[#1F2B6D] dark:text-blue-400'
                  : currentStep > 3
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-400 dark:text-slate-500'
                  }`}
              >
                Rules & Schedule
              </span>
            </div>

            <div
              className={`flex-1 h-[2px] mx-3 transition-colors ${currentStep >= 4 ? 'bg-[#1F2B6D]' : 'bg-slate-200 dark:bg-slate-800'
                }`}
            />

            {/* Step 4 */}
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep === 4
                  ? 'bg-[#1F2B6D] text-white shadow-xs ring-4 ring-blue-500/10'
                  : 'border border-slate-300 dark:border-slate-700 text-slate-500 bg-white dark:bg-slate-800'
                  }`}
              >
                4
              </div>
              <span
                className={`text-xs sm:text-sm font-bold ${currentStep === 4
                  ? 'text-[#1F2B6D] dark:text-blue-400'
                  : 'text-slate-400 dark:text-slate-500'
                  }`}
              >
                Review & Activate
              </span>
            </div>
          </div>
        </div>

        {/* ─── Scrollable Content Area (Flex-1) ──────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 lg:px-8 py-5 sm:py-6 bg-[#F8F9FD] dark:bg-slate-950 space-y-6">
          {stepError && (
            <div className="px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs sm:text-sm font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{stepError}</span>
            </div>
          )}
          {/* ─── STEP 1: CONFIGURE RATES ─────────────────────────────── */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
              {/* Left Column (7 cols): Rates and Options */}
              <div className="lg:col-span-7 xl:col-span-7 space-y-4">
                {/* Card 1: Configure Deduction Rates */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 lg:p-7 shadow-xs space-y-5">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Percent className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                        Configure Deduction Rates
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                        Set platform commission and ride GST recovery rates for driver wallet deduction.
                      </p>
                    </div>
                  </div>

                  {/* Rate Row 1: Platform Commission */}
                  <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#1F2B6D] dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            Platform Commission
                          </span>
                          <span title="Commission charged to driver per completed trip." className="cursor-help">
                            <Info className="w-3.5 h-3.5 text-slate-400" />
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Zaroorat platform commission per completed ride.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Rate Input */}
                      <div className="relative w-28 sm:w-32">
                        <input
                          type="number"
                          min="0"
                          max="50"
                          step="0.5"
                          disabled={!commissionEnabled}
                          value={commissionRateStr}
                          placeholder="e.g., 7.0"
                          onChange={(e) => {
                            setCommissionRateStr(e.target.value)
                            setStepError(null)
                          }}
                          className="w-full pl-3.5 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] h-10 sm:h-11 shadow-2xs transition disabled:opacity-50"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono pointer-events-none select-none">
                          %
                        </span>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={commissionEnabled}
                        onClick={() => setCommissionEnabled(!commissionEnabled)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${commissionEnabled ? 'bg-[#2563EB]' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${commissionEnabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Rate Row 2: Ride GST Recovery */}
                  <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#1F2B6D] dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Coins className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            Ride GST Recovery
                          </span>
                          <span title="Government tax recovered from driver wallet." className="cursor-help">
                            <Info className="w-3.5 h-3.5 text-slate-400" />
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          GST recovered on passenger ride (charged to driver).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Rate Input */}
                      <div className="relative w-28 sm:w-32">
                        <input
                          type="number"
                          min="0"
                          max="28"
                          step="0.5"
                          disabled={!gstEnabled}
                          value={gstRateStr}
                          placeholder="e.g., 5.0"
                          onChange={(e) => {
                            setGstRateStr(e.target.value)
                            setStepError(null)
                          }}
                          className="w-full pl-3.5 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] h-10 sm:h-11 shadow-2xs transition disabled:opacity-50"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono pointer-events-none select-none">
                          %
                        </span>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={gstEnabled}
                        onClick={() => setGstEnabled(!gstEnabled)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${gstEnabled ? 'bg-[#2563EB]' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${gstEnabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Total Deduction per Ride Banner */}
                  <div className="p-4 sm:p-5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100/80 dark:bg-blue-900/60 text-[#1F2B6D] dark:text-blue-300 flex items-center justify-center shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          Total Deduction per Ride
                        </h4>
                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Platform Commission ({effectiveCommission}%) + Ride GST Recovery ({effectiveGst}%)
                        </p>
                      </div>
                    </div>

                    <span className="text-2xl sm:text-3xl font-black font-mono text-[#1F2B6D] dark:text-blue-400">
                      {totalDeduction.toFixed(2)}%
                    </span>
                  </div>

                  {/* Additional Options */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Additional Options
                    </h4>

                    {/* Option 1: Apply on Booking Fee */}
                    <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#1F2B6D] dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            Apply on Booking Fee (if any)
                          </span>
                          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Include commission and GST on the booking fee.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={applyOnBookingFee}
                        onClick={() => setApplyOnBookingFee(!applyOnBookingFee)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${applyOnBookingFee ? 'bg-[#2563EB]' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${applyOnBookingFee ? 'translate-x-4' : 'translate-x-0'
                            }`}
                        />
                      </button>
                    </div>

                    {/* Option 2: Round Off Deduction */}
                    <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#1F2B6D] dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Sliders className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            Round Off Deduction
                          </span>
                          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Round the deduction amount to the nearest ₹1.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={roundOffDeduction}
                        onClick={() => setRoundOffDeduction(!roundOffDeduction)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${roundOffDeduction ? 'bg-[#2563EB]' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${roundOffDeduction ? 'translate-x-4' : 'translate-x-0'
                            }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (5 cols): Example Calculation & Important Notes */}
              <div className="lg:col-span-5 xl:col-span-5 space-y-4">
                {/* Card 1: Example Calculation */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                        Example Calculation
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        For a ride of ₹1,000 (before GST)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs sm:text-sm divide-y divide-slate-100 dark:divide-slate-800/60 pt-1">
                    <div className="flex items-center justify-between pt-1 text-slate-600 dark:text-slate-400">
                      <span>Passenger ride GST ({effectiveGst}%):</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        + ₹{sampleGstAmount.toFixed(2)}
                      </span>
                    </div>

                    {/* Customer Pays to Driver Pill */}
                    <div className="p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 flex items-center justify-between text-[#1F2B6D] dark:text-blue-300 font-bold">
                      <span>Customer Pays to Driver</span>
                      <span className="font-mono font-black text-sm sm:text-base">₹{sampleCustomerPays.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 text-slate-600 dark:text-slate-400">
                      <span>- Platform Commission ({effectiveCommission}%):</span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        - ₹{sampleCommissionDeduction.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 text-slate-600 dark:text-slate-400">
                      <span>- Ride GST Recovery ({effectiveGst}%):</span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        - ₹{sampleGstDeduction.toFixed(2)}
                      </span>
                    </div>

                    {/* Driver's Earning Pill */}
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-bold">
                      <span>Driver's Earning (After Deduction)</span>
                      <span className="font-mono font-black text-sm sm:text-base text-emerald-600 dark:text-emerald-400">
                        ₹{sampleDriverEarning.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Important Notes */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Important Notes
                    </h4>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Commission and GST are deducted from the driver wallet after ride completion.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Both rates are configurable and can be enabled or disabled independently.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>
                        The total deduction is {totalDeduction}% ({effectiveCommission}% + {effectiveGst}%) in this configuration.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 2: APPLICABILITY ────────────────────────────────── */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Header Banner */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    Applicability
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Choose where this deduction configuration will apply.
                  </p>
                </div>
              </div>

              {/* Card 1: Vehicle Types */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Vehicle Types <span className="text-rose-500">*</span>
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select the vehicle types for which this configuration applies.
                  </p>
                </div>

                {/* Dynamic Vehicle Catalog Selector (scales from 1 to 50+ vehicles with Search + Select All) */}
                <DynamicVehicleSelector
                  vehicles={vehicleOptions}
                  selectedIds={selectedVehicleIds}
                  onChange={setSelectedVehicleIds}
                  variant="cards"
                />
              </div>

              {/* Card 2: Geographic Scope */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Geographic Scope <span className="text-rose-500">*</span>
                  </h4>
                </div>

                {/* 2 Radio Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  {[
                    {
                      id: 'ALL_CITIES',
                      title: 'All Cities',
                      desc: 'Apply to all cities and zones',
                    },
                    {
                      id: 'SELECTED_CITIES',
                      title: 'Selected Cities & Zones',
                      desc: 'Apply only to specific cities and zones',
                    },
                  ].map((option) => {
                    const isActive = geographicScope === option.id
                    return (
                      <div
                        key={option.id}
                        onClick={() =>
                          setGeographicScope(
                            option.id as 'ALL_CITIES' | 'SELECTED_CITIES',
                          )
                        }
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 select-none flex flex-col justify-between ${isActive
                          ? 'border-blue-600 bg-blue-50/25 ring-1 ring-blue-500/25'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${isActive
                              ? 'border-blue-600'
                              : 'border-slate-300 dark:border-slate-600'
                              }`}
                          >
                            {isActive && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                          </div>
                          <div>
                            <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                              {option.title}
                            </h5>
                            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                              {option.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Interactive Cities & Zones dropdown selectors */}
                {geographicScope === 'SELECTED_CITIES' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Cities Selector */}
                    <div className="space-y-1.5 relative">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Cities <span className="text-rose-500">*</span>
                      </label>
                      <div
                        ref={cityTriggerRef}
                        onClick={() => {
                          setIsCityDropdownOpen(!isCityDropdownOpen)
                          setIsZoneDropdownOpen(false)
                        }}
                        className="min-h-[46px] px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 flex flex-wrap items-center justify-between gap-1.5 cursor-pointer shadow-2xs hover:border-slate-300 transition"
                      >
                        <div className="flex flex-wrap items-center gap-1.5 flex-1">
                          {selectedCities.map((city) => (
                            <span
                              key={city}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold"
                            >
                              {city}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleCity(city)
                                }}
                                className="hover:text-rose-600 dark:hover:text-rose-400 ml-0.5 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          {selectedCities.length === 0 && (
                            <span className="text-xs text-slate-400">Select cities...</span>
                          )}
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 shrink-0 ml-1 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`}
                        />
                      </div>

                      {/* Cities Dropdown (portaled downward above modal footer so nothing ever clips it) */}
                      {isCityDropdownOpen &&
                        cityMenuRect &&
                        createPortal(
                          <>
                            <div
                              className="fixed inset-0 z-[190]"
                              onClick={() => setIsCityDropdownOpen(false)}
                            />
                            <div
                              style={{
                                position: 'fixed',
                                top: cityMenuRect.top,
                                left: cityMenuRect.left,
                                width: cityMenuRect.width,
                                maxHeight: cityMenuRect.maxHeight,
                              }}
                              className="z-[200] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-2 space-y-1 overflow-y-auto"
                            >
                              {availableCityNames.map(
                                (city) => {
                                  const isChecked = selectedCities.includes(city)
                                  return (
                                    <div
                                      key={city}
                                      onClick={() => toggleCity(city)}
                                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200"
                                    >
                                      <span>{city}</span>
                                      <div
                                        className={`w-4 h-4 rounded flex items-center justify-center ${isChecked
                                          ? 'bg-blue-600 text-white'
                                          : 'border border-slate-300 dark:border-slate-600'
                                          }`}
                                      >
                                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                      </div>
                                    </div>
                                  )
                                },
                              )}
                            </div>
                          </>,
                          document.body,
                        )}
                    </div>

                    {/* Zones Selector */}
                    <div className="space-y-1.5 relative">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Zones <span className="text-slate-400 font-normal">(Optional · blank = All Zones)</span>
                      </label>
                      <div
                        ref={zoneTriggerRef}
                        onClick={() => {
                          if (selectedCities.length === 0) return
                          setIsZoneDropdownOpen(!isZoneDropdownOpen)
                          setIsCityDropdownOpen(false)
                        }}
                        className={`min-h-[46px] px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-wrap items-center justify-between gap-1.5 shadow-2xs transition ${
                          selectedCities.length === 0
                            ? 'bg-slate-50 dark:bg-slate-800/50 opacity-60 cursor-not-allowed'
                            : 'bg-white dark:bg-slate-800 cursor-pointer hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-1.5 flex-1">
                          {selectedZones.map((zone) => (
                            <span
                              key={zone}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold"
                            >
                              {zone}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleZone(zone)
                                }}
                                className="hover:text-rose-600 dark:hover:text-rose-400 ml-0.5 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          {selectedZones.length === 0 && (
                            <span className="text-xs text-slate-400">
                              {selectedCities.length === 0
                                ? 'Select a city first...'
                                : 'All Zones (click to pick specific)'}
                            </span>
                          )}
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 shrink-0 ml-1 transition-transform ${isZoneDropdownOpen ? 'rotate-180' : ''}`}
                        />
                      </div>

                      {/* Zones Dropdown (portaled downward above modal footer; strictly scoped to selected cities) */}
                      {isZoneDropdownOpen &&
                        selectedCities.length > 0 &&
                        zoneMenuRect &&
                        createPortal(
                          <>
                            <div
                              className="fixed inset-0 z-[190]"
                              onClick={() => setIsZoneDropdownOpen(false)}
                            />
                            <div
                              style={{
                                position: 'fixed',
                                top: zoneMenuRect.top,
                                left: zoneMenuRect.left,
                                width: zoneMenuRect.width,
                                maxHeight: zoneMenuRect.maxHeight,
                              }}
                              className="z-[200] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-2 space-y-1 overflow-y-auto"
                            >
                              {(() => {
                                const selectedCityCodes = new Set(
                                  cityOptions
                                    .filter((c) => selectedCities.includes(c.name))
                                    .map((c) => c.code.toUpperCase()),
                                )
                                const filteredZones = zoneOptions.filter(
                                  (z) =>
                                    z.cityCode.toUpperCase() !== 'GLOBAL' &&
                                    selectedCityCodes.has(z.cityCode.toUpperCase()),
                                )
                                if (filteredZones.length === 0) {
                                  return (
                                    <p className="px-3 py-2 text-xs text-slate-400">
                                      No service zones for selected cities (applies to All Zones).
                                    </p>
                                  )
                                }
                                return filteredZones.map((z) => {
                                  const isChecked = selectedZones.includes(z.name)
                                  return (
                                    <div
                                      key={z.id}
                                      onClick={() => toggleZone(z.name)}
                                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200"
                                    >
                                      <span>
                                        {z.name}{' '}
                                        <span className="text-[10px] text-slate-400 font-normal">
                                          ({z.cityCode})
                                        </span>
                                      </span>
                                      <div
                                        className={`w-4 h-4 rounded flex items-center justify-center ${isChecked
                                          ? 'bg-blue-600 text-white'
                                          : 'border border-slate-300 dark:border-slate-600'
                                          }`}
                                      >
                                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                      </div>
                                    </div>
                                  )
                                })
                              })()}
                            </div>
                          </>,
                          document.body,
                        )}
                    </div>
                  </div>
                )}
              </div>

              {/* Full-Width Applicability Summary Bar */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 sm:gap-6">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Applicability Summary
                  </span>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 flex-wrap flex-1 justify-between sm:justify-end min-w-0">
                  {/* Vehicles */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                      <Car className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                        Vehicles
                      </span>
                      <span className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 break-words">
                        {selectedVehicleIds.length === 0
                          ? 'None selected'
                          : allVehiclesSelected
                            ? 'All Vehicles'
                            : selectedVehicleLabels.join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                  {/* Cities */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                        Cities
                      </span>
                      <span className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 break-words">
                        {geographicScope === 'ALL_CITIES'
                          ? 'All Cities'
                          : selectedCities.length > 0
                            ? selectedCities.join(', ')
                            : 'All Cities'}
                      </span>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                  {/* Zones */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                        Zones
                      </span>
                      <span className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 break-words">
                        {geographicScope === 'ALL_CITIES'
                          ? 'All Zones'
                          : selectedZones.length > 0
                            ? selectedZones.join(', ')
                            : 'All Zones'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3: RULES & SCHEDULE ─────────────────────────────── */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Header Banner */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    Rules & Schedule
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Set when this configuration becomes active and how it should apply across rides.
                  </p>
                </div>
              </div>

              {/* 2-Column Grid: Effective Schedule (Left) + Apply Changes To (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
                {/* Column 1: Effective Schedule */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Effective Schedule <span className="text-rose-500">*</span>
                        </h4>
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#1F2B6D] dark:text-blue-300 border border-blue-100 dark:border-blue-900/40">
                        Activation Timeline
                      </span>
                    </div>

                    {/* Effective From */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>Effective From Date & Time *</span>
                        <span className="text-[11px] text-slate-400 font-normal">When rates begin</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Custom DatePicker */}
                        <div className="w-full">
                          <DatePicker
                            value={toIsoDate(effectiveFromDate)}
                            onChange={(val) => setEffectiveFromDate(toDisplayDate(val))}
                            placeholder="Select date"
                            iconPosition="left"
                          />
                        </div>

                        {/* Production Time / Timer Input without increment/decrement */}
                        <div className="relative w-full">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 pointer-events-none">
                            <Clock className="w-4 h-4" />
                          </div>
                          <input
                            type="time"
                            value={toIsoTime(effectiveFromTime)}
                            onClick={(e) => {
                              try {
                                e.currentTarget.showPicker?.()
                              } catch { }
                            }}
                            onChange={(e) => setEffectiveFromTime(toDisplayTime(e.target.value))}
                            className="w-full h-10 pl-9 pr-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/15 focus:border-[#1F2B6D] shadow-2xs transition [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Effective Expiration */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>Effective Expiration (Optional)</span>
                        <span className="text-[11px] text-slate-400 font-normal">Sunset or temporary period</span>
                      </label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="flex-1">
                          <DatePicker
                            disabled={noEndDate}
                            value={toIsoDate(effectiveToDate)}
                            onChange={(val) => setEffectiveToDate(toDisplayDate(val))}
                            placeholder="Select end date"
                            iconPosition="left"
                          />
                        </div>

                        {/* No End Date Toggle */}
                        <div className="flex items-center gap-2.5 shrink-0 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={noEndDate}
                            onClick={() => setNoEndDate(!noEndDate)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${noEndDate ? 'bg-[#2563EB]' : 'bg-slate-300 dark:bg-slate-700'
                              }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${noEndDate ? 'translate-x-4' : 'translate-x-0'
                                }`}
                            />
                          </button>
                          <div className="leading-tight">
                            <span className="block text-xs font-bold text-slate-900 dark:text-white">
                              No End Date
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              Active until updated
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Schedule Confirmation Note */}
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-300">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]" />
                    <span className="leading-snug">
                      Scheduled to activate from <strong>{toDisplayDate(effectiveFromDate)}, {toDisplayTime(effectiveFromTime)}</strong> {noEndDate ? 'with continuous enforcement.' : `until ${toDisplayDate(effectiveToDate)}.`}
                    </span>
                  </div>
                </div>

                {/* Column 2: Apply Changes To */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Apply Changes To <span className="text-rose-500">*</span>
                        </h4>
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#1F2B6D] dark:text-blue-300 border border-blue-100 dark:border-blue-900/40">
                        Ride Scope
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {/* New Rides Only (Enforced by Backend) */}
                      <div className="p-4 rounded-xl border border-blue-600 bg-blue-50/20 ring-1 ring-blue-500/20 shadow-2xs select-none flex items-start gap-3.5">
                        <div className="w-4 h-4 rounded-full border-2 border-blue-600 shrink-0 mt-0.5 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-blue-600" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                              New Rides Only
                            </h5>
                            <span className="px-2 py-0.5 rounded-full bg-blue-100/80 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                              Enforced
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Apply this rate strictly to rides accepted after the effective date & time.
                          </p>
                          <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 pt-1">
                            <li className="flex items-center gap-1.5">
                              <span className="text-emerald-500 font-bold">✓</span> In-transit rides complete under their original accepted tariff
                            </li>
                            <li className="flex items-center gap-1.5">
                              <span className="text-emerald-500 font-bold">✓</span> Zero driver wallet deduction discrepancy
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>Selected Policy:</span>
                    <strong className="text-slate-900 dark:text-white font-semibold">
                      New Rides Only (Safe Transition)
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 4: REVIEW & ACTIVATE ────────────────────────────── */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Header Banner */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
                  <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    Review & Activate
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Please review the complete configuration below before making it live.
                  </p>
                </div>
              </div>

              {/* 2-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Section (approx 8 cols in 12): 2x2 Grid of Cards */}
                <div className="lg:col-span-7 xl:col-span-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card 1: Deduction Rates */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                          %
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          Deduction Rates
                        </h4>
                      </div>

                      <div className="space-y-2.5 text-xs sm:text-sm">
                        <div className="flex items-center justify-between py-1">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">Platform Commission</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {effectiveCommission.toFixed(2)}%
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-1">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">Ride GST Recovery</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {effectiveGst.toFixed(2)}%
                          </span>
                        </div>

                        <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 flex items-center justify-between">
                          <span className="font-bold text-[#1F2B6D] dark:text-blue-400">
                            Total Deduction
                          </span>
                          <span className="font-mono font-black text-sm sm:text-base text-[#1F2B6D] dark:text-blue-400">
                            {totalDeduction.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Applicability */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <Car className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          Applicability
                        </h4>
                      </div>

                      <div className="space-y-3 text-xs">
                        {/* Vehicle Types */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Vehicle Types</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {allVehiclesSelected || selectedVehicleIds.length === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                All Vehicles
                              </span>
                            ) : (
                              selectedVehicleLabels.map((label) => (
                                <span
                                  key={label}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300"
                                >
                                  <span>{label}</span>
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Cities */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Cities</span>
                          </div>
                          <div className="pt-0.5">
                            <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              {geographicScope === 'ALL_CITIES'
                                ? 'All Cities'
                                : selectedCities.length > 0
                                  ? selectedCities.join(', ')
                                  : 'None'}
                            </span>
                          </div>
                        </div>

                        {/* Zones */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Zones</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {geographicScope === 'ALL_CITIES' ? (
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                All Zones
                              </span>
                            ) : (
                              selectedZones.map((z) => (
                                <span
                                  key={z}
                                  className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300"
                                >
                                  {z}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Rules & Schedule */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          Rules & Schedule
                        </h4>
                      </div>

                      <div className="space-y-3 text-xs sm:text-sm">
                        <div className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Effective From</span>
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {toDisplayDate(effectiveFromDate)}, {toDisplayTime(effectiveFromTime)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Effective To</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            {noEndDate ? 'No End Date' : (toDisplayDate(effectiveToDate) || 'No End Date')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Zap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Apply Changes To</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1F2B6D] dark:text-blue-300 font-bold text-[11px] border border-blue-100 dark:border-blue-900/40">
                            New Rides Only
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Summary */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <Info className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          Summary
                        </h4>
                      </div>

                      <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span className="leading-snug">
                            {effectiveCommission.toFixed(0)}% platform commission will be deducted from driver wallet per completed ride.
                          </span>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span className="leading-snug">
                            {effectiveGst.toFixed(0)}% ride GST recovery (from passenger) will be deducted from driver wallet per completed ride.
                          </span>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span className="leading-snug">
                            Total deduction will be {totalDeduction.toFixed(0)}% ({effectiveCommission.toFixed(0)}% + {effectiveGst.toFixed(0)}%).
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section (approx 4 cols in 12): Activate & Important Notes */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                  {/* Card 1: Activate Configuration */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Rocket className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                          Activate Configuration
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          This will make the configuration live from the effective date and apply to new eligible rides.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 flex items-center gap-3">
                      <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          Will be active from
                        </span>
                        <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                          {toDisplayDate(effectiveFromDate)}, {toDisplayTime(effectiveFromTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Important Notes */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3.5">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        Important Notes
                      </h4>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 list-disc pl-4 leading-relaxed">
                      <li>Changes will apply to new rides only.</li>
                      <li>Already accepted and ongoing rides will not be affected.</li>
                      <li>Commission and ride GST are recorded as separate wallet transactions.</li>
                      <li>You can view, edit or deactivate this configuration later from the Overview screen.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Confirmation Banner */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-xs">
                <div
                  onClick={() => setIsConfirmed(!isConfirmed)}
                  className={`w-5 h-5 rounded-md flex items-center justify-center cursor-pointer transition select-none shrink-0 ${isConfirmed
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                >
                  {isConfirmed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <p
                  onClick={() => setIsConfirmed(!isConfirmed)}
                  className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 cursor-pointer select-none leading-snug"
                >
                  I confirm that the{' '}
                  <strong className="font-bold text-slate-900 dark:text-white">
                    commission rate, GST treatment and driver recovery policy
                  </strong>{' '}
                  have been reviewed and approved by the finance/tax team.{' '}
                  <span className="text-rose-500 font-bold">*</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ─── Bottom Action Bar (Fixed at bottom) ───────────────────── */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-7 lg:px-8 py-3.5 sm:py-4 bg-white dark:bg-slate-900 border-t border-slate-200/90 dark:border-slate-800">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 sm:px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                ← Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-5 sm:px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 sm:px-8 py-2.5 bg-[#1F2B6D] hover:bg-[#182258] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>
                  {currentStep === 1
                    ? 'Next: Applicability →'
                    : currentStep === 2
                      ? 'Next: Rules & Schedule →'
                      : 'Next: Review & Activate →'}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => handleFinish(e, true)}
                  className="px-5 sm:px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={!isConfirmed}
                  onClick={(e) => handleFinish(e, false)}
                  className="px-6 sm:px-8 py-2.5 bg-[#1F2B6D] hover:bg-[#182258] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Activate Configuration</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default CreateConfigurationModal

