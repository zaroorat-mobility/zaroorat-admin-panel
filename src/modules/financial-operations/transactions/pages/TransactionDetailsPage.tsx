import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTransaction, useFinanceAuditLogs } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardHeader, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { FormTabs } from '@/shared/components/ui/FormTabs'
import { PageLoader } from '@/shared/components/loaders'
import { TransactionStatusBadge, PaymentMethodBadge, TransactionTimeline } from '../components'
import {
  ArrowLeft, Activity, Landmark, ShieldAlert, FileText, Eye
} from 'lucide-react'

type Tab =
  | 'overview'
  | 'financials'
  | 'reconciliation'
  | 'ride'
  | 'refunds'
  | 'disputes'
  | 'settlements'
  | 'timeline'
  | 'audit'

export const TransactionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const { data: txn, isLoading, isError } = useTransaction(id!)
  const { data: auditLogsRes } = useFinanceAuditLogs()
  const logs = auditLogsRes?.data?.filter(l => l.entityId === txn?.entityId || l.entityId === txn?.transactionId) || []

  if (isLoading) return <PageLoader />
  if (isError || !txn) return <div className="p-8 text-center text-slate-550">Transaction not found.</div>

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'financials', label: 'Financial Breakdown' },
    { id: 'reconciliation', label: 'Reconciliation' },
    { id: 'ride', label: 'Ride Details' },
    { id: 'refunds', label: 'Related Refunds' },
    { id: 'disputes', label: 'Related Disputes' },
    { id: 'settlements', label: 'Related Settlements' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'audit', label: 'Audit Trail' }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title={`Transaction Details: ${txn.transactionId}`}
        description={`Gateway Ref: ${txn.gatewayReference || 'None'} · Date: ${new Date(txn.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
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
        {/* Sticky top financial summary card */}
        <Card className="premium-card text-left bg-slate-50/50 dark:bg-slate-900/50 border-primary/20">
          <CardContent className="p-4 flex flex-wrap gap-6 items-center justify-between">
            <div className="flex items-center gap-3">
              <TransactionStatusBadge status={txn.status} />
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Gateway</p>
                <p className="font-bold text-slate-800 dark:text-white uppercase text-[10px]">{txn.paymentGateway || 'None'}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-5">
              {[
                { label: 'Ride Fare', value: `₹${txn.rideFare.toFixed(2)}`, color: 'text-slate-700 dark:text-slate-350' },
                { label: 'Charged Amount', value: `₹${txn.amountCharged.toFixed(2)}`, color: 'text-slate-700 dark:text-slate-350' },
                { label: 'Captured Amount', value: `₹${txn.amountCaptured.toFixed(2)}`, color: 'text-slate-700 dark:text-slate-350 font-semibold' },
                { label: 'Refund Amount', value: `-₹${txn.refundAmount.toFixed(2)}`, color: 'text-rose-600' },
                { label: 'Settlement Impact', value: `₹${txn.settlementImpact.toFixed(2)}`, color: 'text-emerald-600' },
                { label: 'Variance Difference', value: `₹${txn.variance.toFixed(2)}`, color: txn.variance !== 0 ? 'text-rose-600 font-bold' : 'text-slate-600 dark:text-slate-300' }
              ].map(({ label, value, color }) => (
                <div key={label} className="text-xs">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">{label}</p>
                  <p className={`font-mono font-black ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FormTabs selection panel */}
        <div className="border-b border-border pb-3 flex justify-start">
          <FormTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(id: any) => setActiveTab(id)}
          />
        </div>

        {/* Tab contents panel */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            <div className="lg:col-span-1 space-y-4">
              <Card className="premium-card">
                <CardHeader className="pb-3 border-b border-border">
                  <h3 className="font-black text-slate-800 dark:text-white text-sm">PG Details</h3>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs font-semibold">
                  {[
                    { label: 'Gateway ID', value: txn.paymentGateway ? txn.paymentGateway.toUpperCase() : 'None' },
                    { label: 'Gateway Reference', value: txn.gatewayReference || '—' },
                    { label: 'Gateway Status', value: txn.gatewayStatus || '—' },
                    { label: 'Payment Method', value: <PaymentMethodBadge method={txn.paymentMethod} /> },
                    { label: 'Directional Direction', value: txn.direction.toUpperCase() },
                    { label: 'ISO Currency', value: txn.currency }
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500">{label}:</span>
                      <strong className="text-slate-800 dark:text-white font-mono">{value}</strong>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <Card className="premium-card">
                <CardHeader className="pb-3 border-b border-border">
                  <h3 className="font-black text-slate-800 dark:text-white text-sm">PG Performance Stats</h3>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs font-semibold">
                  {[
                    { label: 'Response Latency Time', value: txn.gatewayResponseTimeMs ? `${(txn.gatewayResponseTimeMs / 1000).toFixed(2)}s` : 'N/A' },
                    { label: 'Collect Gateway Time', value: txn.collectionTimeMs ? `${(txn.collectionTimeMs / 1000).toFixed(2)}s` : 'N/A' },
                    { label: 'Retry Authorization Attempts', value: `${txn.retryAttempts} attempts` },
                    { label: 'Error Code', value: txn.gatewayErrorCode || 'None' },
                    { label: 'Error Message Description', value: txn.gatewayErrorMessage || 'None' }
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-0.5 border-b border-dashed border-border last:border-0 pb-2">
                      <span className="text-slate-500">{label}:</span>
                      <strong className="text-slate-800 dark:text-white font-mono">{value}</strong>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'financials' && (
          <Card className="premium-card text-left">
            <CardHeader className="pb-3 border-b border-border">
              <h3 className="font-black text-slate-800 dark:text-white text-sm">Ride Fare Rules Calculation</h3>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs font-semibold">
              {[
                { label: 'Base Ride Fare Charge', value: `₹${(txn.rideFare * 0.4).toFixed(2)}` },
                { label: 'Distance Charge Metric', value: `₹${(txn.rideFare * 0.4).toFixed(2)}` },
                { label: 'Time Spent Charge', value: `₹${(txn.rideFare * 0.1).toFixed(2)}` },
                { label: 'Peak Hour Surge Tariff', value: `₹${(txn.rideFare * 0.1).toFixed(2)}` }
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-1 border-b border-dashed border-border last:border-0 pb-2">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-mono">{value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t-2 border-border font-bold">
                <span className="text-slate-800 dark:text-white">Total Expected Ride Fare</span>
                <span className="font-mono text-primary text-sm font-black">₹{txn.rideFare.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'reconciliation' && (
          <Card className="premium-card text-left">
            <CardHeader className="pb-3 border-b border-border">
              <h3 className="font-black text-slate-800 dark:text-white text-sm">Comparative Variance Ledger</h3>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs font-semibold">
              {[
                { label: 'Ride Fare Expected', value: `₹${txn.rideFare.toFixed(2)}` },
                { label: 'Amount Sent to PG', value: `₹${txn.amountCharged.toFixed(2)}` },
                { label: 'Amount Captured by PG', value: `₹${txn.amountCaptured.toFixed(2)}` },
                { label: 'Refund Amount Processed', value: `-₹${txn.refundAmount.toFixed(2)}` },
                { label: 'Driver Settlement Payout Impact', value: `₹${txn.settlementImpact.toFixed(2)}` }
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-1 border-b border-dashed border-border last:border-0 pb-2">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-mono">{value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-dashed border-border">
                <span className="text-slate-500">Variance Status:</span>
                <span className={`uppercase text-[9px] font-black px-1.5 py-0.5 rounded border border-slate-200 dark:border-dark-700 bg-slate-100 dark:bg-slate-800 text-slate-700`}>
                  {txn.varianceStatus.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2 border-border font-bold">
                <span className="text-slate-800 dark:text-white">Reconciliation Variance Deviation</span>
                <span className={`font-mono text-sm font-black ${txn.variance !== 0 ? 'text-rose-600' : 'text-slate-600 dark:text-slate-350'}`}>
                  ₹{txn.variance.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'ride' && (
          <Card className="premium-card text-left text-xs font-semibold">
            <CardHeader className="pb-3 border-b border-border">
              <h3 className="font-black text-slate-800 dark:text-white text-sm">Linked Ride Information</h3>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-border">
                  <p className="text-[10px] text-slate-455 font-bold uppercase tracking-wider">Ride Ref</p>
                  <p className="font-mono font-bold mt-1 text-slate-850 dark:text-white">{txn.rideId || 'None'}</p>
                  <button
                    onClick={() => navigate(`/operations/ride-monitor/${txn.rideId}`)}
                    className="text-primary hover:underline font-bold mt-2 inline-flex items-center gap-1"
                  >
                    View Ride monitor <Activity className="h-3 w-3" />
                  </button>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-border">
                  <p className="text-[10px] text-slate-455 font-bold uppercase tracking-wider">Rider Passenger</p>
                  <p className="font-mono font-bold mt-1 text-slate-850 dark:text-white">{txn.riderId || 'None'}</p>
                  <button
                    onClick={() => navigate(`/riders`)}
                    className="text-primary hover:underline font-bold mt-2 inline-flex items-center gap-1"
                  >
                    View Rider Profile <Landmark className="h-3 w-3" />
                  </button>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-border">
                  <p className="text-[10px] text-slate-455 font-bold uppercase tracking-wider">Driver Partner</p>
                  <p className="font-mono font-bold mt-1 text-slate-850 dark:text-white">{txn.driverId || 'None'}</p>
                  <button
                    onClick={() => navigate(`/driver-management/drivers`)}
                    className="text-primary hover:underline font-bold mt-2 inline-flex items-center gap-1"
                  >
                    View Driver details <Landmark className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'refunds' && (
          <Card className="premium-card text-left text-xs font-semibold">
            <CardHeader className="pb-3 border-b border-border">
              <h3 className="font-black text-slate-800 dark:text-white text-sm">Linked Refund Transactions</h3>
            </CardHeader>
            <CardContent className="p-4">
              {txn.refundAmount === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <Landmark className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-500" />
                  <p>No refund requests linked to this ledger capture.</p>
                </div>
              ) : (
                <div className="border border-border rounded-lg p-3 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <strong className="text-slate-850 dark:text-white font-mono block">Refund Reference: REF-2026-{txn.id}</strong>
                    <span className="text-[10px] text-slate-400 mt-1 font-medium block">Category: DOUBLE_PAYMENT · Status: Completed</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-rose-600 block">-₹{txn.refundAmount.toFixed(2)}</span>
                    <button
                      onClick={() => navigate(`/financial-operations/refunds`)}
                      className="text-primary hover:underline font-bold mt-2 inline-flex items-center gap-1"
                    >
                      View details <Eye className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'disputes' && (
          <Card className="premium-card text-left text-xs font-semibold">
            <CardHeader className="pb-3 border-b border-border">
              <h3 className="font-black text-slate-800 dark:text-white text-sm">Linked Dispute Claims</h3>
            </CardHeader>
            <CardContent className="p-4">
              {txn.variance === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-500" />
                  <p>No active disputes or estimates mismatches filed for this capture.</p>
                </div>
              ) : (
                <div className="border border-border rounded-lg p-3 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <strong className="text-slate-850 dark:text-white font-mono block">Dispute Reference: DISP-2026-{txn.id}</strong>
                    <span className="text-[10px] text-slate-400 mt-1 font-medium block">Type: UPFRONT_ESTIMATE_MISMATCH · Status: Resolved</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-rose-600 block">₹{txn.variance.toFixed(2)} disputed</span>
                    <button
                      onClick={() => navigate(`/financial-operations/disputes`)}
                      className="text-primary hover:underline font-bold mt-2 inline-flex items-center gap-1"
                    >
                      View details <Eye className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'settlements' && (
          <Card className="premium-card text-left text-xs font-semibold">
            <CardHeader className="pb-3 border-b border-border">
              <h3 className="font-black text-slate-800 dark:text-white text-sm">Settlement Payout References</h3>
            </CardHeader>
            <CardContent className="p-4">
              {txn.status === 'failed' ? (
                <div className="text-center py-6 text-slate-400">
                  <Landmark className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-500" />
                  <p>Settlement payout is not applicable for failed transaction authorizations.</p>
                </div>
              ) : (
                <div className="border border-border rounded-lg p-3 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <strong className="text-slate-850 dark:text-white font-mono block">Settlement Batch ID: SET-2026-1001</strong>
                    <span className="text-[10px] text-slate-400 mt-1 font-medium block">Period: 01 Jul - 15 Jul · Payout Status: Paid</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-emerald-600 block">₹{txn.settlementImpact.toFixed(2)} payout impact</span>
                    <button
                      onClick={() => navigate(`/financial-operations/settlements`)}
                      className="text-primary hover:underline font-bold mt-2 inline-flex items-center gap-1"
                    >
                      View settlement details <Eye className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'timeline' && (
          <Card className="premium-card text-left">
            <CardHeader className="pb-3 border-b border-border">
              <h3 className="font-black text-slate-800 dark:text-white text-sm">Chronological Timeline Steps</h3>
            </CardHeader>
            <CardContent className="p-6">
              <TransactionTimeline txn={txn} />
            </CardContent>
          </Card>
        )}

        {activeTab === 'audit' && (
          <Card className="premium-card text-left text-xs font-semibold">
            <CardHeader className="pb-3 border-b border-border flex items-center justify-between">
              <h3 className="font-black text-slate-800 dark:text-white text-sm">Ledger Event Logs</h3>
              <span className="text-slate-400 font-medium">{logs.length} logs</span>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {logs.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-500" />
                  <p>No transaction-specific audit events found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log, index) => (
                    <div key={index} className="flex justify-between items-start border-b border-border pb-3 last:border-0 last:pb-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] border uppercase font-black tracking-wider ${log.severity === 'critical' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-50 text-slate-650'}`}>
                            {log.severity}
                          </span>
                          <strong className="text-slate-850 dark:text-white font-mono">{log.action}</strong>
                        </div>
                        <p className="text-[10px] text-slate-455 mt-1">{log.notes}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5 font-mono">Operator: {log.user} · IP: {log.ipAddress}</p>
                      </div>
                      <span className="font-mono text-[9px] text-slate-400">
                        {new Date(log.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  )
}

export default TransactionDetailsPage
