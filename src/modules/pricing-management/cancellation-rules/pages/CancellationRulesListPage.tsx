import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useCancellationRules,
  useDeleteCancellationRule,
  useActivateCancellationRule,
  useDeactivateCancellationRule
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
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Eye,
  User
} from 'lucide-react'
import type { CancellationRule } from '../types'

export const CancellationRulesListPage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Modal triggers
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [actionRule, setActionRule] = useState<CancellationRule | null>(null)
  const [actionType, setActionType] = useState<'activate' | 'deactivate' | 'delete' | null>(null)

  // React Query
  const { data, isLoading, isError, refetch } = useCancellationRules()
  
  const { mutate: deleteRule, isPending: isDeleting } = useDeleteCancellationRule()
  const { mutate: activateRule, isPending: isActivating } = useActivateCancellationRule()
  const { mutate: deactivateRule, isPending: isDeactivating } = useDeactivateCancellationRule()

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

  const columns: DataTableColumn<CancellationRule>[] = [
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
      key: 'actor',
      label: 'Actor',
      align: 'left',
      render: (val: string) => (
        <span className="capitalize font-bold text-slate-700 bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1 w-max">
          <User className="h-3 w-3 text-slate-500" />
          {val}
        </span>
      )
    },
    {
      key: 'scenario',
      label: 'Scenario',
      align: 'left',
      render: (val: string) => (
        <span className="font-mono text-slate-600 dark:text-slate-350 text-[10px]">
          {val.replace(/_/g, ' ')}
        </span>
      )
    },
    {
      key: 'chargeType',
      label: 'Charge Type',
      align: 'center',
      render: (val: string) => (
        <span className="capitalize text-slate-500 font-medium">
          {val}
        </span>
      )
    },
    {
      key: 'chargeAmount',
      label: 'Charge Amount',
      align: 'right',
      render: (val: number | undefined, row) => (
        <span className="font-bold text-slate-850 dark:text-white">
          {val !== undefined && typeof val === 'number'
            ? (row.chargeType === 'fixed' ? `₹${val.toFixed(2)}` : `${val}%`)
            : '—'}
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
      key: 'actions',
      label: 'Actions',
      align: 'center',
      render: (_, row) => {
        const dropActions: DropdownAction[] = [
          {
            label: 'View Details',
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/pricing-management/cancellation-rules/${row.id}`)
          },
          {
            label: 'Edit Configuration',
            icon: <Edit2 className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/pricing-management/cancellation-rules/${row.id}/edit`)
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
        title="Cancellation Penalties Settings"
        description="Configure penalty rules and passenger wallet deductions for order cancellations."
        onBack={() => navigate('/pricing-management')}
        actions={
          <Button
            onClick={() => navigate('/pricing-management/cancellation-rules/new')}
            className="gap-2 text-xs font-semibold h-9 rounded-lg bg-primary hover:bg-primary/95 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Create Penalty Rule</span>
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
          searchPlaceholder="Search by rule name, actor or scenario..."
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
        title={`${actionType === 'delete' ? 'Delete' : actionType === 'activate' ? 'Activate' : 'Deactivate'} Cancellation Rule`}
        description={
          <div className="space-y-2 text-xs text-muted-foreground w-full text-left">
            <p>
              Are you sure you want to perform this pricing modification on cancellation rule <strong>{actionRule?.ruleName}</strong>?
            </p>
            {actionType === 'activate' && (
              <p className="text-amber-600 font-bold bg-amber-50/50 p-2.5 rounded border border-amber-100">
                Notice: Activating this will automatically turn off any other active rule matching the actor "{actionRule?.actor.toUpperCase()}" and scenario "{actionRule?.scenario.replace(/_/g, ' ')}".
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

export default CancellationRulesListPage
