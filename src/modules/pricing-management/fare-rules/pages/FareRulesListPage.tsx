import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useFareRules,
  useDeleteFareRule,
  useActivateFareRule,
  useDeactivateFareRule
} from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { InfoCardGrid, InfoCard } from '@/shared/components/InfoCard'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { Button } from '@/shared/components/ui/Button'
import { ActionDropdown, type DropdownAction } from '@/modules/driver-management/components/ActionDropdown'
import {
  DollarSign,
  Plus,
  Car,
  Bike,
  Activity,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Eye
} from 'lucide-react'
import type { FareRule } from '../types'

export const FareRulesListPage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Modal triggers
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [actionRule, setActionRule] = useState<FareRule | null>(null)
  const [actionType, setActionType] = useState<'activate' | 'deactivate' | 'delete' | null>(null)

  // React Query
  const { data, isLoading, isError, refetch } = useFareRules()
  
  const { mutate: deleteRule, isPending: isDeleting } = useDeleteFareRule()
  const { mutate: activateRule, isPending: isActivating } = useActivateFareRule()
  const { mutate: deactivateRule, isPending: isDeactivating } = useDeactivateFareRule()

  const rules = data?.data || []

  // Metrics
  const totalRules = rules.length
  const activeRules = rules.filter(r => r.status === 'active').length
  const inactiveRules = totalRules - activeRules
  const vehicleTypesCovered = new Set(rules.map(r => r.vehicleType)).size

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

  const columns: DataTableColumn<FareRule>[] = [
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
          <div className="p-1 rounded bg-primary/10 text-primary">
            {val === 'bike' ? <Bike className="h-3.5 w-3.5" /> : <Car className="h-3.5 w-3.5" />}
          </div>
          <span className="font-bold text-slate-700 dark:text-slate-200 uppercase text-[10px] tracking-wider">{val}</span>
        </div>
      )
    },
    {
      key: 'baseFare',
      label: 'Base Fare',
      align: 'right',
      render: (val: number) => <span className="font-semibold text-slate-700 dark:text-slate-350">₹{val.toFixed(2)}</span>
    },
    {
      key: 'perKmRate',
      label: 'Per KM',
      align: 'right',
      render: (val: number) => <span className="font-semibold text-slate-700 dark:text-slate-350">₹{val.toFixed(2)}</span>
    },
    {
      key: 'perMinuteRate',
      label: 'Per Minute',
      align: 'right',
      render: (val: number) => <span className="font-semibold text-slate-750 dark:text-slate-300">₹{val.toFixed(2)}</span>
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (val: string) => <StatusBadge status={val} />
    },
    {
      key: 'effectiveFrom',
      label: 'Effective From',
      align: 'center',
      render: (val: string) => <span className="text-[10px] text-slate-500 font-medium font-mono">{val}</span>
    },
    {
      key: 'effectiveTo',
      label: 'Effective To',
      align: 'center',
      render: (val: string) => <span className="text-[10px] text-slate-500 font-medium font-mono">{val || '—'}</span>
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
            onClick: () => navigate(`/pricing-management/fare-rules/${row.id}`)
          },
          {
            label: 'Edit Configuration',
            icon: <Edit2 className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/pricing-management/fare-rules/${row.id}/edit`)
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
        title="Fare Rules Formula Options"
        description="Review base tariffs, per-km/per-min charges, and operational scheduled waiting settings."
        onBack={() => navigate('/pricing-management')}
        actions={
          <Button
            onClick={() => navigate('/pricing-management/fare-rules/new')}
            className="gap-2 text-xs font-semibold h-9 rounded-lg bg-primary hover:bg-primary/95 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Create Fare Rule</span>
          </Button>
        }
      />

      <div className="space-y-6">
        <InfoCardGrid cols={4}>
          <InfoCard
            label="Total Fare Rules"
            value={totalRules}
            icon={<DollarSign className="h-5 w-5 text-slate-500" />}
            variant="blue"
            loading={isLoading}
          />
          <InfoCard
            label="Active Rules"
            value={activeRules}
            icon={<Activity className="h-5 w-5 text-emerald-500" />}
            variant="green"
            loading={isLoading}
          />
          <InfoCard
            label="Inactive Rules"
            value={inactiveRules}
            icon={<ToggleLeft className="h-5 w-5 text-amber-500" />}
            variant="amber"
            loading={isLoading}
          />
          <InfoCard
            label="Vehicle Types Covered"
            value={vehicleTypesCovered}
            icon={<Car className="h-5 w-5 text-primary" />}
            variant="blue"
            loading={isLoading}
          />
        </InfoCardGrid>

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
        title={`${actionType === 'delete' ? 'Delete' : actionType === 'activate' ? 'Activate' : 'Deactivate'} Fare Rule`}
        description={
          <div className="space-y-2 text-xs text-muted-foreground w-full text-left">
            <p>
              Are you sure you want to perform this pricing modification on rule <strong>{actionRule?.ruleName}</strong>?
            </p>
            {actionType === 'activate' && (
              <p className="text-amber-600 font-bold bg-amber-50/50 p-2.5 rounded border border-amber-100">
                Notice: Activating this will automatically turn off any other active rule for this vehicle category.
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

export default FareRulesListPage
