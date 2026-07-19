import React, { useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { FormTabs } from '@/shared/components/ui/FormTabs'
import { ChevronLeft, ChevronRight, Save, Info, Sparkles, CheckCircle2 } from 'lucide-react'
import type { FareRule } from '../types'
import type { VehicleType } from '@/modules/driver-management/types'
import { FareRulePreviewCard } from './FareRulePreviewCard'

interface FareRuleWizardFormProps {
  initialValues?: FareRule | null
  onSubmit: (data: Omit<FareRule, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => void
  loading?: boolean
}

type StepType = 'basic' | 'base_pricing' | 'waiting' | 'night' | 'simulation' | 'review'

export const FareRuleWizardForm: React.FC<FareRuleWizardFormProps> = ({
  initialValues,
  onSubmit,
  loading
}) => {
  const [activeStep, setActiveStep] = useState<StepType>('basic')

  // Form states
  const [ruleName, setRuleName] = useState(initialValues?.ruleName || '')
  const [vehicleType, setVehicleType] = useState<VehicleType>(initialValues?.vehicleType || 'cab')
  const [status, setStatus] = useState<'active' | 'inactive'>(initialValues?.status || 'active')
  const [effectiveFrom, setEffectiveFrom] = useState(initialValues?.effectiveFrom || new Date().toISOString().split('T')[0])
  const [effectiveTo, setEffectiveTo] = useState(initialValues?.effectiveTo || '')

  const [baseFare, setBaseFare] = useState(initialValues?.baseFare || 50)
  const [minimumFare, setMinimumFare] = useState(initialValues?.minimumFare || 60)
  const [perKmRate, setPerKmRate] = useState(initialValues?.perKmRate || 12)
  const [perMinuteRate, setPerMinuteRate] = useState(initialValues?.perMinuteRate || 1.2)

  const [freeWaitingMinutes, setFreeWaitingMinutes] = useState(initialValues?.freeWaitingMinutes || 3)
  const [waitingChargePerMinute, setWaitingChargePerMinute] = useState(initialValues?.waitingChargePerMinute || 2.0)

  const [nightEnabled, setNightEnabled] = useState(initialValues?.nightEnabled || false)
  const [nightStartTime, setNightStartTime] = useState(initialValues?.nightStartTime || '22:00')
  const [nightEndTime, setNightEndTime] = useState(initialValues?.nightEndTime || '05:00')
  const [nightChargePercentage, setNightChargePercentage] = useState(initialValues?.nightChargePercentage || 20)

  // Errors for validations
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validator
  const validateStep = (step: StepType): boolean => {
    const errs: Record<string, string> = {}
    
    if (step === 'basic') {
      if (!ruleName.trim()) errs.ruleName = 'Rule name is required.'
      if (!effectiveFrom) errs.effectiveFrom = 'Effective From date is required.'
    }

    if (step === 'base_pricing') {
      if (baseFare < 0) errs.baseFare = 'Base fare cannot be negative.'
      if (minimumFare < 0) errs.minimumFare = 'Minimum fare cannot be negative.'
      if (perKmRate < 0) errs.perKmRate = 'Per KM rate cannot be negative.'
      if (perMinuteRate < 0) errs.perMinuteRate = 'Per Minute rate cannot be negative.'
      if (minimumFare < baseFare) errs.minimumFare = 'Minimum fare should be greater than or equal to Base fare.'
    }

    if (step === 'waiting') {
      if (freeWaitingMinutes < 0) errs.freeWaitingMinutes = 'Free waiting minutes cannot be negative.'
      if (waitingChargePerMinute < 0) errs.waitingChargePerMinute = 'Waiting charge per minute cannot be negative.'
    }

    if (step === 'night' && nightEnabled) {
      if (!nightStartTime) errs.nightStartTime = 'Start Time is required.'
      if (!nightEndTime) errs.nightEndTime = 'End Time is required.'
      if (nightChargePercentage <= 0 || nightChargePercentage > 100) {
        errs.nightChargePercentage = 'Surcharge percentage must be between 1% and 100%.'
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const stepsList: { id: StepType; label: string }[] = [
    { id: 'basic', label: '1. Basic Details' },
    { id: 'base_pricing', label: '2. Base Pricing' },
    { id: 'waiting', label: '3. Waiting Charges' },
    { id: 'night', label: '4. Night Pricing' },
    { id: 'simulation', label: '5. Fare Simulator' },
    { id: 'review', label: '6. Review & Publish' }
  ]

  const handleStepChange = (targetStepId: StepType) => {
    // Validate current step before moving
    const currentStepIdx = stepsList.findIndex(s => s.id === activeStep)
    const targetStepIdx = stepsList.findIndex(s => s.id === targetStepId)

    // Moving forward requires step validations
    if (targetStepIdx > currentStepIdx) {
      // Validate all steps between current and target
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
    // Validate all steps before submitting
    for (const step of stepsList) {
      if (!validateStep(step.id)) {
        setActiveStep(step.id)
        return
      }
    }
    onSubmit({
      ruleName,
      vehicleType,
      status,
      effectiveFrom,
      effectiveTo: effectiveTo || undefined,
      baseFare,
      minimumFare,
      perKmRate,
      perMinuteRate,
      freeWaitingMinutes,
      waitingChargePerMinute,
      nightEnabled,
      nightStartTime,
      nightEndTime,
      nightChargePercentage
    })
  }

  return (
    <div className="space-y-6 text-left">
      {/* Wizard Form Tabs Navigation */}
      <FormTabs
        activeTab={activeStep}
        onChange={handleStepChange}
        tabs={stepsList}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Steps Content */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="premium-card text-left">
            <CardContent className="p-6">
              
              {/* STEP 1: Basic Config */}
              {activeStep === 'basic' && (
                <div className="space-y-4 text-xs">
                  <div className="border-b pb-3 mb-2">
                    <h3 className="font-bold text-slate-800 text-sm">Rule Basic Settings</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Define name, vehicle category, and active duration boundaries.</p>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Rule Name</label>
                    <input
                      type="text"
                      value={ruleName}
                      onChange={(e) => setRuleName(e.target.value)}
                      placeholder="e.g. Cab Standard Tariff V2"
                      className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                    />
                    {errors.ruleName && <p className="text-[10px] text-rose-500 font-bold">{errors.ruleName}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Vehicle Type</label>
                      <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                        className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                      >
                        <option value="cab">Cab</option>
                        <option value="auto">Auto</option>
                        <option value="bike">Bike</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Rule Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                        className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive / Draft</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Effective From</label>
                      <input
                        type="date"
                        value={effectiveFrom}
                        onChange={(e) => setEffectiveFrom(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                      />
                      {errors.effectiveFrom && <p className="text-[10px] text-rose-500 font-bold">{errors.effectiveFrom}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Effective To (Optional)</label>
                      <input
                        type="date"
                        value={effectiveTo}
                        onChange={(e) => setEffectiveTo(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Base Pricing */}
              {activeStep === 'base_pricing' && (
                <div className="space-y-4 text-xs">
                  <div className="border-b pb-3 mb-2">
                    <h3 className="font-bold text-slate-800 text-sm">Base Tariffs Configuration</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Determine the basic pricing structure including base fare, minimum bounds, and mileage rates.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Base Fare (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={baseFare}
                        onChange={(e) => setBaseFare(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                      />
                      {errors.baseFare && <p className="text-[10px] text-rose-500 font-bold">{errors.baseFare}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Minimum Fare (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={minimumFare}
                        onChange={(e) => setMinimumFare(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                      />
                      {errors.minimumFare && <p className="text-[10px] text-rose-500 font-bold">{errors.minimumFare}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Per KM Rate (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={perKmRate}
                        onChange={(e) => setPerKmRate(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                      />
                      {errors.perKmRate && <p className="text-[10px] text-rose-500 font-bold">{errors.perKmRate}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Per Minute Rate (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={perMinuteRate}
                        onChange={(e) => setPerMinuteRate(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                      />
                      {errors.perMinuteRate && <p className="text-[10px] text-rose-500 font-bold">{errors.perMinuteRate}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Waiting Charges */}
              {activeStep === 'waiting' && (
                <div className="space-y-4 text-xs">
                  <div className="border-b pb-3 mb-2">
                    <h3 className="font-bold text-slate-800 text-sm">Waiting Charges Settings</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Determine waiting penalty charges calculation parameters.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Free Waiting Minutes</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={freeWaitingMinutes}
                        onChange={(e) => setFreeWaitingMinutes(parseInt(e.target.value) || 0)}
                        className="w-full p-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                      />
                      {errors.freeWaitingMinutes && <p className="text-[10px] text-rose-500 font-bold">{errors.freeWaitingMinutes}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Waiting Charge Per Minute (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={waitingChargePerMinute}
                        onChange={(e) => setWaitingChargePerMinute(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                      />
                      {errors.waitingChargePerMinute && <p className="text-[10px] text-rose-500 font-bold">{errors.waitingChargePerMinute}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Night Pricing */}
              {activeStep === 'night' && (
                <div className="space-y-4 text-xs">
                  <div className="border-b pb-3 mb-2">
                    <h3 className="font-bold text-slate-800 text-sm">Night Surcharges Rules</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Enable and customize scheduler night-time ride multipliers.</p>
                  </div>

                  <div className="flex items-center gap-2 mb-2 text-left">
                    <input
                      type="checkbox"
                      id="nightEnabled"
                      checked={nightEnabled}
                      onChange={(e) => setNightEnabled(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-slate-50 dark:bg-slate-950 cursor-pointer"
                    />
                    <label htmlFor="nightEnabled" className="text-xs font-bold text-slate-750 select-none cursor-pointer">
                      Enable Night Surcharge Schedulers
                    </label>
                  </div>

                  {nightEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 animate-in fade-in slide-in-from-top-1 duration-100">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Start Time</label>
                        <input
                          type="time"
                          value={nightStartTime}
                          onChange={(e) => setNightStartTime(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                        />
                        {errors.nightStartTime && <p className="text-[10px] text-rose-500 font-bold">{errors.nightStartTime}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">End Time</label>
                        <input
                          type="time"
                          value={nightEndTime}
                          onChange={(e) => setNightEndTime(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                        />
                        {errors.nightEndTime && <p className="text-[10px] text-rose-500 font-bold">{errors.nightEndTime}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Surcharge (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={nightChargePercentage}
                          onChange={(e) => setNightChargePercentage(parseInt(e.target.value) || 0)}
                          className="w-full p-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                        />
                        {errors.nightChargePercentage && <p className="text-[10px] text-rose-500 font-bold">{errors.nightChargePercentage}</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 5: Simulation */}
              {activeStep === 'simulation' && (
                <div className="space-y-4 text-xs">
                  <div className="border-b pb-3 mb-2 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Interactive Fare Simulator</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Test configuration estimates in real-time on the right card panel before finalizing.</p>
                    </div>
                    <Sparkles className="h-5 w-5 text-primary animate-bounce" />
                  </div>
                  <div className="flex gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20 text-xs leading-normal">
                    <Info className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-bold text-primary">Simulator Instructions</p>
                      <p className="text-slate-600 mt-0.5">Adjust the distance and duration values on the simulator preview widget. The estimate on the right will update immediately matching your current wizard details.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: Review & Publish */}
              {activeStep === 'review' && (
                <div className="space-y-4 text-xs">
                  <div className="border-b pb-3 mb-2">
                    <h3 className="font-bold text-slate-800 text-sm">Review & Publish Rule</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Review pricing variables, dates, and submit to live calculation engines.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border border-border p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl">
                    <div className="space-y-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Rule Metadata</p>
                      <p><strong>Name:</strong> {ruleName}</p>
                      <p><strong>Vehicle Category:</strong> <span className="uppercase font-bold text-primary">{vehicleType}</span></p>
                      <p><strong>Status:</strong> {status === 'active' ? <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">ACTIVE</span> : <span className="text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded border">DRAFT</span>}</p>
                      <p><strong>Effective Dates:</strong> {effectiveFrom} {effectiveTo ? `to ${effectiveTo}` : '(No End Expiry)'}</p>
                    </div>
                    <div className="space-y-2 border-l pl-4">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Tariff Specifications</p>
                      <p><strong>Base Fare:</strong> ₹{baseFare.toFixed(2)}</p>
                      <p><strong>Min Fare:</strong> ₹{minimumFare.toFixed(2)}</p>
                      <p><strong>Rates:</strong> ₹{perKmRate}/KM, ₹{perMinuteRate}/Min</p>
                      <p><strong>Waiting:</strong> ₹{waitingChargePerMinute}/min after {freeWaitingMinutes}m</p>
                      <p><strong>Night Surcharge:</strong> {nightEnabled ? `Enabled (+${nightChargePercentage}%, ${nightStartTime}-${nightEndTime})` : 'Disabled'}</p>
                    </div>
                  </div>

                  {status === 'active' && (
                    <div className="flex gap-2 p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-amber-800 text-left">
                      <CheckCircle2 className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Auto-Deactivation Event</p>
                        <p className="text-[10px] text-amber-700/90 leading-relaxed mt-0.5">
                          Activating this configuration will automatically deactivate any other active rule for <strong>{vehicleType.toUpperCase()}</strong> categories. Historical data remains intact as Version {initialValues ? initialValues.version : 1}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Actions Footer */}
              <div className="flex justify-between items-center mt-8 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  disabled={activeStep === 'basic'}
                  className="h-9 px-4 text-xs font-semibold rounded-lg gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous Step</span>
                </Button>

                {activeStep === 'review' ? (
                  <Button
                    type="button"
                    onClick={handlePublish}
                    disabled={loading}
                    className="h-9 px-4 text-xs font-bold rounded-lg bg-primary hover:bg-primary/95 text-white gap-1.5"
                  >
                    <Save className="h-4 w-4" />
                    <span>{initialValues ? `Publish New Version (V${(initialValues.version || 1) + 1})` : 'Publish Fare Rule'}</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="h-9 px-4 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white gap-1"
                  >
                    <span>Next Step</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Side: Interactive Preview simulator widget */}
        <div className="space-y-6">
          <FareRulePreviewCard
            baseFare={baseFare}
            minimumFare={minimumFare}
            perKmRate={perKmRate}
            perMinuteRate={perMinuteRate}
            nightEnabled={nightEnabled}
            nightChargePercentage={nightChargePercentage}
          />
        </div>
      </div>
    </div>
  )
}
