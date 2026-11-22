import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layers,
  User,
  Car,
  Clock,
  ChevronDown,
  Info,
  CreditCard,
  Percent,
  Coins,
  Users,
  SlidersHorizontal,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react'
import type {
  CancellationRule,
  CancellationActor,
  CancellationScenario,
  CancellationChargeType,
} from '../types'
import { useCancellationRules } from '../../hooks'
import { CancellationPolicySummaryCard } from './CancellationPolicySummaryCard'
import { CancellationRuleConflictModal } from './CancellationRuleConflictModal'
import { Button } from '@/shared/components/ui/Button'

interface CancellationRuleFormProps {
  mode?: 'create' | 'edit'
  initialValues?: CancellationRule | null
  onSubmit: (data: Omit<CancellationRule, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => void
  loading?: boolean
  error?: unknown
}

function numToStr(value: number | null | undefined): string {
  return value != null && Number.isFinite(value) ? String(value) : ''
}

function parseNum(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

function formatDurationHuman(totalSeconds: number): string {
  const secs = Math.max(0, Math.round(totalSeconds))
  if (secs < 60) return `${secs} second${secs === 1 ? '' : 's'}`
  const mins = Math.floor(secs / 60)
  const rem = secs % 60
  if (rem === 0) return `${mins} minute${mins === 1 ? '' : 's'}`
  return `${mins} min ${rem} sec`
}

export const CancellationRuleForm: React.FC<CancellationRuleFormProps> = ({
  mode,
  initialValues,
  onSubmit,
  loading = false,
  error,
}) => {
  const navigate = useNavigate()
  const isEditMode = mode ? mode === 'edit' : Boolean(initialValues?.id)
  const [conflictModalOpen, setConflictModalOpen] = useState(false)

  // Live active policies for instant duplicate detection on Create
  const { data: activePoliciesResp } = useCancellationRules({ status: 'active', limit: 100 })

  // 1. Policy Scope
  const [actor, setActor] = useState<CancellationActor>(initialValues?.actor || 'rider')
  const [scenario, setScenario] = useState<CancellationScenario>(
    initialValues?.scenario || 'after_arrival',
  )

  // 2. Free Cancellation Window (Blank on Create; pre-filled on Edit)
  const [freeWindowStr, setFreeWindowStr] = useState<string>(
    numToStr(initialValues?.freeCancellationWindow),
  )
  const [freeUnit, setFreeUnit] = useState<'seconds' | 'minutes'>(
    initialValues?.freeCancellationUnit ?? 'seconds',
  )

  // 3. Cancellation Charge (Blank on Create; pre-filled on Edit)
  const [chargeType, setChargeType] = useState<CancellationChargeType>(
    initialValues?.chargeType || 'percentage',
  )
  const [chargeAmountStr, setChargeAmountStr] = useState<string>(
    numToStr(initialValues?.chargeAmount),
  )
  const [maxChargeStr, setMaxChargeStr] = useState<string>(
    numToStr(initialValues?.maxChargeAmount),
  )

  // 4. Driver Settlement (Blank on Create; pre-filled on Edit)
  const [driverPayoutStr, setDriverPayoutStr] = useState<string>(
    numToStr(initialValues?.driverPayout),
  )
  const [driverPenaltyStr, setDriverPenaltyStr] = useState<string>(
    numToStr(initialValues?.driverPenalty),
  )

  // 5. Effective Status
  const [isActive, setIsActive] = useState<boolean>(
    initialValues ? initialValues.status === 'active' : true,
  )

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  const freeWindowNum = parseNum(freeWindowStr)
  const chargeAmountNum = parseNum(chargeAmountStr)
  const maxChargeNum = parseNum(maxChargeStr)
  const driverPayoutNum = parseNum(driverPayoutStr)
  const driverPenaltyNum = parseNum(driverPenaltyStr)

  // Live duplicate active policy check on Create
  const conflictingActivePolicy = useMemo(() => {
    if (isEditMode || !isActive) return null
    const allActive = activePoliciesResp?.data ?? []
    return (
      allActive.find(
        (p) =>
          p.status === 'active' &&
          p.actor === actor &&
          p.scenario === scenario &&
          !p.cityCode &&
          !p.vehicleTypeId,
      ) ?? null
    )
  }, [isEditMode, isActive, activePoliciesResp?.data, actor, scenario])

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
    const isConflict = status === 409 || code === 'CANCELLATION_POLICY_CONFLICT'
    return { code: isConflict ? 'CANCELLATION_POLICY_CONFLICT' : code, message }
  }, [error])

  useEffect(() => {
    if (serverErrorInfo.code === 'CANCELLATION_POLICY_CONFLICT') {
      setConflictModalOpen(true)
    }
  }, [serverErrorInfo.code, error])

  const serverErrorMessage =
    serverErrorInfo.code === 'CANCELLATION_POLICY_CONFLICT' ? null : serverErrorInfo.message

  // Example calculation for info callout
  const exampleFreeSeconds =
    freeWindowNum != null ? (freeUnit === 'minutes' ? freeWindowNum * 60 : freeWindowNum) : null
  const exampleFreeHuman =
    exampleFreeSeconds != null ? formatDurationHuman(exampleFreeSeconds) : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isEditMode && isActive && conflictingActivePolicy) {
      setConflictModalOpen(true)
      return
    }

    const errs: Record<string, string> = {}

    if (freeWindowNum === null) {
      errs.freeWindow = 'Free cancellation window is required.'
    } else if (freeWindowNum < 0) {
      errs.freeWindow = 'Free window cannot be negative.'
    }
    if (chargeAmountNum === null) {
      errs.chargeAmount = 'Charge amount is required.'
    } else if (chargeAmountNum < 0) {
      errs.chargeAmount = 'Charge amount cannot be negative.'
    } else if (chargeType === 'percentage' && chargeAmountNum > 100) {
      errs.chargeAmount = 'Percentage cannot exceed 100%.'
    }
    if (chargeType === 'percentage' && maxChargeNum !== null && maxChargeNum < 0) {
      errs.maxCharge = 'Maximum charge cannot be negative.'
    }
    if (actor === 'rider') {
      if (driverPayoutNum === null) {
        errs.driverPayout = 'Driver payout is required (enter 0 if none).'
      } else if (driverPayoutNum < 0) {
        errs.driverPayout = 'Driver payout cannot be negative.'
      }
    } else {
      if (driverPenaltyNum !== null && driverPenaltyNum < 0) {
        errs.driverPenalty = 'Driver penalty cannot be negative.'
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setErrors({})

    // Auto-generate rule name following standard convention (e.g., "rider · after arrival")
    const formattedScenario = scenario.replace(/_/g, ' ')
    const scopeChanged =
      Boolean(initialValues) &&
      (actor !== initialValues?.actor || scenario !== initialValues?.scenario)
    const ruleName =
      !scopeChanged && initialValues?.ruleName
        ? initialValues.ruleName
        : `${actor} · ${formattedScenario}`

    onSubmit({
      ruleName,
      actor,
      scenario,
      chargeType,
      chargeAmount: chargeAmountNum!,
      freeCancellationWindow: freeWindowNum!,
      freeCancellationUnit: freeUnit,
      maxChargeAmount: chargeType === 'percentage' ? maxChargeNum : null,
      driverPayout: actor === 'rider' ? driverPayoutNum! : 0,
      driverPenalty: actor === 'driver' ? driverPenaltyNum : null,
      status: isActive ? 'active' : 'inactive',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3 text-left">
      {/* Non-conflict API error banner */}
      {serverErrorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{serverErrorMessage}</span>
        </div>
      )}

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
        {/* Left Column: 5 Configuration Cards */}
        <div className="lg:col-span-8 space-y-2.5 sm:space-y-3">
          {/* CARD 1: Policy Scope */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
            {/* Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#1F2B6D] dark:text-white leading-tight">
                  1. Policy Scope
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight">
                  Choose who this policy applies to and the cancellation scenario.
                </p>
              </div>
            </div>

            {/* Inputs: 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-0.5">
              {/* Applies To */}
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Applies To <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={actor}
                    onChange={(e) => setActor(e.target.value as CancellationActor)}
                    className="w-full h-10 pl-9 pr-9 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] appearance-none cursor-pointer transition shadow-2xs"
                  >
                    <option value="rider">Rider (Customer)</option>
                    <option value="driver">Driver</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Cancellation Scenario */}
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Cancellation Scenario <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Car className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value as CancellationScenario)}
                    className="w-full h-10 pl-9 pr-9 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] appearance-none cursor-pointer transition shadow-2xs"
                  >
                    <option value="after_arrival">After Driver Arrival</option>
                    <option value="after_assignment">After Driver Assignment</option>
                    <option value="no_show">Passenger No Show</option>
                    <option value="before_assignment">Before Driver Assignment</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Live Duplicate Active Policy Warning Banner */}
            {conflictingActivePolicy && (
              <div className="mt-2 p-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 dark:text-amber-200 space-y-0.5 min-w-0">
                    <p className="font-bold">
                      An active policy already exists: {conflictingActivePolicy.ruleName} (v
                      {conflictingActivePolicy.version ?? 1})
                    </p>
                    <p className="text-[11.5px] text-amber-800/90 dark:text-amber-300/90 leading-snug">
                      Current fee:{' '}
                      <strong>
                        {conflictingActivePolicy.chargeType === 'percentage'
                          ? `${conflictingActivePolicy.chargeAmount}%`
                          : `₹${conflictingActivePolicy.chargeAmount.toFixed(2)}`}
                      </strong>{' '}
                      · Free window:{' '}
                      <strong>
                        {conflictingActivePolicy.freeCancelWindowSec ??
                          conflictingActivePolicy.freeCancellationWindow ??
                          0}
                        s
                      </strong>
                      . Edit it to publish v{(conflictingActivePolicy.version ?? 1) + 1} cleanly.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/pricing-management/cancellation-rules/${conflictingActivePolicy.id}/edit`)
                  }
                  className="shrink-0 bg-[#1F2B6D] hover:bg-[#182258] text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer whitespace-nowrap"
                >
                  Edit Existing Policy →
                </button>
              </div>
            )}
          </div>

          {/* CARD 2: Free Cancellation Window */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
            {/* Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#1F2B6D] dark:text-white leading-tight">
                  2. Free Cancellation Window
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight">
                  Set the time during which cancellation is free of charge (after the scenario is reached).
                </p>
              </div>
            </div>

            {/* Inputs & Callout: 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-center pt-0.5">
              {/* Free Window Input & Unit Select */}
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Free Window <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={freeWindowStr}
                    placeholder={freeUnit === 'minutes' ? 'e.g., 3' : 'e.g., 180'}
                    onChange={(e) => setFreeWindowStr(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] h-10 shadow-2xs transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <div className="relative">
                    <select
                      value={freeUnit}
                      onChange={(e) => setFreeUnit(e.target.value as 'seconds' | 'minutes')}
                      className="w-full h-10 pl-3 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] appearance-none cursor-pointer transition shadow-2xs"
                    >
                      <option value="seconds">Seconds</option>
                      <option value="minutes">Minutes</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                {errors.freeWindow && (
                  <p className="text-[10.5px] text-rose-500 font-medium">{errors.freeWindow}</p>
                )}
              </div>

              {/* Information Callout Box */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#1F2B6D] dark:text-blue-300">
                    {exampleFreeSeconds != null && exampleFreeHuman != null
                      ? `Example: ${Math.round(exampleFreeSeconds)} seconds = ${exampleFreeHuman}.`
                      : 'Enter a free cancellation window'}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {exampleFreeHuman != null
                      ? `If the ${actor === 'rider' ? 'rider' : 'driver'} cancels within ${exampleFreeHuman} of ${scenario === 'after_arrival' ? 'driver arrival' : scenario === 'after_assignment' ? 'driver assignment' : scenario === 'no_show' ? 'passenger no show' : 'booking'}, no cancellation fee will be charged.`
                      : 'Specify how long the cancelling party has before any cancellation penalty applies.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: Cancellation Charge */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
            {/* Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#1F2B6D] dark:text-white leading-tight">
                  3. Cancellation Charge
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight">
                  Define the cancellation fee to be charged to the cancelling party (rider or driver).
                </p>
              </div>
            </div>

            {/* Inputs: 2 Columns for Fixed, 3 Columns for Percentage (with Maximum Cap) */}
            <div
              className={`grid grid-cols-1 gap-3 sm:gap-4 pt-0.5 ${
                chargeType === 'percentage' ? 'md:grid-cols-3' : 'md:grid-cols-2'
              }`}
            >
              {/* Charge Type */}
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Charge Type <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  {chargeType === 'percentage' ? (
                    <Percent className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  ) : (
                    <Coins className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                  <select
                    value={chargeType}
                    onChange={(e) => setChargeType(e.target.value as CancellationChargeType)}
                    className="w-full h-10 pl-9 pr-9 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] appearance-none cursor-pointer transition shadow-2xs"
                  >
                    <option value="percentage">Percentage of Fare (%)</option>
                    <option value="fixed">Fixed Flat Amount (₹)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Charge Amount */}
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Charge Amount <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  {chargeType === 'fixed' && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono pointer-events-none select-none">
                      ₹
                    </span>
                  )}
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={chargeAmountStr}
                    placeholder={chargeType === 'percentage' ? 'e.g., 10' : 'e.g., 25'}
                    onChange={(e) => setChargeAmountStr(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className={`w-full py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] h-10 shadow-2xs transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      chargeType === 'fixed' ? 'pl-8 pr-3' : 'pl-3 pr-11'
                    }`}
                  />
                  {chargeType === 'percentage' && (
                    <span className="absolute right-1.5 top-1.5 bottom-1.5 px-2.5 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/60 font-bold text-xs text-[#1F2B6D] dark:text-blue-400 select-none pointer-events-none">
                      %
                    </span>
                  )}
                </div>
                {errors.chargeAmount && (
                  <p className="text-[10.5px] text-rose-500 font-medium">{errors.chargeAmount}</p>
                )}
              </div>

              {/* Maximum Charge (Only relevant for Percentage of Fare) */}
              {chargeType === 'percentage' && (
                <div className="space-y-1">
                  <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Maximum Charge (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono pointer-events-none select-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={maxChargeStr}
                      placeholder="No limit"
                      onChange={(e) => setMaxChargeStr(e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] h-10 shadow-2xs transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  {errors.maxCharge && (
                    <p className="text-[10.5px] text-rose-500 font-medium">{errors.maxCharge}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* CARD 4: Driver Settlement (Actor-aware: Payout for Rider cancel, Penalty for Driver cancel) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
            {/* Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#1F2B6D] dark:text-white leading-tight">
                  4. Driver Settlement
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight">
                  {actor === 'rider'
                    ? 'Set how much compensation is paid to the driver when a rider cancels late.'
                    : 'Set how much penalty is deducted from the driver wallet when a driver cancels.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-center pt-0.5">
              {actor === 'rider' ? (
                <>
                  {/* Driver Payout (Rider cancels) */}
                  <div className="space-y-1">
                    <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Driver Payout (Compensation) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono pointer-events-none select-none">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={driverPayoutStr}
                        placeholder="e.g., 25 (enter 0 if none)"
                        onChange={(e) => setDriverPayoutStr(e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] h-10 shadow-2xs transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    {errors.driverPayout && (
                      <p className="text-[10.5px] text-rose-500 font-medium">{errors.driverPayout}</p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Credited to the driver&apos;s wallet for wasted travel/wait time when a{' '}
                      <strong className="text-slate-700 dark:text-slate-200">rider</strong> cancels
                      after the free window. Driver penalty does not apply here.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Driver Penalty (Driver cancels) */}
                  <div className="space-y-1">
                    <label className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Driver Wallet Penalty <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono pointer-events-none select-none">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={driverPenaltyStr}
                        placeholder="e.g., 20 (leave blank for none)"
                        onChange={(e) => setDriverPenaltyStr(e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] h-10 shadow-2xs transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    {errors.driverPenalty && (
                      <p className="text-[10.5px] text-rose-500 font-medium">{errors.driverPenalty}</p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Deducted from the driver&apos;s wallet when a{' '}
                      <strong className="text-slate-700 dark:text-slate-200">driver</strong> cancels
                      after the free window. Driver payout compensation is automatically ₹0.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* CARD 5: Effective Status */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
            {/* Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <SlidersHorizontal className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#1F2B6D] dark:text-white leading-tight">
                  5. Effective Status
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 leading-tight">
                  Enable or disable this policy.
                </p>
              </div>
            </div>

            {/* Status Toggle matching Screenshot */}
            <div className="space-y-1 pt-0.5">
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
                    isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
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

        {/* Right Column: Policy Summary & Information Sidebar */}
        <div className="lg:col-span-4">
          <CancellationPolicySummaryCard
            actor={actor}
            scenario={scenario}
            freeWindow={freeWindowNum}
            freeUnit={freeUnit}
            chargeType={chargeType}
            chargeAmount={chargeAmountNum}
            maxCharge={maxChargeNum}
            driverPayout={driverPayoutNum}
            driverPenalty={driverPenaltyNum}
          />
        </div>
      </div>

      {/* Bottom Action Footer Bar */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 mt-2.5 sm:mt-3">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => navigate('/pricing-management/cancellation-rules')}
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
          {loading
            ? 'Saving...'
            : isEditMode
              ? `Publish Version v${(initialValues?.version ?? 1) + 1}`
              : 'Save Cancellation Policy'}
        </Button>
      </div>

      <CancellationRuleConflictModal
        isOpen={conflictModalOpen}
        existingPolicy={conflictingActivePolicy}
        fallbackMessage={serverErrorInfo.message}
        onClose={() => setConflictModalOpen(false)}
        onEditExisting={(policyId) => {
          setConflictModalOpen(false)
          navigate(`/pricing-management/cancellation-rules/${policyId}/edit`)
        }}
      />
    </form>
  )
}

export default CancellationRuleForm
