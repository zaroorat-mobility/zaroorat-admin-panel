import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboardStats, useFinanceAuditLogs } from '../../transactions/hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { PageLoader, InfinityLoader } from '@/shared/components/loaders'
import {
  DollarSign, Activity, AlertTriangle, ShieldCheck,
  TrendingUp, TrendingDown, Clock, ArrowRight, ShieldAlert, FileText, Landmark,
  Calendar, Download
} from 'lucide-react'

export const FinancialDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: stats, isLoading: isStatsLoading } = useDashboardStats()
  const { data: auditLogsRes, isLoading: isLogsLoading } = useFinanceAuditLogs()
  const [gstPeriod, setGstPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('week')
  const [gstFromDate, setGstFromDate] = useState('')
  const [gstToDate, setGstToDate] = useState('')

  if (isStatsLoading) return <PageLoader />

  const recentLogs = auditLogsRes?.data?.slice(0, 20) || []
  const rev = stats?.revenue
  const act = stats?.actions
  const hlth = stats?.health
  const gts = stats?.gateways || []

  // GST collection values based on selected range
  const getGstMetrics = () => {
    switch (gstPeriod) {
      case 'today':
        return { total: 4850.00, cgst: 2425.00, sgst: 2425.00, igst: 0.00, taxable: 97000.00 }
      case 'month':
        return { total: 112500.00, cgst: 56250.00, sgst: 56250.00, igst: 0.00, taxable: 2250000.00 }
      case 'custom':
        return { total: 18500.00, cgst: 9250.00, sgst: 9250.00, igst: 0.00, taxable: 370000.00 }
      case 'week':
      default:
        return { total: 28420.00, cgst: 14210.00, sgst: 14210.00, igst: 0.00, taxable: 568400.00 }
    }
  }

  const { total: gstTotal, cgst: gstCgst, sgst: gstSgst, igst: gstIgst, taxable: gstTaxable } = getGstMetrics()

  const handleExportGstCSV = () => {
    const headers = ['Transaction ID', 'Date', 'Booking ID', 'Taxable Value (INR)', 'CGST (INR)', 'SGST (INR)', 'IGST (INR)', 'Total GST (INR)', 'Total Amount (INR)']
    const mockRows = [
      ['TXN-9011', '2026-07-26', 'R-9812', (gstTaxable * 0.4).toFixed(2), (gstCgst * 0.4).toFixed(2), (gstSgst * 0.4).toFixed(2), '0.00', (gstTotal * 0.4).toFixed(2), ((gstTaxable + gstTotal) * 0.4).toFixed(2)],
      ['TXN-9012', '2026-07-25', 'R-9811', (gstTaxable * 0.3).toFixed(2), (gstCgst * 0.3).toFixed(2), (gstSgst * 0.3).toFixed(2), '0.00', (gstTotal * 0.3).toFixed(2), ((gstTaxable + gstTotal) * 0.3).toFixed(2)],
      ['TXN-9013', '2026-07-24', 'R-9810', (gstTaxable * 0.2).toFixed(2), (gstCgst * 0.2).toFixed(2), (gstSgst * 0.2).toFixed(2), '0.00', (gstTotal * 0.2).toFixed(2), ((gstTaxable + gstTotal) * 0.2).toFixed(2)],
      ['TXN-9014', '2026-07-23', 'R-9808', (gstTaxable * 0.1).toFixed(2), (gstCgst * 0.1).toFixed(2), (gstSgst * 0.1).toFixed(2), '0.00', (gstTotal * 0.1).toFixed(2), ((gstTaxable + gstTotal) * 0.1).toFixed(2)]
    ]

    const csvContent = [headers.join(','), ...mockRows.map(row => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `gst_collection_report_${gstPeriod}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const revenueKpis = [
    { label: 'Gross Transaction Value (GTV)', value: `₹${rev?.gtv.toLocaleString('en-IN')}`, icon: <DollarSign className="h-4.5 w-4.5 text-primary" />, sub: 'All completed PG captures' },
    { label: 'Net Revenue', value: `₹${rev?.netRevenue.toLocaleString('en-IN')}`, icon: <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />, sub: 'GTV minus refunds resolved' },
    { label: "Today's Collection", value: `₹${rev?.todayCollection.toLocaleString('en-IN')}`, icon: <Clock className="h-4.5 w-4.5 text-blue-500" />, sub: 'Captured today' },
    { label: 'Weekly Collection', value: `₹${rev?.weeklyCollection.toLocaleString('en-IN')}`, icon: <Clock className="h-4.5 w-4.5 text-indigo-500" />, sub: 'Past 7 days' },
    { label: 'Outstanding Settlements Liability', value: `₹${rev?.outstandingSettlements.toLocaleString('en-IN')}`, icon: <Landmark className="h-4.5 w-4.5 text-amber-600" />, sub: 'Pending batch payouts' },
    { label: 'Outstanding Refunds Liability', value: `₹${rev?.outstandingRefunds.toLocaleString('en-IN')}`, icon: <TrendingDown className="h-4.5 w-4.5 text-rose-500" />, sub: 'Approved in-review refunds' },
    { label: 'Open Disputes Asset Value', value: `₹${rev?.openDisputesValue.toLocaleString('en-IN')}`, icon: <ShieldAlert className="h-4.5 w-4.5 text-rose-500" />, sub: 'Value locked in disputes' }
  ]

  const healthKpis = [
    { label: 'PG Success Rate', value: `${hlth?.successRate}%`, sub: 'Successful captured vs total' },
    { label: 'Avg Gateway Latency', value: `${hlth?.avgGatewayResponseTime}s`, sub: 'Gateway round-trip response' },
    { label: 'Dispute Ratio', value: `${hlth?.disputeRatio}%`, sub: 'Disputes raised vs total transactions' },
    { label: 'Refund Ratio', value: `${hlth?.refundRatio}%`, sub: 'Refund requests count vs total' },
    { label: 'Settlement Success Rate', value: `${hlth?.settlementSuccessRate}%`, sub: 'Settlement processing success rate' }
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
            className="gap-2 text-xs font-semibold h-9 rounded-lg bg-[#1F2B6D] hover:bg-[#1F2B6D]/90 text-white shadow-sm"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {revenueKpis.map((k, idx) => (
              <Card key={idx} className="premium-card">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">{k.label}</span>
                    <span className="p-1 rounded bg-slate-100 dark:bg-slate-800">{k.icon}</span>
                  </div>
                  <p className="text-xl font-black text-slate-850 dark:text-white tracking-tight">{k.value}</p>
                  <p className="text-[10px] text-slate-450 font-medium">{k.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* NEW SECTION: GST Collection Summary Box */}
        <div className="space-y-3 text-left">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Landmark className="h-4 w-4" /> GST & Tax Collection Ledger
          </h3>
          <Card className="premium-card">
            <CardContent className="p-5 space-y-5">
              {/* Header and Date Filter Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">GST Collection Summary</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Track CGST, SGST and IGST splits collected for tax compliance audits.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-border">
                    {(['today', 'week', 'month', 'custom'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setGstPeriod(p)}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-md capitalize transition-all cursor-pointer ${
                          gstPeriod === p 
                            ? 'bg-[#2B317A] text-white shadow-sm' 
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  {gstPeriod === 'custom' && (
                    <div className="flex items-center gap-2 border border-border rounded-lg px-2.5 py-1 bg-slate-50 dark:bg-slate-900 text-[10px]">
                      <span className="text-muted-foreground font-semibold">From:</span>
                      <input 
                        type="date" 
                        value={gstFromDate} 
                        onChange={e => setGstFromDate(e.target.value)} 
                        className="bg-transparent text-foreground outline-none border-none p-0 w-24 cursor-pointer [color-scheme:light]"
                      />
                      <span className="text-muted-foreground font-semibold">To:</span>
                      <input 
                        type="date" 
                        value={gstToDate} 
                        onChange={e => setGstToDate(e.target.value)} 
                        className="bg-transparent text-foreground outline-none border-none p-0 w-24 cursor-pointer [color-scheme:light]"
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleExportGstCSV}
                    className="gap-1.5 bg-[#2B317A] hover:bg-[#2B317A]/95 text-white text-xs font-semibold h-8 rounded-lg"
                  >
                    <Download className="h-3.5 w-3.5" /> Export Report
                  </Button>
                </div>
              </div>

              {/* GST breakdown display */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-medium">
                <div className="p-4 rounded-xl border border-border bg-slate-50/30 dark:bg-slate-900/10 flex flex-col justify-between">
                  <span className="text-slate-450 uppercase text-[9px] font-bold tracking-wider">Total GST Collected</span>
                  <h3 className="text-2xl font-black text-[#2B317A] dark:text-[#4F5FBF] mt-2">₹{gstTotal.toLocaleString('en-IN')}</h3>
                  <span className="text-[9px] text-slate-400 mt-1">Sum of CGST + SGST + IGST</span>
                </div>
                <div className="p-4 rounded-xl border border-border bg-slate-50/30 dark:bg-slate-900/10">
                  <span className="text-slate-450 uppercase text-[9px] font-bold tracking-wider">CGST (Central Tax)</span>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white mt-2">₹{gstCgst.toLocaleString('en-IN')}</h3>
                  <span className="text-[9px] text-slate-400">Intra-state central split</span>
                </div>
                <div className="p-4 rounded-xl border border-border bg-slate-50/30 dark:bg-slate-900/10">
                  <span className="text-slate-450 uppercase text-[9px] font-bold tracking-wider">SGST (State Tax)</span>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white mt-2">₹{gstSgst.toLocaleString('en-IN')}</h3>
                  <span className="text-[9px] text-slate-400">Intra-state state split</span>
                </div>
                <div className="p-4 rounded-xl border border-border bg-slate-50/30 dark:bg-slate-900/10">
                  <span className="text-slate-450 uppercase text-[9px] font-bold tracking-wider">IGST (Integrated Tax)</span>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white mt-2">₹{gstIgst.toLocaleString('en-IN')}</h3>
                  <span className="text-[9px] text-slate-400">Inter-state integrated split</span>
                </div>
              </div>

              {/* Taxable value vs tax reconciliation */}
              <div className="p-4 bg-indigo-50/20 dark:bg-indigo-950/15 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl flex items-center justify-between text-[11px] font-semibold text-indigo-855 dark:text-indigo-300">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4.5 w-4.5 text-indigo-550" />
                  <span>Taxable Base Value: <strong>₹{gstTaxable.toLocaleString('en-IN')}</strong></span>
                </div>
                <div>
                  <span>Reconciliation Ratio: <strong>5.0% (Average tax value vs base fare)</strong></span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 2: Action Required / Exception Queues */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider text-left flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" /> Exception Action Items
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 text-left">
            {[
              { label: 'Failed Transactions', count: act?.failedTransactions || 0, path: '/financial-operations/failed-transactions', color: 'border-rose-200 hover:border-rose-300 bg-rose-50/10' },
              { label: 'Open Disputes', count: act?.openDisputes || 0, path: '/financial-operations/disputes', color: 'border-amber-200 hover:border-amber-300 bg-amber-50/10' },
              { label: 'Refunds Pending Review', count: act?.refundsPendingReview || 0, path: '/financial-operations/refunds', color: 'border-indigo-200 hover:border-indigo-300 bg-indigo-50/10' },
              { label: 'Settlement Variances', count: act?.settlementVariances || 0, path: '/financial-operations/reconciliation?variance=true', color: 'border-rose-200 hover:border-rose-300 bg-rose-50/10' },
              { label: 'Unreconciled Variances', count: act?.unreconciledTransactions || 0, path: '/financial-operations/reconciliation', color: 'border-orange-200 hover:border-orange-300 bg-orange-50/10' }
            ].map((a, idx) => (
              <button
                key={idx}
                onClick={() => navigate(a.path)}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all hover:shadow-md cursor-pointer ${a.color}`}
              >
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">{a.label}</span>
                <div className="flex items-end justify-between mt-2">
                  <span className="text-2xl font-black text-slate-850 dark:text-white leading-none">{a.count}</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Health Metrics */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider text-left flex items-center gap-1">
            <Activity className="h-4 w-4" /> Transaction Health Rates
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 text-left">
            {healthKpis.map((k, idx) => (
              <Card key={idx} className="premium-card">
                <CardContent className="p-4 space-y-1">
                  <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">{k.label}</span>
                  <p className="text-lg font-black text-primary tracking-tight">{k.value}</p>
                  <p className="text-[10px] text-slate-450 font-medium leading-normal">{k.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Grid: Gateway Matrix & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
          {/* Gateway Health Matrix */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Gateway Health Matrix
            </h3>
            <Card className="premium-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-slate-50 dark:bg-slate-800/60 text-left">
                      {['Gateway', 'PG Success Rate', 'Failed Attempts', 'Avg Latency'].map(h => (
                        <th key={h} className="px-4 py-3 font-black text-slate-500 uppercase tracking-wide text-[9px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {gts.map((gt, idx) => (
                      <tr key={idx} className="hover:bg-slate-55 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-white">{gt.gateway}</td>
                        <td className="px-4 py-3.5 font-mono text-emerald-600 font-bold">{gt.successRate}%</td>
                        <td className="px-4 py-3.5 font-mono text-rose-600 font-semibold">{gt.failedCount} failed</td>
                        <td className="px-4 py-3.5 font-mono text-slate-550">{gt.avgResponseTime}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

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
