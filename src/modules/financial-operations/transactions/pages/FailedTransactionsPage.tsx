import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useFailedMetrics } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { PageLoader } from '@/shared/components/loaders'
import {
  ArrowLeft, Clock, ShieldAlert, AlertTriangle, CreditCard, Ban, Activity, Landmark
} from 'lucide-react'

export const FailedTransactionsPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: metrics, isLoading } = useFailedMetrics()

  if (isLoading) return <PageLoader />

  const kpis = [
    { label: 'Failed Attempts Today', value: metrics?.totalFailedToday || 0, icon: <Clock className="h-4.5 w-4.5 text-rose-600" />, color: 'bg-rose-50 text-rose-700' },
    { label: 'Gateway Timeouts', value: metrics?.gatewayTimeouts || 0, icon: <Activity className="h-4.5 w-4.5 text-rose-600" />, color: 'bg-rose-50 text-rose-700' },
    { label: 'OTP Failures', value: metrics?.otpFailures || 0, icon: <ShieldAlert className="h-4.5 w-4.5 text-amber-600" />, color: 'bg-amber-50 text-amber-700' },
    { label: 'Insufficient Funds', value: metrics?.insufficientFunds || 0, icon: <CreditCard className="h-4.5 w-4.5 text-rose-600" />, color: 'bg-rose-50 text-rose-700' },
    { label: 'Bank Declines', value: metrics?.bankDeclines || 0, icon: <Ban className="h-4.5 w-4.5 text-rose-600" />, color: 'bg-rose-50 text-rose-700' }
  ]

  const reasons = metrics?.reasons || []
  const trends = metrics?.trends || []
  const matrix = metrics?.matrix || []

  return (
    <PageWrapper>
      <PageHeader
        title="Gateway Failures Analyzer"
        description="Troubleshoot payment gateway timeouts, bank declines, insufficient funds, and OTP expiration trends."
        actions={
          <Button
            onClick={() => navigate('/financial-operations/transactions')}
            className="btn-secondary flex items-center gap-2 text-xs font-semibold h-9 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Ledger
          </Button>
        }
      />

      <div className="space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 text-left">
          {kpis.map((k, idx) => (
            <Card key={idx} className="premium-card">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">{k.label}</span>
                  <span className={`p-1 rounded ${k.color}`}>{k.icon}</span>
                </div>
                <p className="text-xl font-black text-slate-850 dark:text-white tracking-tight">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reason Distribution & Error Trends charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          {/* Reason distribution list */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> Failure Reasons Distribution
            </h3>
            <Card className="premium-card p-4 space-y-3.5">
              {reasons.map((r, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{r.reason} ({r.code})</span>
                    <span className="font-mono font-bold text-slate-500">{r.count} errors ({r.percent}%)</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full transition-all duration-500"
                      style={{ width: `${r.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* Error trends */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Failure Trends
            </h3>
            <Card className="premium-card p-4 flex flex-col justify-between h-[234px]">
              <div className="space-y-4">
                {trends.map((t, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs border-b border-border pb-3 last:border-0 last:pb-0">
                    <span className="text-slate-500 font-bold">{t.label}</span>
                    <strong className="text-rose-600 font-mono text-sm font-black">{t.count} failed</strong>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-455 font-medium italic mt-2">PG timeout rates have reduced by 14% this week.</p>
            </Card>
          </div>
        </div>

        {/* Gateway Failure success rate Matrix table */}
        <div className="space-y-3 text-left">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Landmark className="h-4 w-4" /> Gateway Failure success rate Matrix
          </h3>
          <Card className="premium-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-slate-50 dark:bg-slate-800/60 text-left">
                    {['Payment Gateway Name', 'Total Checkout Attempts', 'Failed Attempts count', 'PG Success Rate'].map(h => (
                      <th key={h} className="px-4 py-3.5 font-black text-slate-500 uppercase tracking-wide text-[9px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {matrix.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-55 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-white">{row.gateway}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-550">{row.totalAttempts} attempts</td>
                      <td className="px-4 py-3.5 font-mono text-rose-600 font-bold">{row.failedAttempts} failed</td>
                      <td className="px-4 py-3.5 font-mono text-emerald-600 font-black">{row.successRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  )
}

export default FailedTransactionsPage
