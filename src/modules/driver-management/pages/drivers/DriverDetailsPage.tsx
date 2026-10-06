import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useDriver,
  useSuspendDriver,
  useBlockDriver,
  useActivateDriver,
  useUpdateDriverBillingMode,
  useAddDriverTimelineNote,
  useFlagVehicleForRenewal,
} from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { ImagePreviewModal } from '../../components/ImagePreviewModal'
import { FileImage } from '@/shared/components/FileImage'
import { getFileReadUrl } from '@/shared/services/file-upload.service'
import { isFileId, resolveFileRef } from '@/shared/utils/file-ref'
import { ExpiryIndicator } from '../../components/ExpiryIndicator'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { DataTable } from '@/shared/components/DataTable'
import { useToast } from '@/shared/context/toast'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
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
  Settings,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react'
import { cn } from '@/shared/utils'

type DriverTab = 'overview' | 'documents' | 'vehicle' | 'ratings' | 'earnings' | 'timeline' | 'audit'

export const DriverDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success: showSuccess, error: showError } = useToast()
  const user = useAuthStore((state) => state.user)
  const canSuspend = hasPermission(user, 'drivers:write')
  const canFlagVehicle = hasPermission(user, 'vehicles:write')
  const [activeTab, setActiveTab] = useState<DriverTab>('overview')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')

  // Modals operational state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [statusAction, setStatusAction] = useState<'suspend' | 'block' | 'activate' | null>(null)
  const [statusNotes, setStatusNotes] = useState('')

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'commission' | 'subscription'>('commission')
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
  const { mutate: flagVehicleRenewal, isPending: isFlaggingVehicle } = useFlagVehicleForRenewal()

  const openPreview = async (ref: string, title: string) => {
    if (!ref) return
    try {
      const url = isFileId(ref) ? await getFileReadUrl(ref) : ref
      setPreviewImage(url)
      setPreviewTitle(title)
    } catch {
      showError('Preview unavailable', 'Could not load the document image.')
    }
  }

  const reviewColumns = [
    {
      key: 'date',
      label: 'Date',
      align: 'center' as const,
      render: (date: string) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {new Date(date).toLocaleDateString('en-IN')}
        </span>
      ),
    },
    {
      key: 'riderName',
      label: 'Rider Name',
      align: 'left' as const,
      render: (name: string) => (
        <span className="font-bold text-xs text-slate-800 dark:text-white">{name}</span>
      ),
    },
    {
      key: 'score',
      label: 'Rating',
      align: 'center' as const,
      render: (score: number) => (
        <span className="inline-flex items-center gap-1 font-bold text-xs text-amber-500">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
          {score}
        </span>
      ),
    },
    {
      key: 'comment',
      label: 'Review Comment',
      align: 'left' as const,
      render: (comment: string) => <span className="italic text-xs text-slate-600 dark:text-slate-350">"{comment}"</span>,
    },
  ]

  const ledgerColumns = [
    {
      key: 'id',
      label: 'Transaction ID',
      align: 'center' as const,
      render: (id: string) => (
        <span className="font-mono text-xs font-bold text-[#1F2B6D] dark:text-[#8B93D9]">{id}</span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      align: 'center' as const,
      render: (date: string) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {new Date(date).toLocaleDateString('en-IN')}
        </span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      align: 'center' as const,
      render: (type: string) => (
        <span
          className={cn(
            'px-2 py-0.5 rounded-full text-[10px] font-black border',
            type === 'EARNING' &&
              'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800',
            type === 'COMMISSION_DUE' &&
              'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800',
            type === 'PAYOUT' &&
              'bg-[#1F2B6D]/10 border-[#1F2B6D]/20 text-[#1F2B6D] dark:bg-slate-800 dark:text-[#8B93D9]',
            type === 'BONUS' &&
              'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400',
          )}
        >
          {type}
        </span>
      ),
    },
    {
      key: 'rideId',
      label: 'Description',
      align: 'left' as const,
      render: (rideId: string) => (
        <span className="text-xs text-slate-700 dark:text-slate-300">
          {rideId ? `Booking ref: ${rideId}` : 'Weekly settlement payout'}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right' as const,
      render: (amount: number) => (
        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
          ₹{(amount || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'commission',
      label: 'Commission Charged',
      align: 'right' as const,
      render: (_: any, row: any) => (
        <span className="font-mono text-xs text-rose-500 font-semibold">
          {row.type === 'EARNING' ? `₹${((row.amount || 0) * 0.07).toFixed(2)}` : '—'}
        </span>
      ),
    },
    {
      key: 'driverEarning',
      label: "Driver's Earning",
      align: 'right' as const,
      render: (_: any, row: any) => (
        <span className="font-mono text-xs text-emerald-600 font-bold">
          {row.type === 'EARNING'
            ? `₹${((row.amount || 0) * 0.93).toFixed(2)}`
            : `₹${(row.amount || 0).toFixed(2)}`}
        </span>
      ),
    },
    {
      key: 'balanceAfter',
      label: 'Balance After',
      align: 'right' as const,
      render: (balance: number) => (
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
          ₹{balance.toFixed(2)}
        </span>
      ),
    },
  ]

  if (isLoading) {
    return (
      <PageWrapper className="pt-1 pb-6 px-3 sm:px-5">
        <div className="flex items-center justify-center p-16 text-[#1F2B6D] dark:text-[#8B93D9] font-medium animate-pulse text-sm">
          Loading Driver Profile details...
        </div>
      </PageWrapper>
    )
  }

  if (isError || !driver) {
    return (
      <PageWrapper className="pt-1 pb-6 px-3 sm:px-5">
        <div className="flex flex-col items-center justify-center p-16 space-y-4">
          <AlertTriangle className="h-12 w-12 text-slate-400" />
          <h3 className="text-base font-bold text-[#1F2B6D] dark:text-white">Driver Profile Not Found</h3>
          <button
            type="button"
            onClick={() => navigate('/driver-management/drivers')}
            className="bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white px-4 py-2 rounded-[10px] text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            Back to Driver Directory
          </button>
        </div>
      </PageWrapper>
    )
  }

  const isSuspendedOrBlocked =
    driver.driverStatus === 'suspended' || driver.driverStatus === 'blocked'

  return (
    <PageWrapper className="space-y-4 pt-1 pb-6 px-3 sm:px-5">
      {/* ─── 1. Header with Geographic Dashboard Styling ───────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/driver-management/drivers')}
            title="Back to Driver Directory"
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition shadow-2xs cursor-pointer flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2B6D] dark:text-white">
              Driver Profile: {driver.driverName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive dashboard metrics, compliance document audits, bookings log, and payout ledgers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="text-xs font-semibold text-[#1F2B6D] dark:text-[#8B93D9] bg-[#1F2B6D]/[0.06] hover:bg-[#1F2B6D]/[0.12] dark:bg-slate-800 dark:hover:bg-slate-700/80 px-3 py-2 rounded-[10px] border border-[#1F2B6D]/20 dark:border-slate-700 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            onClick={() => navigate(`/driver-management/drivers/${driver.id}/edit`)}
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit Profile</span>
          </button>

          {canSuspend &&
            (isSuspendedOrBlocked ? (
              <button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white px-3.5 py-2 rounded-[10px] text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                onClick={() => {
                  setStatusAction('activate')
                  setIsStatusModalOpen(true)
                }}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Activate Partner</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 px-3.5 py-2 rounded-[10px] border border-amber-200 dark:border-amber-800 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  onClick={() => {
                    setStatusAction('suspend')
                    setIsStatusModalOpen(true)
                  }}
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  <span>Suspend</span>
                </button>
                <button
                  type="button"
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100/80 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 px-3.5 py-2 rounded-[10px] border border-rose-200 dark:border-rose-800 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  onClick={() => {
                    setStatusAction('block')
                    setIsStatusModalOpen(true)
                  }}
                >
                  <Ban className="h-3.5 w-3.5 text-rose-500" />
                  <span>Block</span>
                </button>
              </>
            ))}
        </div>
      </div>

      {/* ─── 2. Driver Identity Profile Card ───────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm text-left">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            {/* Driver Avatar */}
            <div className="h-20 w-20 rounded-2xl bg-[#1F2B6D] text-white overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0 flex items-center justify-center font-extrabold text-2xl shadow-md">
              <FileImage
                src={driver.profilePhotoUrl}
                alt="Driver Profile"
                className="h-full w-full object-cover"
                fallback={<span className="text-white">{driver.driverName?.charAt(0).toUpperCase() || 'D'}</span>}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-[#1F2B6D] dark:text-white tracking-tight">
                  {driver.driverName}
                </h2>
                <StatusBadge status={driver.driverStatus} />
                <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 uppercase dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                  <span className={cn('h-1.5 w-1.5 rounded-full bg-emerald-500', driver.isOnline && 'animate-pulse')} />
                  {driver.isOnline ? 'Online' : 'Offline'}
                </span>
                <span className="px-2.5 py-0.5 rounded-xl bg-[#1F2B6D]/[0.06] dark:bg-slate-800 border border-[#1F2B6D]/15 dark:border-slate-700 text-[#1F2B6D] dark:text-[#8B93D9] text-[10px] font-bold uppercase tracking-wider">
                  Gold Tier (580 pts)
                </span>
              </div>

              <div className="flex items-center gap-4 flex-wrap text-xs text-slate-600 dark:text-slate-300">
                <p>
                  Mobile: <strong className="font-mono text-slate-800 dark:text-white font-bold">{driver.mobileNumber}</strong>
                </p>
                {driver.email && (
                  <p>
                    Email: <strong className="text-slate-800 dark:text-white font-semibold">{driver.email}</strong>
                  </p>
                )}
                <p>
                  Gender / DOB: <strong className="text-slate-800 dark:text-white">{driver.gender || '—'} / {driver.dateOfBirth || '—'}</strong>
                </p>
              </div>

              {driver.country && (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span>
                    {driver.addressLine1}, {driver.addressLine2 ? `${driver.addressLine2}, ` : ''}
                    {driver.city}, {driver.state} - {driver.postcode} ({driver.country})
                  </span>
                </p>
              )}

              {/* Duty Status Quick Boxes */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-2.5 border border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20 rounded-xl flex flex-col justify-center">
                  <span className="text-[9px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">Account State</span>
                  <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase mt-0.5">Active</span>
                </div>
                <div className="p-2.5 border border-[#1F2B6D]/20 bg-[#1F2B6D]/[0.05] dark:border-slate-800 dark:bg-slate-800/40 rounded-xl flex flex-col justify-center">
                  <span className="text-[9px] uppercase font-bold text-[#1F2B6D] dark:text-[#8B93D9] tracking-wider">Duty Status</span>
                  <span className="text-xs font-black text-[#1F2B6D] dark:text-white uppercase mt-0.5">{driver.isOnline ? 'Online' : 'Offline'}</span>
                </div>
                <div className="p-2.5 border border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40 rounded-xl flex flex-col justify-center">
                  <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Real-time status</span>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase mt-0.5">{driver.isOnline ? 'Available' : 'Resting'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Metadata */}
          <div className="flex flex-col gap-3 self-start lg:self-center pl-2 border-l border-slate-100 dark:border-slate-800 lg:pl-8 min-w-[200px]">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-semibold">Background check</span>
              <span
                className={cn(
                  'text-xs font-bold px-2 py-0.5 rounded-full border',
                  driver.bgCheckStatus === 'clear'
                    ? 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400'
                    : 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400',
                )}
              >
                {driver.bgCheckStatus?.replace('_', ' ').toUpperCase() || '—'}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-semibold">Trips completed</span>
              <strong className="text-sm font-bold text-[#1F2B6D] dark:text-white">{driver.totalTrips} Trips</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400 font-semibold">Passenger rating</span>
              <span className="flex items-center gap-1 font-bold text-sm text-amber-500">
                <Star className="h-4 w-4 fill-amber-500" />
                <span>{Number(driver.ratingAvg || 5).toFixed(1)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Top 4 Metric KPI Cards (Geographic Dashboard Style) ────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Trips */}
        <div
          onClick={() => setActiveTab('overview')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between cursor-pointer hover:shadow-md transition-all text-left"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {driver.totalTrips || 0}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Total Completed Trips
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {driver.vehicleType || 'Commercial'} fleet partner
          </p>
        </div>

        {/* Card 2: Driver Rating */}
        <div
          onClick={() => setActiveTab('ratings')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between cursor-pointer hover:shadow-md transition-all text-left"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Star className="w-5 h-5 fill-white text-white" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {Number(driver.ratingAvg || 5).toFixed(1)} ★
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Passenger Rating
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            Based on {driver.totalTrips || 0} trip reviews
          </p>
        </div>

        {/* Card 3: Wallet Balance */}
        <div
          onClick={() => setActiveTab('earnings')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between cursor-pointer hover:shadow-md transition-all text-left"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  ₹{(driver.walletBalance || 0).toFixed(0)}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Wallet Balance
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            ₹{driver.outstandingDues || 0} uncollected dues
          </p>
        </div>

        {/* Card 4: Compliance Status */}
        <div
          onClick={() => setActiveTab('documents')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between cursor-pointer hover:shadow-md transition-all text-left"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {driver.bgCheckStatus === 'clear' ? 'Verified' : 'Pending'}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Compliance Status
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {driver.documents?.length || 0} commercial documents on file
          </p>
        </div>
      </div>

      {/* ─── 4. Pill Tab Bar Navigation ────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 mb-6">
        {[
          { id: 'overview', label: 'Overview', icon: User },
          { id: 'documents', label: `Documents Checklist (${driver.documents?.length || 0})`, icon: FileText },
          { id: 'vehicle', label: 'Vehicle Details', icon: Car },
          { id: 'ratings', label: 'Ratings Summary', icon: Star },
          { id: 'earnings', label: 'Earnings & Ledger', icon: CreditCard },
          { id: 'timeline', label: `Timeline & Notes (${driver.timeline?.length || 0})`, icon: Clock },
          { id: 'audit', label: `System Logs (${driver.auditLogs?.length || 0})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DriverTab)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer',
                isActive
                  ? 'bg-[#1F2B6D] text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 font-semibold',
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div className="space-y-6">
        {/* ─── TAB 1: OVERVIEW ─────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
            {/* Panel 1: Partner Specifications */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-[#1F2B6D]/[0.08] dark:bg-slate-800 flex items-center justify-center text-[#1F2B6D] dark:text-[#8B93D9]">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                        Partner Specifications
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Fleet and registration metadata</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Preferred Language</span>
                    <strong className="text-slate-800 dark:text-white font-semibold">{driver.preferredLanguage || '—'}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Joined Platform</span>
                    <strong className="text-slate-800 dark:text-white font-semibold">{new Date(driver.joinedAt).toLocaleDateString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Associated Vehicle</span>
                    <strong className="uppercase font-mono text-[#1F2B6D] dark:text-[#8B93D9]">{driver.registrationPlate || 'No Vehicle Linked'} ({driver.vehicleType})</strong>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-3">
                    <span className="text-rose-600 font-bold uppercase block text-[9px] tracking-wider">Category Flag</span>
                    <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] uppercase mt-1 inline-block">Speed Limit Alert</span>
                    <p className="text-[10px] text-slate-400 italic mt-1.5 leading-relaxed">Reason: "Telemetry indicated vehicle speed exceeded 80km/h inside municipal limits."</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 2: Gamification Policy & Tiers */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-[#1F2B6D]/[0.08] dark:bg-slate-800 flex items-center justify-center text-[#1F2B6D] dark:text-[#8B93D9]">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                        Gamification Policy & Tiers
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Accrued lifetime points tier</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-2 text-xs">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[11px] border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">Bronze Tier</span>
                      <span className="text-slate-400 font-mono">0 - 99 pts</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">Silver Tier</span>
                      <span className="text-slate-400 font-mono">100 - 499 pts</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] border-b border-slate-100 dark:border-slate-800 pb-1.5 bg-amber-50/50 dark:bg-amber-950/20 p-1.5 rounded-lg">
                      <span className="font-bold text-amber-700 dark:text-amber-300">Gold Tier</span>
                      <span className="text-amber-700 dark:text-amber-300 font-bold font-mono">500 - 1,499 pts (Active)</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-semibold text-purple-600 dark:text-purple-400">Diamond Tier</span>
                      <span className="text-slate-400 font-mono">1,500+ pts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 3: Emergency Contacts */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-[#1F2B6D]/[0.08] dark:bg-slate-800 flex items-center justify-center text-[#1F2B6D] dark:text-[#8B93D9]">
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                        Emergency Contacts
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">SOS and next of kin details</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Contact Name</span>
                    <strong className="text-slate-800 dark:text-white font-semibold">{driver.emergencyContactName || '—'}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Emergency Phone</span>
                    <strong className="font-mono text-slate-800 dark:text-white font-bold">{driver.emergencyContactNumber || '—'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: DOCUMENTS CHECKLIST ──────────────────────────────────── */}
        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-left">
            {(driver.documents ?? []).map((doc) => (
              <div
                key={doc.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      {doc.category === 'vehicle' ? 'Vehicle Document' : 'Driver Identity'}
                    </span>
                    <h4 className="text-xs font-bold capitalize text-slate-800 dark:text-white">
                      {doc.docType.replace('_', ' ')}
                    </h4>
                  </div>
                  <StatusBadge status={doc.verifyStatus} />
                </div>

                <div className="h-32 w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden relative group">
                  <FileImage
                    src={resolveFileRef(doc.fileUrl, doc.fileId)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => openPreview(resolveFileRef(doc.fileUrl, doc.fileId), doc.docType.replace('_', ' '))}
                      className="bg-[#1F2B6D] hover:bg-[#182258] text-white p-2 rounded-lg shadow-sm cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {doc.docNumber && (
                  <p className="text-[10px] text-slate-400 font-mono">Doc ID: {doc.docNumber}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── TAB 3: VEHICLE DETAILS ──────────────────────────────────────── */}
        {activeTab === 'vehicle' && (
          <div className="space-y-5 text-left">
            {driver.vehicle ? (
              <>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-[#1F2B6D]/[0.08] dark:bg-slate-800 flex items-center justify-center text-[#1F2B6D] dark:text-[#8B93D9]">
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                          Vehicle Specifications
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Associated partner vehicle asset data</p>
                      </div>
                    </div>
                    {canFlagVehicle && (
                      <button
                        type="button"
                        className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 px-3 py-1.5 rounded-[10px] border border-amber-200 dark:border-amber-800 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        disabled={isFlaggingVehicle}
                        onClick={() => {
                          if (!driver.vehicle?.id) return
                          flagVehicleRenewal(
                            {
                              id: driver.vehicle.id,
                              notes: 'Flagged commercial certifications for audit renewal.',
                            },
                            {
                              onSuccess: () => {
                                showSuccess(
                                  'Flagged for renewal',
                                  'Vehicle documents were reset to pending for re-verification.',
                                )
                              },
                              onError: (err: unknown) => {
                                showError(
                                  'Could not flag vehicle',
                                  err instanceof Error ? err.message : 'Request failed',
                                )
                              },
                            },
                          )
                        }}
                      >
                        Flag for Renewal
                      </button>
                    )}
                  </div>
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <p><span className="text-slate-500 font-medium">Vehicle Class Type:</span> <strong className="uppercase font-bold text-slate-800 dark:text-white">{driver.vehicle.vehicleType}</strong></p>
                    <p><span className="text-slate-500 font-medium">Category Class:</span> <strong className="text-slate-800 dark:text-white">{driver.vehicle.vehicleCategory || '—'}</strong></p>
                    <p><span className="text-slate-500 font-medium">Brand & Make:</span> <strong className="text-slate-800 dark:text-white">{driver.vehicle.brand || '—'}</strong></p>
                    <p><span className="text-slate-500 font-medium">Model Variant:</span> <strong className="text-slate-800 dark:text-white">{driver.vehicle.model || '—'}</strong></p>
                    <p><span className="text-slate-500 font-medium">Plate Number:</span> <strong className="uppercase font-mono text-[#1F2B6D] dark:text-[#8B93D9]">{driver.vehicle.registrationPlate}</strong></p>
                    <p><span className="text-slate-500 font-medium">Color:</span> <strong className="text-slate-800 dark:text-white">{driver.vehicle.color || '—'}</strong></p>
                    <p><span className="text-slate-500 font-medium">Seats Capacity:</span> <strong className="text-slate-800 dark:text-white">{driver.vehicle.seatsCapacity} Seats</strong></p>
                    <p><span className="text-slate-500 font-medium">Manufacturing Year:</span> <strong className="text-slate-800 dark:text-white">{driver.vehicle.manufacturingYear || '—'}</strong></p>
                  </div>
                </div>

                {/* Expiry alerts & Vehicle documents checklist */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                      Asset Expiry & Alert Indicators
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Visual state of transport licenses, permits, and fitness policies</p>
                  </div>
                  <div className="p-5 space-y-3">
                    {[
                      { label: 'Registration Certificate (RC)', docNo: driver.vehicle.rcNumber, exp: undefined as string | undefined },
                      { label: 'Insurance Policy Cover', docNo: driver.vehicle.insuranceNo, exp: driver.vehicle.insuranceExpiry },
                      { label: 'Commercial Road Permit', docNo: driver.vehicle.permitNo, exp: driver.vehicle.permitExpiry },
                      { label: 'Pollution Certificate (PUC)', docNo: driver.vehicle.pollutionNo, exp: driver.vehicle.pollutionExpiry },
                      ...(driver.vehicle.fitnessNo ? [{ label: 'Fitness Certificate', docNo: driver.vehicle.fitnessNo, exp: driver.vehicle.fitnessExpiry }] : []),
                    ].map((item, index) => (
                      <div key={index} className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-white">{item.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Policy / Reg No: {item.docNo || '—'}</p>
                        </div>
                        <ExpiryIndicator expiryDate={item.exp} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400 font-medium text-xs">No vehicle asset registered.</div>
            )}
          </div>
        )}

        {/* ─── TAB 4: RATINGS SUMMARY ──────────────────────────────────────── */}
        {activeTab === 'ratings' && (
          <div className="space-y-5 text-left">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Overall Ratings Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-6 flex flex-col justify-between items-center text-center shadow-sm">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Average Rating</span>
                  <h3 className="text-3xl font-extrabold text-[#1F2B6D] dark:text-white flex items-center justify-center gap-1.5 mt-1">
                    <Star className="h-7 w-7 fill-amber-500 text-amber-500" />
                    <span>{Number(driver.ratingAvg || 5).toFixed(1)}</span>
                  </h3>
                  <p className="text-xs text-slate-500">Based on {driver.totalTrips || 0} customer reviews</p>
                </div>
                <div className="w-full border-t border-slate-100 dark:border-slate-800 mt-4 pt-4 text-xs text-slate-500 font-semibold flex justify-around">
                  <div>
                    <p className="text-slate-800 dark:text-white font-bold text-sm">94%</p>
                    <p className="text-[10px]">Positive rate</p>
                  </div>
                  <div className="border-r border-slate-100 dark:border-slate-800 h-8" />
                  <div>
                    <p className="text-slate-800 dark:text-white font-bold text-sm">0%</p>
                    <p className="text-[10px]">Critical complaints</p>
                  </div>
                </div>
              </div>

              {/* Star breakdown bar chart */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-6 md:col-span-2 shadow-sm">
                <h4 className="text-xs font-bold text-[#1F2B6D] dark:text-white uppercase tracking-wider mb-4">Rating Breakdown</h4>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = driver.ratingsBreakdown?.[stars] || 0
                    const total = Object.values(driver.ratingsBreakdown || {}).reduce((a, b) => a + b, 0) || 1
                    const percentage = Math.round((count / total) * 100)

                    return (
                      <div key={stars} className="flex items-center gap-3 text-xs">
                        <span className="w-3 font-bold text-slate-500">{stars}</span>
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 flex-shrink-0" />
                        <div className="flex-grow h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="w-12 text-right font-medium text-slate-400">{percentage}% ({count})</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Category Subscores */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm">
              <h4 className="text-xs font-bold text-[#1F2B6D] dark:text-white uppercase tracking-wider mb-4">On-Trip Compliance Indicators</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {[
                  { label: 'Customer Behaviour', key: 'behaviour', score: driver.categoryScores?.behaviour || 5.0 },
                  { label: 'Safe Riding Habits', key: 'driving', score: driver.categoryScores?.driving || 5.0 },
                  { label: 'Punctual Arrivals', key: 'punctuality', score: driver.categoryScores?.punctuality || 5.0 },
                  { label: 'Vehicle Cleanliness', key: 'cleanliness', score: driver.categoryScores?.cleanliness || 5.0 },
                ].map((cat, i) => (
                  <div key={i} className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{cat.label}</span>
                    <p className="text-lg font-black text-slate-800 dark:text-white flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                      <span>{Number(cat.score).toFixed(1)}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent reviews list */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">Recent Trip Reviews</h3>
                <p className="text-xs text-slate-400 mt-0.5">Passenger rating log submitted during billing settlements</p>
              </div>
              <div className="p-1">
                <DataTable
                  columns={reviewColumns}
                  data={driver.recentReviews || []}
                  selectable={false}
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 5: EARNINGS & LEDGER ─────────────────────────────────────── */}
        {activeTab === 'earnings' && (
          <div className="space-y-5 text-left">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {[
                { label: 'Today Earnings', val: `₹${driver.earningsToday || 0}`, desc: 'Net fare generated today' },
                { label: 'Week Earnings', val: `₹${driver.earningsWeek || 0}`, desc: 'Ongoing cycle earnings' },
                { label: 'Wallet Balance', val: `₹${driver.walletBalance || 0}`, desc: 'Net payout credit due' },
                { label: 'Outstanding Dues', val: `₹${driver.outstandingDues || 0}`, desc: 'Uncollected commission fees' },
              ].map((kpi, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
                  <p className="text-xl font-extrabold text-[#1F2B6D] dark:text-white my-1">{kpi.val}</p>
                  <p className="text-[10px] text-slate-400">{kpi.desc}</p>
                </div>
              ))}
            </div>

            {/* Plan Configuration Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Active Monetization Plan</span>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[#1F2B6D] dark:text-white capitalize">
                    {driver.billingMode === 'commission'
                      ? '7% Commission Plan'
                      : driver.billingMode === 'subscription'
                        ? `Subscription Plan (${driver.subscriptionType || 'monthly'})`
                        : 'Free Trial Plan'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {driver.billingMode === 'subscription'
                    ? 'Fixed billing applied. No per-ride commissions.'
                    : 'Commission auto-deducted from digital settlements or logged as dues.'}
                </p>
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-[#1F2B6D] dark:text-[#8B93D9] bg-[#1F2B6D]/[0.06] hover:bg-[#1F2B6D]/[0.12] dark:bg-slate-800 dark:hover:bg-slate-700/80 px-3 py-2 rounded-[10px] border border-[#1F2B6D]/20 dark:border-slate-700 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                onClick={() => {
                  setSelectedPlan(driver.billingMode === 'subscription' ? 'subscription' : 'commission')
                  setSubscriptionType(driver.subscriptionType || 'monthly')
                  setPlanNotes('')
                  setIsPlanModalOpen(true)
                }}
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Change Plan</span>
              </button>
            </div>

            {/* Ledger Transactions table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                  Payout & Dues Ledger Transactions
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">History logs of commission postings, subscription bills, and payout settlements</p>
              </div>
              <div className="p-1">
                <DataTable
                  columns={ledgerColumns}
                  data={driver.ledger || []}
                  selectable={false}
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 6: TIMELINE & NOTES ─────────────────────────────────────── */}
        {activeTab === 'timeline' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden text-left">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                  Operational Timeline Logs
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">System telemetry logs and custom admin support notes</p>
              </div>
              <button
                type="button"
                className="bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white px-3 py-1.5 rounded-[10px] text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                onClick={() => {
                  setTimelineNote('')
                  setIsNoteModalOpen(true)
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add timeline note</span>
              </button>
            </div>
            <div className="p-6">
              <div className="relative border-l-2 border-[#1F2B6D] pl-4 space-y-5 ml-2">
                {driver.timeline?.map((evt) => (
                  <div key={evt.id} className="space-y-1 relative">
                    <span
                      className={cn(
                        'absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900',
                        evt.isSystem ? 'bg-slate-400' : 'bg-[#1F2B6D]',
                      )}
                    />
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
                      <p className="text-[10px] bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 mt-1 dark:text-slate-400 font-medium">
                        {evt.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 7: SYSTEM AUDIT LOG ─────────────────────────────────────── */}
        {activeTab === 'audit' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden text-left">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                Partner Audit Trail Log
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Operators logs recorded during driver partner profile cycle changes</p>
            </div>
            <div className="p-6">
              <div className="relative border-l-2 border-[#1F2B6D] pl-4 space-y-4 ml-2">
                {driver.auditLogs.map((log, index) => (
                  <div key={index} className="space-y-1 relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#1F2B6D] border-2 border-white dark:border-slate-900" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{log.action}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{log.operator}</span>
                      <span>•</span>
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </p>
                    {log.notes && (
                      <p className="text-[10px] bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 mt-1 dark:text-slate-400">
                        {log.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
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
          setStatusAction(null)
        }}
        onConfirm={() => {
          if (!statusAction) return

          const actionMap = {
            suspend: suspendDriver,
            block: blockDriver,
            activate: activateDriver,
          }

          actionMap[statusAction](
            { id: driver.id, notes: statusNotes || undefined },
            {
              onSuccess: () => {
                showSuccess(
                  'Driver updated',
                  `Account marked as ${statusAction === 'activate' ? 'active' : statusAction}.`,
                )
                setIsStatusModalOpen(false)
                setStatusNotes('')
                setStatusAction(null)
              },
              onError: (err: unknown) => {
                showError(
                  'Could not update driver',
                  err instanceof Error ? err.message : 'Request failed',
                )
              },
            },
          )
        }}
        title={`${statusAction === 'suspend' ? 'Suspend' : statusAction === 'block' ? 'Block' : 'Activate'} Partner`}
        description={
          <div className="space-y-4 w-full text-left">
            <p className="text-xs text-muted-foreground">
              Please provide a reason or operational audit note for this status change. This action will be logged in the timeline.
            </p>
            <textarea
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="Enter verification comments or reason..."
              className="w-full min-h-[80px] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-[#1F2B6D] focus:outline-none"
            />
          </div>
        }
        confirmText="Confirm Action"
        variant={statusAction === 'block' ? 'danger' : statusAction === 'activate' ? 'info' : 'warning'}
        loading={isSuspending || isBlocking || isActivating}
      />

      {/* Confirmation Modal for Monetization Plan updates */}
      <ConfirmationModal
        isOpen={isPlanModalOpen}
        onCancel={() => setIsPlanModalOpen(false)}
        onConfirm={() => {
          updateBillingPlan(
            {
              id: driver.id,
              billingMode: selectedPlan,
              subscriptionType: selectedPlan === 'subscription' ? subscriptionType : undefined,
              notes: planNotes,
            },
            {
              onSuccess: () => setIsPlanModalOpen(false),
              onError: (err: unknown) => {
                showError(
                  'Billing update unavailable',
                  err instanceof Error ? err.message : 'Request failed',
                )
              },
            },
          )
        }}
        title="Change Monetization Plan"
        description={
          <div className="space-y-4 w-full text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Billing Plan Model</label>
              <div className="grid grid-cols-2 gap-2">
                {(['commission', 'subscription'] as const).map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setSelectedPlan(plan)}
                    className={cn(
                      'p-2.5 text-xs font-bold rounded-lg border transition-colors capitalize cursor-pointer',
                      selectedPlan === plan
                        ? 'bg-[#1F2B6D] border-[#1F2B6D] text-white'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300',
                    )}
                  >
                    {plan === 'commission' ? '7% Commission' : 'Subscription'}
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
                        'p-2 text-xs font-bold rounded-lg border transition-colors capitalize cursor-pointer',
                        subscriptionType === freq
                          ? 'bg-[#1F2B6D] border-[#1F2B6D] text-white'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300',
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
                className="w-full min-h-[60px] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-[#1F2B6D] focus:outline-none"
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
          addSupportNote(
            { id: driver.id, notes: timelineNote },
            {
              onSuccess: () => {
                setIsNoteModalOpen(false)
                setTimelineNote('')
              },
              onError: (err: unknown) => {
                showError(
                  'Note unavailable',
                  err instanceof Error ? err.message : 'Request failed',
                )
              },
            },
          )
        }}
        title="Add Timeline Support Note"
        description={
          <div className="space-y-4 w-full text-left">
            <p className="text-xs text-muted-foreground">
              Add operational support details. This note will be recorded directly on the partner's chronological timeline.
            </p>
            <textarea
              value={timelineNote}
              onChange={(e) => setTimelineNote(e.target.value)}
              placeholder="Enter note details..."
              className="w-full min-h-[100px] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-[#1F2B6D] focus:outline-none"
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
