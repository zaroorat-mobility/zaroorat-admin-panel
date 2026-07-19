import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useRiders,
  useSuspendRider,
  useBlockRider,
  useActivateRider
} from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { InfoCardGrid, InfoCard } from '@/shared/components/InfoCard'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { ActionDropdown } from '@/modules/driver-management/components/ActionDropdown'
import {
  Users,
  UserCheck,
  UserMinus,
  UserX,
  Eye,
  AlertTriangle,
  Ban,
  ShieldCheck
} from 'lucide-react'
import type { RiderEntity } from '../types'

export const RidersListPage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Modal triggers
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [actionRider, setActionRider] = useState<RiderEntity | null>(null)
  const [actionType, setActionType] = useState<'suspend' | 'block' | 'activate' | null>(null)
  const [actionNotes, setActionNotes] = useState('')

  // React Query Queries & Mutations
  const { data, isLoading, isError, refetch } = useRiders()

  const { mutate: suspendRider, isPending: isSuspending } = useSuspendRider()
  const { mutate: blockRider, isPending: isBlocking } = useBlockRider()
  const { mutate: activateRider, isPending: isActivating } = useActivateRider()

  const riders = data?.data || []
  const activeData = riders

  // Funnel calculations
  const totalRiders = activeData.length
  const activeCount = activeData.filter(r => r.riderStatus === 'active').length
  const suspendedCount = activeData.filter(r => r.riderStatus === 'suspended').length
  const blockedCount = activeData.filter(r => r.riderStatus === 'blocked').length

  const handleConfirmAction = () => {
    if (!actionRider || !actionType) return

    const actionMap = {
      suspend: suspendRider,
      block: blockRider,
      activate: activateRider
    }

    actionMap[actionType]({ id: actionRider.id, notes: actionNotes }, {
      onSuccess: () => {
        setIsModalOpen(false)
        setActionNotes('')
        setActionRider(null)
        setActionType(null)
        refetch()
      }
    })
  }

  const columns: DataTableColumn<RiderEntity>[] = [
    {
      key: 'riderId',
      label: 'Rider ID',
      align: 'center',
      render: (val: string) => <span className="font-mono font-bold text-slate-850 dark:text-slate-200">{val}</span>
    },
    {
      key: 'fullName',
      label: 'FullName',
      align: 'left',
      render: (val: string, row) => (
        <div className="flex flex-col text-left">
          <span className="font-bold text-slate-700 dark:text-slate-350">{val}</span>
          {row.email && <span className="text-[10px] text-muted-foreground">{row.email}</span>}
        </div>
      )
    },
    {
      key: 'mobileNumber',
      label: 'Mobile No',
      align: 'center',
      render: (val: string) => <span className="font-semibold text-slate-650 dark:text-slate-400">{val}</span>
    },
    {
      key: 'joinedAt',
      label: 'Registration Date',
      align: 'center',
      render: (val: string) => <span>{new Date(val).toLocaleDateString('en-IN')}</span>
    },
    {
      key: 'totalRides',
      label: 'Total Trips',
      align: 'center',
      render: (val: number) => <span className="font-bold text-slate-800 dark:text-slate-200">{val}</span>
    },
    {
      key: 'walletBalance',
      label: 'Wallet Balance',
      align: 'right',
      render: (val: number) => (
        <span className={val >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
          ₹{val.toFixed(2)}
        </span>
      )
    },
    {
      key: 'riderStatus',
      label: 'Status',
      align: 'center',
      render: (val: string) => <StatusBadge status={val} />
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
            onClick: () => navigate(`/riders/${row.id}`)
          }
        ]

        if (row.riderStatus === 'active') {
          dropActions.push(
            {
              label: 'Suspend Account',
              icon: <AlertTriangle className="h-3.5 w-3.5" />,
              onClick: () => {
                setActionRider(row)
                setActionType('suspend')
                setIsModalOpen(true)
              }
            },
            {
              label: 'Block Account',
              icon: <Ban className="h-3.5 w-3.5" />,
              onClick: () => {
                setActionRider(row)
                setActionType('block')
                setIsModalOpen(true)
              }
            }
          )
        } else {
          dropActions.push({
            label: 'Reactivate Account',
            icon: <ShieldCheck className="h-3.5 w-3.5" />,
            onClick: () => {
              setActionRider(row)
              setActionType('activate')
              setIsModalOpen(true)
            }
          })
        }

        return <ActionDropdown actions={dropActions} />
      }
    }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Riders Directory"
        description="Monitor passenger user accounts, safety timelines, dispute ledgers, and login permissions."
      />

      <div className="space-y-6">
        <InfoCardGrid cols={4}>
          <InfoCard
            label="Total Riders"
            value={totalRiders}
            icon={<Users className="h-5 w-5 text-slate-500" />}
            variant="blue"
            loading={isLoading}
          />
          <InfoCard
            label="Active Accounts"
            value={activeCount}
            icon={<UserCheck className="h-5 w-5 text-emerald-500" />}
            variant="green"
            loading={isLoading}
          />
          <InfoCard
            label="Suspended Accounts"
            value={suspendedCount}
            icon={<UserMinus className="h-5 w-5 text-amber-500" />}
            variant="amber"
            loading={isLoading}
          />
          <InfoCard
            label="Blocked Accounts"
            value={blockedCount}
            icon={<UserX className="h-5 w-5 text-rose-500" />}
            variant="red"
            loading={isLoading}
          />
        </InfoCardGrid>

        <DataTable
          data={activeData}
          columns={columns}
          isLoading={isLoading}
          isError={isError}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          searchPlaceholder="Search by Rider name or mobile number..."
          onRowClick={(row) => navigate(`/riders/${row.id}`)}
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
              Are you sure you want to perform this operational status change on <strong>{actionRider?.fullName}</strong>?
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
