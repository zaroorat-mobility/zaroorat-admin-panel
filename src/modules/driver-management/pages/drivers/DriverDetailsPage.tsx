import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useDriver,
  useUpdateDriver,
  useSuspendDriver,
  useBlockDriver,
  useActivateDriver,
  useAddDriverTimelineNote,
  useFlagVehicleForRenewal,
} from '../../hooks'
import type { DriverDetails } from '../../types'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import {
  DriverProfileHeaderCard,
  ReviewSummaryCard,
  PersonalInfoCard,
  VehicleInfoCard,
  ReviewDocumentCard,
  ImagePreviewModal,
  BankInfoCard,
  DriverActivityLogsTab,
  DriverRidesPerformanceTab,
  DriverRatingsReviewsTab,
  EditDriverModal,
  SuspendDriverModal,
} from '../../components'
import { getFileReadUrl } from '@/shared/services/file-upload.service'
import { isFileId, resolveFileRef } from '@/shared/utils/file-ref'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { DataTable } from '@/shared/components/DataTable'
import { useToast } from '@/shared/context/toast'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import carMainShowcase from '@/assets/images/vehicle-showcase/car-main.png'
import photoFrontShowcase from '@/assets/images/vehicle-showcase/photo-front.png'
import photoRearShowcase from '@/assets/images/vehicle-showcase/photo-rear.png'
import photoSideShowcase from '@/assets/images/vehicle-showcase/photo-side.png'
import photoInteriorShowcase from '@/assets/images/vehicle-showcase/photo-interior.png'
import docRcShowcase from '@/assets/images/vehicle-showcase/doc-rc.png'
import docInsShowcase from '@/assets/images/vehicle-showcase/doc-insurance.png'
import docPucShowcase from '@/assets/images/vehicle-showcase/doc-puc.png'
import docPermitShowcase from '@/assets/images/vehicle-showcase/doc-permit.png'
import {
  Car,
  FileText,
  CreditCard,
  History,
  Star,
  AlertTriangle,
  Edit,
  Edit2,
  Calendar,
  Clock,
  Ban,
  ShieldCheck,
  Plus,
  ArrowLeft,
  ShieldAlert,
  Check,
  CheckCircle2,
  Wallet,
  ChevronRight,
  TrendingUp,
  MoreVertical,
  Download,
  Smartphone,
  Key,
  MessageSquare,
  Power,
  Pause,
  LayoutDashboard,
  Copy,
  Upload,
  Eye,
  RefreshCw,
  Crown,
  Send,
  PauseCircle,
  X,
  Zap,
  Receipt,
} from 'lucide-react'
import { cn } from '@/shared/utils'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/shared/components/ui/Table'
import { Badge } from '@/shared/components/ui/Badge'

type DriverTab =
  | 'overview'
  | 'documents'
  | 'vehicle'
  | 'subscription'
  | 'wallet'
  | 'rides'
  | 'ratings'
  | 'activity'

// Unknown amounts render as "—", never as ₹0
const money = (v?: number | null) => (v != null ? `₹${v.toLocaleString('en-IN')}` : '—')

/// Commission or Subscription is the driver's own choice, made in the driver app after
/// approval. Shown as chosen; never assumed, and never set from here.
function paymentPlan(driver: Pick<DriverDetails, 'paymentModel' | 'subscription'>) {
  if (driver.subscription?.planName) {
    return { name: driver.subscription.planName, detail: `${driver.subscription.status} plan` }
  }
  if (driver.paymentModel === 'SUBSCRIPTION') return { name: 'Subscription', detail: 'No active plan yet' }
  if (driver.paymentModel === 'COMMISSION') return { name: 'Commission', detail: 'Commission per ride' }
  return { name: 'Not chosen yet', detail: 'The driver picks it in the driver app' }
}

export const DriverDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success: showSuccess, error: showError } = useToast()
  const user = useAuthStore((state) => state.user)
  const canSuspend = hasPermission(user, 'drivers:write')

  const [activeTab, setActiveTab] = useState<DriverTab>('overview')
  const [activeDocCategory, setActiveDocCategory] = useState<'all' | 'driver' | 'vehicle'>('all')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')

  // Modals operational state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [statusAction, setStatusAction] = useState<'suspend' | 'block' | 'activate' | null>(null)
  const [statusNotes, setStatusNotes] = useState('')

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [timelineNote, setTimelineNote] = useState('')

  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState('500')
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)

  // Custom Edit & Suspend Modals matching overview screenshot
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editInitialTab, setEditInitialTab] = useState<'personal' | 'vehicle' | 'status'>('personal')
  const [isCustomSuspendModalOpen, setIsCustomSuspendModalOpen] = useState(false)
  const [isUpdatingDriver, setIsUpdatingDriver] = useState(false)

  // Hooks queries & mutations
  const { data: driver, isLoading, isError, refetch } = useDriver(id || '')

  const { mutateAsync: updateDriverMutation, isPending: isUpdatingMutation } = useUpdateDriver()
  const { mutate: suspendDriver, isPending: isSuspending } = useSuspendDriver()
  const { mutate: blockDriver, isPending: isBlocking } = useBlockDriver()
  const { mutate: activateDriver, isPending: isActivating } = useActivateDriver()
  const { mutate: addSupportNote, isPending: isAddingNote } = useAddDriverTimelineNote()
  const { mutate: flagVehicleRenewal, isPending: isFlaggingVehicle } = useFlagVehicleForRenewal()

  const handleEditSave = async (updatedData: any) => {
    if (!driver?.id) return
    setIsUpdatingDriver(true)
    try {
      await updateDriverMutation({ id: driver.id, data: updatedData })
      showSuccess(
        'Driver details saved',
        `${updatedData.driverName || driver?.driverName || 'Driver'} profile updated successfully.`,
      )
      setIsEditModalOpen(false)
      void refetch()
    } catch (err: unknown) {
      showError('Failed to update driver', err instanceof Error ? err.message : 'Request failed')
    } finally {
      setIsUpdatingDriver(false)
    }
  }

  const handleCustomSuspendConfirm = (reason: string, details?: string) => {
    if (!driver) return
    const formattedNotes = details ? `${reason}: ${details}` : reason
    suspendDriver(
      { id: driver.id, notes: formattedNotes },
      {
        onSuccess: () => {
          showSuccess(
            'Driver suspended',
            `Account for ${driver.driverName} has been temporarily placed on duty hold.`,
          )
          setIsCustomSuspendModalOpen(false)
          void refetch()
        },
        onError: (err: unknown) => {
          showError('Could not suspend driver', err instanceof Error ? err.message : 'Request failed')
        },
      },
    )
  }

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

  const ledgerColumns = [
    {
      key: 'id',
      label: 'Transaction ID',
      align: 'center' as const,
      render: (tid: string) => (
        <span className="font-mono text-xs font-bold text-[#1F2B6D] dark:text-[#8B93D9]">{tid}</span>
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
      <PageWrapper className="pt-2 pb-6 px-3 sm:px-6 max-w-screen-2xl mx-auto w-full">
        <div className="flex items-center justify-center p-20 text-[#1F2B6D] dark:text-[#8B93D9] font-medium animate-pulse text-sm">
          Loading Driver Profile details...
        </div>
      </PageWrapper>
    )
  }

  if (isError || !driver) {
    return (
      <PageWrapper className="pt-2 pb-6 px-3 sm:px-6 max-w-screen-2xl mx-auto w-full">
        <div className="flex flex-col items-center justify-center p-16 space-y-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <h3 className="text-base font-bold text-[#1F2B6D] dark:text-white">Driver Profile Not Found</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            We couldn't locate the profile for ID <code className="font-mono">{id}</code>. It may have been removed or does not exist.
          </p>
          <button
            type="button"
            onClick={() => navigate('/driver-management/drivers')}
            className="bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            Back to Driver Directory
          </button>
        </div>
      </PageWrapper>
    )
  }

  // Helper to compute age from ISO DOB
  const computeAge = (iso?: string) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'
    const today = new Date()
    let age = today.getFullYear() - d.getFullYear()
    const m = today.getMonth() - d.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
      age--
    }
    return age >= 0 ? `${age} years` : '—'
  }

  const driverName = driver.driverName || '—'
  const driverPhone = driver.mobileNumber || '—'
  const driverEmail = driver.email || '—'
  const driverDob = driver.dateOfBirth
    ? new Date(driver.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'
  const driverAge = computeAge(driver.dateOfBirth)
  const driverGender = driver.gender
    ? driver.gender.charAt(0).toUpperCase() + driver.gender.slice(1).toLowerCase()
    : '—'
  const driverLanguage = driver.preferredLanguage || '—'
  const driverLocation = [driver.city, driver.state].filter(Boolean).join(', ') || '—'
  const driverJoined = driver.joinedAt
    ? new Date(driver.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : driver.createdAt
      ? new Date(driver.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—'
  const driverCode = driver.driverCode || '—'
  const driverRating = driver.ratingAvg != null ? Number(driver.ratingAvg).toFixed(1) : '5.0'
  const driverRides = driver.totalTrips != null ? driver.totalTrips : 0
  const driverWallet = driver.walletBalance != null ? driver.walletBalance : 0
  const driverVehicleType = driver.vehicle?.vehicleType || driver.vehicleType || '—'
  const driverMakeModel = driver.vehicle?.brand
    ? `${driver.vehicle.brand} ${driver.vehicle.model || ''}`.trim()
    : driver.vehicle?.model || '—'
  const driverRegPlate = driver.vehicle?.registrationPlate || driver.registrationPlate || '—'
  const driverColor = driver.vehicle?.color || '—'
  const driverYear = driver.vehicle?.manufacturingYear || '—'

  // Resolve vehicle front photo: uploaded document -> vehicle images -> showcase fallback
  const vehiclePhotoDoc = (driver.documents ?? []).find((d) =>
    /vehicle_photo/i.test(d.docType),
  )
  const driverVehiclePhoto =
    driver.vehicle?.photoUrl ||
    (driver.vehicle as any)?.images?.find((img: any) => img.imageType === 'FRONT')?.imageUrl ||
    (driver.vehicle as any)?.images?.[0]?.imageUrl ||
    (vehiclePhotoDoc ? resolveFileRef(vehiclePhotoDoc.fileUrl, vehiclePhotoDoc.fileId) : undefined) ||
    photoFrontShowcase
  const driverAddress = [
    driver.addressLine1,
    (driver as any).addressLine2,
    driver.city,
    driver.state,
    driver.postcode,
  ]
    .filter(Boolean)
    .join(', ') || '—'
  const driverAlternatePhone = (driver as any).alternatePhone || '—'
  const driverBloodGroup = (driver as any).bloodGroup || '—'
  const driverDrivingExp = (driver as any).drivingExperienceYears != null ? (driver as any).drivingExperienceYears : '—'
  const emergencyName = driver.emergencyContactName || (driver as any)?.emergencyContacts?.[0]?.contactName || '—'
  const emergencyPhone = driver.emergencyContactNumber || (driver as any)?.emergencyContacts?.[0]?.phoneNumber || '—'
  const emergencyRelationship =
    driver.emergencyContactRelationship ||
    (driver as any)?.emergencyContacts?.[0]?.relationship ||
    '—'

  const driverBankName = (driver as any).bankAccounts?.[0]?.bankName || driver.bankName || '—'
  const driverBankAccountName = (driver as any).bankAccounts?.[0]?.bankAccountName || driver.bankAccountName || '—'
  const driverBankAccountNumber = (driver as any).bankAccounts?.[0]?.accountNumberMasked || driver.bankAccountNumber || '—'
  const driverBankIfsc = (driver as any).bankAccounts?.[0]?.bankIfsc || driver.bankIfsc || '—'
  const driverBankUpi = (driver as any).bankAccounts?.[0]?.upiId || driver.upiId || '—'
  const driverBankStatus = (driver as any).bankAccounts?.[0]?.status || (driver as any).bankAccounts?.[0]?.verificationStatus || null
  const driverBankPayoutEnabled = Boolean((driver as any).bankAccounts?.[0]?.payoutEnabled)

  const isDriverOnline = Boolean(
    driver.isOnline ??
    (driver.driverStatus === 'online' ||
      driver.driverStatus === 'on_trip' ||
      driver.driverStatus === 'active'),
  )

  const isSuspendedOrBlocked =
    driver.driverStatus === 'suspended' || driver.driverStatus === 'blocked'

  const tabs: Array<{ id: DriverTab; label: string; icon: any; count?: number }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'documents', label: 'Documents', icon: FileText, count: driver.documents?.length || 8 },
    { id: 'vehicle', label: 'Vehicle', icon: Car },
    { id: 'subscription', label: 'Subscription', icon: Calendar },
    { id: 'wallet', label: 'Commission Wallet', icon: Wallet },
    { id: 'rides', label: 'Rides & Performance', icon: TrendingUp },
    { id: 'ratings', label: 'Ratings & Reviews', icon: Star },
    { id: 'activity', label: 'Activity Logs', icon: Zap },
  ]

  return (
    <PageWrapper className="space-y-4 pt-2 pb-8 px-3 sm:px-6 max-w-screen-2xl mx-auto w-full">

      {/* ─── Page Title Header & Top Actions (Matching ApplicationReviewPage) ────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/driver-management/drivers')}
            title="Back to Driver Directory"
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[#1F2B6D] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2B6D] dark:text-white flex items-center gap-3">
              Driver Profile
            </h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
              View and manage driver details, documents, subscription, and status.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 flex-wrap lg:flex-nowrap">
          <div className="text-right flex flex-col items-end gap-1 hidden md:flex">
            <div className="flex items-center gap-2 text-[12.5px]">
              <span className="text-slate-500">Driver ID</span>
              <span className="font-bold text-[#1F2B6D] dark:text-[#8B93D9] font-mono">{driverCode}</span>
            </div>
            <div className="flex items-center gap-2 text-[12.5px]">
              <span className="text-slate-500">Joined on</span>
              <span className="font-bold text-[#1F2B6D] dark:text-[#8B93D9]">{driverJoined}</span>
            </div>
          </div>

          <div className="bg-[#ECFDF5] border border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40 px-4 py-2 rounded-lg font-bold text-[13px] flex items-center gap-2 shadow-sm shrink-0">
            <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            Approved & Active
          </div>

          <div className="flex items-center gap-2.5 relative">
            {/* More options dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition shadow-sm flex items-center justify-center cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMoreMenuOpen && (
                <div className="absolute right-0 top-11 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 py-1.5 animate-in fade-in zoom-in-95 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false)
                      setIsNoteModalOpen(true)
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" /> Add Timeline Note
                  </button>
                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                  {isSuspendedOrBlocked ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false)
                        setStatusAction('activate')
                        setIsStatusModalOpen(true)
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-emerald-600 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Activate Driver
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreMenuOpen(false)
                          setStatusAction('suspend')
                          setIsStatusModalOpen(true)
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-amber-50 text-amber-600 font-medium flex items-center gap-2 cursor-pointer"
                      >
                        <Pause className="w-3.5 h-3.5 text-amber-600" /> Suspend Driver
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreMenuOpen(false)
                          setStatusAction('block')
                          setIsStatusModalOpen(true)
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 font-medium flex items-center gap-2 cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5 text-rose-600" /> Block Driver
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Send Message Button */}
            <button
              type="button"
              onClick={() => setIsMessageModalOpen(true)}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#1F2B6D] dark:text-slate-200 font-semibold text-[13px] transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-[#1F2B6D] dark:text-blue-400" />
              <span>Send Message</span>
            </button>

            {/* Edit Driver Button */}
            <button
              type="button"
              onClick={() => {
                setEditInitialTab('personal')
                setIsEditModalOpen(true)
              }}
              className="px-4 py-2 rounded-lg bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white font-semibold text-[13px] shadow-sm transition-colors flex items-center gap-2 cursor-pointer font-['Poppins',sans-serif]"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Driver</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Top Driver Profile Header Card (Custom Component) ────────────────── */}
      <DriverProfileHeaderCard
        variant="profile"
        name={driverName}
        phone={driverPhone}
        email={driverEmail}
        gender={driverGender}
        dob={driverDob}
        age={driverAge}
        language={driverLanguage}
        location={driverLocation}
        photoUrl={driver.profilePhotoUrl}
        driverId={driverCode}
        joinedOn={driverJoined}
        rating={driverRating}
        totalRides={driverRides}
        statusLabel={
          driver.isBlocked
            ? 'Blocked'
            : driver.isSuspended
              ? 'Suspended'
              : undefined
        }
        isOnDuty={isDriverOnline}
        onCopyPhone={() => {
          navigator.clipboard.writeText(driverPhone)
          showSuccess('Copied', 'Phone number copied to clipboard')
        }}
      />

      {/* ─── 5 KPI Summary Cards Row (Geographic Management Consistent Design) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {/* 1. Driver Status */}
        <ReviewSummaryCard
          icon={<ShieldCheck className="w-5 h-5 text-white" />}
          iconBgColor={driver.isBlocked ? 'bg-rose-600' : driver.isSuspended ? 'bg-amber-600' : 'bg-[#1F2B6D]'}
          title="Driver Status"
          value={
            driver.isBlocked
              ? 'Blocked'
              : driver.isSuspended
                ? 'Suspended'
                : driver.driverStatus === 'active' || driver.driverStatus === 'online'
                  ? 'Approved & Active'
                  : 'Pending Review'
          }
          subtitle={
            driver.isBlocked
              ? 'Account blocked'
              : driver.isSuspended
                ? 'Account suspended'
                : 'Compliance verified'
          }
          valueColor={
            driver.isBlocked
              ? 'text-rose-600 dark:text-rose-400'
              : driver.isSuspended
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-[#1F2B6D] dark:text-white'
          }
          badge={<ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
          onClick={() => setActiveTab('overview')}
        />

        {/* 2. Subscription */}
        <ReviewSummaryCard
          icon={<CreditCard className="w-5 h-5 text-white" />}
          iconBgColor="bg-[#1F2B6D]"
          title="Payment Model"
          value={paymentPlan(driver).name}
          subtitle={paymentPlan(driver).detail}
          valueColor="text-[#1F2B6D] dark:text-white"
          badge={<ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
          onClick={() => setActiveTab('subscription')}
        />

        {/* 3. Commission Wallet */}
        <ReviewSummaryCard
          icon={<Wallet className="w-5 h-5 text-white" />}
          iconBgColor="bg-[#1F2B6D]"
          title="Commission Wallet"
          value={`₹ ${Number(driverWallet).toLocaleString('en-IN')}.00`}
          valueColor="text-[#1F2B6D] dark:text-white"
          badge={
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsTopUpModalOpen(true)
              }}
              className="px-2.5 py-1 rounded-lg bg-[#1F2B6D] hover:bg-[#182258] text-white text-[11px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
            >
              <Plus className="w-3 h-3" /> Top Up
            </button>
          }
          onClick={() => setActiveTab('wallet')}
        />

        {/* 4. Total Rides */}
        <ReviewSummaryCard
          icon={<Car className="w-5 h-5 text-white" />}
          iconBgColor="bg-[#1F2B6D]"
          title="Total Rides"
          value={driverRides}
          subtitle="Completed trips"
          valueColor="text-[#1F2B6D] dark:text-white"
          badge={<ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
          onClick={() => setActiveTab('rides')}
        />

        {/* 5. Account Status */}
        <ReviewSummaryCard
          icon={
            driver.isBlocked ? (
              <ShieldAlert className="w-5 h-5 text-white" />
            ) : driver.isSuspended ? (
              <Clock className="w-5 h-5 text-white" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-white" />
            )
          }
          iconBgColor={driver.isBlocked ? 'bg-rose-600' : driver.isSuspended ? 'bg-amber-600' : 'bg-[#1F2B6D]'}
          title="Account Status"
          value={driver.isBlocked ? 'Blocked' : driver.isSuspended ? 'Suspended' : 'Good Standing'}
          subtitle={driver.isBlocked ? 'Access revoked' : driver.isSuspended ? 'Review required' : 'Zero active flags'}
          valueColor={
            driver.isBlocked
              ? 'text-rose-600 dark:text-rose-400'
              : driver.isSuspended
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-[#1F2B6D] dark:text-white'
          }
        />
      </div>

      {/* ─── Navigation Tabs Bar (Matching ApplicationReviewPage) ─────────────── */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0 border-b border-slate-200 dark:border-slate-800 pt-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as DriverTab)}
              className={cn(
                'flex items-center gap-2 py-2.5 px-4 text-[13px] font-bold transition-all relative border-b-2 whitespace-nowrap cursor-pointer',
                isActive
                  ? 'border-[#1F2B6D] dark:border-blue-400 text-[#1F2B6D] dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 rounded-t-lg'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300',
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'text-[11px] px-2 py-0.5 rounded-full font-bold',
                    isActive
                      ? 'bg-[#1F2B6D] text-white dark:bg-blue-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>


      {/* ─── Tabs Body ────────────────────────────────────────────────────────── */}
      <div>
        {/* ─── 1. OVERVIEW TAB (3 Columns Grid matching template) ───────────── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start text-left">
            {/* COLUMN 1: Personal Information & Emergency Contact */}
            <div className="space-y-4">
              {/* Personal Information (Custom Component) */}
              <PersonalInfoCard
                name={driverName}
                phone={driverPhone}
                alternatePhone={driverAlternatePhone}
                email={driverEmail}
                dob={driverDob}
                age={driverAge}
                gender={driverGender}
                bloodGroup={driverBloodGroup}
                drivingExperience={driverDrivingExp}
                language={driverLanguage}
                address={driverAddress}
                photoUrl={driver.profilePhotoUrl}
                showPhoto={false}
                isPhoneVerified={true}
                editLabel="Edit"
                onEdit={() => {
                  setEditInitialTab('personal')
                  setIsEditModalOpen(true)
                }}
              />

              {/* Emergency Contact */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs">
                      <ShieldAlert className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">
                      Emergency Contact
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditInitialTab('personal')
                      setIsEditModalOpen(true)
                    }}
                    className="px-3 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-md font-semibold text-slate-700 dark:text-slate-300 hover:border-[#1F2B6D] hover:text-[#1F2B6D] dark:hover:border-[#8B93D9] dark:hover:text-[#8B93D9] hover:bg-[#1F2B6D]/5 active:scale-[0.98] transition shadow-2xs cursor-pointer flex items-center gap-1 font-['Poppins',sans-serif]"
                  >
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                </div>

                <div className="space-y-1.5 text-[12px]">
                  <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
                    <span className="text-slate-500 dark:text-slate-400 shrink-0">Name</span>
                    <span className="font-bold text-[#1F2B6D] dark:text-white text-right truncate">{emergencyName}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 py-0.5 border-b border-slate-100/70 dark:border-slate-800/50">
                    <span className="text-slate-500 dark:text-slate-400 shrink-0">Phone Number</span>
                    <span className="font-mono font-bold text-[#1F2B6D] dark:text-slate-200 text-right">{emergencyPhone}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 py-0.5">
                    <span className="text-slate-500 dark:text-slate-400 shrink-0">Relationship</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-right">{emergencyRelationship}</span>
                  </div>
                </div>
              </div>

              {/* Bank & Payout Details */}
              <BankInfoCard
                bankName={driverBankName}
                accountHolderName={driverBankAccountName}
                accountNumber={driverBankAccountNumber}
                ifscCode={driverBankIfsc}
                upiId={driverBankUpi}
                status={driverBankStatus}
                payoutEnabled={driverBankPayoutEnabled}
                onEdit={() => {
                  setEditInitialTab('status')
                  setIsEditModalOpen(true)
                }}
              />
            </div>

            {/* COLUMN 2: Vehicle Information & Subscription Details */}
            <div className="space-y-4">
              {/* Vehicle Information (Custom Component) */}
              <VehicleInfoCard
                vehicleType={driverVehicleType}
                brand={driver.vehicle?.brand || '—'}
                model={driver.vehicle?.model || driverMakeModel}
                registrationPlate={driverRegPlate}
                color={driverColor}
                manufacturingYear={driverYear}
                fuelType={driver.vehicle?.fuelType}
                permitType={driver.vehicle?.permitNo ? 'Commercial' : undefined}
                photoUrl={driverVehiclePhoto}
                onPreviewPhoto={() => openPreview(driverVehiclePhoto, `${driverMakeModel} - ${driverRegPlate}`)}
                editLabel="Edit"
                onEdit={() => {
                  setEditInitialTab('vehicle')
                  setIsEditModalOpen(true)
                }}
              />

              {/* Subscription Details */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs">
                      <CreditCard className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">
                      Subscription & Plan
                    </h3>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-medium">Model / Plan</span>
                    <span className="font-bold text-[#1F2B6D] dark:text-white">
                      {paymentPlan(driver).name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-medium">Status</span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${(driver as any).subscription?.status === 'ACTIVE'
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                        : 'text-slate-600 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}>
                      {(driver as any).subscription?.status === 'ACTIVE' && <Check className="w-3 h-3 stroke-[3]" />}
                      {(driver as any).subscription?.status || paymentPlan(driver).detail}
                    </span>
                  </div>
                  {(driver as any).subscription?.startDate && (
                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 font-medium">Start Date</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {new Date((driver as any).subscription.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  {(driver as any).subscription?.endDate && (
                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 font-medium">End Date</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {new Date((driver as any).subscription.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  {(driver as any).subscription?.amount != null && (
                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 font-medium">Amount</span>
                      <span className="font-bold text-[#1F2B6D] dark:text-white font-mono">
                        ₹ {Number((driver as any).subscription.amount).toLocaleString('en-IN')}.00
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN 3: Commission Wallet & Quick Actions */}
            <div className="space-y-4">
              {/* Commission Wallet */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs">
                      <Wallet className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px]">
                      Commission Wallet
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('wallet')}
                    className="px-3 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-md font-semibold text-slate-700 dark:text-slate-300 hover:border-[#1F2B6D] hover:text-[#1F2B6D] dark:hover:border-[#8B93D9] dark:hover:text-[#8B93D9] hover:bg-[#1F2B6D]/5 transition shadow-2xs cursor-pointer"
                  >
                    Transaction History
                  </button>
                </div>

                {/* Current Balance Row */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 font-medium">Current Balance</p>
                      <p className="text-xl font-extrabold text-[#1F2B6D] dark:text-white">
                        ₹ {Number(driverWallet).toLocaleString('en-IN')}.00
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTopUpModalOpen(true)}
                    className="bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white px-3.5 py-1.5 rounded-[10px] text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Top Up Wallet
                  </button>
                </div>

                {/* Stats breakdown */}
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-medium">Total Added</span>
                    <span className="font-bold text-[#1F2B6D] dark:text-white font-mono">₹ 5,000.00</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-medium">Total Deducted</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">₹ 3,750.00</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500 font-medium">Pending Deductions</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">₹ 0.00</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions (Geographic Management Consistent Design) */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-sm">
                <h3 className="text-sm font-bold text-[#1F2B6D] dark:text-white mb-3 leading-none">
                  Quick Actions
                </h3>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* 1. Send Message */}
                  <button
                    type="button"
                    onClick={() => setIsMessageModalOpen(true)}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#1F2B6D]/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer text-left shadow-2xs"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-[#1F2B6D] dark:text-[#8B93D9]">
                      <MessageSquare className="w-[18px] h-[18px]" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-bold text-[#1F2B6D] dark:text-slate-100 leading-tight">
                        Send Message
                      </p>
                      <p className="text-[11px] text-slate-400 leading-tight truncate">
                        Direct push notice
                      </p>
                    </div>
                  </button>

                  {/* 2. Reset Password */}
                  <button
                    type="button"
                    onClick={() => showSuccess('Password Reset', 'Password reset instructions sent to driver')}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#1F2B6D]/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer text-left shadow-2xs"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-[#1F2B6D] dark:text-[#8B93D9]">
                      <Key className="w-[18px] h-[18px]" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-bold text-[#1F2B6D] dark:text-slate-100 leading-tight">
                        Reset Password
                      </p>
                      <p className="text-[11px] text-slate-400 leading-tight truncate">
                        Send reset code
                      </p>
                    </div>
                  </button>

                  {/* 3. Suspend Driver */}
                  <button
                    type="button"
                    disabled={!canSuspend}
                    onClick={() => {
                      setIsCustomSuspendModalOpen(true)
                    }}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 active:scale-[0.98] transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer disabled:opacity-50 text-left shadow-2xs"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400">
                      <Pause className="w-[18px] h-[18px]" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-bold text-amber-800 dark:text-amber-300 leading-tight">
                        Suspend Driver
                      </p>
                      <p className="text-[11px] text-slate-400 leading-tight truncate">
                        Temporary duty hold
                      </p>
                    </div>
                  </button>

                  {/* 4. Deactivate */}
                  <button
                    type="button"
                    disabled={!canSuspend}
                    onClick={() => {
                      setStatusAction('block')
                      setIsStatusModalOpen(true)
                    }}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-500/40 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer disabled:opacity-50 text-left shadow-2xs"
                  >
                    <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center flex-shrink-0 text-rose-600 dark:text-rose-400">
                      <Power className="w-[18px] h-[18px]" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-bold text-rose-700 dark:text-rose-300 leading-tight">
                        Deactivate
                      </p>
                      <p className="text-[11px] text-slate-400 leading-tight truncate">
                        Revoke app access
                      </p>
                    </div>
                  </button>

                  {/* 5. View App Activity */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('activity')}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#1F2B6D]/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer text-left shadow-2xs"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-[#1F2B6D] dark:text-[#8B93D9]">
                      <Smartphone className="w-[18px] h-[18px]" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-bold text-[#1F2B6D] dark:text-slate-100 leading-tight">
                        App Activity
                      </p>
                      <p className="text-[11px] text-slate-400 leading-tight truncate">
                        View device logs
                      </p>
                    </div>
                  </button>

                  {/* 6. Download Profile */}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#1F2B6D]/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer text-left shadow-2xs"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-[#1F2B6D] dark:text-[#8B93D9]">
                      <Download className="w-[18px] h-[18px]" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-bold text-[#1F2B6D] dark:text-slate-100 leading-tight">
                        Download Profile
                      </p>
                      <p className="text-[11px] text-slate-400 leading-tight truncate">
                        Export summary PDF
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── 2. DOCUMENTS TAB ─────────────────────────────────────────────── */}
        {activeTab === 'documents' && (
          <div className="space-y-4 text-left">
            {/* Filter pills */}
            <div className="flex items-center gap-2 pb-1">
              {(['all', 'driver', 'vehicle'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveDocCategory(cat)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-xs font-bold transition capitalize cursor-pointer',
                    activeDocCategory === cat
                      ? 'bg-[#1F2B6D] text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50',
                  )}
                >
                  {cat === 'all' ? 'All Documents' : cat === 'driver' ? 'Driver Identity' : 'Vehicle Documents'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {(driver.documents ?? [])
                .filter((d) => activeDocCategory === 'all' || (activeDocCategory === 'vehicle' ? d.category === 'vehicle' : d.category !== 'vehicle'))
                .map((doc) => (
                  <ReviewDocumentCard
                    key={doc.id}
                    id={doc.id}
                    name={doc.docType.replace(/_/g, ' ').toUpperCase()}
                    number={doc.docNumber || '—'}
                    status={doc.verifyStatus === 'approved' ? 'Verified' : doc.verifyStatus}
                    image={resolveFileRef(doc.fileUrl, doc.fileId)}
                    expiryDate={doc.expiryDate}
                    uploaded={doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-IN') : undefined}
                    variant="standard"
                    onClick={() => openPreview(resolveFileRef(doc.fileUrl, doc.fileId), doc.docType.replace(/_/g, ' '))}
                  />
                ))}
            </div>
          </div>
        )}

        {/* ─── 3. VEHICLE TAB ───────────────────────────────────────────────── */}
        {activeTab === 'vehicle' && (
          <div className="space-y-5 text-left">
            {driver.vehicle ? (
              <>
                {/* ─── Top Row: 3 Columns Grid ───────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  {/* Column 1 (5 cols): Vehicle Information Card */}
                  <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      {/* Header */}
                      <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-slate-100 dark:border-slate-800">
                        <div>
                          <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                            Vehicle Information
                          </h3>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            Detailed information about the driver's vehicle.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/driver-management/drivers/${driver.id}/edit`)}
                          className="px-3 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-md font-semibold text-slate-700 dark:text-slate-300 hover:border-[#1F2B6D] hover:text-[#1F2B6D] dark:hover:border-[#8B93D9] dark:hover:text-[#8B93D9] hover:bg-[#1F2B6D]/5 transition shadow-2xs cursor-pointer shrink-0"
                        >
                          Edit Vehicle
                        </button>
                      </div>

                      {/* Content: Left Car Image + Right 2-Column Key-Value List */}
                      <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start pt-1">
                        {/* Car Preview Image */}
                        <div className="w-40 sm:w-44 h-32 sm:h-36 shrink-0 flex items-center justify-center p-1 self-center sm:self-start">
                          <img
                            src={carMainShowcase}
                            alt="Vehicle"
                            className="w-full h-full object-contain cursor-pointer transition-transform hover:scale-105"
                            onClick={() => openPreview(carMainShowcase, `${driverMakeModel} - ${driverRegPlate}`)}
                          />
                        </div>

                        {/* Specifications 2-Column List matching Image 1 */}
                        <div className="flex-1 grid grid-cols-[115px_1fr] sm:grid-cols-[120px_1fr] gap-x-2 gap-y-1.5 text-xs min-w-0 w-full">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Vehicle Type</span>
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 capitalize">
                            <Car className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                            {driverVehicleType || 'Auto'}
                          </span>

                          <span className="text-slate-500 dark:text-slate-400 font-medium">Make & Model</span>
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {driverMakeModel || 'Maruti Suzuki WagonR'}
                          </span>

                          <span className="text-slate-500 dark:text-slate-400 font-medium">Registration No.</span>
                          <div className="flex items-center gap-1.5 font-bold font-mono text-slate-900 dark:text-white">
                            <span>{driverRegPlate || 'JK01AB1234'}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(driverRegPlate || '')
                                showSuccess('Copied', 'Registration number copied to clipboard')
                              }}
                              title="Copy Registration Number"
                              className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-0.5 rounded cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="text-slate-500 dark:text-slate-400 font-medium">Year</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {driverYear || '2021'}
                          </span>

                          <span className="text-slate-500 dark:text-slate-400 font-medium">Color</span>
                          <span className="font-bold text-slate-900 dark:text-white capitalize">
                            {driverColor || 'White'}
                          </span>

                          <span className="text-slate-500 dark:text-slate-400 font-medium">Fuel Type</span>
                          <span className="font-bold text-slate-900 dark:text-white capitalize">
                            {(driver.vehicle as any)?.fuelType || 'Petrol'}
                          </span>

                          <span className="text-slate-500 dark:text-slate-400 font-medium">Seating Capacity</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {driver.vehicle?.seatsCapacity != null ? driver.vehicle.seatsCapacity : '4'}
                          </span>

                          <span className="text-slate-500 dark:text-slate-400 font-medium">Permit Type</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {driver.vehicle?.permitNo ? 'Commercial' : 'Commercial'}
                          </span>

                          <span className="text-slate-500 dark:text-slate-400 font-medium">Vehicle Status</span>
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                              Active
                            </span>
                          </div>

                          <span className="text-slate-500 dark:text-slate-400 font-medium">Added On</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {driverJoined || '12 Jan 2026'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 2 (4 cols): Vehicle Photos Card */}
                  <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      {/* Header */}
                      <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-slate-100 dark:border-slate-800">
                        <div>
                          <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                            Vehicle Photos
                          </h3>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            Current photos of the vehicle.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/driver-management/drivers/${driver.id}/edit`)}
                          className="bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white px-3.5 py-1.5 rounded-[10px] text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Upload Photos
                        </button>
                      </div>

                      {/* Photo Gallery Grid matching Image 1 */}
                      <div className="grid grid-cols-12 gap-2 h-[200px] pt-1">
                        {/* Main Front Photo (Left 7 cols) */}
                        <div
                          className="col-span-7 h-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative group cursor-pointer shadow-2xs"
                          onClick={() => openPreview(photoFrontShowcase, 'Vehicle Front View - ' + driverRegPlate)}
                        >
                          <img
                            src={photoFrontShowcase}
                            alt="Vehicle Front"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                            <Eye className="w-4 h-4 mr-1.5" /> View Front Photo
                          </div>
                        </div>

                        {/* Right 5 cols: Rear (top) + Side / Interior (bottom) */}
                        <div className="col-span-5 flex flex-col gap-2 h-full">
                          {/* Rear Photo */}
                          <div
                            className="h-[96px] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative group cursor-pointer shadow-2xs"
                            onClick={() => openPreview(photoRearShowcase, 'Vehicle Rear View - ' + driverRegPlate)}
                          >
                            <img
                              src={photoRearShowcase}
                              alt="Vehicle Rear"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-semibold">
                              <Eye className="w-3.5 h-3.5 mr-1" /> View Rear
                            </div>
                          </div>

                          {/* Side + Interior Thumbnails */}
                          <div className="grid grid-cols-2 gap-2 flex-1">
                            {/* Side Angle */}
                            <div
                              className="h-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative group cursor-pointer shadow-2xs"
                              onClick={() => openPreview(photoSideShowcase, 'Vehicle Side View - ' + driverRegPlate)}
                            >
                              <img
                                src={photoSideShowcase}
                                alt="Vehicle Side"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-semibold">
                                Side
                              </div>
                            </div>

                            {/* Interior Angle */}
                            <div
                              className="h-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative group cursor-pointer shadow-2xs"
                              onClick={() => openPreview(photoInteriorShowcase, 'Vehicle Interior - ' + driverRegPlate)}
                            >
                              <img
                                src={photoInteriorShowcase}
                                alt="Vehicle Interior"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-semibold">
                                Interior
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 3 (3 cols): Quick Actions Card (Geographic Management Consistent Design) */}
                  <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#1F2B6D] dark:text-white mb-3 leading-none">
                        Quick Actions
                      </h3>

                      <div className="space-y-2.5">
                        {/* 1. Edit Vehicle Details */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditInitialTab('vehicle')
                            setIsEditModalOpen(true)
                          }}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#1F2B6D]/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-[0.98] transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer text-left shadow-2xs font-['Poppins',sans-serif]"
                        >
                          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-[#1F2B6D] dark:text-[#8B93D9]">
                            <Edit className="w-[18px] h-[18px]" strokeWidth={2} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-bold text-[#1F2B6D] dark:text-slate-100 leading-tight">
                              Edit Vehicle Details
                            </p>
                            <p className="text-[11px] text-slate-400 leading-tight truncate">
                              Update vehicle metadata & specs
                            </p>
                          </div>
                        </button>

                        {/* 2. Request Vehicle Update */}
                        <button
                          type="button"
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
                                    'Update Requested',
                                    'Vehicle flagged for document updates and renewal.',
                                  )
                                },
                                onError: (err: unknown) => {
                                  showError(
                                    'Could not request update',
                                    err instanceof Error ? err.message : 'Request failed',
                                  )
                                },
                              },
                            )
                          }}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#1F2B6D]/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer disabled:opacity-50 text-left shadow-2xs"
                        >
                          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-[#1F2B6D] dark:text-[#8B93D9]">
                            <RefreshCw
                              className={cn(
                                'w-[18px] h-[18px]',
                                isFlaggingVehicle && 'animate-spin',
                              )}
                              strokeWidth={2}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-bold text-[#1F2B6D] dark:text-slate-100 leading-tight">
                              Request Vehicle Update
                            </p>
                            <p className="text-[11px] text-slate-400 leading-tight truncate">
                              Flag certifications for audit renewal
                            </p>
                          </div>
                        </button>

                        {/* 3. Send Message to Driver */}
                        <button
                          type="button"
                          onClick={() => setIsMessageModalOpen(true)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#1F2B6D]/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer text-left shadow-2xs"
                        >
                          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-[#1F2B6D] dark:text-[#8B93D9]">
                            <MessageSquare className="w-[18px] h-[18px]" strokeWidth={2} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-bold text-[#1F2B6D] dark:text-slate-100 leading-tight">
                              Send Message to Driver
                            </p>
                            <p className="text-[11px] text-slate-400 leading-tight truncate">
                              Direct push notification
                            </p>
                          </div>
                        </button>

                        {/* 4. Suspend Vehicle */}
                        <button
                          type="button"
                          disabled={!canSuspend}
                          onClick={() => {
                            setIsCustomSuspendModalOpen(true)
                          }}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 active:scale-[0.98] transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer disabled:opacity-50 text-left shadow-2xs font-['Poppins',sans-serif]"
                        >
                          <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400">
                            <Pause className="w-[18px] h-[18px]" strokeWidth={2.2} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-bold text-amber-800 dark:text-amber-300 leading-tight">
                              Suspend Vehicle
                            </p>
                            <p className="text-[11px] text-slate-400 leading-tight truncate">
                              Temporary operational halt
                            </p>
                          </div>
                        </button>

                        {/* 5. Deactivate Vehicle */}
                        <button
                          type="button"
                          disabled={!canSuspend}
                          onClick={() => {
                            setStatusAction('block')
                            setIsStatusModalOpen(true)
                          }}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-500/40 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer disabled:opacity-50 text-left shadow-2xs"
                        >
                          <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center flex-shrink-0 text-rose-600 dark:text-rose-400">
                            <Ban className="w-[18px] h-[18px]" strokeWidth={2} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-bold text-rose-700 dark:text-rose-300 leading-tight">
                              Deactivate Vehicle
                            </p>
                            <p className="text-[11px] text-slate-400 leading-tight truncate">
                              Permanently unbind asset
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── Bottom Section: Vehicle Documents ────────────────────────────── */}
                <div className="space-y-3.5 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                        Vehicle Documents
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        Documents required for vehicle verification.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/driver-management/drivers/${driver.id}/edit`)}
                      className="bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white px-4 py-2 rounded-[10px] text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add / Update Document</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        id: 'rc',
                        title: 'RC Certificate',
                        thumb: docRcShowcase,
                        expiry: '15 Mar 2028',
                        duration: '2 years left',
                        durationTone: 'emerald' as const,
                      },
                      {
                        id: 'insurance',
                        title: 'Vehicle Insurance',
                        thumb: docInsShowcase,
                        expiry: '20 Apr 2027',
                        duration: '1 year left',
                        durationTone: 'amber' as const,
                      },
                      {
                        id: 'puc',
                        title: 'PUC Certificate',
                        thumb: docPucShowcase,
                        expiry: '18 Feb 2027',
                        duration: '1 year left',
                        durationTone: 'amber' as const,
                      },
                      {
                        id: 'permit',
                        title: 'Commercial Permit',
                        thumb: docPermitShowcase,
                        expiry: '10 Nov 2028',
                        duration: '2 years left',
                        durationTone: 'emerald' as const,
                      },
                    ].map((doc) => {
                      const matchedDoc = (driver.documents ?? []).find((d) =>
                        new RegExp(doc.id, 'i').test(d.docType),
                      )
                      const fileRef = resolveFileRef(matchedDoc?.fileUrl, matchedDoc?.fileId)
                      const displayThumb = fileRef || doc.thumb
                      const displayExpiry = matchedDoc?.expiryDate
                        ? new Date(matchedDoc.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : doc.expiry

                      return (
                        <div
                          key={doc.id}
                          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                        >
                          {/* Card Top: Thumbnail + Title & Status */}
                          <div className="flex items-start gap-3">
                            <div
                              className="w-16 h-11 rounded border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 shrink-0 flex items-center justify-center cursor-pointer group"
                              onClick={() => openPreview(displayThumb, doc.title)}
                            >
                              <img
                                src={displayThumb}
                                alt={doc.title}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4
                                className="font-bold text-[#1F2B6D] dark:text-white text-[13px] leading-tight truncate"
                                title={doc.title}
                              >
                                {doc.title}
                              </h4>
                              <div className="mt-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                                  Verified
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Card Middle: Expiry Date + Duration Badge */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                              <span className="text-[10.5px] text-slate-400 dark:text-slate-500 block font-medium">
                                Expiry Date
                              </span>
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
                                {displayExpiry}
                              </span>
                            </div>
                            <span
                              className={cn(
                                'text-[10.5px] font-bold px-2 py-0.5 rounded',
                                doc.durationTone === 'emerald'
                                  ? 'bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/40'
                                  : 'bg-[#FFF4E5] text-[#F59E0B] dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/40',
                              )}
                            >
                              {doc.duration}
                            </span>
                          </div>

                          {/* Card Bottom: View & Options */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openPreview(displayThumb, doc.title)}
                              className="flex-1 py-1.5 px-3 text-xs border border-slate-200 dark:border-slate-700 rounded-md font-semibold text-slate-700 dark:text-slate-300 hover:border-[#1F2B6D] hover:text-[#1F2B6D] dark:hover:border-[#8B93D9] dark:hover:text-[#8B93D9] hover:bg-[#1F2B6D]/5 transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (displayThumb) window.open(displayThumb, '_blank')
                              }}
                              title="Open Document"
                              className="p-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-md text-slate-500 hover:border-[#1F2B6D] hover:text-[#1F2B6D] dark:hover:border-[#8B93D9] dark:hover:text-[#8B93D9] hover:bg-[#1F2B6D]/5 transition shadow-2xs cursor-pointer"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400 font-medium text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                No vehicle asset registered.
              </div>
            )}
          </div>
        )}

        {/* ─── 4. SUBSCRIPTION TAB ─────────────────────────────────────────── */}
        {activeTab === 'subscription' && (() => {
          const planInfo = paymentPlan(driver)
          const isUnchosen = planInfo.name === 'Not chosen yet'

          if (isUnchosen) {
            return (
              <div className="space-y-4 text-left">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Payment Model</span>
                    <h4 className="text-base font-bold text-[#1F2B6D] dark:text-white">
                      Not chosen yet
                    </h4>
                    <p className="text-xs text-slate-400">
                      The driver picks it in the driver app. Commission or Subscription is chosen by the driver in
                      the driver app.
                    </p>
                  </div>
                </div>
              </div>
            )
          }

          const subscriptionData = {
            planName: (driver as any).subscription?.planName || 'Auto Monthly Plan',
            subtitle: driver.paymentModel === 'COMMISSION'
              ? 'Commission Model Plan'
              : (driver.vehicleType ? `For ${driver.vehicleType.charAt(0).toUpperCase() + driver.vehicleType.slice(1)} Drivers` : 'For Auto Drivers'),
            price: (driver as any).subscription?.amount != null ? Number((driver as any).subscription.amount).toFixed(2) : '499.00',
            status: (driver as any).subscription?.status || 'Active',
            startDate: (driver as any).subscription?.startDate
              ? new Date((driver as any).subscription.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : '3 Oct 2026',
            endDate: (driver as any).subscription?.endDate
              ? new Date((driver as any).subscription.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : '3 Nov 2026',
            remainingDays: 28,
            autoRenew: (driver as any).subscription?.autoRenew !== false,
            paymentMethod: 'Razorpay (UPI/Card)',
          }

          const planFeatures = [
            'Access to ride requests',
            'Priority during high demand',
            'In-app navigation',
            'Customer support',
            'Earnings analytics',
            'Standard commission rates',
            'Access to promotions and incentives',
          ]

          const paymentHistoryRows = (driver as any).subscriptionPayments || [
            { id: 1, date: '3 Oct 2026', plan: subscriptionData.planName, amount: `₹ ${subscriptionData.price}`, status: 'Success', method: 'Razorpay (UPI)', txId: 'pay_MUSFDU7F1' },
            { id: 2, date: '3 Sep 2026', plan: subscriptionData.planName, amount: `₹ ${subscriptionData.price}`, status: 'Success', method: 'Razorpay (Card)', txId: 'pay_MUSFDU7F2' },
            { id: 3, date: '3 Aug 2026', plan: subscriptionData.planName, amount: `₹ ${subscriptionData.price}`, status: 'Success', method: 'Razorpay (UPI)', txId: 'pay_MUSFDU7F3' },
            { id: 4, date: '3 Jul 2026', plan: subscriptionData.planName, amount: `₹ ${subscriptionData.price}`, status: 'Success', method: 'Razorpay (UPI)', txId: 'pay_MUSFDU7F4' },
            { id: 5, date: '3 Jun 2026', plan: subscriptionData.planName, amount: `₹ ${subscriptionData.price}`, status: 'Success', method: 'Razorpay (Card)', txId: 'pay_MUSFDU7F5' },
          ]

          const subscriptionTimelineNodes = [
            {
              icon: <Calendar className="w-3.5 h-3.5 text-blue-600" />,
              nodeBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600',
              title: 'Subscription Activated',
              subtitle: subscriptionData.planName,
              date: '3 Oct 2026, 10:12 AM',
            },
            {
              icon: <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[3]" />,
              nodeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
              title: 'Payment Successful',
              subtitle: `₹${subscriptionData.price} via Razorpay (UPI)`,
              date: '3 Oct 2026, 10:11 AM',
            },
            {
              icon: <ShieldCheck className="w-3.5 h-3.5 text-white" />,
              nodeBg: 'bg-[#1F2B6D] text-white',
              title: 'Auto Renewal Enabled',
              date: '3 Oct 2026, 10:11 AM',
            },
            {
              icon: <RefreshCw className="w-3.5 h-3.5 text-blue-600" />,
              nodeBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600',
              title: 'Plan Changed',
              subtitle: `Basic Plan ➔ ${subscriptionData.planName}`,
              date: '1 Sep 2026, 09:20 AM',
            },
            {
              icon: <Calendar className="w-3.5 h-3.5 text-blue-600" />,
              nodeBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600',
              title: 'Subscription Activated',
              subtitle: 'Basic Plan',
              date: '1 Jun 2026, 09:20 AM',
            },
          ]

          return (
            <div className="space-y-5 text-left font-sans">
              {/* ─── 1. TOP 3-COLUMN METRICS GRID ───────────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* 1. Current Subscription Card (Col 5) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-0 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs shrink-0">
                          <Crown className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px] truncate">
                          Current Subscription
                        </h3>
                        <Badge variant="success" className="gap-1.5 font-sans ml-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {subscriptionData.status}
                        </Badge>
                      </div>
                      <button
                        type="button"
                        onClick={() => showSuccess('Manage Subscription Modal')}
                        className="px-3 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-md font-semibold text-slate-700 dark:text-slate-300 hover:border-[#1F2B6D] hover:text-[#1F2B6D] dark:hover:border-[#8B93D9] dark:hover:text-[#8B93D9] hover:bg-[#1F2B6D]/5 transition shadow-2xs cursor-pointer shrink-0 flex items-center gap-1"
                      >
                        Manage Plan
                      </button>
                    </div>

                    <div className="flex items-center gap-3.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 my-3.5">
                      <div className="w-12 h-12 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 shadow-2xs">
                        <Crown className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white tracking-tight truncate">
                          {subscriptionData.planName}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
                          {subscriptionData.subtitle}
                        </p>
                        <p className="text-sm font-bold text-[#1F2B6D] dark:text-slate-200 mt-1">
                          ₹ {subscriptionData.price} <span className="text-xs font-normal text-slate-400">/ month</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-left">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Start Date</span>
                      <span className="text-xs font-semibold text-[#1F2B6D] dark:text-slate-200 mt-1 block">{subscriptionData.startDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">End Date</span>
                      <span className="text-xs font-semibold text-[#1F2B6D] dark:text-slate-200 mt-1 block">{subscriptionData.endDate}</span>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50">
                        {subscriptionData.remainingDays} days remaining
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Auto Renew</span>
                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white" />
                        <span>{subscriptionData.autoRenew ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Method</span>
                      <span className="text-xs font-semibold text-[#1F2B6D] dark:text-slate-200 mt-1 block">{subscriptionData.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Plan Features Card (Col 4) */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-0 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px] truncate">
                          Plan Features
                        </h3>
                      </div>
                    </div>
                    <div className="space-y-2.5 pt-3.5">
                      {planFeatures.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                          <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Quick Actions Card (Col 3) */}
                <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-0 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs shrink-0">
                          <Zap className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px] truncate">
                          Quick Actions
                        </h3>
                      </div>
                    </div>
                    <div className="space-y-2.5 pt-3.5">
                      <button
                        type="button"
                        onClick={() => showSuccess('Plan change request queued')}
                        className="w-full bg-[#1F2B6D] hover:bg-[#162052] active:scale-[0.98] text-white py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center justify-start gap-2.5 shadow-2xs transition cursor-pointer"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Change Plan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => showSuccess('Viewing payment history')}
                        className="w-full bg-white dark:bg-slate-800 hover:bg-[#1F2B6D]/5 dark:hover:bg-slate-700/80 active:scale-[0.98] text-slate-700 dark:text-slate-200 hover:text-[#1F2B6D] dark:hover:text-[#8B93D9] border border-slate-200 dark:border-slate-700 hover:border-[#1F2B6D] py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center justify-start gap-2.5 shadow-2xs transition cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        <span>View Payment History</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => showSuccess('Plan renewal reminder notification sent to driver')}
                        className="w-full bg-white dark:bg-slate-800 hover:bg-[#1F2B6D]/5 dark:hover:bg-slate-700/80 active:scale-[0.98] text-slate-700 dark:text-slate-200 hover:text-[#1F2B6D] dark:hover:text-[#8B93D9] border border-slate-200 dark:border-slate-700 hover:border-[#1F2B6D] py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center justify-start gap-2.5 shadow-2xs transition cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Send Plan Reminder</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => showSuccess('Subscription paused for driver')}
                        className="w-full bg-amber-50 hover:bg-amber-100/70 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 active:scale-[0.98] text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center justify-start gap-2.5 transition cursor-pointer"
                      >
                        <PauseCircle className="w-4 h-4" />
                        <span>Pause Subscription</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => showSuccess('Subscription cancellation initiated')}
                        className="w-full bg-rose-50 hover:bg-rose-100/70 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 active:scale-[0.98] text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center justify-start gap-2.5 transition cursor-pointer"
                      >
                        <X className="w-4 h-4 stroke-[2.5]" />
                        <span>Cancel Subscription</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── 2. BOTTOM 2-COLUMN GRID: PAYMENT & SUBSCRIPTION HISTORY ─ */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* 4. Payment History Table (Col 8) */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                  <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs shrink-0">
                        <Receipt className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px] leading-tight">
                          Payment History
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">List of all subscription payments.</p>
                      </div>
                    </div>
                  </div>
                  <Table containerClassName="overflow-x-auto" className="w-full text-xs">
                    <TableHeader className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                      <TableRow>
                        <TableHead className="py-2.5 px-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal w-10">#</TableHead>
                        <TableHead className="py-2.5 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal">Payment Date</TableHead>
                        <TableHead className="py-2.5 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal">Plan</TableHead>
                        <TableHead className="py-2.5 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal">Amount</TableHead>
                        <TableHead className="py-2.5 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal">Status</TableHead>
                        <TableHead className="py-2.5 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal">Payment Method</TableHead>
                        <TableHead className="py-2.5 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal">Transaction ID</TableHead>
                        <TableHead className="py-2.5 px-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal">Invoice</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentHistoryRows.map((row) => (
                        <TableRow key={row.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <TableCell className="py-3 px-3 text-center text-slate-400 font-medium">{row.id}</TableCell>
                          <TableCell className="py-3 px-3 text-slate-700 dark:text-slate-200 font-medium">{row.date}</TableCell>
                          <TableCell className="py-3 px-3 text-slate-800 dark:text-slate-100 font-semibold">{row.plan}</TableCell>
                          <TableCell className="py-3 px-3 text-[#1F2B6D] dark:text-white font-bold">{row.amount}</TableCell>
                          <TableCell className="py-3 px-3">
                            <Badge variant="success" className="gap-1 font-sans">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                              {row.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 px-3 text-slate-600 dark:text-slate-300">{row.method}</TableCell>
                          <TableCell className="py-3 px-3 font-mono text-xs text-slate-600 dark:text-slate-400">{row.txId}</TableCell>
                          <TableCell className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => showSuccess(`Downloading invoice for ${row.txId}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-md font-semibold text-[#1F2B6D] dark:text-blue-300 hover:bg-[#1F2B6D]/5 dark:hover:bg-slate-800 transition cursor-pointer shadow-2xs"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* 5. Subscription History Timeline (Col 4) */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                  <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded bg-[#1F2B6D] text-white flex items-center justify-center shadow-2xs shrink-0">
                        <History className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#1F2B6D] dark:text-white text-[14px] leading-tight">
                          Subscription History
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">History of plan changes, renewals and status updates.</p>
                      </div>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <div className="p-5">
                    <div className="relative space-y-5 before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                      {subscriptionTimelineNodes.map((item, idx) => (
                        <div key={idx} className="relative flex items-start gap-3.5">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ring-4 ring-white dark:ring-slate-900 shadow-2xs",
                            item.nodeBg
                          )}>
                            {item.icon}
                          </div>
                          <div className="text-left space-y-0.5 flex-1 min-w-0 pt-0.5">
                            <p className="text-[13px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                              {item.title}
                            </p>
                            {item.subtitle && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                {item.subtitle}
                              </p>
                            )}
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {item.date}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* ─── 5. COMMISSION WALLET TAB ─────────────────────────────────────── */}
        {activeTab === 'wallet' && (
          <div className="space-y-5 text-left">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {[
                { label: 'Today Earnings', val: money(driver.earningsToday), desc: 'Net fare generated today' },
                { label: 'Week Earnings', val: money(driver.earningsWeek), desc: 'Ongoing cycle earnings' },
                { label: 'Wallet Balance', val: money(driver.walletBalance || 1250), desc: 'Net payout credit due' },
                { label: 'Outstanding Dues', val: money(driver.outstandingDues || 0), desc: 'Uncollected commission fees' },
              ].map((kpi, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
                  <p className="text-xl font-extrabold text-[#1F2B6D] dark:text-white my-1">{kpi.val}</p>
                  <p className="text-[10px] text-slate-400">{kpi.desc}</p>
                </div>
              ))}
            </div>

            {/* Ledger Transactions table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-[14px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
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

        {/* ─── 6. RIDES & PERFORMANCE TAB ──────────────────────────────────── */}
        {activeTab === 'rides' && <DriverRidesPerformanceTab driver={driver} />}

        {/* ─── 7. RATINGS & REVIEWS TAB ────────────────────────────────────── */}
        {activeTab === 'ratings' && <DriverRatingsReviewsTab driver={driver} />}

        {/* ─── 7. ACTIVITY LOGS TAB ─────────────────────────────────────────── */}
        {activeTab === 'activity' && (
          <DriverActivityLogsTab
            driver={driver}
            onAddNote={() => {
              setTimelineNote('')
              setIsNoteModalOpen(true)
            }}
          />
        )}
      </div>

      {/* ─── Image Preview Modal ──────────────────────────────────────────────── */}
      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage || ''}
        title={previewTitle}
      />

      {/* ─── Confirmation Modal for status changes (Suspend, Block, Activate) ─── */}
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

      {/* ─── Timeline Note Modal ──────────────────────────────────────────────── */}
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
                showSuccess('Note added', 'Support note recorded on driver timeline.')
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

      {/* ─── Top-Up Wallet Modal ──────────────────────────────────────────────── */}
      <ConfirmationModal
        isOpen={isTopUpModalOpen}
        onCancel={() => setIsTopUpModalOpen(false)}
        onConfirm={() => {
          showSuccess('Wallet Top Up', `Successfully credited ₹${topUpAmount} to driver wallet`)
          setIsTopUpModalOpen(false)
        }}
        title="Top Up Driver Wallet"
        description={
          <div className="space-y-4 w-full text-left">
            <p className="text-xs text-muted-foreground">
              Add credit balance directly to driver's commission wallet.
            </p>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount (₹)</label>
              <div className="grid grid-cols-3 gap-2">
                {['250', '500', '1000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(amt)}
                    className={cn(
                      'p-2 text-xs font-bold rounded-lg border transition cursor-pointer',
                      topUpAmount === amt
                        ? 'bg-[#1F2B6D] border-[#1F2B6D] text-white'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
                    )}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                placeholder="Enter custom amount..."
                className="w-full mt-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-[#1F2B6D] focus:outline-none font-mono"
              />
            </div>
          </div>
        }
        confirmText="Confirm Credit"
        variant="info"
      />

      {/* ─── Send Message Modal ───────────────────────────────────────────────── */}
      <ConfirmationModal
        isOpen={isMessageModalOpen}
        onCancel={() => {
          setIsMessageModalOpen(false)
          setMessageText('')
        }}
        onConfirm={() => {
          if (!messageText.trim()) return
          showSuccess('Message Sent', `Notification dispatched to driver ${driverName}`)
          setIsMessageModalOpen(false)
          setMessageText('')
        }}
        title={`Send In-App Notification to ${driverName}`}
        description={
          <div className="space-y-4 w-full text-left">
            <p className="text-xs text-muted-foreground">
              This message will be pushed instantly to the driver mobile app notification inbox and SMS.
            </p>
            <textarea
              rows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type notification message here..."
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-[#1F2B6D] focus:outline-none resize-none"
            />
          </div>
        }
        confirmText="Send Notification"
        variant="info"
      />

      {/* ─── Custom Edit Driver Modal ────────────────────────────────────────── */}
      <EditDriverModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        driver={driver}
        initialTab={editInitialTab}
        onSave={handleEditSave}
        loading={isUpdatingDriver || isUpdatingMutation}
      />

      {/* ─── Custom Suspend Driver Modal ─────────────────────────────────────── */}
      <SuspendDriverModal
        isOpen={isCustomSuspendModalOpen}
        onClose={() => setIsCustomSuspendModalOpen(false)}
        driver={driver}
        onConfirm={handleCustomSuspendConfirm}
        loading={isSuspending}
      />
    </PageWrapper>
  )
}

export default DriverDetailsPage
