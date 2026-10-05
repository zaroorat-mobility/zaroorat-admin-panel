import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboardStats, useFinanceAuditLogs } from '../../transactions/hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { InfoCard, InfoCardGrid } from '@/shared/components/InfoCard'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { PageLoader, InfinityLoader } from '@/shared/components/loaders'
import {
  DollarSign, Activity, AlertTriangle,
  TrendingUp, TrendingDown, Clock, ShieldAlert, FileText, Landmark
} from 'lucide-react'

export const FinancialDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: stats, isLoading: isStatsLoading } = useDashboardStats()
  const { data: auditLogsRes, isLoading: isLogsLoading } = useFinanceAuditLogs()

  if (isStatsLoading) return <PageLoader />

  const recentLogs = auditLogsRes?.data?.slice(0, 20) || []
  const rev = stats?.revenue
  const act = stats?.actions
  const hlth = stats?.health

  const revenueKpis = [
    { label: 'Gross Transaction Value (GTV)', value: `₹${rev?.gtv.toLocaleString('en-IN')}`, icon: <DollarSign className="w-5 h-5" />, variant: 'blue' as const, sub: 'All completed PG captures' },
    { label: 'Net Revenue', value: `₹${rev?.netRevenue.toLocaleString('en-IN')}`, icon: <TrendingUp className="w-5 h-5" />, variant: 'blue' as const, sub: 'GTV minus refunds resolved' },
    { label: "Today's Collection", value: `₹${rev?.todayCollection.toLocaleString('en-IN')}`, icon: <Clock className="w-5 h-5" />, variant: 'blue' as const, sub: 'Captured today' },
    { label: 'Weekly Collection', value: `₹${rev?.weeklyCollection.toLocaleString('en-IN')}`, icon: <Clock className="w-5 h-5" />, variant: 'blue' as const, sub: 'Past 7 days' },
    { label: 'Outstanding Settlements Liability', value: `₹${rev?.outstandingSettlements.toLocaleString('en-IN')}`, icon: <Landmark className="w-5 h-5" />, variant: 'red' as const, sub: 'Pending batch payouts' },
    { label: 'Outstanding Refunds Liability', value: `₹${rev?.outstandingRefunds.toLocaleString('en-IN')}`, icon: <TrendingDown className="w-5 h-5" />, variant: 'red' as const, sub: 'Approved in-review refunds' },
    { label: 'Open Disputes Asset Value', value: `₹${rev?.openDisputesValue.toLocaleString('en-IN')}`, icon: <ShieldAlert className="w-5 h-5" />, variant: 'red' as const, sub: 'Value locked in disputes' }
  ]

  const healthKpis = [
    { label: 'PG Success Rate', value: `${hlth?.successRate}%`, icon: <Activity className="w-5 h-5" />, variant: 'blue' as const, sub: 'Successful captured vs total' },
    { label: 'Dispute Ratio', value: `${hlth?.disputeRatio}%`, icon: <ShieldAlert className="w-5 h-5" />, variant: 'red' as const, sub: 'Disputes raised vs total transactions' },
    { label: 'Refund Ratio', value: `${hlth?.refundRatio}%`, icon: <TrendingDown className="w-5 h-5" />, variant: 'red' as const, sub: 'Refund requests count vs total' },
    { label: 'Settlement Success Rate', value: `${hlth?.settlementSuccessRate}%`, icon: <Landmark className="w-5 h-5" />, variant: 'blue' as const, sub: 'Settlement processing success rate' }
  ]

  const severityColor = (sev: string) => {
    if (sev === 'critical') return 'bg-rose-50 text-rose-700 border-rose-100 font-bold'
    if (sev === 'warning') return 'bg-amber-50 text-amber-700 border-amber-100 font-bold'
    return 'bg-blue-50 text-blue-700 border-blue-100'
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Financial Operations Dashboard"
        description="Monitor revenue velocity, liability pipelines, gateway health performance, and critical variance exception queues."
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/financial-operations/audit-logs')}
            className="gap-2 text-xs font-semibold h-9 rounded-lg bg-primary hover:bg-primary-hover text-white shadow-sm"
          >
            <FileText className="h-4 w-4" />
            <span>View Finance Audit Trail</span>
          </Button>
        }

      />

      <div className="space-y-6">
        {/* Section 1: Revenue & Liabilities Overview */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider text-left flex items-center gap-1">
            <DollarSign className="h-4 w-4" /> Revenue & Liability Overview
          </h3>
          <InfoCardGrid cols={4}>
            {revenueKpis.map((k, idx) => (
              <InfoCard
                key={idx}
                label={k.label}
                value={k.value}
                icon={k.icon}
                variant={k.variant}
                subtitle={k.sub}
              />
            ))}
          </InfoCardGrid>
        </div>

        {/* Section 2: Action Required / Exception Queues */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider text-left flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" /> Exception Action Items
          </h3>
          <InfoCardGrid cols={5}>
            {[
              { label: 'Failed Transactions', count: act?.failedTransactions || 0, path: '/financial-operations/failed-transactions', icon: <AlertTriangle className="w-5 h-5" /> },
              { label: 'Open Disputes', count: act?.openDisputes || 0, path: '/financial-operations/disputes', icon: <ShieldAlert className="w-5 h-5" /> },
              { label: 'Refunds Pending Review', count: act?.refundsPendingReview || 0, path: '/financial-operations/refunds', icon: <Clock className="w-5 h-5" /> },
              { label: 'Settlement Variances', count: act?.settlementVariances || 0, path: '/financial-operations/reconciliation?variance=true', icon: <Landmark className="w-5 h-5" /> },
              { label: 'Unreconciled Variances', count: act?.unreconciledTransactions || 0, path: '/financial-operations/reconciliation', icon: <Activity className="w-5 h-5" /> }
            ].map((a, idx) => (
              <InfoCard
                key={idx}
                label={a.label}
                value={a.count}
                icon={a.icon}
                variant="red"
                subtitle="Click to view queue →"
                onClick={() => navigate(a.path)}
              />
            ))}
          </InfoCardGrid>
        </div>

        {/* Section 3: Health Metrics */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider text-left flex items-center gap-1">
            <Activity className="h-4 w-4" /> Transaction Health Rates
          </h3>
          <InfoCardGrid cols={4}>
            {healthKpis.map((k, idx) => (
              <InfoCard
                key={idx}
                label={k.label}
                value={k.value}
                icon={k.icon}
                variant={k.variant}
                subtitle={k.sub}
              />
            ))}
          </InfoCardGrid>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 gap-6 text-left">
          {/* Finance Activity Feed */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Recent Financial Activities (Finance Audit Logs)
            </h3>
            <Card className="premium-card">
              <CardContent className="p-4 space-y-4 max-h-[310px] overflow-y-auto">
                {isLogsLoading ? (
                  <div className="flex justify-center py-10"><InfinityLoader size={32} /></div>
                ) : recentLogs.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">No finance activity recorded.</div>
                ) : (
                  <div className="space-y-3">
                    {recentLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-3 text-xs justify-between items-start border-b border-border pb-3 last:border-0 last:pb-0">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] border uppercase font-black tracking-wider ${severityColor(log.severity)}`}>
                              {log.severity}
                            </span>
                            <span className="font-black text-slate-850 dark:text-slate-100">{log.action.replace(/_/g, ' ')}</span>
                          </div>
                          <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">{log.notes}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5 font-mono">By {log.user} · Correlation: {log.correlationId}</p>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}

export default FinancialDashboardPage
