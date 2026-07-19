import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useRefund,
  useStartRefundReview
} from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardHeader, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { FormTabs } from '@/shared/components/ui/FormTabs'
import {
  RefundStatusBadge,
  RefundTimeline,
  RefundSummaryCard,
  RefundApprovalPanel,
  RefundFinancialBreakdown
} from '../components'
import { useQuery } from '@tanstack/react-query'
import { OperationsService } from '@/modules/operations/services'
import { FinancialService } from '@/modules/financial-operations/services'
import { AuditLogService } from '@/modules/audit-log/services'
import {
  Clock,
  ShieldCheck,
  Eye,
  CreditCard
} from 'lucide-react'

export const RefundDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'ride' | 'dispute' | 'financials' | 'timeline' | 'audit'>('overview')

  // Query details
  const { data: request, isLoading, isError, refetch } = useRefund(id || '')
  const { mutate: startReview, isPending: isStartingReview } = useStartRefundReview()

  // Fetch linked ride details dynamically
  const rideId = request?.rideId || ''
  const { data: ride } = useQuery({
    queryKey: ['financial', 'refund-ride-details', rideId],
    queryFn: () => OperationsService.getRideById(rideId),
    enabled: !!rideId
  })

  // Fetch linked dispute details dynamically
  const disputeId = request?.disputeId || ''
  const { data: dispute } = useQuery({
    queryKey: ['financial', 'refund-dispute-details', disputeId],
    queryFn: () => FinancialService.getDisputeById(disputeId),
    enabled: !!disputeId
  })

  // Fetch linked audit logs
  const { data: auditsRes } = useQuery({
    queryKey: ['financial', 'refund-audits', id],
    queryFn: () => AuditLogService.getAuditLogs({ search: id }),
    enabled: !!id
  })
  const linkedAudits = auditsRes?.data || []

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center p-12 text-slate-500 font-medium">
          Loading refund request details...
        </div>
      </PageWrapper>
    )
  }

  if (isError || !request) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center p-12 text-rose-500 font-medium">
          <p>Failed to find refund details.</p>
          <button onClick={() => navigate('/financial-operations/refunds')} className="text-xs underline mt-2 text-slate-650">Back to list</button>
        </div>
      </PageWrapper>
    )
  }

  const handleStartReview = () => {
    startReview(
      { id: request.id, reviewerName: 'Finance Analyst B' },
      {
        onSuccess: () => {
          refetch()
          navigate(`/financial-operations/refunds/${request.id}/review`)
        }
      }
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'ride', label: 'Ride Details' },
    { id: 'dispute', label: 'Dispute Context' },
    { id: 'financials', label: 'Financials' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'audit', label: 'Audit Trail' }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title={`Refund Request: #${request.refundId}`}
        description="Verify driver no-shows, overcharges, UPI fail loops, and credit-card reversals."
        onBack={() => navigate('/financial-operations/refunds')}
        actions={
          <div className="flex gap-2">
            {request.status === 'requested' && (
              <Button
                onClick={handleStartReview}
                disabled={isStartingReview}
                className="gap-2 text-xs font-semibold h-9 rounded-lg bg-primary hover:bg-primary/95 text-white"
              >
                <Clock className="h-4 w-4" />
                <span>Start Review</span>
              </Button>
            )}

            {request.status === 'under_review' && (
              <Button
                onClick={() => navigate(`/financial-operations/refunds/${request.id}/review`)}
                className="gap-2 text-xs font-semibold h-9 rounded-lg bg-amber-600 hover:bg-amber-500 text-white"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Submit Approval decision</span>
              </Button>
            )}

            {['approved', 'processing'].includes(request.status) && (
              <Button
                onClick={() => navigate(`/financial-operations/refunds/${request.id}/process`)}
                className="gap-2 text-xs font-semibold h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <CreditCard className="h-4 w-4" />
                <span>Process Settlement Payout</span>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-4">
        
        {/* Left Side: Tabs */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="premium-card">
            <CardHeader className="pb-2 border-b border-border flex flex-row items-center justify-between">
              <FormTabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={(id: any) => setActiveTab(id)}
              />
              <RefundStatusBadge status={request.status} />
            </CardHeader>

            <CardContent className="p-6">
              
              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6 text-left text-xs">
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-855 text-sm">Disputed / Refund Justification Reason</h3>
                    <p className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl leading-relaxed text-slate-700 font-medium font-sans">
                      "{request.reason}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider border-b pb-1">Refund Specifications</h4>
                      <div className="space-y-2 font-medium font-sans text-slate-600">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Refund Type:</span>
                          <strong className="text-slate-800 dark:text-white font-bold">{request.refundType.replace(/_/g, ' ')}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Requested Amount:</span>
                          <strong className="text-slate-800 dark:text-white font-mono font-bold">₹{request.requestedAmount.toFixed(2)}</strong>
                        </div>
                        {request.approvedAmount !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Approved Amount:</span>
                            <strong className="text-slate-800 dark:text-white font-mono font-bold">₹{request.approvedAmount.toFixed(2)}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider border-b pb-1">Processing Details</h4>
                      <div className="space-y-2 font-medium font-sans text-slate-600">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Rider / Passenger:</span>
                          <strong className="text-slate-800 dark:text-white">{request.riderName}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Approval Level:</span>
                          <strong className="text-slate-850 dark:text-white uppercase font-bold text-[9px]">{request.approvalLevel} tier</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Origin Origin Source:</span>
                          <strong className="text-slate-850 dark:text-white uppercase font-mono text-[9px]">{request.refundSource}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Ride details */}
              {activeTab === 'ride' && (
                <div className="space-y-4 text-left text-xs">
                  <div className="border-b pb-2 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-855 text-sm">Associated Ride</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Parameters of the booking record corresponding to the refund.</p>
                    </div>
                    {ride && (
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/operations/ride-monitor/${ride.id}`)}
                        className="gap-1 h-8 text-[10px] font-semibold border-border"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Master Ride</span>
                      </Button>
                    )}
                  </div>

                  {ride ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2.5 font-medium">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Ride ID:</span>
                          <strong className="font-mono text-slate-800 dark:text-white font-bold">#{ride.id}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Pickup Location:</span>
                          <span className="text-slate-800 dark:text-slate-200 truncate max-w-[150px]" title={ride.pickupLocation}>{ride.pickupLocation}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Drop Location:</span>
                          <span className="text-slate-800 dark:text-slate-200 truncate max-w-[150px]" title={ride.dropLocation}>{ride.dropLocation}</span>
                        </div>
                      </div>

                      <div className="space-y-2.5 font-medium">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Distance Travelled:</span>
                          <strong className="text-slate-800 dark:text-white font-mono">{ride.distance} km</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Trip Duration:</span>
                          <strong className="text-slate-800 dark:text-white font-mono">{ride.duration} mins</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Payment status:</span>
                          <strong className="uppercase text-slate-800 dark:text-white font-mono">{ride.paymentStatus}</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 font-medium py-4 text-center">No ride is linked.</div>
                  )}
                </div>
              )}

              {/* Tab 3: Dispute Context */}
              {activeTab === 'dispute' && (
                <div className="space-y-4 text-left text-xs">
                  <div className="border-b pb-2 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-855 text-sm">Linked Dispute Ticket</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Underlying payment dispute corresponding to the refund.</p>
                    </div>
                    {dispute && (
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/financial-operations/disputes/${dispute.id}`)}
                        className="gap-1 h-8 text-[10px] font-semibold border-border"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Dispute Ticket</span>
                      </Button>
                    )}
                  </div>

                  {dispute ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2.5 font-medium text-slate-650">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Dispute ID:</span>
                          <strong className="font-mono text-slate-800 dark:text-white font-bold">#{dispute.id}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Dispute Status:</span>
                          <strong className="uppercase text-slate-800 dark:text-white font-mono">{dispute.status}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Dispute Type:</span>
                          <strong className="text-slate-800 dark:text-white font-bold">{dispute.type.replace(/_/g, ' ')}</strong>
                        </div>
                      </div>

                      <div className="space-y-2.5 font-medium text-slate-650">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Disputed Amount:</span>
                          <strong className="text-slate-800 dark:text-white font-mono">₹{dispute.amount.toFixed(2)}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Reason Summary:</span>
                          <span className="text-slate-805 truncate max-w-[150px]" title={dispute.reason}>{dispute.reason}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 font-medium py-4 text-center">No associated payment dispute ticket.</div>
                  )}
                </div>
              )}

              {/* Tab 4: Financials */}
              {activeTab === 'financials' && (
                <RefundFinancialBreakdown request={request} ride={ride} />
              )}

              {/* Tab 5: Timeline */}
              {activeTab === 'timeline' && (
                <RefundTimeline timeline={request.timeline} />
              )}

              {/* Tab 6: Audit */}
              {activeTab === 'audit' && (
                <div className="space-y-4 text-left text-xs">
                  <div className="border-b pb-2">
                    <h3 className="font-bold text-slate-850 text-sm">Audit Actions Logs</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Sensitive events captured for refund ID #{request.id}.</p>
                  </div>

                  {linkedAudits.length === 0 ? (
                    <div className="text-slate-400 font-medium py-4 text-center">No specific audit trail entries for this refund request.</div>
                  ) : (
                    <div className="border border-border rounded-xl overflow-hidden">
                      <table className="w-full text-[10px] border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900 border-b border-border font-bold text-slate-500 uppercase tracking-wider">
                            <th className="p-3 text-center w-24">Date</th>
                            <th className="p-3 text-left w-36">Operator</th>
                            <th className="p-3 text-left">Action details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border font-medium text-slate-700">
                          {linkedAudits.map((log: any) => (
                            <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                              <td className="p-3 text-center font-mono text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString('en-IN')}</td>
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{log.actor}</td>
                              <td className="p-3">{log.action}. <span className="text-slate-400 font-mono text-[9px]">{log.notes}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </CardContent>
          </Card>
        </div>

        {/* Right Side: Info Panels */}
        <div className="space-y-4">
          <RefundSummaryCard request={request} />
          <RefundApprovalPanel request={request} />
        </div>

      </div>
    </PageWrapper>
  )
}

export default RefundDetailsPage
