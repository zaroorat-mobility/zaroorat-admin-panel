import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFareRule } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardHeader, CardContent } from '@/shared/components/ui/Card'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Button } from '@/shared/components/ui/Button'
import { Edit2, ArrowLeft, Calendar, Shield, Clock, Car, Bike } from 'lucide-react'
import { FareRulePreviewCard } from '../components/FareRulePreviewCard'

export const FareRuleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: rule, isLoading, isError } = useFareRule(id || '')

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center p-12 text-slate-500 font-medium">
          Loading rule details...
        </div>
      </PageWrapper>
    )
  }

  if (isError || !rule) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center p-12 text-rose-500 font-medium">
          <p>Failed to find fare rule.</p>
          <button onClick={() => navigate('/pricing-management/fare-rules')} className="text-xs underline mt-2 text-slate-650">Back to list</button>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <PageHeader
        title={`Fare Rule: ${rule.ruleName}`}
        description="Detailed review of Base pricing tariffs, waiting charges, and night schedules."
        onBack={() => navigate('/pricing-management/fare-rules')}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/pricing-management/fare-rules')}
              className="gap-2 text-xs font-semibold h-9 rounded-lg border-border"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to list</span>
            </Button>
            <Button
              onClick={() => navigate(`/pricing-management/fare-rules/${rule.id}/edit`)}
              className="gap-2 text-xs font-semibold h-9 rounded-lg bg-primary hover:bg-primary/95 text-white"
            >
              <Edit2 className="h-4 w-4" />
              <span>Edit Configuration</span>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-4 text-left">
        {/* Left Side: Rule Details Grid */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="premium-card text-left">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded bg-primary/10 text-primary">
                    {rule.vehicleType === 'bike' ? <Bike className="h-4 w-4" /> : <Car className="h-4 w-4" />}
                  </span>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">{rule.ruleName}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Version V{rule.version} — Created on {new Date(rule.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
                <StatusBadge status={rule.status} />
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-xs text-slate-700">
              
              {/* Grid sections */}
              <div className="grid grid-cols-2 gap-6">
                
                {/* Pricing values */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    <span>Pricing Formula Parameters</span>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Base Fare:</span>
                      <strong className="text-slate-800 dark:text-white">₹{rule.baseFare.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Minimum Trip Fare:</span>
                      <strong className="text-slate-800 dark:text-white">₹{rule.minimumFare.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Distance Charge (Per KM):</span>
                      <strong className="text-slate-800 dark:text-white">₹{rule.perKmRate.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Duration Charge (Per Min):</span>
                      <strong className="text-slate-800 dark:text-white">₹{rule.perMinuteRate.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                {/* Waiting Charge details */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span>Waiting (In-Trip) Penalties</span>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Free Wait Period:</span>
                      <strong className="text-slate-800 dark:text-white">{rule.freeWaitingMinutes} Minutes</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Charge Per Minute:</span>
                      <strong className="text-slate-800 dark:text-white">₹{rule.waitingChargePerMinute.toFixed(2)} / min</strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* Night Surcharges Section */}
              <div className="space-y-3 border-t pt-4">
                <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Scheduled Night Surcharges</span>
                </h4>
                {rule.nightEnabled ? (
                  <div className="grid grid-cols-3 gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-border">
                    <div>
                      <p className="text-[10px] text-slate-400">Start Time</p>
                      <strong className="text-slate-850 dark:text-white text-xs font-mono">{rule.nightStartTime}</strong>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">End Time</p>
                      <strong className="text-slate-850 dark:text-white text-xs font-mono">{rule.nightEndTime}</strong>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Surcharge Percentage</p>
                      <strong className="text-amber-600 text-xs">{rule.nightChargePercentage}% Extra</strong>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-450 italic p-3 bg-slate-50/50 rounded-lg border border-dashed text-center">Night-time pricing surcharges are disabled for this configuration.</p>
                )}
              </div>

              {/* Rule Dates Validity */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4 text-[10px] text-slate-450">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>Effective From: <strong>{rule.effectiveFrom}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>Effective To: <strong>{rule.effectiveTo || 'Active Indefinitely'}</strong></span>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Side: Interactive Preview simulator widget */}
        <div className="space-y-6">
          <FareRulePreviewCard
            baseFare={rule.baseFare}
            minimumFare={rule.minimumFare}
            perKmRate={rule.perKmRate}
            perMinuteRate={rule.perMinuteRate}
            nightEnabled={rule.nightEnabled}
            nightChargePercentage={rule.nightChargePercentage}
          />
        </div>
      </div>
    </PageWrapper>
  )
}

export default FareRuleDetailsPage
