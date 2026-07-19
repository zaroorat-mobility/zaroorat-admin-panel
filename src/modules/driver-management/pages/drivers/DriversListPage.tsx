import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDrivers, useSuspendDriver, useBlockDriver, useActivateDriver } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { InfoCard, InfoCardGrid } from '@/shared/components/InfoCard'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { Users, UserCheck, UserX, Eye, Edit2, ShieldAlert, Ban, ShieldCheck } from 'lucide-react'
import { ActionDropdown } from '../../components'
import type { DriverEntity } from '../../types'

export const DriversListPage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  // Modals for actions
  const [activeDriver, setActiveDriver] = useState<DriverEntity | null>(null)
  const [actionType, setActionType] = useState<'suspend' | 'block' | 'activate' | null>(null)
  const [actionNotes, setActionNotes] = useState('')

  const { data, isLoading, isError, refetch } = useDrivers()
  const { mutate: suspendDrv, isPending: isSuspending } = useSuspendDriver()
  const { mutate: blockDrv, isPending: isBlocking } = useBlockDriver()
  const { mutate: activateDrv, isPending: isActivating } = useActivateDriver()

  const columns: DataTableColumn<DriverEntity>[] = [
    {
      key: 'driverName',
      label: 'Driver Name',
      sortable: true,
      align: 'left',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs overflow-hidden">
            {row.profilePhotoUrl ? (
              <img src={row.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              value.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100">{value}</p>
            <p className="text-[10px] text-muted-foreground">{row.mobileNumber}</p>
          </div>
        </div>
      )
    },
    {
      key: 'vehicleType',
      label: 'Vehicle',
      sortable: true,
      render: (value, row) => (
        <div>
          <span className="capitalize font-semibold text-xs text-slate-665">
            {value}
          </span>
          {row.registrationPlate && (
            <p className="text-[10px] text-slate-450 uppercase font-mono tracking-wider font-bold mt-0.5">
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
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'ratingAvg',
      label: 'Rating',
      sortable: true,
      render: (value) => (
        <span className="font-semibold text-xs text-amber-500">
          {value ? `${Number(value).toFixed(1)} ★` : '—'}
        </span>
      ),
    },
    {
      key: 'totalTrips',
      label: 'Trips',
      sortable: true,
      render: (value) => (
        <span className="font-bold text-xs text-slate-665 dark:text-slate-400">
          {value || 0}
        </span>
      ),
    },
    {
      key: 'joinedAt',
      label: 'Joined Date',
      sortable: true,
      render: (value) => (
        <span className="text-xs text-muted-foreground">
          {new Date(value).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      render: (_, row) => {
        const isSuspendedOrBlocked = row.driverStatus === 'suspended' || row.driverStatus === 'blocked'
        
        return (
          <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <ActionDropdown
              actions={[
                {
                  label: 'View Profile',
                  icon: <Eye className="h-3.5 w-3.5" />,
                  onClick: () => navigate(`/driver-management/drivers/${row.id}`)
                },
                {
                  label: 'Edit Profile',
                  icon: <Edit2 className="h-3.5 w-3.5" />,
                  onClick: () => navigate(`/driver-management/drivers/${row.id}/edit`)
                },
                ...(isSuspendedOrBlocked
                  ? [
                      {
                        label: 'Activate Partner',
                        icon: <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />,
                        onClick: () => {
                          setActiveDriver(row)
                          setActionType('activate' as const)
                        }
                      }
                    ]
                  : [
                      {
                        label: 'Suspend Partner',
                        icon: <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />,
                        onClick: () => {
                          setActiveDriver(row)
                          setActionType('suspend' as const)
                        }
                      },
                      {
                        label: 'Block Partner',
                        icon: <Ban className="h-3.5 w-3.5 text-rose-600" />,
                        onClick: () => {
                          setActiveDriver(row)
                          setActionType('block' as const)
                        },
                        variant: 'danger' as const
                      }
                    ])
              ]}
            />
          </div>
        )
      }
    }
  ]

  const activeData = data?.data ?? []

  // Metrics breakdown
  const totalDrivers = activeData.length
  const activeCount = activeData.filter(d => d.driverStatus === 'active' || d.driverStatus === 'online' || d.driverStatus === 'on_trip').length
  const suspendedCount = activeData.filter(d => d.driverStatus === 'suspended').length
  const blockedCount = activeData.filter(d => d.driverStatus === 'blocked').length

  const handleActionConfirm = () => {
    if (!activeDriver || !actionType) return

    const payload = { id: activeDriver.id, notes: actionNotes }
    const callback = {
      onSuccess: () => {
        setActiveDriver(null)
        setActionType(null)
        setActionNotes('')
        refetch()
      }
    }

    if (actionType === 'suspend') {
      suspendDrv(payload, callback)
    } else if (actionType === 'block') {
      blockDrv(payload, callback)
    } else if (actionType === 'activate') {
      activateDrv(payload, callback)
    }
  }

  const actionText = {
    suspend: { title: 'Suspend Driver Partner', desc: 'Are you sure you want to suspend this driver? Suspension prevents them from taking new bookings.', label: 'Suspend' },
    block: { title: 'Block Driver Partner', desc: 'Are you sure you want to block this driver? Blocking prevents login access entirely.', label: 'Block' },
    activate: { title: 'Activate Driver Partner', desc: 'Are you sure you want to restore active state to this driver profile?', label: 'Activate' },
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Drivers Directory"
        description="Monitor active partners, online availabilities, user ratings, and manage suspension blocks."
      />

      <div className="space-y-6">
        <InfoCardGrid cols={4}>
          <InfoCard
            label="Total Partners"
            value={totalDrivers}
            icon={<Users className="h-5 w-5 text-slate-500" />}
            variant="blue"
            loading={isLoading}
          />
          <InfoCard
            label="Active & Online"
            value={activeCount}
            icon={<UserCheck className="h-5 w-5 text-emerald-500" />}
            variant="green"
            loading={isLoading}
          />
          <InfoCard
            label="Suspended"
            value={suspendedCount}
            icon={<ShieldAlert className="h-5 w-5 text-amber-500" />}
            variant="amber"
            loading={isLoading}
          />
          <InfoCard
            label="Blocked"
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
          searchPlaceholder="Search by Partner name, phone number, vehicle plate..."
          onRowClick={(row) => navigate(`/driver-management/drivers/${row.id}`)}
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
            <p>{actionType ? actionText[actionType].desc : ''}</p>
            <div className="mt-4 space-y-2 text-left">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Operation Notes / Action Reason</label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Provide context for audit timeline logs..."
                className="w-full h-20 rounded-lg border border-input bg-surface px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 dark:bg-slate-900"
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
