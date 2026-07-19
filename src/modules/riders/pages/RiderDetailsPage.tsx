import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useRider,
  useSuspendRider,
  useBlockRider,
  useActivateRider
} from '../hooks'
import { useQuery } from '@tanstack/react-query'
import { RefundService } from '@/modules/financial-operations/refunds'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { DataTable } from '@/shared/components/DataTable'
import {
  User,
  MapPin,
  CreditCard,
  Star,
  AlertTriangle,
  Calendar,
  Clock,
  Ban,
  ShieldCheck,
  Briefcase
} from 'lucide-react'
import { cn } from '@/shared/utils'

type RiderTab = 'profile' | 'history' | 'wallet' | 'refunds' | 'timeline'

export const RiderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<RiderTab>('profile')

  // Modals operational state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [statusAction, setStatusAction] = useState<'suspend' | 'block' | 'activate' | null>(null)
  const [statusNotes, setStatusNotes] = useState('')

  // Hooks queries & mutations
  const { data: rider, isLoading, isError, refetch } = useRider(id || '')

  const { data: refundsRes } = useQuery({
    queryKey: ['financial', 'rider-refunds', id],
    queryFn: () => RefundService.getRefunds(),
    enabled: !!id
  })
  const linkedRefunds = (refundsRes?.data || []).filter(r => r.riderId === id)
  
  const { mutate: suspendRider, isPending: isSuspending } = useSuspendRider()
  const { mutate: blockRider, isPending: isBlocking } = useBlockRider()
  const { mutate: activateRider, isPending: isActivating } = useActivateRider()

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center p-12 text-slate-500 font-medium animate-pulse">
          Loading Rider Profile details...
        </div>
      </PageWrapper>
    )
  }

  if (isError || !rider) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <AlertTriangle className="h-12 w-12 text-slate-400" />
          <h3 className="text-base font-bold text-text-primary">Rider Profile Not Found</h3>
          <Button onClick={() => navigate('/riders')}>Back to List</Button>
        </div>
      </PageWrapper>
    )
  }

  const isSuspendedOrBlocked = rider.riderStatus === 'suspended' || rider.riderStatus === 'blocked'

  // Columns definitions for ride history table
  const rideHistoryColumns = [
    {
      key: 'id',
      label: 'Booking ID',
      align: 'center' as const,
      render: (val: string) => <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{val}</span>
    },
    {
      key: 'date',
      label: 'Date',
      align: 'center' as const,
      render: (val: string) => <span>{new Date(val).toLocaleDateString('en-IN')}</span>
    },
    {
      key: 'route',
      label: 'Route details',
      align: 'left' as const,
      render: (_: any, row: any) => (
        <div className="flex flex-col text-left space-y-0.5 max-w-xs truncate">
          <span className="font-medium text-slate-700 dark:text-slate-350 truncate">From: {row.pickupAddress}</span>
          <span className="text-[10px] text-muted-foreground truncate font-medium">To: {row.dropAddress}</span>
        </div>
      )
    },
    {
      key: 'fare',
      label: 'Fare Amount',
      align: 'right' as const,
      render: (val: number) => <span className="font-bold text-slate-800 dark:text-slate-250">₹{val.toFixed(2)}</span>
    },
    {
      key: 'paymentMethod',
      label: 'Payment',
      align: 'center' as const,
      render: (val: string) => <span className="uppercase text-[10px] bg-slate-100 border border-slate-200 dark:bg-slate-850 dark:border-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-black tracking-wider">{val}</span>
    },
    {
      key: 'status',
      label: 'Trip Status',
      align: 'center' as const,
      render: (val: string) => <StatusBadge status={val} />
    }
  ]

  // Columns definitions for wallet transactions ledger
  const walletLedgerColumns = [
    {
      key: 'id',
      label: 'Transaction ID',
      align: 'center' as const,
      render: (val: string) => <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{val}</span>
    },
    {
      key: 'date',
      label: 'Date',
      align: 'center' as const,
      render: (val: string) => <span>{new Date(val).toLocaleDateString('en-IN')}</span>
    },
    {
      key: 'type',
      label: 'Type',
      align: 'center' as const,
      render: (val: string) => (
        <span className={cn(
          "px-1.5 py-0.5 rounded-full text-[9px] font-black border",
          val === 'TOPUP' && "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450",
          val === 'PAYMENT' && "bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450",
          val === 'REFUND' && "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-450",
          val === 'CASHBACK' && "bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-450"
        )}>
          {val}
        </span>
      )
    },
    {
      key: 'rideId',
      label: 'Details',
      align: 'left' as const,
      render: (val: string) => val ? `Refund/Payment for Ride: ${val}` : 'Wallet direct topup balance'
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right' as const,
      render: (val: number) => (
        <span className={cn("font-bold", val >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
          {val >= 0 ? `+₹${val.toFixed(2)}` : `-₹${Math.abs(val).toFixed(2)}`}
        </span>
      )
    },
    {
      key: 'balanceAfter',
      label: 'Balance After',
      align: 'right' as const,
      render: (val: number) => <span className="font-mono font-semibold">₹{val.toFixed(2)}</span>
    }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title={`Rider Profile: ${rider.fullName}`}
        description="Review customer profile metrics and wallet ledger history."
        onBack={() => navigate('/riders')}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {isSuspendedOrBlocked ? (
              <Button
                variant="primary"
                className="gap-2 text-xs font-semibold h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  setStatusAction('activate')
                  setIsStatusModalOpen(true)
                }}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Activate Account</span>
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="gap-2 text-xs font-semibold h-9 rounded-lg border-amber-250 text-amber-600 hover:bg-amber-50"
                  onClick={() => {
                    setStatusAction('suspend')
                    setIsStatusModalOpen(true)
                  }}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Suspend</span>
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 text-xs font-semibold h-9 rounded-lg border-rose-250 text-rose-600 hover:bg-rose-50"
                  onClick={() => {
                    setStatusAction('block')
                    setIsStatusModalOpen(true)
                  }}
                >
                  <Ban className="h-4 w-4" />
                  <span>Block</span>
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Tab Navigations */}
      <div className="flex border-b border-border mb-6 overflow-x-auto text-left gap-2 print:hidden mt-2">
        {[
          { id: 'profile', label: 'Overview Profile', icon: User },
          { id: 'history', label: 'Ride History log', icon: Briefcase },
          { id: 'wallet', label: 'Wallet balance & transactions', icon: CreditCard },
          { id: 'refunds', label: `Refund History (${linkedRefunds.length})`, icon: ShieldCheck },
          { id: 'timeline', label: 'Compliance timeline logs', icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as RiderTab)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 -mb-px outline-none whitespace-nowrap",
                isActive
                  ? "border-primary text-primary font-black"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div className="space-y-6">
        
        {/* TAB 1: PROFILE OVERVIEW */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Profile Bio details */}
              <Card className="premium-card text-left lg:col-span-2">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                  <div className="h-20 w-20 rounded-2xl bg-primary/10 border border-primary/20 flex-shrink-0 flex items-center justify-center">
                    <User className="h-9 w-9 text-primary" />
                  </div>
                  <div className="space-y-1 flex-grow">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-black text-slate-800 dark:text-slate-150">{rider.fullName}</h3>
                      <StatusBadge status={rider.riderStatus} />
                    </div>
                    <p className="text-xs text-slate-500">
                      Mobile: <strong className="text-slate-800 dark:text-slate-200">{rider.mobileNumber}</strong>
                      {rider.email && <> | Email: <strong className="text-slate-800 dark:text-slate-200">{rider.email}</strong></>}
                    </p>
                    <p className="text-xs text-slate-500">
                      Gender / DOB: <strong>{rider.gender || '—'} / {rider.dateOfBirth || '—'}</strong>
                    </p>
                    {rider.addressLine1 && (
                      <p className="text-xs text-slate-500 flex items-start gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span>
                          {rider.addressLine1}, {rider.addressLine2 ? `${rider.addressLine2}, ` : ''}
                          {rider.city}, {rider.state} - {rider.postcode} ({rider.country})
                        </span>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Booking Statistics summary */}
              <Card className="premium-card text-left p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-xs text-muted-foreground font-semibold">Trips Booked</span>
                    <strong className="text-sm text-slate-800 dark:text-slate-200">{rider.totalRides} Bookings</strong>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-xs text-muted-foreground font-semibold">Preferred Payment</span>
                    <strong className="text-xs uppercase text-slate-800 dark:text-slate-200">{rider.preferredPaymentMethod || '—'}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-semibold">Average passenger rating</span>
                    <span className="flex items-center gap-1 font-bold text-sm text-amber-500">
                      <Star className="h-4 w-4 fill-amber-500" />
                      <span>{Number(rider.ratingAvg || 5).toFixed(1)}</span>
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Address & Emergency Contacts info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
              <Card className="premium-card">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-sm">Risk Indicators & Policy Compliance</CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-2 text-xs">
                  <p><span className="text-slate-500 font-medium">Cancellation Rate:</span> <strong>{rider.cancelRate || 0}%</strong></p>
                  <p><span className="text-slate-500 font-medium">No-Show Penalty count:</span> <strong className="text-rose-600">{rider.noShowCount || 0} violations</strong></p>
                  <p><span className="text-slate-500 font-medium">Account setup:</span> <strong>{new Date(rider.joinedAt).toLocaleDateString('en-IN')}</strong></p>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-sm">Rider Emergency Contacts</CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-2 text-xs">
                  {rider.emergencyContacts.length > 0 ? (
                    rider.emergencyContacts.map((contact, idx) => (
                      <p key={idx}>
                        <span className="text-slate-500 font-medium">{contact.name}:</span> <strong>{contact.phone}</strong>
                      </p>
                    ))
                  ) : (
                    <p className="text-slate-400">No emergency contacts configured.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: RIDE HISTORY */}
        {activeTab === 'history' && (
          <Card className="premium-card text-left">
            <CardHeader>
              <CardTitle>Historical Bookings Log</CardTitle>
              <CardDescription>Comprehensive checklist of passenger rides, pick/drop routes, and fare transaction summaries.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={rideHistoryColumns}
                data={rider.rideHistory}
                selectable={false}
              />
            </CardContent>
          </Card>
        )}

        {/* TAB 3: WALLET BALANCES */}
        {activeTab === 'wallet' && (
          <div className="space-y-6 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className="premium-card p-5">
                <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Wallet Balance</span>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">₹{Number(rider.walletBalance || 0).toFixed(2)}</p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-1">Auto-refund cycle: Live</p>
              </Card>

              <Card className="premium-card p-5">
                <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Total refunds issued</span>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">₹0.00</p>
                <p className="text-[10px] text-muted-foreground mt-1">Status: No active disputes</p>
              </Card>

              <Card className="premium-card p-5">
                <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Accumulated cashbacks</span>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">₹70.00</p>
                <p className="text-[10px] text-primary mt-1">Promotional coupon applied</p>
              </Card>
            </div>

            <Card className="premium-card">
              <CardHeader>
                <CardTitle>Wallet Transactions & Refund Ledger</CardTitle>
                <CardDescription>Ledger records of top-up transfers, booking debits, and ride cashbacks.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <DataTable
                  columns={walletLedgerColumns}
                  data={rider.ledger}
                  selectable={false}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB: REFUND HISTORY */}
        {activeTab === 'refunds' && (
          <Card className="premium-card text-left">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle>Refund Requests Ledger</CardTitle>
              <CardDescription>Passenger fare overcharges, goodwill compensations, and cancel waivers.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {linkedRefunds.length === 0 ? (
                <div className="text-slate-400 font-medium py-8 text-center text-xs">No refund history logs for this rider.</div>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-border font-bold text-slate-500 uppercase tracking-wider text-[9px]">
                        <th className="p-3">Refund ID</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-right">Requested</th>
                        <th className="p-3 text-right">Approved</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium text-slate-700">
                      {linkedRefunds.map(refund => (
                        <tr key={refund.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-100">{refund.refundId}</td>
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{refund.refundType.replace(/_/g, ' ')}</td>
                          <td className="p-3 text-right font-mono">₹{refund.requestedAmount.toFixed(2)}</td>
                          <td className="p-3 text-right font-mono">{refund.approvedAmount !== undefined ? `₹${refund.approvedAmount.toFixed(2)}` : '—'}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${
                              refund.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : refund.status === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border-rose-100'
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>{refund.status}</span>
                          </td>
                          <td className="p-3 text-center font-mono text-[9px] text-slate-400">{new Date(refund.requestedAt).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 4: COMPLIANCE TIMELINE */}
        {activeTab === 'timeline' && (
          <Card className="premium-card text-left">
            <CardHeader>
              <CardTitle>Compliance Log Checklist</CardTitle>
              <CardDescription>Operational account changes, verification activities, and auditor remarks.</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="relative border-l border-slate-200 pl-4 space-y-4 dark:border-slate-800 ml-2">
                {rider.timeline.map((evt) => (
                  <div key={evt.id} className="space-y-1 relative">
                    <span className={cn(
                      "absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900",
                      evt.isSystem ? "bg-slate-400" : "bg-primary"
                    )} />
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-150">{evt.action}</p>
                      {evt.isSystem && (
                        <span className="text-[8px] bg-slate-100 border border-slate-200 text-slate-400 px-1 rounded uppercase font-black tracking-wider">
                          System
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-slate-455 flex items-center gap-1">
                      <span>Logged by: {evt.actor}</span>
                      <span>•</span>
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(evt.timestamp).toLocaleString()}</span>
                    </p>
                    {evt.notes && (
                      <p className="text-[10px] bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-border text-slate-600 mt-1 dark:text-slate-400 font-medium">
                        {evt.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Confirmation Modal for status changes (Suspend, Block, Activate) */}
      <ConfirmationModal
        isOpen={isStatusModalOpen}
        onCancel={() => {
          setIsStatusModalOpen(false)
          setStatusNotes('')
          setStatusAction(null)
        }}
        onConfirm={() => {
          if (!statusAction) return
          
          const actionMap = {
            suspend: suspendRider,
            block: blockRider,
            activate: activateRider
          }
          
          actionMap[statusAction]({ id: rider.id, notes: statusNotes }, {
            onSuccess: () => {
              setIsStatusModalOpen(false)
              setStatusNotes('')
              setStatusAction(null)
              refetch()
            }
          })
        }}
        title={`${statusAction === 'suspend' ? 'Suspend' : statusAction === 'block' ? 'Block' : 'Activate'} Rider`}
        description={
          <div className="space-y-4 w-full">
            <p className="text-xs text-muted-foreground">
              Provide compliance comments or reasons for updating this rider's account login permissions.
            </p>
            <textarea
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="Enter remarks..."
              className="w-full min-h-[80px] p-2.5 rounded-lg border border-border bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
        }
        confirmText="Confirm Action"
        variant={statusAction === 'block' ? 'danger' : 'warning'}
        loading={isSuspending || isBlocking || isActivating}
      />
    </PageWrapper>
  )
}

export default RiderDetailsPage
