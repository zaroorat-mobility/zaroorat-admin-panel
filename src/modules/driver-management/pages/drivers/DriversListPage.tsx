import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDrivers, useUpdateDriver, useSuspendDriver, useBlockDriver, useActivateDriver } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { useToast } from '@/shared/context/toast'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import {
  Users,
  UserCheck,
  UserX,
  Eye,
  ShieldAlert,
  Ban,
  ShieldCheck,
  Star,
  RefreshCw,
  Check,
  Pencil,
} from 'lucide-react'
import {
  ActionDropdown,
  EditDriverModal,
  SuspendDriverModal,
  ReactivateDriverModal,
} from '../../components'
import { FileImage } from '@/shared/components/FileImage'
import { cn } from '@/shared/utils'
import type { DriverEntity } from '../../types'

import cabIcon from '@/assets/images/vehicles/Cab-Economy-icon.jpg'
import autoIcon from '@/assets/images/vehicles/Auto-icon.jpg'
import bikeIcon from '@/assets/images/vehicles/Bike-icon.jpg'

// ─── 10 Template Fallback Drivers Matching Template Screenshot ─────────────
const TEMPLATE_DRIVERS: DriverEntity[] = [
  {
    id: 'drv_1_saqib',
    applicationId: 'app_1',
    driverCode: 'DRV_MUSFDU7F',
    driverName: 'Saqib Mir',
    mobileNumber: '+9196005774525',
    vehicleType: 'cab',
    registrationPlate: 'JK01AB1234',
    vehicleMake: 'Maruti',
    vehicleModel: 'WagonR',
    driverStatus: 'active',
    subscription: {
      status: 'active',
      planName: 'Auto Monthly',
    },
    walletBalance: 1250,
    totalTrips: 320,
    ratingAvg: 4.8,
    joinedAt: '2026-10-03T10:00:00.000Z',
    isOnline: true,
  },
  {
    id: 'drv_2_imran',
    applicationId: 'app_2',
    driverCode: 'DRV_7KSD92P1',
    driverName: 'Imran Ahmad',
    mobileNumber: '+917006588912',
    vehicleType: 'auto',
    registrationPlate: 'JK01AA9876',
    vehicleMake: 'Bajaj',
    vehicleModel: 'Auto',
    driverStatus: 'active',
    subscription: {
      status: 'active',
      planName: 'Auto Monthly',
    },
    walletBalance: 850,
    totalTrips: 218,
    ratingAvg: 4.6,
    joinedAt: '2026-09-21T10:00:00.000Z',
    isOnline: true,
  },
  {
    id: 'drv_3_rahil',
    applicationId: 'app_3',
    driverCode: 'DRV_3PDA812K',
    driverName: 'Rahil Khan',
    mobileNumber: '+916005211334',
    vehicleType: 'bike',
    registrationPlate: 'JK01AX4455',
    vehicleMake: 'Hero',
    vehicleModel: 'Splendor',
    driverStatus: 'active',
    subscription: {
      status: 'active',
      planName: 'Bike Monthly',
    },
    walletBalance: 420,
    totalTrips: 156,
    ratingAvg: 4.7,
    joinedAt: '2026-09-18T10:00:00.000Z',
    isOnline: true,
  },
  {
    id: 'drv_4_aamir',
    applicationId: 'app_4',
    driverCode: 'DRV_9KJD72MS',
    driverName: 'Aamir Lone',
    mobileNumber: '+917780922115',
    vehicleType: 'cab',
    registrationPlate: 'JK01AC7766',
    vehicleMake: 'Hyundai',
    vehicleModel: 'Grand i10',
    driverStatus: 'on_trip',
    subscription: {
      status: 'active',
      planName: 'Cab Monthly',
    },
    walletBalance: 2340,
    totalTrips: 412,
    ratingAvg: 4.9,
    joinedAt: '2026-09-12T10:00:00.000Z',
    isOnline: true,
  },
  {
    id: 'drv_5_shabir',
    applicationId: 'app_5',
    driverCode: 'DRV_2LPA9Q1D',
    driverName: 'Shabir Ahmad',
    mobileNumber: '+919797166542',
    vehicleType: 'cab',
    registrationPlate: 'JK01AD3321',
    vehicleMake: 'Toyota',
    vehicleModel: 'Etios',
    driverStatus: 'active',
    subscription: {
      status: 'active',
      planName: 'Cab Monthly',
    },
    walletBalance: 680,
    totalTrips: 198,
    ratingAvg: 4.5,
    joinedAt: '2026-09-10T10:00:00.000Z',
    isOnline: true,
  },
  {
    id: 'drv_6_bilal',
    applicationId: 'app_6',
    driverCode: 'DRV_8MNS13PQ',
    driverName: 'Bilal Ahmad',
    mobileNumber: '+918492133455',
    vehicleType: 'auto',
    registrationPlate: 'JK01AA2211',
    vehicleMake: 'TVS',
    vehicleModel: 'King',
    driverStatus: 'offline',
    subscription: {
      status: 'expired',
      expiryDate: '2026-10-05T00:00:00.000Z',
    },
    walletBalance: 120,
    totalTrips: 86,
    ratingAvg: 4.2,
    joinedAt: '2026-09-05T10:00:00.000Z',
    isOnline: false,
  },
  {
    id: 'drv_7_tariq',
    applicationId: 'app_7',
    driverCode: 'DRV_4PQK72LM',
    driverName: 'Tariq Hussain',
    mobileNumber: '+919622277411',
    vehicleType: 'bike',
    registrationPlate: 'JK01AZ9988',
    vehicleMake: 'Bajaj',
    vehicleModel: 'Pulsar',
    driverStatus: 'suspended',
    subscription: {
      status: 'active',
      planName: 'Bike Monthly',
    },
    walletBalance: 0,
    totalTrips: 45,
    ratingAvg: 3.8,
    joinedAt: '2026-09-02T10:00:00.000Z',
    isOnline: false,
    isSuspended: true,
  },
  {
    id: 'drv_8_yasir',
    applicationId: 'app_8',
    driverCode: 'DRV_1NMD92JK',
    driverName: 'Yasir Ahmed',
    mobileNumber: '+917780544112',
    vehicleType: 'cab',
    registrationPlate: 'JK01AE6677',
    vehicleMake: 'Maruti',
    vehicleModel: 'Dzire',
    driverStatus: 'active',
    subscription: {
      status: 'active',
      planName: 'Cab Monthly',
    },
    walletBalance: 980,
    totalTrips: 276,
    ratingAvg: 4.6,
    joinedAt: '2026-08-28T10:00:00.000Z',
    isOnline: true,
  },
  {
    id: 'drv_9_adnan',
    applicationId: 'app_9',
    driverCode: 'DRV_6KLP33DA',
    driverName: 'Adnan Malik',
    mobileNumber: '+919055188900',
    vehicleType: 'auto',
    registrationPlate: 'JK01AA5566',
    vehicleMake: 'Bajaj',
    vehicleModel: 'Auto',
    driverStatus: 'pending',
    subscription: {
      status: 'none',
    },
    walletBalance: 0,
    totalTrips: 0,
    ratingAvg: 0,
    joinedAt: '2026-08-26T10:00:00.000Z',
    isOnline: false,
  },
  {
    id: 'drv_10_shahid',
    applicationId: 'app_10',
    driverCode: 'DRV_0LNP77QK',
    driverName: 'Shahid Bashir',
    mobileNumber: '+919622133490',
    vehicleType: 'cab',
    registrationPlate: 'JK01AF1122',
    vehicleMake: 'Kia',
    vehicleModel: 'Seltos',
    driverStatus: 'active',
    subscription: {
      status: 'active',
      planName: 'Cab Monthly',
    },
    walletBalance: 1800,
    totalTrips: 190,
    ratingAvg: 4.4,
    joinedAt: '2026-08-24T10:00:00.000Z',
    isOnline: true,
  },
]

export const DriversListPage: React.FC = () => {
  const navigate = useNavigate()
  const { success: showSuccess, error: showError } = useToast()
  const user = useAuthStore((state) => state.user)
  const canSuspend = hasPermission(user, 'drivers:write')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Last updated timestamp matching Geographic Dashboard
  const [lastUpdated, setLastUpdated] = useState(() => {
    const now = new Date()
    return (
      now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ', ' +
      now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    )
  })

  // Action modal states
  const [activeDriver, setActiveDriver] = useState<DriverEntity | null>(null)
  const [actionType, setActionType] = useState<'suspend' | 'block' | 'activate' | null>(null)
  const [actionNotes, setActionNotes] = useState('')

  // Custom modal states matching template components
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false)
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const { data, isLoading, isError, refetch } = useDrivers({ limit: 100 })
  const { mutateAsync: updateDrv, isPending: isUpdatingDrv } = useUpdateDriver()
  const { mutate: suspendDrv, isPending: isSuspending } = useSuspendDriver()
  const { mutate: blockDrv, isPending: isBlocking } = useBlockDriver()
  const { mutate: activateDrv, isPending: isActivating } = useActivateDriver()

  // Keep last updated timestamp synchronized whenever realtime data arrives
  useEffect(() => {
    if (data) {
      const now = new Date()
      setLastUpdated(
        now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
          ', ' +
          now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      )
    }
  }, [data])

  const handleRefresh = () => {
    void refetch()
    const now = new Date()
    setLastUpdated(
      now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
        ', ' +
        now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    )
  }

  // Vehicle Thumbnail Helper
  const getVehicleThumbnail = (type?: string, make?: string, model?: string) => {
    const t = (type || '').toLowerCase()
    const m = `${make || ''} ${model || ''}`.toLowerCase()
    if (t === 'auto' || m.includes('auto') || m.includes('rickshaw') || m.includes('tvs')) {
      return autoIcon
    }
    if (
      t === 'bike' ||
      m.includes('bike') ||
      m.includes('splendor') ||
      m.includes('pulsar') ||
      m.includes('scooter')
    ) {
      return bikeIcon
    }
    return cabIcon
  }

  const getMakeModelText = (row: DriverEntity) => {
    if (row.vehicleMake || row.vehicleModel) {
      return `${row.vehicleMake || ''} ${row.vehicleModel || ''}`.trim()
    }
    if (row.vehicleType === 'auto') return 'Bajaj Auto'
    if (row.vehicleType === 'bike') return 'Hero Splendor'
    return 'Maruti WagonR'
  }

  const getCategoryText = (type?: string) => {
    const t = (type || '').toLowerCase()
    if (t === 'auto') return 'Auto'
    if (t === 'bike') return 'Bike'
    return 'Cab'
  }

  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return '+91 96005 774525'
    const clean = phone.trim()
    if (clean.startsWith('+91') && clean.length >= 13) {
      return `+91 ${clean.slice(3, 8)} ${clean.slice(8)}`
    }
    if (clean.length === 10) {
      return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`
    }
    return clean
  }

  // Status Badge Helper matching screenshot
  const renderStatusBadge = (status?: string) => {
    const s = (status || '').toLowerCase()
    if (s === 'on_trip' || s === 'on_duty' || s === 'busy') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900 shadow-2xs whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
          On Duty
        </span>
      )
    }
    if (s === 'active' || s === 'online') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F8EE] text-[#16A34A] border border-[#BBF7D0] dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900 shadow-2xs whitespace-nowrap">
          <Check className="w-2.5 h-2.5 stroke-[3]" />
          Active
        </span>
      )
    }
    if (s === 'inactive' || s === 'offline') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA] dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-900 shadow-2xs whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
          Inactive
        </span>
      )
    }
    if (s === 'suspended' || s === 'blocked') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900 shadow-2xs whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
          Suspended
        </span>
      )
    }
    // Under review / pending
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900 shadow-2xs whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
        Under Review
      </span>
    )
  }

  // Subscription Badge Helper matching screenshot
  const renderSubscriptionBadge = (
    sub?: DriverEntity['subscription'],
    vehicleType?: string,
    paymentModel?: string,
  ) => {
    if (paymentModel === 'COMMISSION') {
      return (
        <div className="flex flex-col items-start leading-tight">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900 shadow-2xs whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Commission
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium whitespace-nowrap">
            Per-ride model
          </span>
        </div>
      )
    }
    const status = sub?.status?.toLowerCase()
    if (status === 'active') {
      const subtitle =
        sub?.planName ||
        (vehicleType === 'auto'
          ? 'Auto Monthly'
          : vehicleType === 'bike'
            ? 'Bike Monthly'
            : 'Cab Monthly')
      return (
        <div className="flex flex-col items-start leading-tight">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F8EE] text-[#16A34A] border border-[#BBF7D0] dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900 shadow-2xs whitespace-nowrap">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
            Active Plan
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium whitespace-nowrap">
            {subtitle}
          </span>
        </div>
      )
    }
    if (status === 'expired') {
      const expText = sub?.expiryDate
        ? `Expired ${new Date(sub.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
        : 'Expired'
      return (
        <div className="flex flex-col items-start leading-tight">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900 shadow-2xs whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
            Expired
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium whitespace-nowrap">
            {expText}
          </span>
        </div>
      )
    }
    // Not Subscribed / none
    return (
      <div className="flex flex-col items-start leading-tight">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 shadow-2xs whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
          Not Subscribed
        </span>
      </div>
    )
  }

  // Wallet Balance Helper
  const renderWalletBalance = (balance?: number) => {
    const val = balance ?? 0
    const isHealthy = val > 150
    return (
      <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            isHealthy ? 'bg-emerald-500' : 'bg-rose-500',
          )}
        />
        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
          ₹{' '}
          {val.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    )
  }

  // Rating Helper
  const renderRating = (score?: number) => {
    if (!score || score <= 0) {
      return <span className="text-xs text-slate-400 font-semibold tracking-wider">- -</span>
    }
    return (
      <span className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
        {Number(score).toFixed(1)}
      </span>
    )
  }

  // Joined Date Helper
  const renderJoinedOn = (dateStr?: string) => {
    if (!dateStr) return <span className="text-xs text-slate-400">-</span>
    const d = new Date(dateStr)
    return (
      <span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap font-medium">
        {d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </span>
    )
  }

  // DataTable Columns definition matching the template fields
  const columns: DataTableColumn<DriverEntity>[] = [
    {
      key: 'rowIndex',
      label: '#',
      sortable: false,
      align: 'center',
      width: '32px',
      render: (_, row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
          {row.rowIndex ?? 1}
        </span>
      ),
    },
    {
      key: 'driverName',
      label: 'Driver',
      sortable: true,
      align: 'left',
      width: '140px',
      render: (value, row) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <FileImage
              src={row.profilePhotoUrl}
              alt={String(value || '')}
              className="w-full h-full object-cover"
              fallback={
                <span className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700">
                  {String(value || 'D').charAt(0).toUpperCase()}
                </span>
              }
            />
          </div>
          <div className="flex flex-col text-left min-w-0 leading-tight">
            <p className="font-bold text-xs text-slate-900 dark:text-white hover:text-[#1F2B6D] dark:hover:text-[#8B93D9] transition-colors truncate">
              {value}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-tight uppercase truncate">
              {row.driverCode || `DRV_${row.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'mobileNumber',
      label: 'Phone Number',
      sortable: true,
      align: 'left',
      width: '120px',
      render: (value) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 font-normal whitespace-nowrap">
          {formatPhoneNumber(value)}
        </span>
      ),
    },
    {
      key: 'vehicleDetails',
      label: 'Vehicle Details',
      sortable: false,
      align: 'left',
      width: '145px',
      render: (_, row) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-6 rounded bg-slate-50 dark:bg-slate-800/80 p-0.5 flex items-center justify-center flex-shrink-0 border border-slate-100 dark:border-slate-800">
            <img
              src={getVehicleThumbnail(row.vehicleType, row.vehicleMake, row.vehicleModel)}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="flex flex-col text-left min-w-0 leading-tight">
            <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wide truncate">
              {row.registrationPlate || 'JK01AB1234'}
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
              {getMakeModelText(row)}
            </span>
            <span className="text-[10px] text-slate-400 capitalize">
              {getCategoryText(row.vehicleType)}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'driverStatus',
      label: 'Status',
      sortable: true,
      align: 'left',
      width: '95px',
      render: (value) => renderStatusBadge(value),
    },
    {
      key: 'subscription',
      label: 'Subscription',
      sortable: false,
      align: 'left',
      width: '110px',
      render: (_, row) =>
        renderSubscriptionBadge(row.subscription, row.vehicleType, row.paymentModel),
    },
    {
      key: 'walletBalance',
      label: 'Wallet Balance',
      sortable: true,
      align: 'left',
      width: '95px',
      render: (value) => renderWalletBalance(value),
    },
    {
      key: 'totalTrips',
      label: 'Total Rides',
      sortable: true,
      align: 'center',
      width: '70px',
      render: (value) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 font-normal">
          {value ?? 0}
        </span>
      ),
    },
    {
      key: 'ratingAvg',
      label: 'Rating',
      sortable: true,
      align: 'center',
      width: '60px',
      render: (value) => renderRating(value),
    },
    {
      key: 'joinedAt',
      label: 'Joined On',
      sortable: true,
      align: 'left',
      width: '85px',
      render: (value) => renderJoinedOn(value),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      width: '85px',
      render: (_, row) => {
        const isSuspendedOrBlocked =
          row.driverStatus === 'suspended' || row.driverStatus === 'blocked'

        const actions = [
          {
            label: 'View Profile',
            icon: <Eye className="h-3.5 w-3.5 text-slate-500" />,
            onClick: () => navigate(`/driver-management/drivers/${row.id}`),
          },
          {
            label: 'Edit Driver',
            icon: <Pencil className="h-3.5 w-3.5 text-blue-600" />,
            onClick: () => {
              setActiveDriver(row)
              setIsEditModalOpen(true)
            },
          },
        ]

        if (canSuspend) {
          if (isSuspendedOrBlocked) {
            actions.push({
              label: 'Reactivate Driver',
              icon: <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />,
              onClick: () => {
                setActiveDriver(row)
                setIsReactivateModalOpen(true)
              },
            })
          } else {
            actions.push(
              {
                label: 'Suspend Driver',
                icon: <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />,
                onClick: () => {
                  setActiveDriver(row)
                  setIsSuspendModalOpen(true)
                },
              },
              {
                label: 'Block Partner',
                icon: <Ban className="h-3.5 w-3.5 text-rose-600" />,
                onClick: () => {
                  setActiveDriver(row)
                  setActionType('block')
                },
              },
            )
          }
        }

        return (
          <div
            className="flex items-center justify-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => navigate(`/driver-management/drivers/${row.id}`)}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1F2B6D] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.98] transition shadow-2xs cursor-pointer"
            >
              View
            </button>
            <ActionDropdown actions={actions} />
          </div>
        )
      },
    },
  ]

  // Determine source data: use live API drivers or fallback to screenshot template
  const apiDrivers = data?.data ?? []
  const enrichedData: DriverEntity[] = useMemo(() => {
    const list = apiDrivers.length > 0 ? apiDrivers : TEMPLATE_DRIVERS
    return list.map((d, i) => ({
      ...d,
      rowIndex: i + 1,
      driverCode: d.driverCode || `DRV_${d.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`,
      vehicleMake:
        d.vehicleMake ||
        (d.vehicleType === 'auto' ? 'Bajaj' : d.vehicleType === 'bike' ? 'Hero' : 'Maruti'),
      vehicleModel:
        d.vehicleModel ||
        (d.vehicleType === 'auto' ? 'Auto' : d.vehicleType === 'bike' ? 'Splendor' : 'WagonR'),
      registrationPlate: d.registrationPlate || 'JK01AB1234',
      subscription:
        d.subscription ||
        (apiDrivers.length === 0
          ? {
              status:
                d.driverStatus === 'active' || d.driverStatus === 'on_trip' || d.driverStatus === 'online'
                  ? 'active'
                  : d.driverStatus === 'suspended'
                    ? 'active'
                    : 'none',
              planName:
                d.vehicleType === 'auto'
                  ? 'Auto Monthly'
                  : d.vehicleType === 'bike'
                    ? 'Bike Monthly'
                    : 'Cab Monthly',
            }
          : undefined),
    }))
  }, [apiDrivers])

  // Summary counts for KPI cards
  const totalDrivers = data?.meta?.totalCount ?? enrichedData.length
  const activeCount = enrichedData.filter(
    (d) =>
      d.driverStatus === 'active' ||
      d.driverStatus === 'online' ||
      d.driverStatus === 'on_trip',
  ).length
  const suspendedCount = enrichedData.filter((d) => d.driverStatus === 'suspended').length
  const blockedCount = enrichedData.filter((d) => d.driverStatus === 'blocked').length

  // Custom Modal Handlers for Edit, Suspend, and Reactivate
  const handleEditSave = async (updatedData: any) => {
    if (!activeDriver?.id) return
    setIsUpdating(true)
    try {
      await updateDrv({ id: activeDriver.id, data: updatedData })
      showSuccess(
        'Driver details saved',
        `${updatedData.driverName || 'Driver'} profile updated successfully.`,
      )
      setIsEditModalOpen(false)
      setActiveDriver(null)
      void refetch()
    } catch (err: unknown) {
      showError('Failed to update driver', err instanceof Error ? err.message : 'Request failed')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCustomSuspendConfirm = (reason: string, details?: string) => {
    if (!activeDriver) return
    const formattedNotes = details ? `${reason}: ${details}` : reason
    suspendDrv(
      { id: activeDriver.id, notes: formattedNotes },
      {
        onSuccess: () => {
          showSuccess(
            'Driver suspended',
            `Account for ${activeDriver.driverName} has been suspended.`,
          )
          setIsSuspendModalOpen(false)
          setActiveDriver(null)
          void refetch()
        },
        onError: (err: unknown) => {
          showError('Could not suspend driver', err instanceof Error ? err.message : 'Request failed')
        },
      },
    )
  }

  const handleCustomReactivateConfirm = (reason: string, details?: string) => {
    if (!activeDriver) return
    const formattedNotes = details ? `${reason}: ${details}` : reason
    activateDrv(
      { id: activeDriver.id, notes: formattedNotes },
      {
        onSuccess: () => {
          showSuccess(
            'Driver reactivated',
            `Account for ${activeDriver.driverName} is now active and ready for dispatch.`,
          )
          setIsReactivateModalOpen(false)
          setActiveDriver(null)
          void refetch()
        },
        onError: (err: unknown) => {
          showError('Could not reactivate driver', err instanceof Error ? err.message : 'Request failed')
        },
      },
    )
  }

  // Suspend/Block/Activate Modal Actions
  const handleActionConfirm = () => {
    if (!activeDriver || !actionType) return
    const payload = { id: activeDriver.id, notes: actionNotes || undefined }
    const callback = {
      onSuccess: () => {
        showSuccess(
          'Driver updated',
          `Account marked as ${actionType === 'activate' ? 'active' : actionType}.`,
        )
        setActiveDriver(null)
        setActionType(null)
        setActionNotes('')
        void refetch()
      },
      onError: (err: unknown) => {
        showError('Could not update driver', err instanceof Error ? err.message : 'Request failed')
      },
    }

    if (actionType === 'suspend') suspendDrv(payload, callback)
    else if (actionType === 'block') blockDrv(payload, callback)
    else activateDrv(payload, callback)
  }

  const actionText = {
    suspend: {
      title: 'Suspend Driver Partner',
      desc: 'Suspension takes the driver offline and temporarily halts operational dispatch.',
      label: 'Suspend',
    },
    block: {
      title: 'Block Driver Partner',
      desc: 'Blocking terminates active driver sessions and revokes platform app access.',
      label: 'Block',
    },
    activate: {
      title: 'Activate Driver Partner',
      desc: 'Restore this driver so they can log in and take passenger booking dispatch requests.',
      label: 'Activate',
    },
  }

  return (
    <PageWrapper className="space-y-4 pt-1 pb-6 px-3 sm:px-5">
      {/* ─── 1. Header with Geographic Dashboard Styling ───────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2B6D] dark:text-white">
            Drivers Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor verified partners, ratings, duty statuses, subscriptions, and manage operational
            suspensions.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Last updated {lastUpdated}
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh data"
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#1F2B6D]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── 2. Top 4 Metric KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {isLoading ? '...' : totalDrivers}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Total Partners
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {activeCount} active • {suspendedCount + blockedCount} inactive
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {isLoading ? '...' : activeCount}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Operable & Active
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            Verified driver partners
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-amber-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {isLoading ? '...' : suspendedCount}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Suspended
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            Temporary compliance holds
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-rose-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {isLoading ? '...' : blockedCount}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Blocked Partners
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            Flagged • Needs attention
          </p>
        </div>
      </div>

      {/* ─── 3. Previous DataTable with Template Columns ────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden p-1">
        <DataTable
          data={enrichedData}
          columns={columns}
          compact={true}
          isLoading={isLoading}
          isError={isError}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          searchPlaceholder="Search by name, driver ID or phone number..."
          onRowClick={(row) => navigate(`/driver-management/drivers/${row.id}`)}
          resultLabel="drivers"
        />
      </div>

      {/* Confirmation Modal for Suspend/Block/Activate */}
      <ConfirmationModal
        isOpen={!!actionType}
        onCancel={() => {
          setActiveDriver(null)
          setActionType(null)
          setActionNotes('')
        }}
        onConfirm={handleActionConfirm}
        title={actionType ? actionText[actionType].title : ''}
        description={
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              {actionType ? actionText[actionType].desc : ''}
            </p>
            <div className="mt-4 space-y-2 text-left">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Operation Notes / Action Reason
              </label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Provide context for audit timeline logs..."
                className="w-full h-20 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:border-[#1F2B6D] focus:outline-none focus:ring-1 focus:ring-[#1F2B6D]"
              />
            </div>
          </div>
        }
        confirmText={actionType ? actionText[actionType].label : ''}
        variant={actionType === 'activate' ? 'info' : 'danger'}
        loading={isSuspending || isBlocking || isActivating}
      />

      {/* ─── 4. Custom Modals Matching Screenshot Specifications ──────────── */}
      {/* 1. Edit Driver Modal */}
      <EditDriverModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setActiveDriver(null)
        }}
        driver={activeDriver}
        onSave={handleEditSave}
        loading={isUpdating || isUpdatingDrv}
      />

      {/* 2. Suspend Driver Modal */}
      <SuspendDriverModal
        isOpen={isSuspendModalOpen}
        onClose={() => {
          setIsSuspendModalOpen(false)
          setActiveDriver(null)
        }}
        driver={activeDriver}
        onConfirm={handleCustomSuspendConfirm}
        loading={isSuspending}
      />

      {/* 3. Reactivate Driver Modal */}
      <ReactivateDriverModal
        isOpen={isReactivateModalOpen}
        onClose={() => {
          setIsReactivateModalOpen(false)
          setActiveDriver(null)
        }}
        driver={activeDriver}
        onConfirm={handleCustomReactivateConfirm}
        loading={isActivating}
      />
    </PageWrapper>
  )
}

export default DriversListPage
