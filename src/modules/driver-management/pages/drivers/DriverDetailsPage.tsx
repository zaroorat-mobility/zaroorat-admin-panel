import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useDriver,
  useSuspendDriver,
  useBlockDriver,
  useActivateDriver,
  useUpdateDriverBillingMode,
  useAddDriverTimelineNote
} from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Button } from '@/shared/components/ui/Button'
import { ImagePreviewModal } from '../../components/ImagePreviewModal'
import { ExpiryIndicator } from '../../components/ExpiryIndicator'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { DataTable } from '@/shared/components/DataTable'
import {
  User,
  MapPin,
  Car,
  FileText,
  CreditCard,
  History,
  Star,
  AlertTriangle,
  Eye,
  Edit2,
  Calendar,
  Clock,
  Ban,
  ShieldCheck,
  Plus,
  Settings
} from 'lucide-react'
import { cn } from '@/shared/utils'

type DriverTab = 'overview' | 'documents' | 'vehicle' | 'ratings' | 'earnings' | 'timeline' | 'audit'

export const DriverDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<DriverTab>('overview')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')

  // Modals operational state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [statusAction, setStatusAction] = useState<'suspend' | 'block' | 'activate' | null>(null)
  const [statusNotes, setStatusNotes] = useState('')

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'commission' | 'subscription'>('free')
  const [subscriptionType, setSubscriptionType] = useState<'monthly' | 'weekly' | 'daily'>('monthly')
  const [planNotes, setPlanNotes] = useState('')

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [timelineNote, setTimelineNote] = useState('')

  // Hooks queries & mutations
  const { data: driver, isLoading, isError } = useDriver(id || '')
  
  const { mutate: suspendDriver, isPending: isSuspending } = useSuspendDriver()
  const { mutate: blockDriver, isPending: isBlocking } = useBlockDriver()
  const { mutate: activateDriver, isPending: isActivating } = useActivateDriver()
  const { mutate: updateBillingPlan, isPending: isUpdatingPlan } = useUpdateDriverBillingMode()
  const { mutate: addSupportNote, isPending: isAddingNote } = useAddDriverTimelineNote()

  const openPreview = (url: string, title: string) => {
    setPreviewImage(url)
    setPreviewTitle(title)
  }

  const reviewColumns = [
    {
      key: 'date',
      label: 'Date',
      render: (date: string) => new Date(date).toLocaleDateString('en-IN')
    },
    {
      key: 'riderName',
      label: 'Rider Name',
      render: (name: string) => <span className="font-semibold text-slate-800 dark:text-slate-200">{name}</span>
    },
    {
      key: 'score',
      label: 'Rating',
      render: (score: number) => <span className="font-bold text-amber-500">{score} ★</span>
    },
    {
      key: 'comment',
      label: 'Review Comment',
      render: (comment: string) => <span className="italic text-slate-500">"{comment}"</span>
    }
  ]

  const ledgerColumns = [
    {
      key: 'id',
      label: 'Transaction ID',
      render: (id: string) => <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{id}</span>
    },
    {
      key: 'date',
      label: 'Date',
      render: (date: string) => new Date(date).toLocaleDateString('en-IN')
    },
    {
      key: 'type',
      label: 'Type',
      render: (type: string) => (
        <span className={cn(
          "px-1.5 py-0.5 rounded-full text-[9px] font-black border",
          type === 'EARNING' && "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450",
          type === 'COMMISSION_DUE' && "bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450",
          type === 'PAYOUT' && "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-450",
          type === 'BONUS' && "bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-450",
        )}>
          {type}
        </span>
      )
    },
    {
      key: 'rideId',
      label: 'Description',
      render: (rideId: string) => rideId ? `Booking ref: ${rideId}` : 'Weekly settlement payout'
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right' as const,
      render: (amount: number) => (
        <span className={cn("font-bold", amount >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
          {amount >= 0 ? `+₹${amount.toFixed(2)}` : `-₹${Math.abs(amount).toFixed(2)}`}
        </span>
      )
    },
    {
      key: 'balanceAfter',
      label: 'Balance After',
      align: 'right' as const,
      render: (balance: number) => <span className="font-mono font-semibold">₹{balance.toFixed(2)}</span>
    }
  ]

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center p-12 text-slate-500 font-medium animate-pulse">
          Loading Driver Profile details...
        </div>
      </PageWrapper>
    )
  }

  if (isError || !driver) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <AlertTriangle className="h-12 w-12 text-slate-400" />
          <h3 className="text-base font-bold text-text-primary">Driver Profile Not Found</h3>
          <Button onClick={() => navigate('/driver-management/drivers')}>Back to List</Button>
        </div>
      </PageWrapper>
    )
  }

  const isSuspendedOrBlocked = driver.driverStatus === 'suspended' || driver.driverStatus === 'blocked'

  return (
    <PageWrapper>
      <PageHeader
        title={`Driver Profile: ${driver.driverName}`}
        description="Comprehensive dashboard metrics, compliance document audits, bookings log, and payout ledgers."
        onBack={() => navigate('/driver-management/drivers')}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              className="gap-2 text-xs font-semibold h-9 rounded-lg border-border"
              onClick={() => navigate(`/driver-management/drivers/${driver.id}/edit`)}
            >
              <Edit2 className="h-4 w-4" />
              <span>Edit Profile</span>
            </Button>

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
                <span>Activate Partner</span>
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

      {/* Main Tab bar navigation */}
      <div className="flex border-b border-border mb-6 overflow-x-auto text-left gap-2 print:hidden mt-2">
        {[
          { id: 'overview', label: 'Overview', icon: User },
          { id: 'documents', label: 'Documents Checklist', icon: FileText },
          { id: 'vehicle', label: 'Vehicle Details', icon: Car },
          { id: 'ratings', label: 'Ratings Summary', icon: Star },
          { id: 'earnings', label: 'Earnings & Ledger', icon: CreditCard },
          { id: 'timeline', label: 'Timeline & Notes', icon: Clock },
          { id: 'audit', label: 'System Logs', icon: History },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DriverTab)}
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
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Profile Card left */}
              <Card className="premium-card text-left lg:col-span-2">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                  <div className="h-24 w-24 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-border flex-shrink-0 flex items-center justify-center">
                    {driver.profilePhotoUrl ? (
                      <img src={driver.profilePhotoUrl} alt="Driver Profile" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-slate-350" />
                    )}
                  </div>
                  <div className="space-y-1 flex-grow">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-black text-slate-800 dark:text-slate-150">{driver.driverName}</h3>
                      <StatusBadge status={driver.driverStatus} />
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 uppercase dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900">
                        <span className={cn("h-1.5 w-1.5 rounded-full bg-emerald-500", driver.isOnline && "animate-pulse")} />
                        {driver.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Mobile: <strong className="text-slate-800 dark:text-slate-200">{driver.mobileNumber}</strong>
                      {driver.email && <> | Email: <strong className="text-slate-800 dark:text-slate-200">{driver.email}</strong></>}
                    </p>
                    <p className="text-xs text-slate-500">
                      Gender / DOB: <strong>{driver.gender || '—'} / {driver.dateOfBirth || '—'}</strong>
                    </p>
                    {driver.country && (
                      <p className="text-xs text-slate-500 flex items-start gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span>
                          {driver.addressLine1}, {driver.addressLine2 ? `${driver.addressLine2}, ` : ''}
                          {driver.city}, {driver.state} - {driver.postcode} ({driver.country})
                        </span>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick statistics right */}
              <Card className="premium-card text-left p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-xs text-muted-foreground font-semibold">Background verification</span>
                    <span className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full border",
                      driver.bgCheckStatus === 'clear' 
                        ? "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900"
                        : "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:text-amber-450"
                    )}>
                      {driver.bgCheckStatus.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-xs text-muted-foreground font-semibold">Trips completed</span>
                    <strong className="text-sm text-slate-800 dark:text-slate-200">{driver.totalTrips} Trips</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-semibold">Average passenger rating</span>
                    <span className="flex items-center gap-1 font-bold text-sm text-amber-500">
                      <Star className="h-4 w-4 fill-amber-500" />
                      <span>{Number(driver.ratingAvg || 5).toFixed(1)}</span>
                    </span>
                  </div>
                </div>
              </Card>

            </div>

            {/* Additional details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
              <Card className="premium-card">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-sm">Partner Specifications</CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-2 text-xs">
                  <p><span className="text-slate-500 font-medium">Preferred language:</span> <strong>{driver.preferredLanguage || '—'}</strong></p>
                  <p><span className="text-slate-500 font-medium">Joined Platform Date:</span> <strong>{new Date(driver.joinedAt).toLocaleDateString('en-IN')}</strong></p>
                  <p><span className="text-slate-500 font-medium">Associated vehicle:</span> <strong className="uppercase">{driver.registrationPlate || 'No Vehicle Linked'}</strong> ({driver.vehicleType})</p>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-sm">Emergency Contacts</CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-2 text-xs">
                  <p><span className="text-slate-500 font-medium">Emergency Name:</span> <strong>{driver.emergencyContactName || '—'}</strong></p>
                  <p><span className="text-slate-500 font-medium">Emergency Phone:</span> <strong>{driver.emergencyContactNumber || '—'}</strong></p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: DOCUMENTS CHECKLIST */}
        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-left">
            {driver.documents.map((doc) => (
              <Card key={doc.id} className="premium-card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Document Category</span>
                    <h4 className="text-xs font-bold capitalize text-slate-800 dark:text-slate-200">{doc.docType.replace('_', ' ')}</h4>
                  </div>
                  <StatusBadge status={doc.verifyStatus} />
                </div>
                <div className="h-28 w-full bg-slate-100 dark:bg-slate-900 border border-border rounded-lg overflow-hidden relative group">
                  <img src={doc.fileUrl} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => openPreview(doc.fileUrl, doc.docType.replace('_', ' '))}
                      className="h-8 w-8 p-0 rounded-lg"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {doc.docNumber && (
                  <p className="text-[10px] text-slate-400">Doc ID: {doc.docNumber}</p>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* TAB 3: VEHICLE DETAILS */}
        {activeTab === 'vehicle' && (
          <div className="space-y-6">
            {driver.vehicle ? (
              <>
                <Card className="premium-card text-left">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <CardTitle>Vehicle Specifications</CardTitle>
                      <CardDescription>Associated partner vehicle specifications logs.</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      className="text-xs font-semibold h-8 rounded-lg border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-400 dark:hover:bg-amber-950/20"
                      onClick={() => alert('Vehicle documents flagged for operational renewal checks.')}
                    >
                      Flag for Renewal
                    </Button>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <p><span className="text-muted-foreground font-medium">Vehicle Class Type:</span> <strong className="uppercase">{driver.vehicle.vehicleType}</strong></p>
                    <p><span className="text-muted-foreground font-medium">Category Class:</span> <strong>{driver.vehicle.vehicleCategory || '—'}</strong></p>
                    <p><span className="text-muted-foreground font-medium">Brand & Make:</span> <strong>{driver.vehicle.brand || '—'}</strong></p>
                    <p><span className="text-muted-foreground font-medium">Model Variant:</span> <strong>{driver.vehicle.model || '—'}</strong></p>
                    <p><span className="text-muted-foreground font-medium">Plate Number:</span> <strong className="uppercase">{driver.vehicle.registrationPlate}</strong></p>
                    <p><span className="text-muted-foreground font-medium">Color:</span> <strong>{driver.vehicle.color || '—'}</strong></p>
                    <p><span className="text-muted-foreground font-medium">Seats Capacity:</span> <strong>{driver.vehicle.seatsCapacity} Seats</strong></p>
                    <p><span className="text-muted-foreground font-medium">Manufacturing Year:</span> <strong>{driver.vehicle.manufacturingYear || '—'}</strong></p>
                  </CardContent>
                </Card>

                {/* Expiry alerts & Vehicle documents checklist */}
                <Card className="premium-card text-left">
                  <CardHeader>
                    <CardTitle>Asset Expiry & Alert Indicators</CardTitle>
                    <CardDescription>Visual state of transport licenses, permits, and fitness policies.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: 'Insurance Policy Cover', docNo: driver.vehicle.insuranceNo, exp: driver.vehicle.insuranceExpiry },
                      { label: 'Commercial Road Permit', docNo: driver.vehicle.permitNo, exp: driver.vehicle.permitExpiry },
                      { label: 'Pollution Certificate (PUC)', docNo: driver.vehicle.pollutionNo, exp: driver.vehicle.pollutionExpiry },
                      ...(driver.vehicle.fitnessNo ? [{ label: 'Fitness Certificate', docNo: driver.vehicle.fitnessNo, exp: driver.vehicle.fitnessExpiry }] : []),
                    ].map((item, index) => (
                      <div key={index} className="p-3.5 border border-border rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Policy / Reg No: {item.docNo || '—'}</p>
                        </div>
                        <ExpiryIndicator expiryDate={item.exp} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400 font-medium">No vehicle asset registered.</div>
            )}
          </div>
        )}

        {/* TAB 4: RATINGS SUMMARY */}
        {activeTab === 'ratings' && (
          <div className="space-y-6 text-left">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Overall Ratings Card */}
              <Card className="premium-card p-6 flex flex-col justify-between items-center text-center">
                <div className="space-y-1 mt-3">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Average Rating</span>
                  <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5 mt-1">
                    <Star className="h-7 w-7 fill-amber-500 text-amber-500" />
                    <span>{Number(driver.ratingAvg || 5).toFixed(1)}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">Based on {driver.totalTrips || 0} customer reviews</p>
                </div>
                <div className="w-full border-t border-border mt-4 pt-4 text-xs text-muted-foreground font-semibold flex justify-around">
                  <div>
                    <p className="text-slate-800 dark:text-slate-200 font-bold text-sm">94%</p>
                    <p className="text-[10px]">Positive rate</p>
                  </div>
                  <div className="border-r border-border h-8" />
                  <div>
                    <p className="text-slate-800 dark:text-slate-200 font-bold text-sm">0%</p>
                    <p className="text-[10px]">Critical complaints</p>
                  </div>
                </div>
              </Card>

              {/* Star breakdown bar chart */}
              <Card className="premium-card p-6 md:col-span-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Rating Breakdown</h4>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = driver.ratingsBreakdown?.[stars] || 0
                    const total = Object.values(driver.ratingsBreakdown || {}).reduce((a, b) => a + b, 0) || 1
                    const percentage = Math.round((count / total) * 100)
                    
                    return (
                      <div key={stars} className="flex items-center gap-3 text-xs">
                        <span className="w-3 font-bold text-slate-500">{stars}</span>
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 flex-shrink-0" />
                        <div className="flex-grow h-2.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden border border-border/20">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="w-12 text-right font-medium text-slate-400">{percentage}% ({count})</span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>

            {/* Category Subscores */}
            <Card className="premium-card p-5">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">On-Trip Compliance Indicators</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {[
                  { label: 'Customer Behaviour', key: 'behaviour', score: driver.categoryScores?.behaviour || 5.0 },
                  { label: 'Safe Riding Habits', key: 'driving', score: driver.categoryScores?.driving || 5.0 },
                  { label: 'Punctual Arrivals', key: 'punctuality', score: driver.categoryScores?.punctuality || 5.0 },
                  { label: 'Vehicle Cleanliness', key: 'cleanliness', score: driver.categoryScores?.cleanliness || 5.0 },
                ].map((cat, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-border space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{cat.label}</span>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                      <span>{Number(cat.score).toFixed(1)}</span>
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent reviews list */}
            <Card className="premium-card">
              <CardHeader>
                <CardTitle>Recent Trip Reviews</CardTitle>
                <CardDescription>Passenger rating log submitted during billing settlements.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <DataTable
                  columns={reviewColumns}
                  data={driver.recentReviews || []}
                  selectable={false}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 5: EARNINGS & LEDGER */}
        {activeTab === 'earnings' && (
          <div className="space-y-6 text-left">
            
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Today Earnings', val: `₹${driver.earningsToday || 0}`, desc: 'Net fare generated today' },
                { label: 'Week Earnings', val: `₹${driver.earningsWeek || 0}`, desc: 'Ongoing cycle earnings' },
                { label: 'Wallet Balance', val: `₹${driver.walletBalance || 0}`, desc: 'Net payout credit due' },
                { label: 'Outstanding Dues', val: `₹${driver.outstandingDues || 0}`, desc: 'Uncollected commission fees' },
              ].map((kpi, idx) => (
                <Card key={idx} className="premium-card p-4 space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-100">{kpi.val}</p>
                  <p className="text-[9px] text-slate-400">{kpi.desc}</p>
                </Card>
              ))}
            </div>

            {/* Plan Configuration Card */}
            <Card className="premium-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Active Monetization Plan</span>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 capitalize">
                    {driver.billingMode === 'commission' 
                      ? '7% Commission Plan' 
                      : driver.billingMode === 'subscription' 
                        ? `Subscription Plan (${driver.subscriptionType || 'monthly'})` 
                        : 'Free Trial Plan'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Active
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {driver.billingMode === 'subscription' 
                    ? 'Fixed billing applied. No per-ride commissions.' 
                    : 'Commission auto-deducted from digital settlements or logged as dues.'}
                </p>
              </div>
              <Button
                variant="outline"
                className="gap-2 text-xs font-semibold h-9 rounded-lg border-border"
                onClick={() => {
                  setSelectedPlan(driver.billingMode || 'free')
                  setSubscriptionType(driver.subscriptionType || 'monthly')
                  setPlanNotes('')
                  setIsPlanModalOpen(true)
                }}
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Change Plan</span>
              </Button>
            </Card>

            {/* Ledger Transactions table */}
            <Card className="premium-card">
              <CardHeader>
                <CardTitle>Payout & Dues Ledger Transactions</CardTitle>
                <CardDescription>History logs of commission postings, subscription bills, and payout settlements.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <DataTable
                  columns={ledgerColumns}
                  data={driver.ledger || []}
                  selectable={false}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 6: TIMELINE & NOTES */}
        {activeTab === 'timeline' && (
          <div className="space-y-6 text-left">
            <Card className="premium-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle>Operational Timeline Logs</CardTitle>
                  <CardDescription>System telemetry logs and custom admin support notes.</CardDescription>
                </div>
                <Button
                  variant="primary"
                  className="gap-1.5 text-xs font-semibold h-8 rounded-lg"
                  onClick={() => {
                    setTimelineNote('')
                    setIsNoteModalOpen(true)
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add timeline note</span>
                </Button>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="relative border-l border-slate-200 pl-4 space-y-5 dark:border-slate-800 ml-2">
                  {driver.timeline?.map((evt) => (
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
                      <p className="text-[9px] text-slate-400 flex items-center gap-1">
                        <User className="h-2.5 w-2.5" />
                        <span>Logged by: {evt.actor}</span>
                        <span>•</span>
                        <Calendar className="h-2.5 w-2.5" />
                        <span>{new Date(evt.timestamp).toLocaleString('en-IN')}</span>
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
          </div>
        )}

        {/* TAB 7: SYSTEM AUDIT LOG */}
        {activeTab === 'audit' && (
          <Card className="premium-card text-left">
            <CardHeader>
              <CardTitle>Partner Audit Trail Log</CardTitle>
              <CardDescription>Operators logs recorded during driver partner profile cycle changes.</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <div className="relative border-l border-slate-200 pl-4 space-y-4 dark:border-slate-800">
                {driver.auditLogs.map((log, index) => (
                  <div key={index} className="space-y-1 relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary border-2 border-white dark:border-slate-900" />
                    <p className="text-xs font-bold text-text-primary">{log.action}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{log.operator}</span>
                      <span>•</span>
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </p>
                    {log.notes && (
                      <p className="text-[10px] bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-border text-slate-600 mt-1 dark:text-slate-400">
                        {log.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage || ''}
        title={previewTitle}
      />

      {/* Confirmation Modal for status changes (Suspend, Block, Activate) */}
      <ConfirmationModal
        isOpen={isStatusModalOpen}
        onCancel={() => {
          setIsStatusModalOpen(false)
          setStatusNotes('')
        }}
        onConfirm={() => {
          if (!statusAction) return
          
          const actionMap = {
            suspend: suspendDriver,
            block: blockDriver,
            activate: activateDriver
          }
          
          actionMap[statusAction]({ id: driver.id, notes: statusNotes }, {
            onSuccess: () => {
              setIsStatusModalOpen(false)
              setStatusNotes('')
            }
          })
        }}
        title={`${statusAction === 'suspend' ? 'Suspend' : statusAction === 'block' ? 'Block' : 'Activate'} Partner`}
        description={
          <div className="space-y-4 w-full">
            <p className="text-xs text-muted-foreground">
              Please provide a reason or operational audit note for this status change. This action will be logged in the timeline.
            </p>
            <textarea
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="Enter verification comments or reason..."
              className="w-full min-h-[80px] p-2.5 rounded-lg border border-border bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
        }
        confirmText="Confirm Action"
        variant={statusAction === 'block' ? 'danger' : 'warning'}
        loading={isSuspending || isBlocking || isActivating}
      />

      {/* Confirmation Modal for Monetization Plan updates */}
      <ConfirmationModal
        isOpen={isPlanModalOpen}
        onCancel={() => setIsPlanModalOpen(false)}
        onConfirm={() => {
          updateBillingPlan({
            id: driver.id,
            billingMode: selectedPlan,
            subscriptionType: selectedPlan === 'subscription' ? subscriptionType : undefined,
            notes: planNotes
          }, {
            onSuccess: () => setIsPlanModalOpen(false)
          })
        }}
        title="Change Monetization Plan"
        description={
          <div className="space-y-4 w-full">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Billing Plan Model</label>
              <div className="grid grid-cols-3 gap-2">
                {(['free', 'commission', 'subscription'] as const).map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setSelectedPlan(plan)}
                    className={cn(
                      "p-2.5 text-xs font-bold rounded-lg border transition-colors capitalize",
                      selectedPlan === plan
                        ? "bg-primary border-primary text-white border-transparent"
                        : "bg-surface border-border hover:bg-slate-50 text-slate-700 dark:text-slate-350 dark:hover:bg-slate-800"
                    )}
                  >
                    {plan === 'free' ? 'Free Trial' : plan === 'commission' ? '7% Commission' : 'Subscription'}
                  </button>
                ))}
              </div>
            </div>
            
            {selectedPlan === 'subscription' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subscription Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setSubscriptionType(freq)}
                      className={cn(
                        "p-2 text-xs font-bold rounded-lg border transition-colors capitalize",
                        subscriptionType === freq
                          ? "bg-primary border-primary text-white border-transparent"
                          : "bg-surface border-border hover:bg-slate-50 text-slate-700 dark:text-slate-350 dark:hover:bg-slate-800"
                      )}
                    >
                      {freq === 'daily' ? 'Daily (₹89)' : freq === 'weekly' ? 'Weekly (₹599)' : 'Monthly (₹1999)'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit Log Notes</label>
              <textarea
                value={planNotes}
                onChange={(e) => setPlanNotes(e.target.value)}
                placeholder="Reason for change..."
                className="w-full min-h-[60px] p-2.5 rounded-lg border border-border bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>
        }
        confirmText="Update Plan"
        variant="info"
        loading={isUpdatingPlan}
      />

      {/* Confirmation Modal for timeline Note additions */}
      <ConfirmationModal
        isOpen={isNoteModalOpen}
        onCancel={() => {
          setIsNoteModalOpen(false)
          setTimelineNote('')
        }}
        onConfirm={() => {
          if (!timelineNote.trim()) return
          addSupportNote({ id: driver.id, notes: timelineNote }, {
            onSuccess: () => {
              setIsNoteModalOpen(false)
              setTimelineNote('')
            }
          })
        }}
        title="Add Timeline Support Note"
        description={
          <div className="space-y-4 w-full">
            <p className="text-xs text-muted-foreground">
              Add operational support details. This note will be recorded directly on the partner's chronological timeline.
            </p>
            <textarea
              value={timelineNote}
              onChange={(e) => setTimelineNote(e.target.value)}
              placeholder="Enter note details..."
              className="w-full min-h-[100px] p-2.5 rounded-lg border border-border bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
        }
        confirmText="Save Note"
        variant="info"
        loading={isAddingNote}
      />
    </PageWrapper>
  )
}

export default DriverDetailsPage
