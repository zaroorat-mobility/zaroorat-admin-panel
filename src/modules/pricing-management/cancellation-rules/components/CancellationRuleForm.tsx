import React, { useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { Save, AlertCircle } from 'lucide-react'
import type { CancellationRule, CancellationActor, CancellationScenario, CancellationChargeType } from '../types'

interface CancellationRuleFormProps {
  initialValues?: CancellationRule | null
  onSubmit: (data: Omit<CancellationRule, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => void
  loading?: boolean
}

export const CancellationRuleForm: React.FC<CancellationRuleFormProps> = ({
  initialValues,
  onSubmit,
  loading
}) => {
  // Form states
  const [ruleName, setRuleName] = useState(initialValues?.ruleName || '')
  const [actor, setActor] = useState<CancellationActor>(initialValues?.actor || 'rider')
  const [scenario, setScenario] = useState<CancellationScenario>(initialValues?.scenario || 'before_assignment')
  const [chargeType, setChargeType] = useState<CancellationChargeType>(initialValues?.chargeType || 'fixed')
  const [chargeAmount, setChargeAmount] = useState<number>(initialValues?.chargeAmount || 20)
  const [status, setStatus] = useState<'active' | 'inactive'>(initialValues?.status || 'active')

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}

    if (!ruleName.trim()) errs.ruleName = 'Rule name is required.'
    if (chargeAmount < 0) errs.chargeAmount = 'Charge amount cannot be negative.'
    if (chargeType === 'percentage' && chargeAmount > 100) errs.chargeAmount = 'Percentage cannot exceed 100%.'

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setErrors({})
    onSubmit({
      ruleName,
      actor,
      scenario,
      chargeType,
      chargeAmount,
      status
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side fields */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="premium-card">
            <CardContent className="p-6 space-y-4 text-xs">
              <div className="border-b pb-3 mb-2">
                <h3 className="font-bold text-slate-800 text-sm">Cancellation Rule Specifications</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Define who is canceling, under what scenario, and what fee applies.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Rule Name</label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. Rider Late Cancellation Fee"
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                />
                {errors.ruleName && <p className="text-[10px] text-rose-500 font-bold">{errors.ruleName}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Cancelling Actor</label>
                  <select
                    value={actor}
                    onChange={(e) => setActor(e.target.value as CancellationActor)}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                  >
                    <option value="rider">Rider</option>
                    <option value="driver">Driver</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Cancellation Scenario</label>
                  <select
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value as CancellationScenario)}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                  >
                    <option value="before_assignment">Before Driver Assignment</option>
                    <option value="after_assignment">After Driver Assignment</option>
                    <option value="after_arrival">After Driver Arrives</option>
                    <option value="no_show">Passenger No Show</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Charge Type</label>
                  <select
                    value={chargeType}
                    onChange={(e) => setChargeType(e.target.value as CancellationChargeType)}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                  >
                    <option value="fixed">Fixed Flat Amount (₹)</option>
                    <option value="percentage">Percentage ( % )</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Charge Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                  />
                  {errors.chargeAmount && <p className="text-[10px] text-rose-500 font-bold">{errors.chargeAmount}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                >
                  <option value="active">Active (Deactivates other active rules with same actor + scenario)</option>
                  <option value="inactive">Inactive / Draft</option>
                </select>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Side: Information warning card */}
        <div className="space-y-4">
          <Card className="premium-card p-5 space-y-4">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-slate-600 leading-normal">
                <p className="font-bold text-slate-700 text-xs">Exclusivity Rule Enforced</p>
                <p className="text-[10px] text-slate-500">
                  Only ONE rule can be active at any given time for a specific combination of Actor (e.g. Rider) and Scenario (e.g. After Assignment).
                </p>
              </div>
            </div>
            
            <div className="border-t border-border pt-4 text-[10px] text-slate-400 leading-relaxed">
              Upon publishing as <strong>Active</strong>, any previously active rule matching these variables will automatically turn inactive.
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-white py-2.5 h-10 font-bold"
            >
              <Save className="h-4 w-4" />
              <span>{initialValues ? `Publish New Version (V${initialValues.version + 1})` : 'Publish Penalty Rule'}</span>
            </Button>
          </Card>
        </div>

      </div>
    </form>
  )
}
export default CancellationRuleForm
