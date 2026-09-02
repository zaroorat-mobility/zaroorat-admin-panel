import React, { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  useRide,
  useRideNotes,
  useAddRideNote,
  useCancelRide,
  useRideAuditLogs,
  useCreateComplaint,
  useRideDriverLocation,
  useRideRoute,
} from '../../hooks'
import { LiveMap } from '@/shared/components/maps/LiveMap'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardHeader, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { FormTabs } from '@/shared/components/ui/FormTabs'
import { RideStatusBadge } from '../components/RideStatusBadge'
import { RideTimeline } from '../components/RideTimeline'
import { useQuery } from '@tanstack/react-query'
import { OperationsService } from '../../services'
import { FinancialService, RefundService } from '@/modules/financial-operations'
import {
  User,
  Car,
  Navigation,
  Plus,
  Eye,
  Ban,
  MessageSquare,
  Send,
  AlertTriangle,
  Star,
} from 'lucide-react'

export const RideDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const urlTab = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<
    'overview' | 'timeline' | 'fare' | 'payment' | 'sos' | 'complaints' | 'refunds' | 'audit' | 'reviews'
  >(
    urlTab &&
      ['overview', 'timeline', 'fare', 'payment', 'sos', 'complaints', 'refunds', 'audit', 'reviews'].includes(urlTab)
      ? (urlTab as any)
      : 'overview'
  )

  // Create Complaint Modal State
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false)
  const [complaintCategory, setComplaintCategory] = useState<any>('Driver Behaviour')
  const [complaintPriority, setComplaintPriority] = useState<any>('medium')
  const [complaintDescription, setComplaintDescription] = useState('')
  const [complaintRaisedBy, setComplaintRaisedBy] = useState<'rider' | 'driver'>('rider')

  // Cancel Ride Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [cancelReasonCode, setCancelReasonCode] = useState('ADMIN_FORCE_CANCEL')
  const [cancelReasonText, setCancelReasonText] = useState('')

  // Note composer state
  const [noteContent, setNoteContent] = useState('')

  // React Query Hooks
  const { data: ride, isLoading, isError, refetch } = useRide(id || '')
  const { data: notesData, refetch: refetchNotes } = useRideNotes(id || '')
  const { data: auditData, isLoading: isLoadingAudit } = useRideAuditLogs(id || '')

  const { mutate: createComplaint, isPending: isCreatingComplaint } = useCreateComplaint()
  const { mutate: addNote, isPending: isAddingNote } = useAddRideNote()
  const { mutate: cancelRideAction, isPending: isCancellingRide } = useCancelRide()

  const isRideActiveForPolling =
    !!ride &&
    !['COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_DRIVER', 'CANCELLED_BY_SYSTEM'].includes(
      ride.rawStatus || '',
    ) &&
    !['completed', 'cancelled-by-rider', 'cancelled-by-driver', 'no-driver-found', 'rider-no-show'].includes(
      ride.status.toLowerCase(),
    )

  const { data: driverLocation } = useRideDriverLocation(id || '', {
    enabled: isRideActiveForPolling,
    refetchInterval: 10000,
  })

  const hasRouteCoords =
    ride?.pickupLat != null &&
    ride?.pickupLng != null &&
    ride?.dropLat != null &&
    ride?.dropLng != null

  const { data: rideRoute } = useRideRoute(id || '', {
    enabled: !!id && !!hasRouteCoords,
  })

  // Fetch linked SOS alerts
  const { data: sosAlertsRes } = useQuery({
    queryKey: ['operations', 'ride-sos', id],
    queryFn: () => OperationsService.getSOSAlerts(),
    enabled: !!id,
  })
  const linkedSos = (sosAlertsRes?.data || []).filter((a) => a.rideId === id)

  // Fetch linked Complaints
  const { data: complaintsRes } = useQuery({
    queryKey: ['operations', 'ride-complaints', id],
    queryFn: () => OperationsService.getComplaints(),
    enabled: !!id,
  })
  const linkedComplaints = (complaintsRes?.data || []).filter((c) => c.rideId === id)

  // Fetch linked Disputes
  const { data: disputesRes } = useQuery({
    queryKey: ['financial', 'ride-disputes', id],
    queryFn: () => FinancialService.getDisputes(),
    enabled: !!id,
  })
  const linkedDisputes = (disputesRes?.data || []).filter((d) => d.rideId === id)

  // Fetch linked Refunds
  const { data: refundsRes } = useQuery({
    queryKey: ['financial', 'ride-refunds', id],
    queryFn: () => RefundService.getRefunds(),
    enabled: !!id,
  })
  const linkedRefunds = (refundsRes?.data || []).filter((r) => r.rideId === id)

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
          <button
            onClick={() => navigate('/operations/ride-monitor')}
            className="text-xs underline mt-2 text-slate-650"
          >
            Back to list
          </button>
        </div>
      </PageWrapper>
    )
  }

  const isRideActive =
    !['COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_DRIVER', 'CANCELLED_BY_SYSTEM'].includes(
      ride.rawStatus || ''
    ) &&
    !['completed', 'cancelled-by-rider', 'cancelled-by-driver', 'no-driver-found', 'rider-no-show'].includes(
      ride.status.toLowerCase()
    )

  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault()
    if (!complaintDescription.trim()) return

    createComplaint(
      {
        rideId: ride.id,
        raisedBy: complaintRaisedBy,
        raisedByName: complaintRaisedBy === 'rider' ? ride.riderName : ride.driverName || 'Unknown Driver',
        category: complaintCategory,
        priority: complaintPriority,
        status: 'open',
        description: complaintDescription,
      },
      {
        onSuccess: () => {
          setIsComplaintModalOpen(false)
          setComplaintDescription('')
          refetch()
        },
      }
    )
  }

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    cancelRideAction(
      {
        id,
        reasonCode: cancelReasonCode,
        reasonText: cancelReasonText || undefined,
      },
      {
        onSuccess: () => {
          setIsCancelModalOpen(false)
          setCancelReasonText('')
          refetch()
        },
      }
    )
  }

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !noteContent.trim()) return

    addNote(
      {
        id,
        note: noteContent.trim(),
      },
      {
        onSuccess: () => {
          setNoteContent('')
          refetchNotes()
        },
      }
    )
  }

  const notesList = notesData || ride.opsNotes || []
  const auditList = auditData?.data || []
  const ratingsList = ride.ratings || []

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'fare', label: 'Fare' },
    { id: 'payment', label: 'Payment' },
    { id: 'sos', label: `SOS (${linkedSos.length})` },
    { id: 'complaints', label: `Complaints (${linkedComplaints.length})` },
    { id: 'refunds', label: `Refunds (${linkedRefunds.length})` },
    { id: 'audit', label: `Audit Trail (${auditList.length})` },
    { id: 'reviews', label: `Reviews (${ratingsList.length})` },
  ]

  return (
    <PageWrapper>
      <PageHeader
        title={`Investigation Center: Ride #${ride.id}`}
        description="Core operational telemetry, timelines, financial variables, and linked safety events."
        onBack={() => navigate('/operations/ride-monitor')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isRideActive && (
              <Button
                variant="outline"
                onClick={() => setIsCancelModalOpen(true)}
                className="gap-1.5 text-xs font-semibold h-9 rounded-lg border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <Ban className="h-4 w-4" />
                <span>Cancel Ride (Ops Force)</span>
              </Button>
            )}
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
              <FormTabs tabs={tabs} activeTab={activeTab} onChange={(id: any) => setActiveTab(id)} />
              <RideStatusBadge status={ride.status} />
            </CardHeader>

            <CardContent className="p-6">
              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6 text-left text-xs">
                  {/* Live route map */}
                  <div className="space-y-2">
                    {ride.pickupLat != null &&
                    ride.pickupLng != null &&
                    ride.dropLat != null &&
                    ride.dropLng != null ? (
                      <LiveMap
                        height="220px"
                        routes={[
                          {
                            id: ride.id,
                            pickup: {
                              lat: ride.pickupLat,
                              lng: ride.pickupLng,
                              label: ride.pickupLocation,
                            },
                            drop: {
                              lat: ride.dropLat,
                              lng: ride.dropLng,
                              label: ride.dropLocation,
                            },
                            driverLocation: driverLocation?.lat != null && driverLocation?.lng != null
                              ? { lat: driverLocation.lat, lng: driverLocation.lng }
                              : null,
                            path: rideRoute?.path?.length ? rideRoute.path : null,
                          },
                        ]}
                      />
                    ) : (
                      <div className="rounded-xl overflow-hidden border border-border h-48 bg-slate-100 dark:bg-slate-900 relative flex items-center justify-center">
                        <Navigation className="h-8 w-8 text-primary" />
                        <p className="absolute bottom-4 left-4 text-[10px] text-muted-foreground">
                          GPS coordinates unavailable for this ride.
                        </p>
                      </div>
                    )}
                    <p className="text-[9px] text-slate-500 font-mono">
                      {ride.pickupLocation} ➔ {ride.dropLocation}
                      {driverLocation?.updatedAt ? (
                        <span className="ml-2">
                          • Driver GPS updated {new Date(driverLocation.updatedAt).toLocaleTimeString()}
                        </span>
                      ) : null}
                    </p>
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

                  {/* Internal Operations Notes Section */}
                  <div className="border border-border rounded-xl p-4 bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <h4 className="text-xs font-bold text-slate-850 dark:text-white flex items-center gap-1.5">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <span>Internal Operations Notes ({notesList.length})</span>
                      </h4>
                    </div>

                    <form onSubmit={handleAddNoteSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Add an internal operations note about this ride..."
                        className="flex-1 px-3 py-1.5 text-xs bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isAddingNote || !noteContent.trim()}
                        className="h-8 text-xs flex items-center gap-1"
                      >
                        <Send className="h-3 w-3" />
                        <span>{isAddingNote ? 'Saving...' : 'Post'}</span>
                      </Button>
                    </form>

                    {notesList.length === 0 ? (
                      <div className="text-slate-400 text-[11px] py-2 text-center">
                        No internal notes recorded yet for this ride.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {notesList.map((n: any) => (
                          <div
                            key={n.id}
                            className="bg-card border border-border rounded-lg p-2.5 space-y-1 text-left text-xs"
                          >
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span className="font-bold text-foreground">{n.author?.fullName || 'Staff Operator'}</span>
                              <span className="font-mono">{new Date(n.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-800 dark:text-slate-200">{n.note}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Timeline */}
              {activeTab === 'timeline' && <RideTimeline timeline={ride.timeline} />}

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
                      <strong
                        className={`capitalize font-bold ${
                          ride.paymentStatus === 'completed'
                            ? 'text-emerald-600'
                            : ride.paymentStatus === 'failed'
                            ? 'text-rose-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {ride.paymentStatus}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Method:</span>
                      <strong className="uppercase text-slate-850 dark:text-white font-mono">{ride.paymentMethod}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Billed:</span>
                      <strong className="text-slate-850 dark:text-white font-mono">₹{ride.finalFare.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: SOS */}
              {activeTab === 'sos' && (
                <div className="space-y-4 text-left text-xs">
                  <div className="border-b pb-2">
                    <h3 className="font-bold text-slate-850 text-sm">Linked Safety Alerts</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Emergency triggers logged against this ride.</p>
                  </div>

                  {linkedSos.length === 0 ? (
                    <div className="text-slate-400 font-medium py-4 text-center">No safety alarms logged for this ride.</div>
                  ) : (
                    <div className="space-y-2">
                      {linkedSos.map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-center justify-between p-3 border border-border rounded-xl bg-slate-50/50 dark:bg-slate-900/50"
                        >
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{alert.id}</span>
                            <div className="text-[10px] text-slate-400 font-mono">Raised at {alert.timeRaised}</div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              alert.status === 'open'
                                ? 'bg-rose-50 text-rose-600 border-rose-100'
                                : alert.status === 'acknowledged'
                                ? 'bg-amber-50 text-amber-600 border-amber-100'
                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}
                          >
                            {alert.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 6: Complaints */}
              {activeTab === 'complaints' && (
                <div className="space-y-4 text-left text-xs">
                  <div className="border-b pb-2">
                    <h3 className="font-bold text-slate-850 text-sm">Linked Complaints</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Disputes logged against this ride.</p>
                  </div>

                  {linkedComplaints.length === 0 ? (
                    <div className="text-slate-400 font-medium py-4 text-center">No complaints filed for this ride.</div>
                  ) : (
                    <div className="space-y-2">
                      {linkedComplaints.map((complaint) => (
                        <div
                          key={complaint.id}
                          className="flex items-center justify-between p-3 border border-border rounded-xl bg-slate-50/50 dark:bg-slate-900/50"
                        >
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{complaint.category}</span>
                            <div className="text-[10px] text-slate-400">Raised by {complaint.raisedByName}</div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              complaint.status === 'open'
                                ? 'bg-rose-50 text-rose-600 border-rose-100'
                                : complaint.status === 'investigating'
                                ? 'bg-amber-50 text-amber-600 border-amber-100'
                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}
                          >
                            {complaint.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 7: Refunds */}
              {activeTab === 'refunds' && (
                <div className="space-y-4 text-left text-xs">
                  <div className="border-b pb-2">
                    <h3 className="font-bold text-slate-850 text-sm">Disputes & Refunds</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Financial adjustments or disputes registered.</p>
                  </div>

                  {linkedDisputes.length === 0 && linkedRefunds.length === 0 ? (
                    <div className="text-slate-400 font-medium py-4 text-center">No financial disputes or refunds recorded.</div>
                  ) : (
                    <div className="space-y-2">
                      {linkedDisputes.map((dispute: any) => (
                        <div
                          key={dispute.id}
                          className="flex items-center justify-between p-3 border border-border rounded-xl bg-slate-50/50 dark:bg-slate-900/50"
                        >
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{dispute.category}</span>
                            <div className="text-[10px] text-slate-400">Dispute ID: {dispute.id}</div>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/financial-operations/disputes/${dispute.id}`)}
                            className="gap-1 h-8 text-[10px] font-semibold border-border"
                          >
                            <Eye className="h-3.5 w-3.5 mr-0.5" />
                            <span>View Details</span>
                          </Button>
                        </div>
                      ))}
                      {linkedRefunds.map((refund: any) => (
                        <div
                          key={refund.id}
                          className="flex items-center justify-between p-3 border border-border rounded-xl bg-slate-50/50 dark:bg-slate-900/50"
                        >
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-100">₹{refund.amount}</span>
                            <div className="text-[10px] text-slate-400">Refund ID: {refund.id}</div>
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

              {/* Tab 8: Audit Trail */}
              {activeTab === 'audit' && (
                <div className="space-y-4 text-left text-xs">
                  <div className="border-b pb-2">
                    <h3 className="font-bold text-slate-850 text-sm">Audit Actions Trace</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Chronological administrative audit ledger entries matching this ride.
                    </p>
                  </div>

                  {isLoadingAudit ? (
                    <div className="text-slate-400 font-medium py-4 text-center">Loading audit records...</div>
                  ) : auditList.length === 0 ? (
                    <div className="text-slate-400 font-medium py-4 text-center">No specific audit logs found for this ride.</div>
                  ) : (
                    <div className="border border-border rounded-xl overflow-hidden">
                      <table className="w-full text-[10px] border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900 border-b border-border font-bold text-slate-500 uppercase tracking-wider">
                            <th className="p-3 text-center w-28">Timestamp</th>
                            <th className="p-3 text-left w-36">Operator</th>
                            <th className="p-3 text-left">Action Summary</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border font-medium text-slate-700 dark:text-slate-200">
                          {auditList.map((log: any) => (
                            <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                              <td className="p-3 text-center font-mono text-[9px] text-slate-400">
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-100">
                                {log.actor?.fullName || 'System / Admin'}
                              </td>
                              <td className="p-3">
                                <span className="font-bold text-primary mr-1">[{log.action}]</span>
                                {log.summary || 'Administrative action performed'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 9: Reviews */}
              {activeTab === 'reviews' && (
                <div className="space-y-6 text-left text-xs">
                  <div className="border-b pb-2">
                    <h3 className="font-bold text-slate-850 text-sm">Ride Reviews & Star Ratings</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Feedback logs submitted by rider and driver partner for this specific booking.
                    </p>
                  </div>

                  {ratingsList.length === 0 ? (
                    <div className="text-slate-400 font-medium py-4 text-center">
                      No ratings submitted yet for this ride.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {ratingsList.map((r: any) => (
                        <Card key={r.id} className="premium-card p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                              Rated by {r.ratedBy}
                            </span>
                            <span className="text-xs font-black text-amber-500 flex items-center gap-0.5">
                              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                              {r.rating}.0
                            </span>
                          </div>
                          {r.comment && (
                            <p className="italic text-slate-600 dark:text-slate-350">"{r.comment}"</p>
                          )}
                          {r.tags && r.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {r.tags.map((tag: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="text-[9px] text-muted-foreground font-mono">
                            {new Date(r.createdAt).toLocaleString()}
                          </div>
                        </Card>
                      ))}
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
                <strong className="font-mono text-slate-850 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border">
                  {ride.otp}
                </strong>
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
                <span
                  className={`px-2 py-0.5 rounded font-black text-[9px] uppercase border ${
                    ride.sosState === 'raised'
                      ? 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse font-bold'
                      : ride.sosState === 'acknowledged'
                      ? 'bg-amber-50 text-amber-700 border-amber-100 font-bold'
                      : ride.sosState === 'resolved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-slate-50 text-slate-400 border-slate-100'
                  }`}
                >
                  {ride.sosState}
                </span>
              </div>
            </div>

            <div className="border-t border-border pt-4 text-[10px] text-slate-400 leading-relaxed">
              Created on: <strong>{new Date(ride.createdAt).toLocaleString('en-IN')}</strong>
              <br />
              Last telemetry refresh: <strong>{new Date(ride.updatedAt).toLocaleTimeString('en-IN')}</strong>
            </div>
          </Card>
        </div>
      </div>

      {/* CANCEL RIDE MODAL */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg premium-card bg-white dark:bg-slate-950 text-left">
            <CardHeader className="border-b border-border pb-3">
              <h3 className="font-black text-rose-600 text-sm flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                <span>Force Cancel Ride #{ride.id}</span>
              </h3>
              <p className="text-[10px] text-slate-450 mt-0.5">
                Administrative emergency cancellation frees up driver partner and cancels customer trip immediately.
              </p>
            </CardHeader>
            <form onSubmit={handleCancelSubmit}>
              <CardContent className="p-5 space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Cancellation Reason Code</label>
                  <select
                    value={cancelReasonCode}
                    onChange={(e) => setCancelReasonCode(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-900"
                  >
                    <option value="ADMIN_FORCE_CANCEL">Administrative Force Cancel</option>
                    <option value="VEHICLE_BREAKDOWN">Vehicle Breakdown / Mechanical Failure</option>
                    <option value="DRIVER_UNRESPONSIVE">Driver Unresponsive / No Movement</option>
                    <option value="CUSTOMER_UNREACHABLE">Customer Unreachable</option>
                    <option value="SAFETY_EMERGENCY">Safety / Security Intervention</option>
                    <option value="OTHER">Other Operational Reason</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase">Detailed Operational Notes *</label>
                  <textarea
                    required
                    value={cancelReasonText}
                    onChange={(e) => setCancelReasonText(e.target.value)}
                    placeholder="Document operator reason, caller details, or emergency telemetry..."
                    rows={3}
                    className="w-full p-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCancelModalOpen(false)}
                    className="h-9 px-4 text-xs font-semibold"
                  >
                    Close
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCancellingRide}
                    className="h-9 px-4 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    {isCancellingRide ? 'Cancelling...' : 'Confirm Force Cancel'}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

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
                      value={complaintRaisedBy === 'rider' ? ride.riderName : ride.driverName || 'Unknown Driver'}
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
