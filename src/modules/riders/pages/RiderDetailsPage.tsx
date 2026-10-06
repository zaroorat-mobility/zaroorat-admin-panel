import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useRider,
  useRiderRealtime,
  useSuspendRider,
  useBlockRider,
  useActivateRider,
} from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { DataTable } from '@/shared/components/DataTable'
import { useToast } from '@/shared/context/toast'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import {
  User,
  MapPin,
  Star,
  AlertTriangle,
  Calendar,
  Clock,
  Ban,
  ShieldCheck,
  Info,
  Smartphone,
  KeyRound,
  HelpCircle,
  Car,
  MessageSquare,
  ShieldAlert,
  Languages,
  Mail,
  Phone,
  Copy,
  Camera,
  Zap,
  BarChart3,
  Wrench,
  Lock,
  Gift,
  MoreHorizontal,
  Edit3,
  Check,
  ChevronDown,
  ArrowLeft,
  X,
} from 'lucide-react'
import { cn } from '@/shared/utils'

type RiderTab = 'profile' | 'history' | 'reviews' | 'support' | 'timeline'

export const RiderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success: showSuccess, error: showError } = useToast()
  const user = useAuthStore((state) => state.user)
  const canWrite = hasPermission(user, 'riders:write')
  const [activeTab, setActiveTab] = useState<RiderTab>('profile')

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [statusAction, setStatusAction] = useState<'suspend' | 'block' | 'activate' | null>(null)
  const [statusNotes, setStatusNotes] = useState('')
  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const moreActionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreActionsRef.current && !moreActionsRef.current.contains(event.target as Node)) {
        setIsMoreActionsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMoreActionsOpen(false)
      }
    }

    if (isMoreActionsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMoreActionsOpen])

  const { data: rider, isLoading, isError, refetch } = useRider(id || '')
  useRiderRealtime(id || '', Boolean(rider))

  const { mutate: suspendRider, isPending: isSuspending } = useSuspendRider()
  const { mutate: blockRider, isPending: isBlocking } = useBlockRider()
  const { mutate: activateRider, isPending: isActivating } = useActivateRider()

  const copyToClipboard = (text: string, label = 'Customer ID') => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true)
    showSuccess('Copied to clipboard', `${label}: ${text}`)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <PageWrapper className="pt-1 pb-6 px-3 sm:px-5">
        <div className="flex items-center justify-center p-16 text-[#1F2B6D] dark:text-[#8B93D9] font-medium animate-pulse text-sm">
          Loading Customer Profile details...
        </div>
      </PageWrapper>
    )
  }

  if (isError || !rider) {
    return (
      <PageWrapper className="pt-1 pb-6 px-3 sm:px-5">
        <div className="flex flex-col items-center justify-center p-16 space-y-4">
          <AlertTriangle className="h-12 w-12 text-slate-400" />
          <h3 className="text-base font-bold text-[#1F2B6D] dark:text-white">Customer Profile Not Found</h3>
          <button
            type="button"
            onClick={() => navigate('/riders')}
            className="bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white px-4 py-2 rounded-[10px] text-xs font-semibold shadow-sm transition"
          >
            Back to Customer Directory
          </button>
        </div>
      </PageWrapper>
    )
  }

  const isSuspendedOrBlocked = rider.riderStatus === 'suspended' || rider.riderStatus === 'blocked'

  // Safe fallback bindings
  const stats = rider.stats ?? {
    totalRides: rider.totalRides ?? 0,
    completedRides: 0,
    cancelledByCustomer: 0,
    cancelledByDriver: 0,
    totalSpent: 0,
    cancelRate: rider.cancelRate ?? 0,
    noShowCount: rider.noShowCount ?? 0,
  }

  const devices = rider.devices ?? []
  const savedPlaces = rider.savedPlaces ?? []
  const emergencyContacts = rider.emergencyContactsList ?? rider.emergencyContacts ?? []
  const supportTickets = rider.supportTickets ?? []
  const reviews = rider.reviews ?? []
  const rideHistory = rider.rideHistory ?? []
  const timeline = rider.timeline ?? []
  const safetyIncidentsCount =
    rider.safetyIncidentsCount ??
    supportTickets.filter((t) => t.category?.toLowerCase().includes('safety')).length

  const driverFeedbackReceived = reviews.filter((r) => r.ratedBy === 'DRIVER')
  const customerFeedbackGiven = reviews.filter((r) => r.ratedBy === 'CUSTOMER')

  const ratingBreakdown = (() => {
    if (rider.ratingBreakdown && (rider.ratingBreakdown.totalRatings > 0 || driverFeedbackReceived.length === 0)) {
      return rider.ratingBreakdown
    }
    if (driverFeedbackReceived.length > 0) {
      const counts = { star5: 0, star4: 0, star3: 0, star2: 0, star1: 0 }
      let sum = 0
      for (const r of driverFeedbackReceived) {
        sum += r.rating
        if (r.rating === 5) counts.star5++
        else if (r.rating === 4) counts.star4++
        else if (r.rating === 3) counts.star3++
        else if (r.rating === 2) counts.star2++
        else if (r.rating === 1) counts.star1++
      }
      return {
        avgRating: Number((sum / driverFeedbackReceived.length).toFixed(2)),
        totalRatings: driverFeedbackReceived.length,
        ...counts,
      }
    }
    return (
      rider.ratingBreakdown ?? {
        avgRating: rider.ratingAvg && rider.ratingAvg > 0 ? rider.ratingAvg : 0,
        totalRatings: 0,
        star5: 0,
        star4: 0,
        star3: 0,
        star2: 0,
        star1: 0,
      }
    )
  })()

  const hasRatings = ratingBreakdown.totalRatings > 0
  const displayedAvgRating = hasRatings
    ? Number(ratingBreakdown.avgRating).toFixed(1)
    : rider.ratingAvg && rider.ratingAvg > 0
      ? Number(rider.ratingAvg).toFixed(1)
      : '0.0'

  // Date and Text Formatters
  const getInitials = (name?: string) => {
    if (!name) return 'CU'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const formatJoinedDate = (d?: string) => {
    if (!d) return '—'
    const date = new Date(d)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatLastActive = (d?: string) => {
    if (!d) return '—'
    const date = new Date(d)
    const datePart = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    const timePart = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    return `${datePart}, ${timePart}`
  }

  const formatDob = (d?: string) => {
    if (!d) return '—'
    const date = new Date(d)
    if (isNaN(date.getTime())) return d
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatGender = (g?: string) => {
    if (!g || g.toLowerCase() === 'unknown') return '—'
    return g.charAt(0).toUpperCase() + g.slice(1).toLowerCase()
  }

  const formatLanguage = (lang?: string) => {
    if (!lang) return '—'
    const lower = lang.toLowerCase()
    if (lower.startsWith('en')) return 'English (EN)'
    if (lower.startsWith('hi')) return 'Hindi (HI)'
    if (lower.startsWith('ur')) return 'Urdu (UR)'
    return `${lang.toUpperCase()} (${lang.toUpperCase()})`
  }

  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return '—'
    const trimmed = phone.trim()
    const cleaned = trimmed.replace(/\s+/g, '')
    if (cleaned.startsWith('+91') && cleaned.length === 13) {
      return `+91 ${cleaned.slice(3, 7)} ${cleaned.slice(7, 10)} ${cleaned.slice(10)}`
    }
    if (/^\d{10}$/.test(cleaned)) {
      return `+91 ${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
    }
    return trimmed
  }

  // Dynamic recent activity events matching the template
  const activityEvents = [
    ...(timeline || []).map((t) => ({
      id: t.id,
      title: t.action,
      date:
        new Date(t.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) +
        ', ' +
        new Date(t.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      icon: t.action.toLowerCase().includes('pin') ? KeyRound : t.action.toLowerCase().includes('phone') ? Lock : User,
    })),
  ]

  if (activityEvents.length === 0) {
    if (rider.joinedAt) {
      activityEvents.push({
        id: 'evt-joined',
        title: 'Account created',
        date: formatLastActive(rider.joinedAt),
        icon: User,
      })
    }
    if (rider.isPhoneVerified) {
      activityEvents.push({
        id: 'evt-phone',
        title: 'Phone verified',
        date: formatLastActive(rider.joinedAt),
        icon: Lock,
      })
    }
    if (rider.hasRidePin) {
      activityEvents.push({
        id: 'evt-pin',
        title: `Ride PIN configured (v${rider.ridePinVersion || 1})`,
        date: rider.ridePinUpdatedAt ? formatLastActive(rider.ridePinUpdatedAt) : formatLastActive(rider.lastActiveAt || rider.joinedAt),
        icon: KeyRound,
      })
    }
  }

  // Ride History Table Columns
  const rideHistoryColumns = [
    {
      key: 'id',
      label: 'Booking Code',
      align: 'center' as const,
      render: (val: string) => <span className="font-mono text-xs font-bold text-[#1F2B6D] dark:text-[#8B93D9]">{val}</span>,
    },
    {
      key: 'date',
      label: 'Date & Time',
      align: 'center' as const,
      render: (val: string) => (
        <span className="text-xs text-slate-600 dark:text-slate-350">
          {new Date(val).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      ),
    },
    {
      key: 'route',
      label: 'Pickup & Drop Route',
      align: 'left' as const,
      render: (_: any, row: any) => (
        <div className="flex flex-col text-left space-y-0.5 max-w-xs">
          <span className="font-medium text-slate-700 dark:text-slate-300 text-xs truncate">From: {row.pickupAddress}</span>
          <span className="text-[11px] text-muted-foreground truncate font-medium">To: {row.dropAddress}</span>
        </div>
      ),
    },
    {
      key: 'driver',
      label: 'Assigned Driver',
      align: 'left' as const,
      render: (_: any, row: any) => (
        <div className="flex flex-col text-left">
          {row.driverName ? (
            <>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{row.driverName}</span>
              {row.driverPhone && <span className="text-[10px] text-muted-foreground font-mono">{row.driverPhone}</span>}
            </>
          ) : (
            <span className="text-xs text-slate-400 italic">Unassigned</span>
          )}
        </div>
      ),
    },
    {
      key: 'vehicle',
      label: 'Vehicle Details',
      align: 'left' as const,
      render: (_: any, row: any) => (
        <div className="flex flex-col text-left">
          {row.vehiclePlate ? (
            <>
              <span className="font-semibold text-xs text-slate-700 dark:text-slate-300 uppercase">{row.vehiclePlate}</span>
              {row.vehicleType && <span className="text-[10px] text-muted-foreground">{row.vehicleType}</span>}
            </>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </div>
      ),
    },
    {
      key: 'fare',
      label: 'Fare Amount',
      align: 'right' as const,
      render: (val: number) => <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">₹{val.toFixed(2)}</span>,
    },
    {
      key: 'paymentMethod',
      label: 'Payment Flow',
      align: 'center' as const,
      render: (val: string) => (
        <span className="uppercase text-[10px] bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-black tracking-wider">
          {val ? (val.toUpperCase() === 'UPI' ? 'Direct UPI' : `${val} to Driver`) : 'Cash to Driver'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center' as const,
      render: (val: string, row: any) => (
        <div className="flex flex-col items-center gap-1">
          <StatusBadge status={val} />
          {row.cancellationReason && (
            <span className="text-[9px] text-rose-600 font-semibold max-w-[120px] truncate" title={row.cancellationReason}>
              {row.cancellationReason}
            </span>
          )}
        </div>
      ),
    },
  ]

  // Support Tickets Columns
  const supportColumns = [
    {
      key: 'ticketNumber',
      label: 'Ticket #',
      align: 'center' as const,
      render: (val: string) => <span className="font-mono text-xs font-bold text-[#1F2B6D] dark:text-[#8B93D9]">{val}</span>,
    },
    {
      key: 'category',
      label: 'Category',
      align: 'center' as const,
      render: (val: string) => (
        <span className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded font-medium text-slate-700 dark:text-slate-300">
          {val || 'General'}
        </span>
      ),
    },
    {
      key: 'subject',
      label: 'Subject / Complaint',
      align: 'left' as const,
      render: (val: string) => <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{val}</span>,
    },
    {
      key: 'priority',
      label: 'Priority',
      align: 'center' as const,
      render: (val: string) => {
        const priorityColors: Record<string, string> = {
          URGENT: 'text-rose-700 bg-rose-50 border-rose-200',
          HIGH: 'text-amber-700 bg-amber-50 border-amber-200',
          NORMAL: 'text-blue-700 bg-blue-50 border-blue-200',
          LOW: 'text-slate-600 bg-slate-50 border-slate-200',
        }
        return (
          <span className={cn('text-[10px] uppercase font-bold px-2 py-0.5 rounded border', priorityColors[val] || priorityColors.NORMAL)}>
            {val}
          </span>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center' as const,
      render: (val: string) => <StatusBadge status={val} />,
    },
    {
      key: 'channel',
      label: 'Channel',
      align: 'center' as const,
      render: (val: string) => <span className="text-xs uppercase font-medium text-slate-500">{val}</span>,
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      align: 'center' as const,
      render: (val: string) => <span className="text-xs text-slate-500">{new Date(val).toLocaleDateString('en-IN')}</span>,
    },
  ]

  return (
    <PageWrapper className="space-y-4 pt-1 pb-6 px-3 sm:px-5">
      {/* ─── 1. Header with Geographic Dashboard Styling ───────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/riders')}
            title="Back to Customer Directory"
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition shadow-2xs cursor-pointer flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2B6D] dark:text-white">
              Customer Profile: {rider.fullName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive customer overview, registered devices, saved addresses, booking history, driver ratings, and support tickets.
            </p>
          </div>
        </div>

        {canWrite && (
          <div className="flex items-center gap-2 relative">
            {isSuspendedOrBlocked ? (
              <button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white px-3.5 py-2 rounded-[10px] text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                onClick={() => {
                  setStatusAction('activate')
                  setIsStatusModalOpen(true)
                }}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Activate Account</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 px-3 py-2 rounded-[10px] border border-amber-200 dark:border-amber-800 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  onClick={() => {
                    setStatusAction('suspend')
                    setIsStatusModalOpen(true)
                  }}
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  <span>Suspend Account</span>
                </button>

                <button
                  type="button"
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100/80 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 px-3 py-2 rounded-[10px] border border-rose-200 dark:border-rose-800 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  onClick={() => {
                    setStatusAction('block')
                    setIsStatusModalOpen(true)
                  }}
                >
                  <Ban className="h-3.5 w-3.5 text-rose-500" />
                  <span>Block Account</span>
                </button>
              </>
            )}

            {/* More Actions Dropdown */}
            <div className="relative" ref={moreActionsRef}>
              <button
                type="button"
                className="text-xs font-semibold text-[#1F2B6D] dark:text-[#8B93D9] bg-[#1F2B6D]/[0.06] hover:bg-[#1F2B6D]/[0.12] dark:bg-slate-800 dark:hover:bg-slate-700/80 px-3 py-2 rounded-[10px] border border-[#1F2B6D]/20 dark:border-slate-700 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                onClick={() => setIsMoreActionsOpen(!isMoreActionsOpen)}
              >
                <MoreHorizontal className="h-3.5 w-3.5 text-[#1F2B6D] dark:text-[#8B93D9]" />
                <span>More Actions</span>
                <ChevronDown className="h-3 w-3 opacity-70 ml-0.5" />
              </button>

              {isMoreActionsOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 py-1.5 text-xs">
                  <button
                    className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                    onClick={() => {
                      copyToClipboard(rider.riderId)
                      setIsMoreActionsOpen(false)
                    }}
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Customer ID</span>
                  </button>
                  <button
                    className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                    onClick={() => {
                      copyToClipboard(rider.mobileNumber, 'Phone')
                      setIsMoreActionsOpen(false)
                    }}
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Phone Number</span>
                  </button>
                  <button
                    className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                    onClick={() => {
                      setActiveTab('timeline')
                      setIsMoreActionsOpen(false)
                    }}
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>View Safety Audit</span>
                  </button>
                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                  <button
                    className="w-full px-3.5 py-2 text-left text-[#1F2B6D] hover:bg-[#1F2B6D]/5 dark:text-[#8B93D9] flex items-center gap-2 font-medium cursor-pointer"
                    onClick={() => {
                      window.print()
                      setIsMoreActionsOpen(false)
                    }}
                  >
                    <span>Print Summary</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Account Deletion Request Banner */}
      {rider.deletionRequest && rider.deletionRequest.status === 'PENDING' && (
        <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-rose-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <strong className="font-bold">Pending Account Deletion Request:</strong> This customer submitted a self-deletion request on{' '}
            {new Date(rider.deletionRequest.requestedAt).toLocaleDateString('en-IN')}. Scheduled for permanent erasure on{' '}
            {new Date(rider.deletionRequest.scheduledFor).toLocaleDateString('en-IN')}.
          </div>
        </div>
      )}

      {/* ─── 2. Customer Profile Identity Card ──────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm text-left">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            {/* Avatar Circle with Initials matching Geographic Badge */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#1F2B6D] text-white font-extrabold text-2xl flex items-center justify-center shadow-md tracking-wider flex-shrink-0">
                {getInitials(rider.fullName)}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 shadow-sm">
                <Camera className="w-3.5 h-3.5 text-slate-500" />
              </div>
            </div>

            {/* Profile Info Rows */}
            <div className="space-y-2">
              {/* Row 1: Name + Status Badge + Direct P2P Badge */}
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-[#1F2B6D] dark:text-white tracking-tight">
                  {rider.fullName}
                </h2>

                {/* Status Badge */}
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5',
                    rider.riderStatus === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                      : rider.riderStatus === 'suspended'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
                        : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300',
                  )}
                >
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      rider.riderStatus === 'active' ? 'bg-emerald-500' : rider.riderStatus === 'suspended' ? 'bg-amber-500' : 'bg-rose-500',
                    )}
                  />
                  <span className="capitalize">{rider.riderStatus}</span>
                </span>

                {/* Direct P2P Badge */}
                <div className="px-3 py-1 rounded-xl bg-[#1F2B6D]/[0.06] dark:bg-slate-800 border border-[#1F2B6D]/15 dark:border-slate-700 flex flex-col leading-tight">
                  <span className="text-[11px] font-bold text-[#1F2B6D] dark:text-white">Direct P2P Model</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Cash / Driver UPI QR</span>
                </div>
              </div>

              {/* Row 2: Customer ID with copy icon */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Customer ID:{' '}
                  <strong className="font-mono font-bold text-[#1F2B6D] dark:text-[#8B93D9]">
                    {rider.riderId}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(rider.riderId)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-[#1F2B6D] cursor-pointer"
                  title="Copy Customer ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Row 3: Phone & Email with Verified Badges */}
              <div className="flex items-center gap-5 flex-wrap text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold font-mono tracking-tight text-slate-800 dark:text-slate-200">
                    {formatPhoneNumber(rider.mobileNumber)}
                  </span>
                  {rider.isPhoneVerified ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Verified
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      Unverified
                    </span>
                  )}
                </div>

                {rider.email ? (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{rider.email}</span>
                    {rider.isEmailVerified ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Verified
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        Unverified
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="italic text-[11px]">No email registered</span>
                  </div>
                )}
              </div>

              {/* Row 4: Demographics */}
              {(() => {
                const items: Array<{ icon: React.ReactNode; label: string }> = []
                const gender = formatGender(rider.gender)
                if (gender !== '—') {
                  items.push({ icon: <User className="w-3.5 h-3.5 text-slate-400" />, label: gender })
                }
                const dob = formatDob(rider.dateOfBirth)
                if (dob !== '—') {
                  items.push({ icon: <Calendar className="w-3.5 h-3.5 text-slate-400" />, label: dob })
                }
                const lang = formatLanguage(rider.languageCode)
                if (lang !== '—') {
                  items.push({ icon: <Languages className="w-3.5 h-3.5 text-slate-400" />, label: lang })
                }
                if (rider.referralCode && rider.referralCode.trim()) {
                  items.push({
                    icon: <Gift className="w-3.5 h-3.5 text-slate-400" />,
                    label: `Referral: ${rider.referralCode}`,
                  })
                }

                if (items.length === 0) return null

                return (
                  <div className="flex items-center gap-3 flex-wrap text-xs text-slate-600 dark:text-slate-400 pt-0.5">
                    {items.map((it, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && <span className="text-slate-300 dark:text-slate-700 select-none">|</span>}
                        <div className="flex items-center gap-1.5">
                          {it.icon}
                          <span className="font-medium">{it.label}</span>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Right Header Metadata */}
          <div className="flex flex-col gap-3.5 self-start lg:self-center pl-2 border-l border-slate-100 dark:border-slate-800 lg:pl-8">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1F2B6D]/[0.08] dark:bg-slate-800 flex items-center justify-center text-[#1F2B6D] dark:text-[#8B93D9] flex-shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Customer joined</div>
                <div className="text-sm font-bold text-[#1F2B6D] dark:text-white">
                  {formatJoinedDate(rider.joinedAt)}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1F2B6D]/[0.08] dark:bg-slate-800 flex items-center justify-center text-[#1F2B6D] dark:text-[#8B93D9] flex-shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Last active</div>
                <div className="text-sm font-bold text-[#1F2B6D] dark:text-white">
                  {formatLastActive(rider.lastActiveAt || rider.joinedAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Top 4 Metric KPI Cards (Geographic Dashboard Style) ────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Bookings */}
        <div
          onClick={() => setActiveTab('history')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between cursor-pointer hover:shadow-md transition-all text-left"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {stats.totalRides}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Total Bookings
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {stats.completedRides} completed • ₹{stats.totalSpent.toFixed(2)} spent
          </p>
        </div>

        {/* Card 2: Passenger Rating */}
        <div
          onClick={() => setActiveTab('reviews')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between cursor-pointer hover:shadow-md transition-all text-left"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Star className="w-5 h-5 fill-white text-white" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {displayedAvgRating} ★
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Passenger Rating
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {hasRatings
              ? `Based on ${ratingBreakdown.totalRatings} driver review${ratingBreakdown.totalRatings === 1 ? '' : 's'}`
              : 'No driver reviews yet'}
          </p>
        </div>

        {/* Card 3: Cancellation Rate */}
        <div
          onClick={() => setActiveTab('history')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between cursor-pointer hover:shadow-md transition-all text-left"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-rose-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {stats.cancelRate}%
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Cancellation Rate
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {stats.cancelledByCustomer} rider • {stats.cancelledByDriver} driver • {stats.noShowCount} no-show
          </p>
        </div>

        {/* Card 4: Security & Safety */}
        <div
          onClick={() => setActiveTab('profile')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between cursor-pointer hover:shadow-md transition-all text-left"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {rider.hasRidePin ? 'Protected' : 'No PIN'}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Security & Safety
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {emergencyContacts.length} contacts • {devices.length} device{devices.length === 1 ? '' : 's'} • {safetyIncidentsCount} safety
          </p>
        </div>
      </div>

      {/* ─── 4. Tab Navigation Pill Bar ────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 mb-6">
        {[
          { id: 'profile', label: 'Overview & Profile', icon: User, count: undefined },
          { id: 'history', label: 'Ride History', icon: Car, count: rideHistory.length },
          { id: 'reviews', label: 'Driver Reviews', icon: Star, count: reviews.length },
          { id: 'support', label: 'Support Tickets', icon: HelpCircle, count: supportTickets.length },
          { id: 'timeline', label: 'Safety & Audit Log', icon: ShieldCheck, count: timeline.length || activityEvents.length },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as RiderTab)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer',
                isActive
                  ? 'bg-[#1F2B6D] text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 font-semibold',
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ─── TAB 1: OVERVIEW & PROFILE ─────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="space-y-6 text-left">
          {/* Row 1: 3-column Grid (Personal Information, Account Status, Quick Actions) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Card 1: Personal Information */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-[#1F2B6D]/[0.08] dark:bg-slate-800 flex items-center justify-center text-[#1F2B6D] dark:text-[#8B93D9]">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                        Personal Information
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Contact and demographic profile</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="text-xs font-semibold text-[#1F2B6D] dark:text-[#8B93D9] bg-[#1F2B6D]/[0.06] hover:bg-[#1F2B6D]/[0.12] dark:bg-slate-800 dark:hover:bg-slate-700/80 px-2.5 py-1 rounded-md border border-[#1F2B6D]/20 dark:border-slate-700 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="p-5 space-y-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Full Name</span>
                    <span className="font-bold text-slate-900 dark:text-white">{rider.fullName}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Customer ID</span>
                    <span className="font-bold text-[#1F2B6D] dark:text-[#8B93D9] flex items-center gap-1.5 font-mono">
                      {rider.riderId}
                      <button
                        type="button"
                        onClick={() => copyToClipboard(rider.riderId)}
                        className="text-slate-400 hover:text-[#1F2B6D] cursor-pointer"
                        title="Copy Customer ID"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Phone Number</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold font-mono text-slate-900 dark:text-white">{rider.mobileNumber}</span>
                      {rider.isPhoneVerified && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Verified
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Email Address</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900 dark:text-white">{rider.email || '—'}</span>
                      {rider.isEmailVerified && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Verified
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Date of Birth</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formatDob(rider.dateOfBirth)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Gender</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formatGender(rider.gender)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Language</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formatLanguage(rider.languageCode)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Referral Code</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{rider.referralCode || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Account Status & Verification */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-[#1F2B6D]/[0.08] dark:bg-slate-800 flex items-center justify-center text-[#1F2B6D] dark:text-[#8B93D9]">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                        Account Status & Security
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Permissions & authentication state</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Account Status</span>
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 capitalize',
                        rider.riderStatus === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                          : rider.riderStatus === 'suspended'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300',
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          rider.riderStatus === 'active' ? 'bg-emerald-500' : rider.riderStatus === 'suspended' ? 'bg-amber-500' : 'bg-rose-500',
                        )}
                      />
                      {rider.riderStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Phone Verification</span>
                    {rider.isPhoneVerified ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Verified
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        Unverified
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Email Verification</span>
                    {rider.isEmailVerified ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Verified
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1">
                        {rider.email ? 'Unverified' : 'No Email'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Ride PIN Status</span>
                    {rider.hasRidePin ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1F2B6D]/10 text-[#1F2B6D] dark:text-[#8B93D9] border border-[#1F2B6D]/20 flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-[#1F2B6D] dark:text-[#8B93D9]" /> Configured (v{rider.ridePinVersion ?? 1})
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-slate-400" /> Not Configured
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Account Created</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatJoinedDate(rider.joinedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Last Active</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatLastActive(rider.lastActiveAt || rider.joinedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Account Deletion</span>
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      {rider.deletionRequest?.status ? `Pending (${rider.deletionRequest.status})` : 'No request'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Quick Actions (Styled after Geographic Dashboard Quick Actions) */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-[#1F2B6D]/[0.08] dark:bg-slate-800 flex items-center justify-center text-[#1F2B6D] dark:text-[#8B93D9]">
                      <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                        Quick Actions
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Operational management tools</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-2.5">
                  {/* Suspend or Reactivate Action */}
                  {isSuspendedOrBlocked ? (
                    <button
                      type="button"
                      onClick={() => {
                        setStatusAction('activate')
                        setIsStatusModalOpen(true)
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-[18px] h-[18px]" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-bold text-emerald-700 dark:text-emerald-300 leading-tight">
                          Activate Account
                        </p>
                        <p className="text-[11px] text-slate-400 leading-tight truncate">
                          Restore full customer app access
                        </p>
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setStatusAction('suspend')
                        setIsStatusModalOpen(true)
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-[18px] h-[18px]" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-bold text-amber-800 dark:text-amber-300 leading-tight">
                          Suspend Account
                        </p>
                        <p className="text-[11px] text-slate-400 leading-tight truncate">
                          Temporary compliance hold
                        </p>
                      </div>
                    </button>
                  )}

                  {/* Block Account */}
                  {!isSuspendedOrBlocked && (
                    <button
                      type="button"
                      onClick={() => {
                        setStatusAction('block')
                        setIsStatusModalOpen(true)
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-500/40 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center flex-shrink-0 text-rose-600 dark:text-rose-400">
                        <Ban className="w-[18px] h-[18px]" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-bold text-rose-700 dark:text-rose-300 leading-tight">
                          Block Account
                        </p>
                        <p className="text-[11px] text-slate-400 leading-tight truncate">
                          Revoke platform permissions
                        </p>
                      </div>
                    </button>
                  )}

                  {/* View Ride History */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#1F2B6D]/40 dark:hover:border-[#8B93D9]/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#1F2B6D]/[0.08] dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-[#1F2B6D] dark:text-[#8B93D9]">
                      <Car className="w-[18px] h-[18px]" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                        View Ride History
                      </p>
                      <p className="text-[11px] text-slate-400 leading-tight truncate">
                        Inspect customer booking logs
                      </p>
                    </div>
                  </button>

                  {/* Create Support Ticket */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('support')}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#1F2B6D]/40 dark:hover:border-[#8B93D9]/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#1F2B6D]/[0.08] dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-[#1F2B6D] dark:text-[#8B93D9]">
                      <HelpCircle className="w-[18px] h-[18px]" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                        Support & Disputes
                      </p>
                      <p className="text-[11px] text-slate-400 leading-tight truncate">
                        Manage customer inquiries
                      </p>
                    </div>
                  </button>

                  {/* View Safety Incidents */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('timeline')}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#1F2B6D]/40 dark:hover:border-[#8B93D9]/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#1F2B6D]/[0.08] dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-[#1F2B6D] dark:text-[#8B93D9]">
                      <ShieldCheck className="w-[18px] h-[18px]" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                        Safety & Audit Trail
                      </p>
                      <p className="text-[11px] text-slate-400 leading-tight truncate">
                        Audit events and security log
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: 2-column Grid (Registered Devices 7 cols, Recent Activity 5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="registered-devices-card">
            {/* Left: Registered Client Devices */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-[#1F2B6D]/[0.08] dark:bg-slate-800 flex items-center justify-center text-[#1F2B6D] dark:text-[#8B93D9]">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                        Registered Client Devices ({devices.length})
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Customer app installations & trust verification</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showSuccess('Device Trust', 'All customer device sessions verified')}
                    className="text-xs font-semibold text-[#1F2B6D] dark:text-[#8B93D9] bg-[#1F2B6D]/[0.06] hover:bg-[#1F2B6D]/[0.12] dark:bg-slate-800 dark:hover:bg-slate-700/80 px-2.5 py-1 rounded-md border border-[#1F2B6D]/20 dark:border-slate-700 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Verify Devices</span>
                  </button>
                </div>

                <div className="p-5">
                  {devices.length === 0 ? (
                    <p className="text-slate-400 py-8 text-center text-xs">No registered client devices recorded for this customer yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {devices.map((device, idx) => (
                        <div
                          key={device.id || device.deviceId || idx}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4 text-emerald-500" />
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                {device.platform || 'Device'} {device.appVersion ? `• App v${device.appVersion}` : ''}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-300">
                              {device.trustState || 'REGISTERED'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-y-2.5 gap-x-6 text-xs pt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 dark:text-slate-400">OS Version</span>
                              <strong className="text-slate-800 dark:text-slate-200">
                                {device.osVersion || '—'}
                              </strong>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 dark:text-slate-400">Push Tokens</span>
                              <strong className="text-slate-800 dark:text-slate-200">
                                {device.hasPushToken ? 'Active' : 'Not Registered'}
                              </strong>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 dark:text-slate-400">Integrity</span>
                              <strong className={device.isRooted || device.isJailbroken ? 'text-rose-600' : 'text-emerald-600'}>
                                {device.isRooted || device.isJailbroken ? 'Compromised' : 'Clean Device'}
                              </strong>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 dark:text-slate-400">Last Seen</span>
                              <strong className="text-slate-800 dark:text-slate-200">
                                {device.lastSeenAt ? formatLastActive(device.lastSeenAt) : '—'}
                              </strong>
                            </div>

                            <div className="flex items-center justify-between col-span-2 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                              <span className="text-slate-500 dark:text-slate-400">Device ID</span>
                              <strong className="font-mono text-slate-700 dark:text-slate-300 text-[11px] truncate max-w-xs" title={device.deviceId}>
                                {device.deviceId || '—'}
                              </strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Recent Activity Timeline */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-[#1F2B6D]/[0.08] dark:bg-slate-800 flex items-center justify-center text-[#1F2B6D] dark:text-[#8B93D9]">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                        Recent Activity
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Timeline of passenger events</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('timeline')}
                    className="text-xs font-semibold text-[#1F2B6D] dark:text-[#8B93D9] bg-[#1F2B6D]/[0.06] hover:bg-[#1F2B6D]/[0.12] dark:bg-slate-800 dark:hover:bg-slate-700/80 px-2.5 py-1 rounded-md border border-[#1F2B6D]/20 dark:border-slate-700 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    View All →
                  </button>
                </div>

                <div className="p-5">
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1F2B6D]">
                    {activityEvents.map((evt, idx) => {
                      const Icon = evt.icon
                      return (
                        <div key={evt.id || idx} className="relative flex items-center justify-between text-xs">
                          <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#1F2B6D] flex items-center justify-center ring-4 ring-white dark:ring-slate-900">
                            <Icon className="w-2.5 h-2.5 text-white" />
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{evt.title}</span>
                          <span className="text-slate-400 text-[11px] font-medium">{evt.date}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Saved Places & Emergency Contacts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Saved Places */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-[#1F2B6D]/[0.08] dark:bg-slate-800 flex items-center justify-center text-[#1F2B6D] dark:text-[#8B93D9]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                      Saved Places & Addresses ({savedPlaces.length})
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Customer pinned locations</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-[#1F2B6D] dark:text-[#8B93D9] bg-[#1F2B6D]/[0.06] border border-[#1F2B6D]/20 px-2 py-0.5 rounded">
                  Bookmarks
                </span>
              </div>

              <div className="p-5 space-y-3 text-xs">
                {savedPlaces.length === 0 ? (
                  <p className="text-slate-400 py-4 text-center">No saved places configured by this customer yet.</p>
                ) : (
                  savedPlaces.map((place) => (
                    <div
                      key={place.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200 uppercase text-xs flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black">
                            {place.label}
                          </span>
                          {place.buildingName && <span>{place.buildingName}</span>}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Added: {new Date(place.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-350 flex items-start gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span>{place.address || 'Address pinned'}</span>
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-[#1F2B6D]/[0.08] dark:bg-slate-800 flex items-center justify-center text-[#1F2B6D] dark:text-[#8B93D9]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                      Emergency Contacts & SOS ({emergencyContacts.length})
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Safety alert network</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                  Safety Network
                </span>
              </div>

              <div className="p-5 space-y-3 text-xs">
                {emergencyContacts.length === 0 ? (
                  <p className="text-slate-400 py-4 text-center">No emergency contacts configured by this customer.</p>
                ) : (
                  emergencyContacts.map((contact, idx) => (
                    <div
                      key={contact.id || idx}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{contact.name}</span>
                          {contact.relationship && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {contact.relationship}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                          {contact.phone}
                        </p>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                        Priority {contact.priority || idx + 1}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: RIDE HISTORY ───────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-4 text-left">
          <div className="p-4 rounded-xl border border-[#1F2B6D]/20 bg-[#1F2B6D]/[0.05] dark:border-[#8B93D9]/20 dark:bg-[#1F2B6D]/10 flex items-start gap-3">
            <Info className="h-4 w-4 text-[#1F2B6D] dark:text-[#8B93D9] mt-0.5 flex-shrink-0" />
            <div className="text-xs text-[#1F2B6D] dark:text-slate-200">
              <strong className="font-bold">Direct Payment Architecture:</strong> Customers pay drivers directly via Cash or external UPI QR. Zaroorat does not route customer ride fares through a platform payment gateway, and does not hold customer ride funds or issue gateway ride refunds. All fare disputes are resolved through Support Complaints & Driver Commission Adjustments.
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden text-left">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#1F2B6D]/[0.08] dark:bg-slate-800 flex items-center justify-center text-[#1F2B6D] dark:text-[#8B93D9]">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                    Historical Bookings Log ({rideHistory.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Comprehensive log of customer rides, assigned drivers, and routes</p>
                </div>
              </div>
            </div>
            <div className="p-1">
              <DataTable
                columns={rideHistoryColumns}
                data={rideHistory}
                selectable={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: PASSENGER REVIEWS ──────────────────────────────────────── */}
      {activeTab === 'reviews' && (
        <div className="space-y-6 text-left">
          {/* Reviews Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-6 flex flex-col justify-center items-center text-center shadow-sm">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Average Rating</p>
              <div className="text-4xl font-extrabold text-[#1F2B6D] dark:text-white flex items-center gap-2 my-2">
                <span>{displayedAvgRating}</span>
                <Star className={cn('h-8 w-8', hasRatings ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-700')} />
              </div>
              <p className="text-xs text-slate-500">
                {hasRatings ? (
                  <>Based on <strong>{ratingBreakdown.totalRatings}</strong> driver review{ratingBreakdown.totalRatings === 1 ? '' : 's'}</>
                ) : (
                  'No reviews received yet'
                )}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-6 lg:col-span-2 space-y-2 shadow-sm">
              <h4 className="text-xs font-bold text-[#1F2B6D] dark:text-white uppercase tracking-wider mb-2">Rating Distribution</h4>
              {[
                { star: 5, count: ratingBreakdown.star5 },
                { star: 4, count: ratingBreakdown.star4 },
                { star: 3, count: ratingBreakdown.star3 },
                { star: 2, count: ratingBreakdown.star2 },
                { star: 1, count: ratingBreakdown.star1 },
              ].map(({ star, count }) => {
                const pct = ratingBreakdown.totalRatings > 0 ? Math.round((count / ratingBreakdown.totalRatings) * 100) : 0
                return (
                  <div key={star} className="flex items-center gap-3 text-xs">
                    <span className="w-8 font-bold flex items-center gap-0.5">{star} ★</span>
                    <div className="flex-grow h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-12 text-right text-slate-500 font-medium">
                      {count} ({pct}%)
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Feedback Received */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#1F2B6D]/[0.08] dark:bg-slate-800 flex items-center justify-center text-[#1F2B6D] dark:text-[#8B93D9]">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                    Feedback Received from Drivers ({driverFeedbackReceived.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Ratings and comments submitted by drivers</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {driverFeedbackReceived.length === 0 ? (
                <p className="text-slate-400 py-6 text-center text-xs">No driver reviews received yet.</p>
              ) : (
                driverFeedbackReceived.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          {review.driverName || 'Driver'}
                        </span>
                        {review.driverPhone && (
                          <span className="text-[10px] text-muted-foreground font-mono">({review.driverPhone})</span>
                        )}
                        <span className="font-mono text-[10px] text-slate-400">Ride #{review.rideCode}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                        <span>{review.rating}</span>
                        <Star className="h-3.5 w-3.5 fill-amber-500" />
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">"{review.comment}"</p>
                    )}
                    <p className="text-[10px] text-slate-400">
                      {new Date(review.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Feedback Given by Customer */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#1F2B6D]/[0.08] dark:bg-slate-800 flex items-center justify-center text-[#1F2B6D] dark:text-[#8B93D9]">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                    Feedback Given by Customer ({customerFeedbackGiven.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Reviews and comments submitted by this customer</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {customerFeedbackGiven.length === 0 ? (
                <p className="text-slate-400 py-6 text-center text-xs">No feedback submitted for drivers yet.</p>
              ) : (
                customerFeedbackGiven.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-700 dark:text-slate-300 font-bold">
                        Ride #{review.rideCode} {review.driverName ? `• Driver: ${review.driverName}` : ''}
                      </span>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                        <span>{review.rating}</span>
                        <Star className="h-3.5 w-3.5 fill-amber-500" />
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">"{review.comment}"</p>
                    )}
                    <p className="text-[10px] text-slate-400">
                      {new Date(review.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: SUPPORT TICKETS & COMPLAINTS ───────────────────────────── */}
      {activeTab === 'support' && (
        <div className="space-y-4 text-left">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#1F2B6D]/[0.08] dark:bg-slate-800 flex items-center justify-center text-[#1F2B6D] dark:text-[#8B93D9]">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                    Customer Support & Complaints Log ({supportTickets.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Disputes, ride fare inquiries, and support requests filed by this customer</p>
                </div>
              </div>
            </div>
            <div className="p-1">
              <DataTable
                columns={supportColumns}
                data={supportTickets}
                selectable={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: COMPLIANCE & SAFETY AUDIT ──────────────────────────────── */}
      {activeTab === 'timeline' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden text-left">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[#1F2B6D]/[0.08] dark:bg-slate-800 flex items-center justify-center text-[#1F2B6D] dark:text-[#8B93D9]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                  Compliance Log & Safety Audit Trail ({timeline.length || activityEvents.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Operational account changes, verification activities, and auditor remarks</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="relative border-l-2 border-[#1F2B6D] pl-4 space-y-4 ml-2">
              {timeline.length === 0 ? (
                activityEvents.map((evt, idx) => (
                  <div key={idx} className="space-y-1 relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 bg-[#1F2B6D]" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-150">{evt.title}</p>
                    <p className="text-[10px] text-slate-400">{evt.date}</p>
                  </div>
                ))
              ) : (
                timeline.map((evt) => (
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
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
            activate: activateRider,
          }

          actionMap[statusAction](
            { id: rider.id, notes: statusNotes || undefined },
            {
              onSuccess: () => {
                showSuccess(
                  'Customer account updated',
                  `Account marked as ${statusAction === 'activate' ? 'active' : statusAction}.`,
                )
                setIsStatusModalOpen(false)
                setStatusNotes('')
                setStatusAction(null)
                void refetch()
              },
              onError: (err) => {
                showError(
                  'Could not update customer account',
                  err instanceof Error ? err.message : 'Request failed',
                )
              },
            },
          )
        }}
        title={`${statusAction === 'suspend' ? 'Suspend' : statusAction === 'block' ? 'Block' : 'Activate'} Customer`}
        description={
          <div className="space-y-4 w-full text-left">
            <p className="text-xs text-muted-foreground">
              Provide compliance comments or reasons for updating this customer's account permissions.
            </p>
            <textarea
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="Enter remarks..."
              className="w-full min-h-[80px] p-2.5 rounded-lg border border-border bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-[#1F2B6D] focus:outline-none"
            />
          </div>
        }
        confirmText="Confirm Action"
        variant={statusAction === 'block' ? 'danger' : 'warning'}
        loading={isSuspending || isBlocking || isActivating}
      />

      {/* Edit Customer Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-[#1F2B6D] dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#1F2B6D] dark:text-[#8B93D9]" />
                <span>Customer Profile Details</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  defaultValue={rider.fullName}
                  readOnly
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    defaultValue={rider.mobileNumber}
                    readOnly
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Email Address</label>
                  <input
                    type="text"
                    defaultValue={rider.email || '—'}
                    readOnly
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Date of Birth</label>
                  <input
                    type="text"
                    defaultValue={formatDob(rider.dateOfBirth)}
                    readOnly
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Gender</label>
                  <input
                    type="text"
                    defaultValue={formatGender(rider.gender)}
                    readOnly
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400 pt-2 italic">
                Note: Customer identity and phone records are authenticated directly through OTP verification on the customer mobile app.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                onClick={() => setIsEditModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

export default RiderDetailsPage
