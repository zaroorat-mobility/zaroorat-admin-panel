import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCancellationRule } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardHeader, CardContent } from '@/shared/components/ui/Card'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Button } from '@/shared/components/ui/Button'
import { Edit2, ArrowLeft, User, Shield, AlertOctagon } from 'lucide-react'

export const CancellationRuleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: rule, isLoading, isError } = useCancellationRule(id || '')

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center p-12 text-slate-500 font-medium">
          Loading cancellation rule details...
        </div>
      </PageWrapper>
    )
  }

  if (isError || !rule) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center p-12 text-rose-500 font-medium">
          <p>Failed to find cancellation rule.</p>
          <button onClick={() => navigate('/pricing-management/cancellation-rules')} className="text-xs underline mt-2 text-slate-650">Back to list</button>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <PageHeader
        title={`Cancellation Rule: ${rule.ruleName}`}
        description="Detailed review of actor cancellation fees and scenario rules."
        onBack={() => navigate('/pricing-management/cancellation-rules')}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/pricing-management/cancellation-rules')}
              className="gap-2 text-xs font-semibold h-9 rounded-lg border-border"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to list</span>
            </Button>
            <Button
              onClick={() => navigate(`/pricing-management/cancellation-rules/${rule.id}/edit`)}
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
              <span className="p-1.5 rounded bg-rose-500/10 text-rose-500">
                <AlertOctagon className="h-4 w-4" />
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
            
            {/* Rule Config details */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span>Operational Variables</span>
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Actor Entity:</span>
                  <span className="capitalize font-bold text-slate-800 dark:text-white flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-slate-450" />
                    {rule.actor}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Scenario Context:</span>
                  <span className="font-mono text-slate-700 font-bold dark:text-slate-350">
                    {rule.scenario.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Charge details */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1.5">
                <AlertOctagon className="h-3.5 w-3.5 text-rose-500" />
                <span>Charge Settings</span>
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Fee Deduction Model:</span>
                  <span className="capitalize font-semibold text-slate-850 dark:text-white">
                    {rule.chargeType === 'fixed' ? 'Fixed Flat Rate' : 'Percentage Rate'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Deduction Amount:</span>
                  <strong className="text-slate-850 dark:text-white text-sm">
                    {rule.chargeType === 'fixed' ? `₹${rule.chargeAmount.toFixed(2)}` : `${rule.chargeAmount}%`}
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

export default CancellationRuleDetailsPage
