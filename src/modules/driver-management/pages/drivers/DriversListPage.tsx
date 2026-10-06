import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDrivers, useSuspendDriver, useBlockDriver, useActivateDriver } from '../../hooks'
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
} from 'lucide-react'
import { ActionDropdown } from '../../components'
import { FileImage } from '@/shared/components/FileImage'
import { cn } from '@/shared/utils'
import type { DriverEntity } from '../../types'

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

  const [activeDriver, setActiveDriver] = useState<DriverEntity | null>(null)
  const [actionType, setActionType] = useState<'suspend' | 'block' | 'activate' | null>(null)
  const [actionNotes, setActionNotes] = useState('')

  const { data, isLoading, isError, refetch } = useDrivers({ limit: 100 })
  const { mutate: suspendDrv, isPending: isSuspending } = useSuspendDriver()
  const { mutate: blockDrv, isPending: isBlocking } = useBlockDriver()
  const { mutate: activateDrv, isPending: isActivating } = useActivateDriver()

  const handleRefresh = () => {
    void refetch()
    const now = new Date()
    setLastUpdated(
      now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ', ' +
      now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    )
  }

  const columns: DataTableColumn<DriverEntity>[] = [
    {
      key: 'driverName',
      label: 'Driver Name',
      sortable: true,
      align: 'left',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#1F2B6D] text-white flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0 shadow-sm">
            <FileImage
              src={row.profilePhotoUrl}
              alt=""
              className="h-full w-full object-cover"
              fallback={
                <span className="text-xs font-bold text-white">
                  {String(value || '?').charAt(0).toUpperCase()}
                </span>
              }
            />
          </div>
          <div className="flex flex-col text-left min-w-0">
            <p className="font-bold text-xs text-slate-800 dark:text-white hover:text-[#1F2B6D] dark:hover:text-[#8B93D9] transition-colors truncate">
              {value}
            </p>
            <p className="text-[10px] text-slate-400 font-mono truncate">{row.mobileNumber}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'vehicleType',
      label: 'Vehicle Class',
      sortable: true,
      render: (value, row) => (
        <div>
          <span className="capitalize font-semibold text-xs text-slate-700 dark:text-slate-300">{value}</span>
          {row.registrationPlate && (
            <p className="text-[10px] text-[#1F2B6D] dark:text-[#8B93D9] uppercase font-mono tracking-wider font-bold mt-0.5">
              {row.registrationPlate}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'driverStatus',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const isOnline = value === 'active' || value === 'online' || value === 'on_trip'
        if (isOnline) {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {value ? value.replace('_', ' ').charAt(0).toUpperCase() + value.replace('_', ' ').slice(1) : 'Active'}
            </span>
          )
        }
        if (value === 'suspended') {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Suspended
            </span>
          )
        }
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-500 dark:text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {value ? value.replace('_', ' ').charAt(0).toUpperCase() + value.replace('_', ' ').slice(1) : 'Blocked'}
          </span>
        )
      },
    },
    {
      key: 'ratingAvg',
      label: 'Rating',
      sortable: true,
      render: (value) => {
        const hasScore = typeof value === 'number' && value > 0
        return (
          <span className="inline-flex items-center justify-center gap-1 font-bold text-xs text-slate-700 dark:text-slate-200">
            <Star className={cn("h-3.5 w-3.5", hasScore ? "fill-amber-400 text-amber-500" : "text-slate-300 dark:text-slate-600")} />
            {hasScore ? Number(value).toFixed(1) : '—'}
          </span>
        )
      },
    },
    {
      key: 'totalTrips',
      label: 'Total Trips',
      sortable: true,
      render: (value) => (
        <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">{value || 0}</span>
      ),
    },
    {
      key: 'joinedAt',
      label: 'Joined Date',
      sortable: true,
      render: (value) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {new Date(value).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      render: (_, row) => {
        const isSuspendedOrBlocked =
          row.driverStatus === 'suspended' || row.driverStatus === 'blocked'
        const actions = [
          {
            label: 'View Profile',
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/driver-management/drivers/${row.id}`),
          },
        ]

        if (canSuspend) {
          if (isSuspendedOrBlocked) {
            actions.push({
              label: 'Activate Partner',
              icon: <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />,
              onClick: () => {
                setActiveDriver(row)
                setActionType('activate')
              },
            })
          } else {
            actions.push(
              {
                label: 'Suspend Partner',
                icon: <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />,
                onClick: () => {
                  setActiveDriver(row)
                  setActionType('suspend')
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
          <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => navigate(`/driver-management/drivers/${row.id}`)}
              className="px-3 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-md font-semibold text-slate-700 dark:text-slate-300 hover:border-[#1F2B6D] hover:text-[#1F2B6D] dark:hover:border-[#8B93D9] dark:hover:text-[#8B93D9] hover:bg-[#1F2B6D]/5 transition shadow-2xs cursor-pointer"
            >
              Manage
            </button>
            <ActionDropdown actions={actions} />
          </div>
        )
      },
    },
  ]

  const activeData = data?.data ?? []
  const totalDrivers = data?.meta.totalCount ?? activeData.length
  const activeCount = activeData.filter(
    (d) =>
      d.driverStatus === 'active' ||
      d.driverStatus === 'online' ||
      d.driverStatus === 'on_trip' ||
      d.driverStatus === 'offline',
  ).length
  const suspendedCount = activeData.filter((d) => d.driverStatus === 'suspended').length
  const blockedCount = activeData.filter((d) => d.driverStatus === 'blocked').length

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
            Monitor verified partners, ratings, duty statuses, and manage operational suspensions or blocks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Last updated {lastUpdated}
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh data"
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#1F2B6D]' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* ─── 2. Top 4 Metric KPI Cards (Geographic Dashboard Style) ────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Partners */}
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

        {/* Card 2: Operable / Active */}
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

        {/* Card 3: Suspended */}
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

        {/* Card 4: Blocked */}
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

      {/* ─── 3. Drivers Directory Table ────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden p-1">
        <DataTable
          data={activeData}
          columns={columns}
          isLoading={isLoading}
          isError={isError}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          searchPlaceholder="Search by name, driver ID or phone number..."
          onRowClick={(row) => navigate(`/driver-management/drivers/${row.id}`)}
          resultLabel="drivers"
        />
      </div>

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
            <p className="text-xs text-muted-foreground">{actionType ? actionText[actionType].desc : ''}</p>
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
    </PageWrapper>
  )
}

export default DriversListPage
