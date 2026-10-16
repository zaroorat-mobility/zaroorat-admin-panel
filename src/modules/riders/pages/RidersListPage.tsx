import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useRiders,
  useSuspendRider,
  useBlockRider,
  useActivateRider,
} from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { ActionDropdown } from '@/modules/driver-management/components/ActionDropdown'
import { useToast } from '@/shared/context/toast'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import {
  Users,
  UserCheck,
  UserMinus,
  UserX,
  Eye,
  AlertTriangle,
  Ban,
  ShieldCheck,
  Star,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/shared/utils'
import type { RiderEntity } from '../types'

export const RidersListPage: React.FC = () => {
  const navigate = useNavigate()
  const { success: showSuccess, error: showError } = useToast()
  const user = useAuthStore((state) => state.user)
  const canWrite = hasPermission(user, 'riders:write')
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

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [actionRider, setActionRider] = useState<RiderEntity | null>(null)
  const [actionType, setActionType] = useState<'suspend' | 'block' | 'activate' | null>(null)
  const [actionNotes, setActionNotes] = useState('')

  const { data, isLoading, isError, refetch } = useRiders({ limit: 100 })

  const { mutate: suspendRider, isPending: isSuspending } = useSuspendRider()
  const { mutate: blockRider, isPending: isBlocking } = useBlockRider()
  const { mutate: activateRider, isPending: isActivating } = useActivateRider()

  const riders = data?.data || []

  const totalRiders = data?.meta.totalCount ?? riders.length
  const activeCount = riders.filter((r) => r.riderStatus === 'active').length
  const suspendedCount = riders.filter((r) => r.riderStatus === 'suspended').length
  const blockedCount = riders.filter((r) => r.riderStatus === 'blocked').length

  const getInitials = (name?: string) => {
    if (!name) return 'CU'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const handleRefresh = () => {
    void refetch()
    const now = new Date()
    setLastUpdated(
      now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ', ' +
      now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    )
  }

  const handleConfirmAction = () => {
    if (!actionRider || !actionType) return

    const actionMap = {
      suspend: suspendRider,
      block: blockRider,
      activate: activateRider,
    }

    actionMap[actionType](
      { id: actionRider.id, notes: actionNotes || undefined },
      {
        onSuccess: () => {
          showSuccess(
            'Rider updated',
            `Account marked as ${actionType === 'activate' ? 'active' : actionType}.`,
          )
          setIsModalOpen(false)
          setActionNotes('')
          setActionRider(null)
          setActionType(null)
          void refetch()
        },
        onError: (err) => {
          showError(
            'Could not update rider',
            err instanceof Error ? err.message : 'Request failed',
          )
        },
      },
    )
  }

  const columns: DataTableColumn<RiderEntity>[] = [
    {
      key: 'fullName',
      label: 'Customer',
      align: 'left',
      render: (val: string, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#1F2B6D] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
            {getInitials(val)}
          </div>
          <div className="flex flex-col text-left min-w-0">
            <span className="font-bold text-xs text-slate-800 dark:text-white hover:text-[#1F2B6D] dark:hover:text-[#8B93D9] transition-colors truncate">
              {val}
            </span>
            {row.email ? (
              <span className="text-[10px] text-slate-400 truncate">{row.email}</span>
            ) : (
              <span className="text-[10px] text-slate-400 italic">No email registered</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'riderId',
      label: 'Customer ID',
      align: 'center',
      render: (val: string) => (
        <span className="font-mono text-xs font-bold text-[#1F2B6D] dark:text-[#8B93D9]">{val}</span>
      ),
    },
    {
      key: 'mobileNumber',
      label: 'Mobile No',
      align: 'center',
      render: (val: string) => (
        <span className="font-mono text-xs font-semibold text-slate-650 dark:text-slate-300">{val}</span>
      ),
    },
    {
      key: 'joinedAt',
      label: 'Registration Date',
      align: 'center',
      render: (val: string) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'totalRides',
      label: 'Total Trips',
      align: 'center',
      render: (val: number) => (
        <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">{val}</span>
      ),
    },
    {
      key: 'ratingAvg',
      label: 'Rating',
      align: 'center',
      render: (val: number) => {
        const hasScore = typeof val === 'number' && val > 0
        return (
          <span className="inline-flex items-center justify-center gap-1 font-bold text-xs text-slate-700 dark:text-slate-200">
            <Star className={cn("h-3.5 w-3.5", hasScore ? "fill-amber-400 text-amber-500" : "text-slate-300 dark:text-slate-600")} />
            {hasScore ? Number(val).toFixed(1) : '0.0'}
          </span>
        )
      },
    },
    {
      key: 'riderStatus',
      label: 'Status',
      align: 'center',
      render: (val: string) => {
        if (val === 'active') {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          )
        }
        if (val === 'suspended') {
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
            {val ? val.charAt(0).toUpperCase() + val.slice(1) : 'Blocked'}
          </span>
        )
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      render: (_, row) => {
        const dropActions = [
          {
            label: 'View Profile',
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/riders/${row.id}`),
          },
        ]

        if (canWrite && row.riderStatus === 'active') {
          dropActions.push(
            {
              label: 'Suspend Account',
              icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
              onClick: () => {
                setActionRider(row)
                setActionType('suspend')
                setIsModalOpen(true)
              },
            },
            {
              label: 'Block Account',
              icon: <Ban className="h-3.5 w-3.5 text-rose-500" />,
              onClick: () => {
                setActionRider(row)
                setActionType('block')
                setIsModalOpen(true)
              },
            },
          )
        } else if (canWrite) {
          dropActions.push({
            label: 'Reactivate Account',
            icon: <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />,
            onClick: () => {
              setActionRider(row)
              setActionType('activate')
              setIsModalOpen(true)
            },
          })
        }

        return (
          <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => navigate(`/riders/${row.id}`)}
              className="px-3 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-md font-semibold text-slate-700 dark:text-slate-300 hover:border-[#1F2B6D] hover:text-[#1F2B6D] dark:hover:border-[#8B93D9] dark:hover:text-[#8B93D9] hover:bg-[#1F2B6D]/5 transition shadow-2xs cursor-pointer"
            >
              Manage
            </button>
            <ActionDropdown actions={dropActions} />
          </div>
        )
      },
    },
  ]

  return (
    <PageWrapper className="space-y-4 pt-1 pb-6 px-3 sm:px-5">
      {/* ─── 1. Header matching Geographic Dashboard ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2B6D] dark:text-white">
            Customers Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor passenger accounts from the Customer App, trip histories, safety timelines, and account status.
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
        {/* Card 1: Total Customers */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {isLoading ? '...' : totalRiders}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Total Customers
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {activeCount} active • {suspendedCount + blockedCount} inactive
          </p>
        </div>

        {/* Card 2: Active Accounts */}
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
                  Active Accounts
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            Verified customer accounts
          </p>
        </div>

        {/* Card 3: Suspended Accounts */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-amber-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <UserMinus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {isLoading ? '...' : suspendedCount}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Suspended Accounts
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            Temporary compliance holds
          </p>
        </div>

        {/* Card 4: Blocked Accounts */}
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
                  Blocked Accounts
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            Flagged • Needs attention
          </p>
        </div>
      </div>

      {/* ─── 3. Customer Directory Data Table ──────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden p-1">
        <DataTable
          data={riders}
          columns={columns}
          isLoading={isLoading}
          isError={isError}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          searchPlaceholder="Search by customer name or mobile number..."
          onRowClick={(row) => navigate(`/riders/${row.id}`)}
          resultLabel="riders"
        />
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          setActionNotes('')
          setActionRider(null)
          setActionType(null)
        }}
        onConfirm={handleConfirmAction}
        title={`${actionType === 'suspend' ? 'Suspend' : actionType === 'block' ? 'Block' : 'Activate'} Rider Account`}
        description={
          <div className="space-y-4 w-full">
            <p className="text-xs text-muted-foreground">
              Are you sure you want to perform this operational status change on{' '}
              <strong>{actionRider?.fullName}</strong>?
            </p>
            <textarea
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="Provide comments or compliance reasons for this change..."
              className="w-full min-h-[85px] p-2.5 rounded-lg border border-border bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
        }
        confirmText="Confirm Action"
        variant={actionType === 'block' ? 'danger' : 'warning'}
        loading={isSuspending || isBlocking || isActivating}
      />
    </PageWrapper>
  )
}

export default RidersListPage
