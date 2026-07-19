import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSurgeRule } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardHeader, CardContent } from '@/shared/components/ui/Card'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Button } from '@/shared/components/ui/Button'
import { Edit2, ArrowLeft, Clock, Shield, Zap, Car, Bike } from 'lucide-react'

export const SurgeRuleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: rule, isLoading, isError } = useSurgeRule(id || '')

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center p-12 text-slate-500 font-medium">
          Loading surge rule details...
        </div>
      </PageWrapper>
    )
  }

  if (isError || !rule) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center p-12 text-rose-500 font-medium">
          <p>Failed to find surge rule.</p>
          <button onClick={() => navigate('/pricing-management/surge-rules')} className="text-xs underline mt-2 text-slate-650">Back to list</button>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <PageHeader
        title={`Surge Rule: ${rule.ruleName}`}
        description="Detailed review of surge parameters, multiplier settings, and validation schedules."
        onBack={() => navigate('/pricing-management/surge-rules')}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/pricing-management/surge-rules')}
              className="gap-2 text-xs font-semibold h-9 rounded-lg border-border"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to list</span>
            </Button>
            <Button
              onClick={() => navigate(`/pricing-management/surge-rules/${rule.id}/edit`)}
              className="gap-2 text-xs font-semibold h-9 rounded-lg bg-primary hover:bg-primary/95 text-white"
            >
              <Edit2 className="h-4 w-4" />
              <span>Edit Configuration</span>
            </Button>
          </div>
        }
      />

      <Card className="premium-card text-left max-w-3xl mt-4">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded bg-amber-500/10 text-amber-500">
                <Zap className="h-4 w-4" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Core Details */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span>Rule Configuration</span>
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Vehicle Category:</span>
                  <span className="uppercase font-bold text-slate-800 dark:text-white flex items-center gap-1">
                    {rule.vehicleType === 'bike' ? <Bike className="h-3.5 w-3.5 text-slate-450" /> : <Car className="h-3.5 w-3.5 text-slate-450" />}
                    {rule.vehicleType}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Surge Multiplier Factor:</span>
                  <span className="px-2 py-0.5 rounded font-black text-rose-700 bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400">
                    {rule.multiplier.toFixed(1)}x
                  </span>
                </div>
              </div>
            </div>

            {/* Time windows */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span>Time Constraints Schedule</span>
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Daily Time Window:</span>
                  <strong className="text-slate-800 dark:text-white font-mono">
                    {rule.startTime && rule.endTime ? `${rule.startTime} - ${rule.endTime}` : 'All Day (No hour restrictions)'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Effective Date Period:</span>
                  <strong className="text-slate-800 dark:text-white font-mono">
                    {rule.effectiveFrom} {rule.effectiveTo ? `to ${rule.effectiveTo}` : 'onwards'}
                  </strong>
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  )
}

export default SurgeRuleDetailsPage
