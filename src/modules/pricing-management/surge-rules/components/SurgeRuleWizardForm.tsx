import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { FormTabs } from '@/shared/components/ui/FormTabs'
import { ChevronLeft, ChevronRight, Save, Zap } from 'lucide-react'
import { useSurgeZones } from '../../hooks'
import { useCities, useStates } from '@/modules/geographic-management/hooks'
import type { SurgeRule } from '../types'
import type { VehicleType } from '@/modules/driver-management/types'

const UNSET_ZONE = '__unset__'

interface SurgeRuleWizardFormProps {
  initialValues?: SurgeRule | null
  onSubmit: (data: Omit<SurgeRule, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => void
  loading?: boolean
}

type StepType = 'basic' | 'multiplier' | 'thresholds' | 'validity' | 'review'

export const SurgeRuleWizardForm: React.FC<SurgeRuleWizardFormProps> = ({
  initialValues,
  onSubmit,
  loading
}) => {
  const [activeStep, setActiveStep] = useState<StepType>('basic')
  const { data: surgeZones = [], isLoading: zonesLoading } = useSurgeZones()
  const { data: states = [] } = useStates({ countryCode: 'IN', activeOnly: true })
  const { data: cities = [] } = useCities(true)

  const [ruleName, setRuleName] = useState(initialValues?.ruleName || '')
  const [stateId, setStateId] = useState('')
  const [cityCode, setCityCode] = useState(initialValues?.cityCode || '')
  const [zoneId, setZoneId] = useState(initialValues?.zoneId || '')
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>(
    Array.isArray(initialValues?.vehicleType)
      ? initialValues.vehicleType
      : initialValues?.vehicleType
        ? [initialValues.vehicleType as VehicleType]
        : ['cab']
  )
  const [multiplier, setMultiplier] = useState<number>(initialValues?.multiplier || 1.2)
  const [demandThresholdPct, setDemandThresholdPct] = useState<number | ''>(
    initialValues?.demandThresholdPct ?? '',
  )
  const [supplyThresholdPct, setSupplyThresholdPct] = useState<number | ''>(
    initialValues?.supplyThresholdPct ?? '',
  )
  const [peakHourStart, setPeakHourStart] = useState(initialValues?.peakHourStart || '')
  const [peakHourEnd, setPeakHourEnd] = useState(initialValues?.peakHourEnd || '')
  const [isPeakHourOnly, setIsPeakHourOnly] = useState(initialValues?.isPeakHourOnly ?? false)
  const [startTime, setStartTime] = useState(initialValues?.startTime || '')
  const [endTime, setEndTime] = useState(initialValues?.endTime || '')
  const [effectiveFrom, setEffectiveFrom] = useState(initialValues?.effectiveFrom || new Date().toISOString().split('T')[0])
  const [effectiveTo, setEffectiveTo] = useState(initialValues?.effectiveTo || '')
  const [status, setStatus] = useState<'active' | 'inactive'>(initialValues?.status || 'active')

  const [errors, setErrors] = useState<Record<string, string>>({})

  const cityOptions = useMemo(() => {
    const activeCities = cities.filter((c) => c.isActive)
    if (!stateId) return activeCities
    return activeCities.filter((c) => c.stateId === stateId)
  }, [cities, stateId])

  const allowedCityCodes = useMemo(() => {
    if (cityCode) return new Set([cityCode])
    return new Set(cityOptions.map((c) => c.code))
  }, [cityCode, cityOptions])

  const zonesForCity = useMemo(
    () =>
      surgeZones.filter(
        (z) => z.isActive && allowedCityCodes.has(z.cityCode),
      ),
    [surgeZones, allowedCityCodes],
  )

  const selectedZone = surgeZones.find((z) => z.id === zoneId)

  useEffect(() => {
    if (initialValues?.cityCode && cities.length > 0 && !stateId) {
      const match = cities.find((c) => c.code === initialValues.cityCode)
      if (match?.stateId) setStateId(match.stateId)
    }
  }, [initialValues?.cityCode, cities, stateId])

  useEffect(() => {
    if (zoneId && !zonesForCity.some((z) => z.id === zoneId)) {
      setZoneId('')
    }
  }, [zoneId, zonesForCity])

  const validateStep = (step: StepType): boolean => {
    const errs: Record<string, string> = {}

    if (step === 'basic') {
      if (!ruleName.trim()) errs.ruleName = 'Rule name is required.'
      if (!zoneId) errs.zoneId = 'Surge zone is required.'
    }

    if (step === 'multiplier') {
      if (multiplier < 0.5) errs.multiplier = 'Multiplier must be at least 0.5x.'
      if (multiplier > 2.0) errs.multiplier = 'Multiplier cannot exceed 2.0x.'
    }

    if (step === 'thresholds') {
      if (demandThresholdPct !== '' && (demandThresholdPct < 0 || demandThresholdPct > 100)) {
        errs.demandThresholdPct = 'Demand threshold must be between 0 and 100.'
      }
      if (supplyThresholdPct !== '' && (supplyThresholdPct < 0 || supplyThresholdPct > 100)) {
        errs.supplyThresholdPct = 'Supply threshold must be between 0 and 100.'
      }
      if (isPeakHourOnly && (!peakHourStart || !peakHourEnd)) {
        errs.peakHourStart = 'Peak hour start and end are required when peak-hour only is enabled.'
      }
    }

    if (step === 'validity') {
      if (!effectiveFrom) errs.effectiveFrom = 'Effective From date is required.'
      if (startTime && !endTime) errs.endTime = 'End Time is required if Start Time is provided.'
      if (endTime && !startTime) errs.startTime = 'Start Time is required if End Time is provided.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const stepsList: { id: StepType; label: string }[] = [
    { id: 'basic', label: '1. Basic Configuration' },
    { id: 'multiplier', label: '2. Multiplier Setting' },
    { id: 'thresholds', label: '3. Demand & Peak Rules' },
    { id: 'validity', label: '4. Validity Schedule' },
    { id: 'review', label: '5. Review & Publish' }
  ]

  const handleStepChange = (targetStepId: StepType) => {
    const currentStepIdx = stepsList.findIndex(s => s.id === activeStep)
    const targetStepIdx = stepsList.findIndex(s => s.id === targetStepId)

    if (targetStepIdx > currentStepIdx) {
      for (let i = currentStepIdx; i < targetStepIdx; i++) {
        if (!validateStep(stepsList[i].id)) return
      }
    }
    setActiveStep(targetStepId)
  }

  const handleNext = () => {
    if (!validateStep(activeStep)) return
    const currentStepIdx = stepsList.findIndex(s => s.id === activeStep)
    if (currentStepIdx < stepsList.length - 1) {
      setActiveStep(stepsList[currentStepIdx + 1].id)
    }
  }

  const handlePrev = () => {
    const currentStepIdx = stepsList.findIndex(s => s.id === activeStep)
    if (currentStepIdx > 0) {
      setActiveStep(stepsList[currentStepIdx - 1].id)
    }
  }

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault()
    for (const step of stepsList) {
      if (!validateStep(step.id)) {
        setActiveStep(step.id)
        return
      }
    }
    onSubmit({
      ruleName,
      zoneId,
      zoneName: selectedZone?.name,
      cityCode: selectedZone?.cityCode ?? (cityCode || undefined),
      vehicleType: vehicleTypes,
      multiplier,
      demandThresholdPct: demandThresholdPct === '' ? null : demandThresholdPct,
      supplyThresholdPct: supplyThresholdPct === '' ? null : supplyThresholdPct,
      peakHourStart: peakHourStart || null,
      peakHourEnd: peakHourEnd || null,
      isPeakHourOnly,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      effectiveFrom,
      effectiveTo: effectiveTo || undefined,
      status
    })
  }

  return (
    <div className="space-y-6 text-left">
      <FormTabs activeTab={activeStep} onChange={handleStepChange} tabs={stepsList} />

      <Card className="premium-card">
        <CardContent className="p-6">
          {activeStep === 'basic' && (
            <div className="space-y-4 text-xs">
              <div className="border-b pb-3 mb-2">
                <h3 className="font-bold text-slate-800 text-sm">Surge Rule Settings</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Configure rule name, geographic scope, surge zone, and vehicle types.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Rule Name</label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. Cab Heavy Rain Surge"
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                />
                {errors.ruleName && <p className="text-[10px] text-rose-500 font-bold">{errors.ruleName}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">State (filter)</label>
                  <select
                    value={stateId}
                    onChange={(e) => {
                      setStateId(e.target.value)
                      setCityCode('')
                      setZoneId('')
                    }}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                  >
                    <option value="">All states</option>
                    {states.map((state) => (
                      <option key={state.id} value={state.id}>{state.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">City (filter)</label>
                  <select
                    value={cityCode}
                    onChange={(e) => {
                      setCityCode(e.target.value)
                      setZoneId('')
                    }}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                  >
                    <option value="">All cities</option>
                    {cityOptions.map((city) => (
                      <option key={city.id} value={city.code}>{city.name} ({city.code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Surge Zone</label>
                  <select
                    value={zoneId || UNSET_ZONE}
                    onChange={(e) => setZoneId(e.target.value === UNSET_ZONE ? '' : e.target.value)}
                    disabled={zonesLoading}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                  >
                    <option value={UNSET_ZONE}>{zonesLoading ? 'Loading zones...' : 'Select surge zone'}</option>
                    {zonesForCity.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name} ({zone.cityCode})
                      </option>
                    ))}
                  </select>
                  {errors.zoneId && <p className="text-[10px] text-rose-500 font-bold">{errors.zoneId}</p>}
                  {!zonesLoading && zonesForCity.length === 0 && (
                    <p className="text-[10px] text-amber-600">
                      No surge zones found for this filter. Create one in Geographic Management first.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Target Vehicle Types</label>
                <div className="flex gap-4 items-center bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-border">
                  {(['cab', 'auto', 'bike'] as const).map(type => (
                    <label key={type} className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={vehicleTypes.includes(type)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...vehicleTypes, type]
                            : vehicleTypes.filter(t => t !== type)
                          if (next.length > 0) setVehicleTypes(next)
                        }}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeStep === 'multiplier' && (
            <div className="space-y-4 text-xs">
              <div className="border-b pb-3 mb-2">
                <h3 className="font-bold text-slate-800 text-sm">Surge Factor Pricing</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Determine the surge multiplier rate.</p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Surge Multiplier Factor</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[0.5, 1.0, 1.5, 2.0].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMultiplier(val)}
                      className={`py-2 px-3 border text-xs font-bold rounded-lg transition-all ${
                        multiplier === val
                          ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                          : 'bg-slate-50 border-border text-slate-650 hover:bg-slate-100'
                      }`}
                    >
                      {val.toFixed(1)}x
                    </button>
                  ))}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Or Custom Multiplier (x)</label>
                  <input
                    type="number"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={multiplier}
                    onChange={(e) => setMultiplier(parseFloat(e.target.value) || 1.0)}
                    className="w-full p-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                  />
                  {errors.multiplier && <p className="text-[10px] text-rose-500 font-bold">{errors.multiplier}</p>}
                </div>
              </div>
            </div>
          )}

          {activeStep === 'thresholds' && (
            <div className="space-y-4 text-xs">
              <div className="border-b pb-3 mb-2">
                <h3 className="font-bold text-slate-800 text-sm">Demand, Supply & Peak-Hour Rules</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Optional triggers that gate when this surge window can activate.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Demand Threshold (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={demandThresholdPct}
                    onChange={(e) => setDemandThresholdPct(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 75"
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                  />
                  <p className="text-[9px] text-slate-400">Activate when ride demand exceeds this % of capacity.</p>
                  {errors.demandThresholdPct && <p className="text-[10px] text-rose-500 font-bold">{errors.demandThresholdPct}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Supply Threshold (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={supplyThresholdPct}
                    onChange={(e) => setSupplyThresholdPct(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 25"
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                  />
                  <p className="text-[9px] text-slate-400">Activate when available driver supply falls below this %.</p>
                  {errors.supplyThresholdPct && <p className="text-[10px] text-rose-500 font-bold">{errors.supplyThresholdPct}</p>}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPeakHourOnly}
                  onChange={(e) => setIsPeakHourOnly(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <span>Restrict to peak-hour window only</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Peak Hour Start</label>
                  <input
                    type="time"
                    value={peakHourStart}
                    onChange={(e) => setPeakHourStart(e.target.value)}
                    disabled={!isPeakHourOnly}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px] disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Peak Hour End</label>
                  <input
                    type="time"
                    value={peakHourEnd}
                    onChange={(e) => setPeakHourEnd(e.target.value)}
                    disabled={!isPeakHourOnly}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px] disabled:opacity-50"
                  />
                </div>
              </div>
              {errors.peakHourStart && <p className="text-[10px] text-rose-500 font-bold">{errors.peakHourStart}</p>}
            </div>
          )}

          {activeStep === 'validity' && (
            <div className="space-y-4 text-xs">
              <div className="border-b pb-3 mb-2">
                <h3 className="font-bold text-slate-800 text-sm">Validity Window & Scheduled Hours</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Determine when the surge rules are active.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Effective From</label>
                  <input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]" />
                  {errors.effectiveFrom && <p className="text-[10px] text-rose-500 font-bold">{errors.effectiveFrom}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Effective To (Optional)</label>
                  <input type="date" value={effectiveTo} onChange={(e) => setEffectiveTo(e.target.value)} className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Daily Start Time (Optional)</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]" />
                  {errors.startTime && <p className="text-[10px] text-rose-500 font-bold">{errors.startTime}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Daily End Time (Optional)</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]" />
                  {errors.endTime && <p className="text-[10px] text-rose-500 font-bold">{errors.endTime}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Initial Publish Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')} className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive / Draft</option>
                </select>
              </div>
            </div>
          )}

          {activeStep === 'review' && (
            <div className="space-y-4 text-xs">
              <div className="border-b pb-3 mb-2">
                <h3 className="font-bold text-slate-800 text-sm">Review Surge Configuration</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                <div className="space-y-2">
                  <p><strong>Rule Name:</strong> {ruleName}</p>
                  <p><strong>Surge Zone:</strong> {selectedZone?.name ?? '—'} {selectedZone?.cityCode ? `(${selectedZone.cityCode})` : ''}</p>
                  <p><strong>Vehicle Category:</strong> <span className="uppercase font-bold text-primary">{vehicleTypes.join(', ')}</span></p>
                  <p><strong>Multiplier:</strong> <span className="px-2 py-0.5 rounded font-black text-rose-700 bg-rose-50 border border-rose-100">{multiplier}x</span></p>
                </div>
                <div className="space-y-2 border-l pl-4">
                  <p><strong>Demand Threshold:</strong> {demandThresholdPct === '' ? '—' : `${demandThresholdPct}%`}</p>
                  <p><strong>Supply Threshold:</strong> {supplyThresholdPct === '' ? '—' : `${supplyThresholdPct}%`}</p>
                  <p><strong>Peak Hours:</strong> {isPeakHourOnly && peakHourStart && peakHourEnd ? `${peakHourStart} – ${peakHourEnd}` : 'Not restricted'}</p>
                  <p><strong>Validity:</strong> {effectiveFrom} {effectiveTo ? `to ${effectiveTo}` : 'onwards'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-8 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={handlePrev} disabled={activeStep === 'basic'} className="h-9 px-4 text-xs font-semibold rounded-lg gap-1">
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            {activeStep === 'review' ? (
              <Button type="button" onClick={handlePublish} disabled={loading} className="h-9 px-4 text-xs font-bold rounded-lg bg-primary hover:bg-primary/95 text-white gap-1.5">
                <Save className="h-4 w-4" />
                <span>{initialValues ? `Publish New Version (V${initialValues.version + 1})` : 'Publish Surge Rule'}</span>
              </Button>
            ) : (
              <Button type="button" onClick={handleNext} className="h-9 px-4 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white gap-1">
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
export default SurgeRuleWizardForm
