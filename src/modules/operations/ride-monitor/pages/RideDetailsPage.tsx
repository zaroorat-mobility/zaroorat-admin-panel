import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRide, useCreateComplaint } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardHeader, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { FormTabs } from '@/shared/components/ui/FormTabs'
import { RideStatusBadge } from '../components/RideStatusBadge'
import { RideTimeline } from '../components/RideTimeline'
import { useQuery } from '@tanstack/react-query'
import { OperationsService } from '../../services'
import { AuditLogService } from '@/modules/audit-log/services'
import { FinancialService, RefundService } from '@/modules/financial-operations'
import {
  User,
  Car,
  Navigation,
  Plus,
  Eye
} from 'lucide-react'

export const RideDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'fare' | 'payment' | 'sos' | 'complaints' | 'refunds' | 'audit'>('overview')

  // Create Complaint Modal State
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false)
  const [complaintCategory, setComplaintCategory] = useState<any>('Driver Behaviour')
  const [complaintPriority, setComplaintPriority] = useState<any>('medium')
  const [complaintDescription, setComplaintDescription] = useState('')
  const [complaintRaisedBy, setComplaintRaisedBy] = useState<'rider' | 'driver'>('rider')

  // React Query
  const { data: ride, isLoading, isError, refetch } = useRide(id || '')
  const { mutate: createComplaint, isPending: isCreatingComplaint } = useCreateComplaint()

  // Fetch linked SOS alerts
  const { data: sosAlertsRes } = useQuery({
    queryKey: ['operations', 'ride-sos', id],
    queryFn: () => OperationsService.getSOSAlerts(),
    enabled: !!id
  })
  const linkedSos = (sosAlertsRes?.data || []).filter(a => a.rideId === id)

  // Fetch linked Complaints
  const { data: complaintsRes } = useQuery({
    queryKey: ['operations', 'ride-complaints', id],
    queryFn: () => OperationsService.getComplaints(),
    enabled: !!id
  })
  const linkedComplaints = (complaintsRes?.data || []).filter(c => c.rideId === id)

  // Fetch linked Audit logs
  const { data: auditRes } = useQuery({
    queryKey: ['operations', 'ride-audits', id],
    queryFn: () => AuditLogService.getAuditLogs({ search: id }),
    enabled: !!id
  })
  const linkedAudits = auditRes?.data || []

  // Fetch linked Disputes
  const { data: disputesRes } = useQuery({
    queryKey: ['financial', 'ride-disputes', id],
    queryFn: () => FinancialService.getDisputes(),
    enabled: !!id
  })
  const linkedDisputes = (disputesRes?.data || []).filter(d => d.rideId === id)

  // Fetch linked Refunds
  const { data: refundsRes } = useQuery({
    queryKey: ['financial', 'ride-refunds', id],
    queryFn: () => RefundService.getRefunds(),
    enabled: !!id
  })
  const linkedRefunds = (refundsRes?.data || []).filter(r => r.rideId === id)

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center p-12 text-slate-500 font-medium">
          Fetching ride specifications...
        </div>
      </PageWrapper>
    )
  }

  if (isError || !ride) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center p-12 text-rose-500 font-medium">
          <p>Failed to find ride details.</p>
          <button onClick={() => navigate('/operations/ride-monitor')} className="text-xs underline mt-2 text-slate-650">Back to list</button>
        </div>
      </PageWrapper>
    )
  }

  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault()
    if (!complaintDescription.trim()) return

    createComplaint({
      rideId: ride.id,
      raisedBy: complaintRaisedBy,
      raisedByName: complaintRaisedBy === 'rider' ? ride.riderName : (ride.driverName || 'Unknown Driver'),
      category: complaintCategory,
      priority: complaintPriority,
      status: 'open',
      description: complaintDescription
    }, {
      onSuccess: () => {
        setIsComplaintModalOpen(false)
        setComplaintDescription('')
        refetch()
      }
    })
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'fare', label: 'Fare' },
    { id: 'payment', label: 'Payment' },
    { id: 'sos', label: `SOS (${linkedSos.length})` },
    { id: 'complaints', label: `Complaints (${linkedComplaints.length})` },
    { id: 'refunds', label: `Refunds (${linkedRefunds.length})` },
    { id: 'audit', label: 'Audit Trail' }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title={`Investigation Center: Ride #${ride.id}`}
        description="Core operational telemetry, timelines, financial variables, and linked safety events."
        onBack={() => navigate('/operations/ride-monitor')}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsComplaintModalOpen(true)}
              className="gap-2 text-xs font-semibold h-9 rounded-lg border-border"
            >
              <Plus className="h-4 w-4" />
              <span>Raise Ticket</span>
            </Button>
            {ride.driverId && (
              <Button
                variant="outline"
                onClick={() => navigate(`/driver-management/drivers/${ride.driverId}`)}
                className="gap-2 text-xs font-semibold h-9 rounded-lg border-border"
              >
                <Car className="h-4 w-4" />
                <span>Driver Profile</span>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate(`/rider-management/riders/${ride.riderId}`)}
              className="gap-2 text-xs font-semibold h-9 rounded-lg border-border"
            >
              <User className="h-4 w-4" />
              <span>Rider Profile</span>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-4">
        
        {/* Left Side: Tabs Display */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="premium-card">
            <CardHeader className="pb-2 border-b border-border flex flex-row items-center justify-between">
              <FormTabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={(id: any) => setActiveTab(id)}
              />
              <RideStatusBadge status={ride.status} />
            </CardHeader>
            
            <CardContent className="p-6">
              
              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6 text-left text-xs">
                  {/* Map Telemetry Simulation */}
                  <div className="rounded-xl overflow-hidden border border-border h-48 bg-slate-100 dark:bg-slate-900 relative flex items-center justify-center">
                    <Navigation className="h-8 w-8 text-primary absolute animate-bounce" />
                    <div className="absolute inset-0 bg-slate-900/5 dark:bg-slate-900/40 p-4 flex flex-col justify-end text-left">
                      <p className="font-bold text-[10px] uppercase text-slate-800 dark:text-slate-200 tracking-wider">Live Route Simulation</p>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">{ride.pickupLocation} ➔ {ride.dropLocation}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Rider / Passenger */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-primary" />
                        <span>Passenger / Rider</span>
                      </h4>
                      <div className="space-y-1.5 font-medium">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Name:</span>
                          <strong className="text-slate-850 dark:text-white">{ride.riderName}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Contact:</span>
                          <strong className="text-slate-850 dark:text-white font-mono">{ride.riderMobile}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">ID:</span>
                          <strong className="text-slate-800 dark:text-white font-mono">{ride.riderId}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Driver / Partner */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1">
                        <Car className="h-3.5 w-3.5 text-primary" />
                        <span>Driver & Vehicle</span>
                      </h4>
                      {ride.driverId ? (
                        <div className="space-y-1.5 font-medium">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Name:</span>
                            <strong className="text-slate-850 dark:text-white">{ride.driverName}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Plate Number:</span>
                            <strong className="text-slate-850 dark:text-white font-mono">{ride.vehiclePlate}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Model:</span>
                            <strong className="text-slate-850 dark:text-white">{ride.vehicleModel}</strong>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 font-medium">Unassigned / Driver matching in progress.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Timeline */}
              {activeTab === 'timeline' && (
                <RideTimeline timeline={ride.timeline} />
              )}

              {/* Tab 3: Fare */}
              {activeTab === 'fare' && (
                <div className="space-y-4 text-left text-xs max-w-md">
                  <div className="border-b pb-2">
                    <h3 className="font-bold text-slate-850 text-sm">Fare Breakdown</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Summary of formula metrics and calculations.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Base Fare:</span>
                      <strong className="text-slate-850 dark:text-white font-mono">₹{ride.baseFare.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Distance Charge ({ride.distance} km):</span>
                      <strong className="text-slate-850 dark:text-white font-mono">₹{ride.distanceCharge.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Time Charge ({ride.duration} mins):</span>
                      <strong className="text-slate-850 dark:text-white font-mono">₹{ride.timeCharge.toFixed(2)}</strong>
                    </div>
                    {ride.surgeCharge > 0 && (
                      <div className="flex justify-between text-rose-600 font-bold">
                        <span>Surge Multiplier Surcharge:</span>
                        <strong className="font-mono">₹{ride.surgeCharge.toFixed(2)}</strong>
                      </div>
                    )}
                    {ride.discount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>Discounts / Coupons Applied:</span>
                        <strong className="font-mono">-₹{ride.discount.toFixed(2)}</strong>
                      </div>
                    )}
                    <hr className="border-border my-2" />
                    <div className="flex justify-between text-sm font-black">
                      <span className="text-slate-850 dark:text-white">Estimated Final Fare:</span>
                      <strong className="text-primary font-mono">₹{ride.finalFare.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Payment */}
              {activeTab === 'payment' && (
                <div className="space-y-4 text-left text-xs max-w-md">
                  <div className="border-b pb-2">
                    <h3 className="font-bold text-slate-850 text-sm">Payment Details</h3>
                    <p className="text-[10px] text-muted-foreground.">Audit status of transaction records.</p>
                  </div>
                  <div className="space-y-2 font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Status:</span>
                      <strong className={`capitalize font-bold ${
                        ride.paymentStatus === 'completed'
                          ? 'text-emerald-600'
                          : ride.paymentStatus === 'failed'
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      }`}>{ride.paymentStatus}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Method Type:</span>
                      <strong className="uppercase text-slate-850 dark:text-white font-mono">{ride.paymentMethod}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Collected Amount:</span>
                      <strong className="text-slate-850 dark:text-white font-mono">₹{ride.finalFare.toFixed(2)}</strong>
                    </div>
                    <hr className="border-border my-3" />
                    <div className="space-y-3 pt-1">
                      <h4 className="font-bold text-slate-800 text-xs">Payment Dispute Linkage</h4>
                      {linkedDisputes.length === 0 ? (
                        <div className="space-y-2">
                          <p className="text-slate-450 text-[10px] leading-relaxed">No disputes logged for this ride transaction. If there is a fare difference or uncollected cash claim, you can log a financial dispute ticket.</p>
                          <Button
                            onClick={() => navigate(`/financial-operations/disputes/new?rideId=${ride.id}`)}
                            className="gap-1.5 h-8 text-[10px] font-semibold bg-primary hover:bg-primary/95 text-white"
                          >
                            <Plus className="h-3.5 w-3.5 mr-0.5" />
                            <span>Log Dispute Ticket</span>
                          </Button>
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
                                <span>Investigate</span>
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: SOS */}
              {activeTab === 'sos' && (
                <div className="space-y-4 text-left text-xs">
                  <div className="border-b pb-2 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-850 text-sm">Linked SOS Events</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Emergency alerts triggered during this trip.</p>
                    </div>
                  </div>

                  {linkedSos.length === 0 ? (
                    <div className="text-slate-400 font-medium py-4 text-center">No SOS alerts recorded for this ride.</div>
                  ) : (
                    <div className="space-y-3">
                      {linkedSos.map(alert => (
                        <div key={alert.id} className="p-4 rounded-xl border border-border flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-white font-mono">{alert.id}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${
                                alert.status === 'resolved'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse'
                              }`}>{alert.status}</span>
                            </div>
                            <p className="text-slate-500 font-medium">Location: {alert.location}</p>
                            <p className="text-[10px] text-slate-400">Raised: {new Date(alert.timeRaised).toLocaleString('en-IN')}</p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => navigate('/operations/sos-monitor')}
                            className="gap-1 h-8 text-[10px] font-semibold border-border"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Monitor Panel</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 6: Complaints */}
              {activeTab === 'complaints' && (
                <div className="space-y-4 text-left text-xs">
                  <div className="border-b pb-2 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-850 text-sm">Complaint Tickets</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Tickets logged on this ride.</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setIsComplaintModalOpen(true)}
                      className="gap-1 h-8 text-[10px] font-semibold border-border"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Log Ticket</span>
                    </Button>
                  </div>

                  {linkedComplaints.length === 0 ? (
                    <div className="text-slate-400 font-medium py-4 text-center">No complaints filed on this ride.</div>
                  ) : (
                    <div className="space-y-3">
                      {linkedComplaints.map(complaint => (
                        <div key={complaint.id} className="p-4 rounded-xl border border-border flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-white font-mono">{complaint.id}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${
                                complaint.status === 'resolved' || complaint.status === 'closed'
                                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>{complaint.status}</span>
                            </div>
                            <p className="text-slate-850 dark:text-slate-200 font-bold">{complaint.category} — Raised by {complaint.raisedBy}</p>
                            <p className="text-slate-500 font-medium">{complaint.description}</p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/operations/complaints/${complaint.id}`)}
                            className="gap-1 h-8 text-[10px] font-semibold border-border"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View Ticket</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Refunds */}
              {activeTab === 'refunds' && (
                <div className="space-y-4 text-left text-xs">
                  <div className="border-b pb-2 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-855 text-sm">Refund Transactions</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Wallet credit adjustments and fee waivers logged on this trip.</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/financial-operations/refunds/new?rideId=${ride.id}&source=ride`)}
                      className="gap-1.5 h-8 text-[10px] font-semibold border-border"
                    >
                      <Plus className="h-3.5 w-3.5 mr-0.5" />
                      <span>Log Refund Request</span>
                    </Button>
                  </div>

                  {linkedRefunds.length === 0 ? (
                    <div className="text-slate-400 font-medium py-4 text-center">No refund requests recorded on this ride.</div>
                  ) : (
                    <div className="space-y-3">
                      {linkedRefunds.map(refund => (
                        <div key={refund.id} className="p-4 rounded-xl border border-border flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-white font-mono">{refund.refundId}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${
                                refund.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : refund.status === 'rejected'
                                  ? 'bg-rose-50 text-rose-700 border-rose-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>{refund.status}</span>
                            </div>
                            <p className="text-slate-850 dark:text-slate-200 font-bold">{refund.refundType.replace(/_/g, ' ')} — Level: {refund.approvalLevel.toUpperCase()}</p>
                            <p className="text-slate-500 font-medium">Amount Requested: ₹{refund.requestedAmount.toFixed(2)}</p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/financial-operations/refunds/${refund.id}`)}
                            className="gap-1 h-8 text-[10px] font-semibold border-border"
                          >
                            <Eye className="h-3.5 w-3.5 mr-0.5" />
                            <span>View Details</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 7: Audit */}
              {activeTab === 'audit' && (
                <div className="space-y-4 text-left text-xs">
                  <div className="border-b pb-2">
                    <h3 className="font-bold text-slate-850 text-sm">Audit Actions Trace</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Chronological audit ledger entries matching this ride identifier.</p>
                  </div>

                  {linkedAudits.length === 0 ? (
                    <div className="text-slate-400 font-medium py-4 text-center">No specific audit logs found for this ride.</div>
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

        {/* Right Side: Operational summary card info */}
        <div className="space-y-4">
          <Card className="premium-card p-5 text-left text-xs space-y-4">
            <div className="border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Ride Telemetry Panel</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Summary variables matching active booking.</p>
            </div>

            <div className="space-y-2.5 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Ride State:</span>
                <RideStatusBadge status={ride.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Security OTP:</span>
                <strong className="font-mono text-slate-850 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border">{ride.otp}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Distance Travelled:</span>
                <strong className="text-slate-800 dark:text-white font-mono">{ride.distance} km</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration Elapsed:</span>
                <strong className="text-slate-800 dark:text-white font-mono">{ride.duration} mins</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active SOS State:</span>
                <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase border ${
                  ride.sosState === 'raised'
                    ? 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse font-bold'
                    : ride.sosState === 'acknowledged'
                    ? 'bg-amber-50 text-amber-700 border-amber-100 font-bold'
                    : ride.sosState === 'resolved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-slate-50 text-slate-400 border-slate-100'
                }`}>{ride.sosState}</span>
              </div>
            </div>

            <div className="border-t border-border pt-4 text-[10px] text-slate-400 leading-relaxed">
              Created on: <strong>{new Date(ride.createdAt).toLocaleString('en-IN')}</strong><br />
              Last telemetry refresh: <strong>{new Date(ride.updatedAt).toLocaleTimeString('en-IN')}</strong>
            </div>
          </Card>
        </div>

      </div>

      {/* CREATE COMPLAINT MODAL */}
      {isComplaintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg premium-card bg-white dark:bg-slate-950 text-left">
            <CardHeader className="border-b border-border pb-3">
              <h3 className="font-black text-slate-800 dark:text-white text-sm">Raise Operational Complaint</h3>
              <p className="text-[10px] text-slate-450 mt-0.5">Logs a new support ticket linked to Ride ID #{ride.id}.</p>
            </CardHeader>
            <form onSubmit={handleCreateComplaint}>
              <CardContent className="p-5 space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Category</label>
                    <select
                      value={complaintCategory}
                      onChange={(e) => setComplaintCategory(e.target.value as any)}
                      className="w-full px-3 py-1.5 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-900"
                    >
                      <option value="Driver Behaviour">Driver Behaviour</option>
                      <option value="Rider Behaviour">Rider Behaviour</option>
                      <option value="Safety">Safety</option>
                      <option value="SOS Related">SOS Related</option>
                      <option value="Payment">Payment</option>
                      <option value="Fare Dispute">Fare Dispute</option>
                      <option value="Vehicle Condition">Vehicle Condition</option>
                      <option value="Lost Item">Lost Item</option>
                      <option value="App Issue">App Issue</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Priority</label>
                    <select
                      value={complaintPriority}
                      onChange={(e) => setComplaintPriority(e.target.value as any)}
                      className="w-full px-3 py-1.5 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-900"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Raised By</label>
                    <select
                      value={complaintRaisedBy}
                      onChange={(e) => setComplaintRaisedBy(e.target.value as any)}
                      className="w-full px-3 py-1.5 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-900"
                    >
                      <option value="rider">Rider / Customer</option>
                      <option value="driver">Driver / Partner</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase">Raised By Name</label>
                    <input
                      type="text"
                      disabled
                      value={complaintRaisedBy === 'rider' ? ride.riderName : (ride.driverName || 'Unknown Driver')}
                      className="w-full px-3 py-1.5 text-xs border border-border rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Description</label>
                  <textarea
                    required
                    value={complaintDescription}
                    onChange={(e) => setComplaintDescription(e.target.value)}
                    placeholder="Enter details of the dispute or incident..."
                    rows={4}
                    className="w-full p-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsComplaintModalOpen(false)}
                    className="h-9 px-4 text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreatingComplaint}
                    className="h-9 px-4 text-xs font-semibold bg-primary text-white hover:bg-primary/95"
                  >
                    {isCreatingComplaint ? 'Creating...' : 'Log Ticket'}
                  </Button>
                </div>

              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </PageWrapper>
  )
}

export default RideDetailsPage
