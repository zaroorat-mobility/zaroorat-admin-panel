import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useDispute,
  useAssignDispute,
  useUpdateDisputeStatus,
  useResolveDispute,
  useCloseDispute
} from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardHeader, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { FormTabs } from '@/shared/components/ui/FormTabs'
import { DisputeStatusBadge, DisputeTimeline, FareComparisonCard } from '../components'
import { ResolutionModal } from '@/modules/operations/complaints/components/ResolutionModal'
import { useQuery } from '@tanstack/react-query'
import { OperationsService } from '@/modules/operations/services'
import { AuditLogService } from '@/modules/audit-log/services'
import { RefundService } from '@/modules/financial-operations/refunds'
import {
  Clock,
  Shield,
  CheckCircle,
  Eye,
  UserCheck,
  Plus
} from 'lucide-react'
import type { DisputeResolutionType } from '../types'

export const DisputeDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'ride' | 'fare' | 'payment' | 'timeline' | 'audit'>('overview')

  // Modals visibility states
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false)
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false)

  // Resolution Form States
  const [resolutionType, setResolutionType] = useState<DisputeResolutionType>('Adjust Fare')
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0)

  // React Query hooks
  const { data: dispute, isLoading, isError, refetch } = useDispute(id || '')
  
  const { mutate: assignDispute, isPending: isAssigning } = useAssignDispute()
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateDisputeStatus()
  const { mutate: resolveDispute, isPending: isResolving } = useResolveDispute()
  const { mutate: closeDispute, isPending: isClosing } = useCloseDispute()

  // Fetch linked ride details dynamically if rideId exists
  const rideId = dispute?.rideId || ''
  const { data: ride } = useQuery({
    queryKey: ['financial', 'dispute-ride', rideId],
    queryFn: () => OperationsService.getRideById(rideId),
    enabled: !!rideId
  })

  // Fetch linked audit logs
  const { data: auditsRes } = useQuery({
    queryKey: ['financial', 'dispute-audits', id],
    queryFn: () => AuditLogService.getAuditLogs({ search: id }),
    enabled: !!id
  })
  const linkedAudits = auditsRes?.data || []

  // Fetch linked refunds
  const { data: refundsRes } = useQuery({
    queryKey: ['financial', 'dispute-refunds', id],
    queryFn: () => RefundService.getRefunds(),
    enabled: !!id
  })
  const linkedRefund = (refundsRes?.data || []).find(r => r.disputeId === id)

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center p-12 text-slate-500 font-medium">
          Loading dispute details...
        </div>
      </PageWrapper>
    )
  }

  if (isError || !dispute) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center p-12 text-rose-500 font-medium">
          <p>Failed to find dispute details.</p>
          <button onClick={() => navigate('/financial-operations/disputes')} className="text-xs underline mt-2 text-slate-650">Back to list</button>
        </div>
      </PageWrapper>
    )
  }

  const handleAssign = () => {
    assignDispute(
      { id: dispute.id, agentName: 'Support Agent A' },
      {
        onSuccess: () => refetch()
      }
    )
  }

  const handleUpdateStatus = (newStatus: any) => {
    updateStatus(
      { id: dispute.id, status: newStatus, notes: `Investigating fare telemetry and UPI transaction status.` },
      {
        onSuccess: () => refetch()
      }
    )
  }

  const handleConfirmResolve = (notes: string) => {
    resolveDispute(
      {
        id: dispute.id,
        resolutionType,
        notes,
        adjustmentAmount: adjustmentAmount > 0 ? adjustmentAmount : undefined
      },
      {
        onSuccess: () => {
          setIsResolveModalOpen(false)
          refetch()
        }
      }
    )
  }

  const handleConfirmClose = (notes: string) => {
    closeDispute(
      { id: dispute.id, notes },
      {
        onSuccess: () => {
          setIsCloseModalOpen(false)
          refetch()
        }
      }
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'ride', label: 'Ride Details' },
    { id: 'fare', label: 'Fare Comparison' },
    { id: 'payment', label: 'Payment Status' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'audit', label: 'Audit Trail' }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title={`Financial Dispute Details: #${dispute.id}`}
        description="Investigate fare calculations upfront estimates vs. final costs, review uncollected cash reports, and resolve payments."
        onBack={() => navigate('/financial-operations/disputes')}
        actions={
          <div className="flex gap-2">
            {dispute.status === 'open' && (
              <Button
                onClick={handleAssign}
                disabled={isAssigning}
                className="gap-2 text-xs font-semibold h-9 rounded-lg bg-primary hover:bg-primary/95 text-white"
              >
                <UserCheck className="h-4 w-4" />
                <span>Assign to Me</span>
              </Button>
            )}

            {dispute.status === 'assigned' && (
              <Button
                onClick={() => handleUpdateStatus('investigating')}
                disabled={isUpdatingStatus}
                className="gap-2 text-xs font-semibold h-9 rounded-lg bg-amber-600 hover:bg-amber-500 text-white"
              >
                <Clock className="h-4 w-4" />
                <span>Start Investigation</span>
              </Button>
            )}

            {dispute.status === 'investigating' && (
              <Button
                onClick={() => handleUpdateStatus('pending_approval')}
                disabled={isUpdatingStatus}
                className="gap-2 text-xs font-semibold h-9 rounded-lg bg-purple-650 hover:bg-purple-600 text-white"
              >
                <Shield className="h-4 w-4" />
                <span>Request Approval</span>
              </Button>
            )}

            {['assigned', 'investigating', 'pending_approval'].includes(dispute.status) && (
              <Button
                onClick={() => setIsResolveModalOpen(true)}
                className="gap-2 text-xs font-semibold h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Resolve Dispute</span>
              </Button>
            )}

            {dispute.status === 'resolved' && (
              <Button
                onClick={() => setIsCloseModalOpen(true)}
                className="gap-2 text-xs font-semibold h-9 rounded-lg bg-slate-700 hover:bg-slate-650 text-white"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Close Ticket</span>
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
              <DisputeStatusBadge status={dispute.status} />
            </CardHeader>

            <CardContent className="p-6">
              
              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6 text-left text-xs">
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-855 text-sm">Dispute Incident Reason</h3>
                    <p className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl leading-relaxed text-slate-700 font-medium font-sans">
                      "{dispute.reason}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider border-b pb-1">Dispute Metrics</h4>
                      <div className="space-y-2 font-medium">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Dispute Type:</span>
                          <strong className="text-slate-800 dark:text-white font-bold">{dispute.type.replace(/_/g, ' ')}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Disputed Amount:</span>
                          <strong className="text-slate-800 dark:text-white font-mono font-bold">₹{dispute.amount.toFixed(2)}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Requested Adjustment:</span>
                          <strong className="text-slate-800 dark:text-white font-mono font-bold">₹{(dispute.requestedAmount || dispute.amount).toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider border-b pb-1">Submitter Details</h4>
                      <div className="space-y-2 font-medium">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Rider / Passenger:</span>
                          <strong className="text-slate-800 dark:text-white">{dispute.riderName}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Driver / Partner:</span>
                          <strong className="text-slate-800 dark:text-white">{dispute.driverName}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Logged At:</span>
                          <strong className="text-slate-800 dark:text-white font-mono">{new Date(dispute.createdAt).toLocaleString('en-IN')}</strong>
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
                      <h3 className="font-bold text-slate-855 text-sm">Associated Ride Telemetry</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Parameters of the booking corresponding to the dispute.</p>
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
                          <strong className="font-mono text-slate-800 dark:text-white">#{ride.id}</strong>
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
                          <span className="text-slate-500">Ride Status:</span>
                          <strong className="uppercase text-slate-800 dark:text-white font-mono">{ride.status}</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 font-medium py-4 text-center">No ride is linked to this dispute.</div>
                  )}
                </div>
              )}

              {/* Tab 3: Fare Breakdown Comparison */}
              {activeTab === 'fare' && (
                ride ? (
                  <FareComparisonCard ride={ride} />
                ) : (
                  <div className="text-slate-400 font-medium py-4 text-center">Estimate-vs-final breakdown requires an associated ride record.</div>
                )
              )}

              {/* Tab 4: Payment Status */}
              {activeTab === 'payment' && (
                <div className="space-y-4 text-left text-xs max-w-md">
                  <div className="border-b pb-2">
                    <h3 className="font-bold text-slate-855 text-sm">Transaction Logs</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Audit details for ride transaction settlement.</p>
                  </div>
                  {ride ? (
                    <div className="space-y-2 font-medium">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Collection Status:</span>
                        <strong className={`capitalize font-bold ${
                          ride.paymentStatus === 'completed' ? 'text-emerald-600' : 'text-amber-600'
                        }`}>{ride.paymentStatus}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Settlement Status:</span>
                        <strong className="text-slate-800 dark:text-white">
                          {dispute.status === 'resolved' ? 'Resolved / Adjusted' : 'Pending Review'}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Method Type:</span>
                        <strong className="uppercase text-slate-800 dark:text-white font-mono">{ride.paymentMethod}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Transferred Transaction Ref:</span>
                        <strong className="text-slate-800 dark:text-white font-mono">TXN-{ride.id.toUpperCase()}-890</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 font-medium py-4 text-center">Payment records require linked ride.</div>
                  )}
                </div>
              )}

              {/* Tab 5: Timeline */}
              {activeTab === 'timeline' && (
                <DisputeTimeline timeline={dispute.timeline} />
              )}

              {/* Tab 6: Audit */}
              {activeTab === 'audit' && (
                <div className="space-y-4 text-left text-xs">
                  <div className="border-b pb-2">
                    <h3 className="font-bold text-slate-850 text-sm">Audit Actions Logs</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Sensitive events captured for dispute ID #{dispute.id}.</p>
                  </div>

                  {linkedAudits.length === 0 ? (
                    <div className="text-slate-400 font-medium py-4 text-center">No specific audit trail entries for this dispute.</div>
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

        {/* Right Side: Assignment Panel */}
        <div className="space-y-4">
          <Card className="premium-card p-5 text-left text-xs space-y-4">
            <div className="border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Dispute Status Tracker</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Assignment status and operational summary.</p>
            </div>

            <div className="space-y-2.5 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Ticket Status:</span>
                <DisputeStatusBadge status={dispute.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Agent:</span>
                <strong className="text-slate-850 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border">
                  {dispute.assignedTo || 'Unassigned'}
                </strong>
              </div>
              {dispute.assignedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned At:</span>
                  <strong className="text-slate-800 dark:text-white font-mono">{new Date(dispute.assignedAt).toLocaleTimeString('en-IN')}</strong>
                </div>
              )}
            </div>

            {dispute.resolutionType && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border rounded-xl space-y-2 font-medium">
                <p className="font-bold text-slate-850">Resolution Details</p>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Resolution:</span>
                    <strong className="text-emerald-600 font-bold">{dispute.resolutionType}</strong>
                  </div>
                  {dispute.adjustmentAmount !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Adjustment:</span>
                      <strong className="text-slate-800 dark:text-white font-mono">₹{dispute.adjustmentAmount.toFixed(2)}</strong>
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <span className="text-slate-500">Notes:</span>
                    <p className="text-slate-600 italic">"{dispute.resolutionNotes}"</p>
                  </div>
                </div>
              </div>
            )}

             {dispute.status === 'resolved' && (
              <div className="border-t border-border pt-4 space-y-3 font-medium">
                <p className="font-bold text-slate-800 text-xs">Linked Refund Request</p>
                {linkedRefund ? (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl flex items-center justify-between">
                    <div className="space-y-1 text-[11px]">
                      <p className="font-bold text-slate-850 font-mono text-[10px]">{linkedRefund.refundId}</p>
                      <p className="text-[10px] text-slate-500">Status: <span className="font-bold uppercase text-[9px] text-emerald-600">{linkedRefund.status}</span></p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/financial-operations/refunds/${linkedRefund.id}`)}
                      className="gap-1 h-7 text-[10px] font-bold border-border"
                    >
                      <Eye className="h-3 w-3 mr-0.5" />
                      <span>View</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-slate-450 text-[10px] leading-relaxed">This dispute is resolved. If there is a wallet credit or gateway reversal required, you can create a refund request.</p>
                    <Button
                      onClick={() => navigate(`/financial-operations/refunds/new?rideId=${dispute.rideId}&disputeId=${dispute.id}&source=dispute&amount=${dispute.amount}&reason=${encodeURIComponent(dispute.reason)}`)}
                      className="gap-1.5 h-8 text-[10px] font-semibold bg-primary hover:bg-primary/95 text-white w-full"
                    >
                      <Plus className="h-3.5 w-3.5 mr-0.5" />
                      <span>Create Refund Request</span>
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-border pt-4 text-[10px] text-slate-400 leading-relaxed">
              Dispute ID: <strong>{dispute.id}</strong><br />
              Logged: <strong>{new Date(dispute.createdAt).toLocaleString('en-IN')}</strong><br />
              Last Update: <strong>{new Date(dispute.updatedAt).toLocaleTimeString('en-IN')}</strong>
            </div>
          </Card>
        </div>

      </div>

      {/* RESOLVE DISPUTE MODAL */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg premium-card bg-white dark:bg-slate-950 text-left">
            <CardHeader className="border-b border-border pb-3 flex justify-between items-center">
              <h3 className="font-black text-slate-800 dark:text-white text-sm">Resolve Financial Dispute</h3>
              <button onClick={() => setIsResolveModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </CardHeader>
            <form onSubmit={(e) => {
              e.preventDefault()
              const target = e.target as any
              const notes = target.resolutionNotes.value
              handleConfirmResolve(notes)
            }}>
              <CardContent className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Resolution Option</label>
                    <select
                      value={resolutionType}
                      onChange={(e) => setResolutionType(e.target.value as DisputeResolutionType)}
                      className="w-full p-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none h-[34px]"
                    >
                      <option value="Approve Refund">Approve Refund</option>
                      <option value="Reject Claim">Reject Claim</option>
                      <option value="Reverse Driver Due">Reverse Driver Due</option>
                      <option value="Adjust Fare">Adjust Fare</option>
                      <option value="Mark Paid">Mark Paid</option>
                      <option value="Write Off">Write Off</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Adjustment Amount (₹, Optional)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 70.00"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none h-[34px]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Resolution Notes / Explanation</label>
                  <textarea
                    required
                    name="resolutionNotes"
                    rows={3}
                    placeholder="Enter final review explanation..."
                    className="w-full p-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsResolveModalOpen(false)}
                    className="h-9 px-4 text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isResolving}
                    className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    {isResolving ? 'Resolving...' : 'Confirm Resolution'}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* CLOSE DISPUTE MODAL */}
      <ResolutionModal
        isOpen={isCloseModalOpen}
        onCancel={() => setIsCloseModalOpen(false)}
        onConfirm={handleConfirmClose}
        title="Close Dispute Ticket"
        description="Verify you have logged all adjustments and resolution steps. Closing will lock this transaction record."
        confirmText="Close Dispute"
        loading={isClosing}
      />
    </PageWrapper>
  )
}

// Re-import missing X icon inside file to prevent compile error
import { X } from 'lucide-react'

export default DisputeDetailsPage
