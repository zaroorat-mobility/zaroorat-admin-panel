import React, { useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { FormTabs } from '@/shared/components/ui/FormTabs'
import { ChevronLeft, ChevronRight, Save, Zap } from 'lucide-react'
import type { SurgeRule } from '../types'
import type { VehicleType } from '@/modules/driver-management/types'

interface SurgeRuleWizardFormProps {
  initialValues?: SurgeRule | null
  onSubmit: (data: Omit<SurgeRule, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => void
  loading?: boolean
}

type StepType = 'basic' | 'multiplier' | 'validity' | 'review'

export const SurgeRuleWizardForm: React.FC<SurgeRuleWizardFormProps> = ({
  initialValues,
  onSubmit,
  loading
}) => {
  const [activeStep, setActiveStep] = useState<StepType>('basic')

  // Form states
  const [ruleName, setRuleName] = useState(initialValues?.ruleName || '')
  const [vehicleType, setVehicleType] = useState<VehicleType>(initialValues?.vehicleType || 'cab')
  const [multiplier, setMultiplier] = useState<number>(initialValues?.multiplier || 1.2)
  const [startTime, setStartTime] = useState(initialValues?.startTime || '')
  const [endTime, setEndTime] = useState(initialValues?.endTime || '')
  const [effectiveFrom, setEffectiveFrom] = useState(initialValues?.effectiveFrom || new Date().toISOString().split('T')[0])
  const [effectiveTo, setEffectiveTo] = useState(initialValues?.effectiveTo || '')
  const [status, setStatus] = useState<'active' | 'inactive'>(initialValues?.status || 'active')

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateStep = (step: StepType): boolean => {
    const errs: Record<string, string> = {}

    if (step === 'basic') {
      if (!ruleName.trim()) errs.ruleName = 'Rule name is required.'
    }

    if (step === 'multiplier') {
      if (multiplier < 1.0) errs.multiplier = 'Multiplier must be at least 1.0x.'
      if (multiplier > 5.0) errs.multiplier = 'Multiplier cannot exceed 5.0x.'
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
    { id: 'validity', label: '3. Validity Schedule' },
    { id: 'review', label: '4. Review & Publish' }
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
      vehicleType,
      multiplier,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      effectiveFrom,
      effectiveTo: effectiveTo || undefined,
      status
    })
  }

  return (
    <div className="space-y-6 text-left">
      <FormTabs
        activeTab={activeStep}
        onChange={handleStepChange}
        tabs={stepsList}
      />

      <Card className="premium-card">
        <CardContent className="p-6">
          {/* STEP 1: Basic Config */}
          {activeStep === 'basic' && (
            <div className="space-y-4 text-xs">
              <div className="border-b pb-3 mb-2">
                <h3 className="font-bold text-slate-800 text-sm">Surge Rule Settings</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Configure rule name and target vehicle type.</p>
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
            </div>
          )}

          {/* STEP 2: Multiplier */}
          {activeStep === 'multiplier' && (
            <div className="space-y-4 text-xs">
              <div className="border-b pb-3 mb-2">
                <h3 className="font-bold text-slate-800 text-sm">Surge Factor Pricing</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Determine the surge multiplier multiplier rate.</p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Surge Multiplier Factor</label>
                
                {/* Multiplier Presets */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[1.1, 1.2, 1.5, 2.0].map((val) => (
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
                    min="1.0"
                    max="5.0"
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

          {/* STEP 3: Validity Schedule */}
          {activeStep === 'validity' && (
            <div className="space-y-4 text-xs">
              <div className="border-b pb-3 mb-2">
                <h3 className="font-bold text-slate-800 text-sm">Validity Window & Scheduled Hours</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Determine when the surge rules are active.</p>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Start Hour Time (Optional)</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                  />
                  {errors.startTime && <p className="text-[10px] text-rose-500 font-bold">{errors.startTime}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">End Hour Time (Optional)</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                  />
                  {errors.endTime && <p className="text-[10px] text-rose-500 font-bold">{errors.endTime}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Initial Publish Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                >
                  <option value="active">Active (Will deactivate other surge rules for this vehicle type)</option>
                  <option value="inactive">Inactive / Draft</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Publish */}
          {activeStep === 'review' && (
            <div className="space-y-4 text-xs">
              <div className="border-b pb-3 mb-2">
                <h3 className="font-bold text-slate-800 text-sm">Review Surge Configuration</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Please review the surge details before submitting.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                <div className="space-y-2">
                  <p><strong>Rule Name:</strong> {ruleName}</p>
                  <p><strong>Vehicle Category:</strong> <span className="uppercase font-bold text-primary">{vehicleType}</span></p>
                  <p><strong>Multiplier Rate:</strong> <span className="px-2 py-0.5 rounded font-black text-rose-700 bg-rose-50 border border-rose-100">{multiplier}x</span></p>
                </div>
                <div className="space-y-2 border-l pl-4">
                  <p><strong>Status:</strong> {status === 'active' ? <span className="text-emerald-600 font-bold">ACTIVE</span> : <span className="text-slate-500 font-bold">INACTIVE</span>}</p>
                  <p><strong>Time Window:</strong> {startTime && endTime ? `${startTime} to ${endTime}` : 'All Day (No schedule constraints)'}</p>
                  <p><strong>Effective Period:</strong> {effectiveFrom} {effectiveTo ? `to ${effectiveTo}` : '(No End Expiry)'}</p>
                </div>
              </div>

              {status === 'active' && (
                <div className="flex gap-2 p-3 bg-amber-50/50 border border-amber-250 rounded-xl text-amber-800">
                  <Zap className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Auto-Deactivation Notification</p>
                    <p className="text-[10px] text-amber-700 mt-0.5">
                      Publishing this rule as Active will automatically turn off other active surge rules for <strong>{vehicleType.toUpperCase()}</strong> categories.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Wizard Footer Controls */}
          <div className="flex justify-between items-center mt-8 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrev}
              disabled={activeStep === 'basic'}
              className="h-9 px-4 text-xs font-semibold rounded-lg gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            {activeStep === 'review' ? (
              <Button
                type="button"
                onClick={handlePublish}
                disabled={loading}
                className="h-9 px-4 text-xs font-bold rounded-lg bg-primary hover:bg-primary/95 text-white gap-1.5"
              >
                <Save className="h-4 w-4" />
                <span>{initialValues ? `Publish New Version (V${initialValues.version + 1})` : 'Publish Surge Rule'}</span>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                className="h-9 px-4 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white gap-1"
              >
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
