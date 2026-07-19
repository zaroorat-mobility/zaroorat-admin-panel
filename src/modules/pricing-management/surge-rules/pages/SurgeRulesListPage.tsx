import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useSurgeRules,
  useDeleteSurgeRule,
  useActivateSurgeRule,
  useDeactivateSurgeRule
} from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { Button } from '@/shared/components/ui/Button'
import { ActionDropdown, type DropdownAction } from '@/modules/driver-management/components/ActionDropdown'
import {
  Plus,
  Car,
  Bike,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Eye,
  Clock,
  Calendar
} from 'lucide-react'
import type { SurgeRule } from '../types'

export const SurgeRulesListPage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Modal triggers
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [actionRule, setActionRule] = useState<SurgeRule | null>(null)
  const [actionType, setActionType] = useState<'activate' | 'deactivate' | 'delete' | null>(null)

  // React Query
  const { data, isLoading, isError, refetch } = useSurgeRules()
  
  const { mutate: deleteRule, isPending: isDeleting } = useDeleteSurgeRule()
  const { mutate: activateRule, isPending: isActivating } = useActivateSurgeRule()
  const { mutate: deactivateRule, isPending: isDeactivating } = useDeactivateSurgeRule()

  const rules = data?.data || []

  const handleConfirmAction = () => {
    if (!actionRule || !actionType) return

    const successCallback = {
      onSuccess: () => {
        setIsModalOpen(false)
        setActionRule(null)
        setActionType(null)
        refetch()
      }
    }

    if (actionType === 'delete') {
      deleteRule(actionRule.id, successCallback)
    } else if (actionType === 'activate') {
      activateRule(actionRule.id, successCallback)
    } else if (actionType === 'deactivate') {
      deactivateRule(actionRule.id, successCallback)
    }
  }

  const columns: DataTableColumn<SurgeRule>[] = [
    {
      key: 'ruleName',
      label: 'Rule Name',
      align: 'left',
      render: (val: string) => <span className="font-bold text-slate-800 dark:text-slate-100">{val}</span>
    },
    {
      key: 'version',
      label: 'Version',
      align: 'center',
      render: (val: number) => <span className="font-semibold text-slate-650 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200">V{val}</span>
    },
    {
      key: 'vehicleType',
      label: 'Vehicle Type',
      align: 'left',
      render: (val: string) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-primary/10 text-primary">
            {val === 'bike' ? <Bike className="h-3.5 w-3.5" /> : <Car className="h-3.5 w-3.5" />}
          </div>
          <span className="font-bold text-slate-700 dark:text-slate-200 uppercase text-[10px] tracking-wider">{val}</span>
        </div>
      )
    },
    {
      key: 'multiplier',
      label: 'Multiplier',
      align: 'center',
      render: (val?: number) => (
        <span className="px-2.5 py-0.5 rounded font-black text-xs border bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450 animate-pulse">
          {val !== undefined && typeof val === 'number' ? `${val.toFixed(1)}x` : '—'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (val: string) => <StatusBadge status={val} />
    },
    {
      key: 'startTime',
      label: 'Time Window',
      align: 'center',
      render: (_, row) => (
        <span className="flex items-center gap-1 justify-center text-[10px] text-slate-500 font-mono">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          {row.startTime && row.endTime ? `${row.startTime} - ${row.endTime}` : 'All Day'}
        </span>
      )
    },
    {
      key: 'effectiveFrom',
      label: 'Validity Dates',
      align: 'center',
      render: (_, row) => (
        <span className="flex items-center gap-1 justify-center text-[10px] text-slate-500 font-mono">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          {row.effectiveFrom} {row.effectiveTo ? `to ${row.effectiveTo}` : 'onwards'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      render: (_, row) => {
        const dropActions: DropdownAction[] = [
          {
            label: 'View Details',
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/pricing-management/surge-rules/${row.id}`)
          },
          {
            label: 'Edit Configuration',
            icon: <Edit2 className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/pricing-management/surge-rules/${row.id}/edit`)
          }
        ]

        if (row.status === 'inactive') {
          dropActions.push({
            label: 'Activate Rule',
            icon: <ToggleRight className="h-3.5 w-3.5" />,
            onClick: () => {
              setActionRule(row)
              setActionType('activate')
              setIsModalOpen(true)
            }
          })
        } else {
          dropActions.push({
            label: 'Deactivate Rule',
            icon: <ToggleLeft className="h-3.5 w-3.5" />,
            onClick: () => {
              setActionRule(row)
              setActionType('deactivate')
              setIsModalOpen(true)
            }
          })
        }

        dropActions.push({
          label: 'Delete Rule',
          icon: <Trash2 className="h-3.5 w-3.5 text-rose-500" />,
          onClick: () => {
            setActionRule(row)
            setActionType('delete')
            setIsModalOpen(true)
          },
          variant: 'danger' as const
        })

        return <ActionDropdown actions={dropActions} />
      }
    }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Surge Tariffs Management"
        description="Enable/disable real-time surge parameters, multiplier boundaries, and active surge levels."
        onBack={() => navigate('/pricing-management')}
        actions={
          <Button
            onClick={() => navigate('/pricing-management/surge-rules/new')}
            className="gap-2 text-xs font-semibold h-9 rounded-lg bg-primary hover:bg-primary/95 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Create Surge Rule</span>
          </Button>
        }
      />

      <div className="space-y-6">
        <DataTable
          columns={columns}
          data={rules}
          isLoading={isLoading}
          isError={isError}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          searchPlaceholder="Search by rule name or vehicle..."
        />
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          setActionRule(null)
          setActionType(null)
        }}
        onConfirm={handleConfirmAction}
        title={`${actionType === 'delete' ? 'Delete' : actionType === 'activate' ? 'Activate' : 'Deactivate'} Surge Rule`}
        description={
          <div className="space-y-2 text-xs text-muted-foreground w-full text-left">
            <p>
              Are you sure you want to perform this pricing modification on surge rule <strong>{actionRule?.ruleName}</strong>?
            </p>
            {actionType === 'activate' && (
              <p className="text-amber-600 font-bold bg-amber-50/50 p-2.5 rounded border border-amber-100">
                Notice: Activating this will automatically turn off any other active surge rules for this vehicle type.
              </p>
            )}
          </div>
        }
        confirmText="Confirm Action"
        variant={actionType === 'delete' ? 'danger' : 'warning'}
        loading={isDeleting || isActivating || isDeactivating}
      />
    </PageWrapper>
  )
}

export default SurgeRulesListPage
