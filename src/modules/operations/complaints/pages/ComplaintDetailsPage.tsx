import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useComplaint,
  useAssignComplaint,
  useUpdateComplaintStatus,
  useResolveComplaint,
  useCloseComplaint
} from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardHeader, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { FormTabs } from '@/shared/components/ui/FormTabs'
import { ComplaintStatusBadge, ComplaintTimeline, ResolutionModal } from '../components'
import { useQuery } from '@tanstack/react-query'
import { OperationsService } from '../../services'
import { AuditLogService } from '@/modules/audit-log/services'
import { FinancialService } from '@/modules/financial-operations'
import {
  Clock,
  Shield,
  CheckCircle,
  Eye,
  UserCheck,
  Plus
} from 'lucide-react'

export const ComplaintDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'ride' | 'timeline' | 'resolution' | 'audit'>('overview')

  // Modals visibility states
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false)
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false)

  // React Query hooks
  const { data: ticket, isLoading, isError, refetch } = useComplaint(id || '')
  
  const { mutate: assignTicket, isPending: isAssigning } = useAssignComplaint()
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateComplaintStatus()
  const { mutate: resolveTicket, isPending: isResolving } = useResolveComplaint()
  const { mutate: closeTicket, isPending: isClosing } = useCloseComplaint()

  // Fetch linked ride details dynamically if rideId exists
  const rideId = ticket?.rideId || ''
  const { data: ride } = useQuery({
    queryKey: ['operations', 'complaint-ride', rideId],
    queryFn: () => OperationsService.getRideById(rideId),
    enabled: !!rideId
  })

  // Fetch linked audit logs
  const { data: auditsRes } = useQuery({
    queryKey: ['operations', 'complaint-audits', id],
    queryFn: () => AuditLogService.getAuditLogs({ search: id }),
    enabled: !!id
  })
  const linkedAudits = auditsRes?.data || []

  // Fetch linked Disputes
  const { data: disputesRes } = useQuery({
    queryKey: ['financial', 'complaint-disputes', id],
    queryFn: () => FinancialService.getDisputes(),
    enabled: !!id
  })
  const linkedDisputes = (disputesRes?.data || []).filter(d => d.rideId === ticket?.rideId)

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center p-12 text-slate-500 font-medium">
          Loading ticket details...
        </div>
      </PageWrapper>
    )
  }

  if (isError || !ticket) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center p-12 text-rose-500 font-medium">
          <p>Failed to find complaint ticket.</p>
          <button onClick={() => navigate('/operations/complaints')} className="text-xs underline mt-2 text-slate-650">Back to list</button>
        </div>
      </PageWrapper>
    )
  }

  // SLA Calculations
  const getSlaInfo = () => {
    const limits: Record<string, number> = {
      critical: 15 * 60 * 1000,
      high: 60 * 60 * 1000,
      medium: 4 * 60 * 60 * 1000,
      low: 24 * 60 * 60 * 1000
    }
    const limit = limits[ticket.priority.toLowerCase()] || 24 * 60 * 60 * 1000
    const createdTime = new Date(ticket.createdAt).getTime()
    const endTime = ticket.resolvedAt ? new Date(ticket.resolvedAt).getTime() : Date.now()
    const elapsed = endTime - createdTime
    const breached = elapsed > limit

    return {
      breached,
      elapsedMin: Math.floor(elapsed / (60 * 1000)),
      limitMin: Math.floor(limit / (60 * 1000))
    }
  }

  const sla = getSlaInfo()

  const handleAssign = () => {
    assignTicket(
      { id: ticket.id, agentName: 'Support Agent A' },
      {
        onSuccess: () => refetch()
      }
    )
  }

  const handleUpdateStatus = (newStatus: any) => {
    updateStatus(
      { id: ticket.id, status: newStatus, notes: `Investigating details...` },
      {
        onSuccess: () => refetch()
      }
    )
  }

  const handleConfirmResolve = (notes: string) => {
    resolveTicket(
      { id: ticket.id, resolutionNotes: notes },
      {
        onSuccess: () => {
          setIsResolveModalOpen(false)
          refetch()
        }
      }
    )
  }

  const handleConfirmClose = (notes: string) => {
    closeTicket(
      { id: ticket.id, notes },
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
    { id: 'ride', label: 'Ride Info' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'resolution', label: 'Resolution & SLA' },
    { id: 'audit', label: 'Audit Trail' }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title={`Support Ticket: #${ticket.id}`}
        description="Review customer complaints, assign investigating agents, log resolution status, and track SLAs."
        onBack={() => navigate('/operations/complaints')}
        actions={
          <div className="flex gap-2">
            {ticket.status === 'open' && (
              <Button
                onClick={handleAssign}
                disabled={isAssigning}
                className="gap-2 text-xs font-semibold h-9 rounded-lg bg-primary hover:bg-primary/95 text-white"
              >
                <UserCheck className="h-4 w-4" />
                <span>Assign to Me</span>
              </Button>
            )}

            {ticket.status === 'assigned' && (
              <Button
                onClick={() => handleUpdateStatus('investigating')}
                disabled={isUpdatingStatus}
                className="gap-2 text-xs font-semibold h-9 rounded-lg bg-amber-600 hover:bg-amber-500 text-white"
              >
                <Clock className="h-4 w-4" />
                <span>Investigate Ticket</span>
              </Button>
            )}

            {['assigned', 'investigating'].includes(ticket.status) && (
              <Button
                onClick={() => setIsResolveModalOpen(true)}
                className="gap-2 text-xs font-semibold h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Resolve Ticket</span>
              </Button>
            )}

            {ticket.status === 'resolved' && (
              <Button
                onClick={() => setIsCloseModalOpen(true)}
                className="gap-2 text-xs font-semibold h-9 rounded-lg bg-slate-700 hover:bg-slate-650 text-white"
              >
                <Shield className="h-4 w-4" />
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
              <ComplaintStatusBadge status={ticket.status} />
            </CardHeader>

            <CardContent className="p-6">
              
              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6 text-left text-xs">
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-850 text-sm">Complaint Description</h3>
                    <p className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl leading-relaxed text-slate-700 font-medium font-sans">
                      "{ticket.description}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider border-b pb-1">Ticket Context</h4>
                      <div className="space-y-1.5 font-medium">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Category:</span>
                          <strong className="text-slate-850 dark:text-white">{ticket.category}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Priority Level:</span>
                          <span className="uppercase font-black text-rose-700">{ticket.priority}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Ticket Status:</span>
                          <strong className="text-slate-850 dark:text-white capitalize">{ticket.status}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider border-b pb-1">Submitter details</h4>
                      <div className="space-y-1.5 font-medium">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Name:</span>
                          <strong className="text-slate-850 dark:text-white">{ticket.raisedByName}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Role Source:</span>
                          <strong className="text-slate-800 dark:text-white capitalize">{ticket.raisedBy}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Created At:</span>
                          <strong className="text-slate-850 dark:text-white font-mono">{new Date(ticket.createdAt).toLocaleString('en-IN')}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Ride Information */}
              {activeTab === 'ride' && (
                <div className="space-y-4 text-left text-xs">
                  <div className="border-b pb-2 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-850 text-sm">Linked Ride Information</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Parameters of the booking corresponding to the dispute.</p>
                    </div>
                    {ride && (
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/operations/ride-monitor/${ride.id}`)}
                        className="gap-1 h-8 text-[10px] font-semibold border-border"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Investigate Ride</span>
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
                          <span className="text-slate-500">Rider / Passenger:</span>
                          <strong className="text-slate-805 dark:text-white">{ride.riderName}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Driver / Partner:</span>
                          <strong className="text-slate-805 dark:text-white">{ride.driverName || 'Unassigned'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Ride Stage:</span>
                          <strong className="uppercase text-slate-805 dark:text-white font-mono">{ride.status}</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 font-medium py-4 text-center">No ride is linked to this complaint ticket.</div>
                  )}
                </div>
              )}

              {/* Tab 3: Timeline */}
              {activeTab === 'timeline' && (
                <ComplaintTimeline timeline={ticket.timeline} />
              )}

              {/* Tab 4: Resolution & SLA */}
              {activeTab === 'resolution' && (
                <div className="space-y-5 text-left text-xs">
                  <div className="border-b pb-2">
                    <h3 className="font-bold text-slate-850 text-sm">Resolution & SLA Tracking</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Calculated duration metrics relative to Priority limits.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider border-b pb-1">SLA Metric Summary</h4>
                      <div className="space-y-2 font-medium">
                        <div className="flex justify-between">
                          <span className="text-slate-500">SLA Priority Limit:</span>
                          <strong className="text-slate-800 dark:text-white font-mono">{sla.limitMin} mins ({ticket.priority.toUpperCase()})</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Time Elapsed:</span>
                          <strong className="text-slate-800 dark:text-white font-mono">{sla.elapsedMin} mins</strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">SLA Audit Status:</span>
                          {sla.breached ? (
                            <span className="px-2 py-0.5 rounded font-black text-[9px] bg-rose-50 border border-rose-100 text-rose-700">BREACHED SLA</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded font-black text-[9px] bg-emerald-50 border border-emerald-100 text-emerald-700">WITHIN SLA</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider border-b pb-1">Resolution Summary</h4>
                      {ticket.resolvedAt ? (
                        <div className="space-y-1.5 font-medium">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Resolved By:</span>
                            <strong className="text-slate-850 dark:text-white">{ticket.resolvedBy}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Resolved At:</span>
                            <strong className="text-slate-850 dark:text-white font-mono">{new Date(ticket.resolvedAt).toLocaleString('en-IN')}</strong>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-500">Agent Resolution Notes:</span>
                            <p className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border italic">"{ticket.resolutionNotes}"</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 font-medium">This ticket is currently unresolved. Proceed with assignment workflows.</div>
                      )}
                    </div>
                  </div>
                  
                  <hr className="border-border my-4" />
                  <div className="space-y-3 pt-1">
                    <h4 className="font-bold text-slate-800 text-xs">Linked Payment Disputes</h4>
                    {linkedDisputes.length === 0 ? (
                      <div className="space-y-2">
                        <p className="text-slate-450 text-[10px] leading-relaxed">No payment disputes have been initialized for the associated ride of this complaint ticket. If the complaint concerns an incorrect fare charge, you can log a financial dispute ticket.</p>
                        {ticket.rideId && (
                          <Button
                            onClick={() => navigate(`/financial-operations/disputes/new?rideId=${ticket.rideId}`)}
                            className="gap-1.5 h-8 text-[10px] font-semibold bg-primary hover:bg-primary/95 text-white"
                          >
                            <Plus className="h-3.5 w-3.5 mr-0.5" />
                            <span>Log Payment Dispute</span>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {linkedDisputes.map(dis => (
                          <div key={dis.id} className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="font-bold text-slate-800 dark:text-white font-mono text-[10px]">{dis.id} — {dis.type.replace(/_/g, ' ')}</p>
                              <p className="text-[10px] text-slate-500">Status: <span className="font-bold uppercase text-[9px]">{dis.status}</span> • Amount: ₹{dis.amount.toFixed(2)}</p>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => navigate(`/financial-operations/disputes/${dis.id}`)}
                              className="gap-1 h-7 text-[10px] font-bold border-border"
                            >
                              <Eye className="h-3 w-3 mr-0.5" />
                              <span>View Dispute</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 5: Audit */}
              {activeTab === 'audit' && (
                <div className="space-y-4 text-left text-xs">
                  <div className="border-b pb-2">
                    <h3 className="font-bold text-slate-850 text-sm">Audit Actions Log</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Sensitive events captured for ticket ID #{ticket.id}.</p>
                  </div>

                  {linkedAudits.length === 0 ? (
                    <div className="text-slate-400 font-medium py-4 text-center">No specific audit trail entries for this ticket.</div>
                  ) : (
                    <div className="border border-border rounded-xl overflow-hidden">
                      <table className="w-full text-[10px] border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900 border-b border-border font-bold text-slate-500 uppercase tracking-wider">
                            <th className="p-3 text-center w-24">Date</th>
                            <th className="p-3 text-left w-36">Operator</th>
                            <th className="p-3 text-left">Action Details</th>
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
              <h3 className="font-bold text-slate-800 text-sm">Ticket Management</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Assignment status and operational summary.</p>
            </div>

            <div className="space-y-2.5 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Ticket Status:</span>
                <ComplaintStatusBadge status={ticket.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Agent:</span>
                <strong className="text-slate-850 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border">
                  {ticket.assignedTo || 'Unassigned'}
                </strong>
              </div>
              {ticket.assignedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned At:</span>
                  <strong className="text-slate-800 dark:text-white font-mono">{new Date(ticket.assignedAt).toLocaleTimeString('en-IN')}</strong>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-4 text-[10px] text-slate-400 leading-relaxed">
              Ticket ID: <strong>{ticket.id}</strong><br />
              Logged: <strong>{new Date(ticket.createdAt).toLocaleString('en-IN')}</strong><br />
              Last update: <strong>{new Date(ticket.updatedAt).toLocaleTimeString('en-IN')}</strong>
            </div>
          </Card>
        </div>

      </div>

      {/* RESOLUTION MODALS */}
      <ResolutionModal
        isOpen={isResolveModalOpen}
        onCancel={() => setIsResolveModalOpen(false)}
        onConfirm={handleConfirmResolve}
        title="Resolve Complaint Ticket"
        description="Verify you have taken all necessary investigation actions before resolving this ticket. Provide a detailed summary of findings below."
        confirmText="Confirm Resolve"
        loading={isResolving}
      />

      <ResolutionModal
        isOpen={isCloseModalOpen}
        onCancel={() => setIsCloseModalOpen(false)}
        onConfirm={handleConfirmClose}
        title="Close Complaint Ticket"
        description="Finalize this ticket and lock it for changes. Documentation of closure logs is required."
        confirmText="Close Ticket"
        loading={isClosing}
      />
    </PageWrapper>
  )
}

export default ComplaintDetailsPage
