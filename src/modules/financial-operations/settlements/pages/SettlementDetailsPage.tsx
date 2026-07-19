import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSettlement, useUpdateSettlementStatus } from '../hooks'
import {
  SettlementStatusBadge, SettlementSummaryCard,
  DriverPayoutCard, SettlementTimeline
} from '../components'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardHeader, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { FormTabs } from '@/shared/components/ui/FormTabs'
import { PageLoader } from '@/shared/components/loaders'
import {
  ArrowLeft, CreditCard, SlidersHorizontal,
  FileText, ChevronRight, Play, CheckCircle2
} from 'lucide-react'

type Tab = 'overview' | 'drivers' | 'transactions' | 'adjustments' | 'timeline' | 'audit'

export const SettlementDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const { data: batch, isLoading } = useSettlement(id!)
  const updateStatus = useUpdateSettlementStatus()

  if (isLoading) return <div className="flex justify-center py-32"><PageLoader /></div>
  if (!batch) return <div className="p-8 text-center text-slate-500">Settlement batch not found.</div>

  const handleStatusChange = (status: 'pending' | 'processing' | 'completed' | 'failed') => {
    updateStatus.mutate({ id: batch.id, status, actor: 'Finance Manager' })
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'drivers', label: `Drivers (${batch.totalDrivers})` },
    { id: 'transactions', label: 'Transactions' },
    { id: 'adjustments', label: `Adjustments (${batch.adjustments.length})` },
    { id: 'timeline', label: 'Timeline' },
    { id: 'audit', label: 'Audit Trail' }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title={batch.batchNumber}
        description={`Settlement period: ${batch.periodStart} → ${batch.periodEnd}`}
        actions={
          <div className="flex gap-2">
            <Button
              onClick={() => navigate('/financial-operations/settlements')}
              className="btn-secondary flex items-center gap-2 text-xs font-semibold h-9 rounded-lg"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {batch.status === 'draft' && (
              <Button
                onClick={() => handleStatusChange('pending')}
                className="gap-2 text-xs font-semibold h-9 rounded-lg bg-primary hover:bg-primary/95 text-white"
              >
                <ChevronRight className="h-4 w-4" /> Submit for Approval
              </Button>
            )}
            {batch.status === 'pending' && (
              <Button
                onClick={() => handleStatusChange('processing')}
                className="gap-2 text-xs font-semibold h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Play className="h-4 w-4" /> Start Processing
              </Button>
            )}
            {batch.status === 'processing' && (
              <Button
                onClick={() => handleStatusChange('completed')}
                className="gap-2 text-xs font-semibold h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4" /> Mark Completed
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-6">
        {/* Status Strip Card */}
        <Card className="premium-card text-left">
          <CardContent className="p-4 flex flex-wrap gap-6 items-center">
            <SettlementStatusBadge status={batch.status} />
            {[
              { label: 'Gross Amount', value: `₹${batch.totalGrossAmount.toLocaleString('en-IN')}`, color: 'text-slate-700 dark:text-slate-350' },
              { label: 'Commission', value: `-₹${batch.totalCommission.toLocaleString('en-IN')}`, color: 'text-rose-600' },
              { label: 'Refund Adj.', value: `-₹${batch.totalRefundAdjustments.toLocaleString('en-IN')}`, color: 'text-orange-600' },
              { label: 'Bonuses & Incentives', value: `+₹${batch.totalBonuses.toLocaleString('en-IN')}`, color: 'text-emerald-600' },
              { label: 'Net Payable', value: `₹${batch.totalNetPayable.toLocaleString('en-IN')}`, color: 'text-primary font-black text-sm' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-xs">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">{label}</p>
                <p className={`font-mono font-black ${color}`}>{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tab Filters */}
        <div className="border-b border-border pb-3 flex justify-start">
          <FormTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(id: any) => setActiveTab(id)}
          />
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <SettlementSummaryCard batch={batch} />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Card className="premium-card text-left">
                <CardHeader className="pb-3 border-b border-border">
                  <h3 className="font-black text-sm text-slate-800 dark:text-white">Financial Reconciliation Summary</h3>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  {[
                    { label: 'Total Gross Earnings', value: `₹${batch.totalGrossAmount.toLocaleString('en-IN')}`, cls: 'text-slate-800 dark:text-slate-100 font-bold' },
                    { label: 'Platform Commission Deducted', value: `-₹${batch.totalCommission.toLocaleString('en-IN')}`, cls: 'text-rose-600 font-bold' },
                    { label: 'Refund Adjustments', value: `-₹${batch.totalRefundAdjustments.toLocaleString('en-IN')}`, cls: 'text-orange-600 font-bold' },
                    { label: 'Penalties Applied', value: `-₹${batch.totalPenalties.toLocaleString('en-IN')}`, cls: 'text-rose-600 font-bold' },
                    { label: 'Bonuses & Incentives', value: `+₹${batch.totalBonuses.toLocaleString('en-IN')}`, cls: 'text-emerald-600 font-bold' },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className="flex justify-between items-center py-1 border-b border-dashed border-border last:border-0">
                      <span className="text-slate-500 font-medium">{label}</span>
                      <span className={`font-mono ${cls}`}>{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t-2 border-border">
                    <span className="font-black text-slate-800 dark:text-white">Net Driver Payable</span>
                    <span className="font-mono font-black text-primary text-base">₹{batch.totalNetPayable.toLocaleString('en-IN')}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="space-y-4 text-left">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{batch.totalDrivers} drivers in batch</p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {batch.drivers.map(d => (
                <DriverPayoutCard
                  key={d.driverId}
                  driver={d}
                  onViewLedger={dId => navigate(`/financial-operations/settlements/drivers/${dId}`)}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <Card className="premium-card">
            <CardContent className="p-8 text-center text-slate-400">
              <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-40 text-slate-500" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Reconciled Ride Transactions</p>
              <p className="text-xs mt-1 text-slate-450">Ride-level payouts and direct collection reports are processed in Phase 2.</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'adjustments' && (
          <Card className="premium-card text-left">
            <CardContent className="p-4">
              {batch.adjustments.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <SlidersHorizontal className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No Manual Adjustments</p>
                  <p className="text-xs text-slate-450 mt-0.5">No supplementary manual additions or deductions have been applied to this batch.</p>
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left">
                      {['Driver', 'Type', 'Reason', 'Amount', 'Applied At'].map(h => (
                        <th key={h} className="px-3 py-2 font-black text-slate-500 uppercase tracking-wide text-[10px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {batch.adjustments.map(adj => (
                      <tr key={adj.id} className="border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-2 font-medium">{adj.driverName}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${adj.type === 'addition' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {adj.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-500">{adj.reason}</td>
                        <td className="px-3 py-2 font-mono font-bold">₹{adj.amount.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-slate-400 font-mono">{new Date(adj.appliedAt).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'timeline' && (
          <Card className="premium-card text-left">
            <CardContent className="p-6">
              <SettlementTimeline events={batch.timeline} />
            </CardContent>
          </Card>
        )}

        {activeTab === 'audit' && (
          <Card className="premium-card">
            <CardContent className="p-8 text-center text-slate-400">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40 text-slate-500" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 font-sans">Audit Logs Reconciled</p>
              <p className="text-xs mt-1 text-slate-450">Every state change has been logged into the main platform Audit Trail.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  )
}

export default SettlementDetailsPage
