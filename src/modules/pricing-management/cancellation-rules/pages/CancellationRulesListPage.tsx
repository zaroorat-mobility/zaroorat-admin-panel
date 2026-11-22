import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useCancellationRules,
  useDeleteCancellationRule,
  useActivateCancellationRule,
  useDeactivateCancellationRule,
  usePricingSummary,
} from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { ActionDropdown, type DropdownAction } from '@/modules/driver-management/components/ActionDropdown'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import {
  ShieldCheck,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Eye,
  ArrowLeft,
  RefreshCw,
  Pencil,
  Search,
  User,
  Users,
  AlertTriangle,
} from 'lucide-react'
import type { CancellationRule } from '../types'
import { NotAppliedNotice, CancellationRuleDetailsModal } from '../components'
import { useToast } from '@/shared/context/toast'

export const CancellationRulesListPage: React.FC = () => {
  const navigate = useNavigate()
  const { success: showSuccess, error: showError } = useToast()
  const user = useAuthStore((state) => state.user)
  const canWrite = hasPermission(user, 'pricing:write')

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Modal triggers
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [actionRule, setActionRule] = useState<CancellationRule | null>(null)
  const [actionType, setActionType] = useState<'activate' | 'deactivate' | 'delete' | null>(null)
  const [detailRule, setDetailRule] = useState<CancellationRule | null>(null)

  // React Query
  const { data, isLoading, refetch } = useCancellationRules()
  const { data: pricingSummary } = usePricingSummary()
  const policyEngineEnforced = pricingSummary?.flags.cancellationPolicyEnforcement ?? false

  const { mutate: deleteRule, isPending: isDeleting } = useDeleteCancellationRule()
  const { mutate: activateRule, isPending: isActivating } = useActivateCancellationRule()
  const { mutate: deactivateRule, isPending: isDeactivating } = useDeactivateCancellationRule()

  const allRules = data?.data || []

  const filteredRules = useMemo(() => {
    if (!searchQuery.trim()) return allRules
    const q = searchQuery.toLowerCase()
    return allRules.filter((rule) => {
      return (
        rule.ruleName.toLowerCase().includes(q) ||
        rule.actor.toLowerCase().includes(q) ||
        rule.scenario.toLowerCase().includes(q)
      )
    })
  }, [allRules, searchQuery])

  // Metrics
  const totalRules = allRules.length
  const activeRules = allRules.filter((r) => r.status === 'active').length
  const riderRules = allRules.filter((r) => r.actor === 'rider').length
  const driverRules = allRules.filter((r) => r.actor === 'driver').length

  const handleConfirmAction = () => {
    if (!actionRule || !actionType) return

    const targetName = actionRule.ruleName
    const currentAction = actionType

    const callbacks = {
      onSuccess: () => {
        setIsModalOpen(false)
        setActionRule(null)
        setActionType(null)
        refetch()
        if (currentAction === 'delete') {
          showSuccess('Cancellation Policy Deleted', `"${targetName}" has been permanently removed.`)
        } else if (currentAction === 'activate') {
          showSuccess('Cancellation Policy Activated', `"${targetName}" is now the active policy for its scope.`)
        } else {
          showSuccess('Cancellation Policy Deactivated', `"${targetName}" has been turned off.`)
        }
      },
      onError: (err: unknown) => {
        const apiErr = err as {
          response?: { data?: { error?: { message?: string }; message?: string } }
          message?: string
        }
        setIsModalOpen(false)
        setActionRule(null)
        setActionType(null)
        showError(
          `Failed to ${currentAction === 'delete' ? 'Delete' : currentAction === 'activate' ? 'Activate' : 'Deactivate'} Policy`,
          apiErr?.response?.data?.error?.message ||
            apiErr?.response?.data?.message ||
            apiErr?.message ||
            'An unexpected error occurred.',
        )
      },
    }

    if (actionType === 'delete') {
      deleteRule(actionRule.id, callbacks)
    } else if (actionType === 'activate') {
      activateRule(actionRule.id, callbacks)
    } else if (actionType === 'deactivate') {
      deactivateRule(actionRule.id, callbacks)
    }
  }

  // Custom DataTable columns definition
  const columns: DataTableColumn<CancellationRule>[] = useMemo(
    () => [
      {
        key: 'ruleName',
        label: 'Rule Name',
        sortable: true,
        align: 'left',
        render: (_: unknown, row: CancellationRule) => (
          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-[13px] whitespace-nowrap">
            {row.ruleName}
          </span>
        ),
      },
      {
        key: 'version',
        label: 'Version',
        sortable: true,
        align: 'center',
        render: (_: unknown, row: CancellationRule) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            V{row.version ?? 1}
          </span>
        ),
      },
      {
        key: 'actor',
        label: 'Actor',
        sortable: true,
        align: 'left',
        render: (_: unknown, row: CancellationRule) => (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {row.actor === 'driver' ? (
              <Users className="w-3 h-3 text-slate-500" />
            ) : (
              <User className="w-3 h-3 text-slate-500" />
            )}
            <span>{row.actor}</span>
          </span>
        ),
      },
      {
        key: 'scenario',
        label: 'Scenario',
        sortable: true,
        align: 'left',
        render: (_: unknown, row: CancellationRule) => (
          <span className="text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
            {row.scenario.replace(/_/g, ' ')}
          </span>
        ),
      },
      {
        key: 'chargeType',
        label: 'Charge Type',
        sortable: true,
        align: 'center',
        render: (_: unknown, row: CancellationRule) => (
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 capitalize">
            {row.chargeType}
          </span>
        ),
      },
      {
        key: 'chargeAmount',
        label: 'Charge Amount',
        sortable: true,
        align: 'right',
        render: (_: unknown, row: CancellationRule) => (
          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-[13px]">
            {row.chargeAmount !== undefined
              ? row.chargeType === 'fixed'
                ? `₹${row.chargeAmount.toFixed(2)}`
                : `${row.chargeAmount}%`
              : '—'}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        align: 'center',
        render: (_: unknown, row: CancellationRule) =>
          row.status === 'active' ? (
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50">
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#EF4444] dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/50">
              Inactive
            </span>
          ),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'center',
        render: (_: unknown, row: CancellationRule) => {
          const dropActions: DropdownAction[] = [
            {
              label: 'View Details',
              icon: <Eye className="w-4 h-4" />,
              onClick: () => setDetailRule(row),
            },
          ]

          if (canWrite) {
            dropActions.push({
              label: 'Edit Policy',
              icon: <Pencil className="w-4 h-4" />,
              onClick: () => navigate(`/pricing-management/cancellation-rules/${row.id}/edit`),
            })

            if (row.status === 'inactive') {
              dropActions.push({
                label: 'Activate Rule',
                icon: <ToggleRight className="w-4 h-4" />,
                onClick: () => {
                  setActionRule(row)
                  setActionType('activate')
                  setIsModalOpen(true)
                },
              })
            } else {
              dropActions.push({
                label: 'Deactivate Rule',
                icon: <ToggleLeft className="w-4 h-4" />,
                onClick: () => {
                  setActionRule(row)
                  setActionType('deactivate')
                  setIsModalOpen(true)
                },
              })
            }

            dropActions.push({
              label: 'Delete Rule',
              icon: <Trash2 className="w-4 h-4 text-rose-500" />,
              onClick: () => {
                setActionRule(row)
                setActionType('delete')
                setIsModalOpen(true)
              },
              variant: 'danger',
            })
          }

          return (
            <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => navigate(`/pricing-management/cancellation-rules/${row.id}/edit`)}
                title="Edit Policy"
                className="p-1.5 text-slate-500 hover:text-[#1F2B6D] dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <ActionDropdown actions={dropActions} />
            </div>
          )
        },
      },
    ],
    [canWrite, navigate],
  )

  return (
    <PageWrapper className="space-y-4 pt-1 pb-6 px-3 sm:px-5 w-full max-w-full overflow-x-hidden">
      {/* ─── 1. Header (Geographic Management Tokens) ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/pricing-management')}
            title="Back to Pricing Control Center"
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#1F2B6D] dark:text-white" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2B6D] dark:text-white">
              Cancellation Policies Settings
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure penalty rules, driver compensation, and rider wallet deductions for trip cancellations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            title="Refresh data"
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#1F2B6D]' : ''}`}
            />
          </button>

          {canWrite && (
            <button
              type="button"
              onClick={() => navigate('/pricing-management/cancellation-rules/new')}
              className="bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Penalty Rule</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── 2. Top 4 Metric Cards (Matching Geographic Management) ─────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Policies */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {totalRules}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Total Cancellation Rules
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {activeRules} active in system
          </p>
        </div>

        {/* Rider Cancellation Rules */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {riderRules}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Rider Penalty Rules
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            Deducted on late cancel / arrival
          </p>
        </div>

        {/* Driver Cancellation Rules */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {driverRules}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Driver Penalty Rules
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            Deducted from driver wallet
          </p>
        </div>

        {/* Live Feature Flag Enforcement Card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-[42px] h-[42px] rounded-full flex items-center justify-center text-white shadow-sm flex-shrink-0 ${
                  policyEngineEnforced ? 'bg-emerald-600' : 'bg-amber-500'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p
                  className={`text-xl font-extrabold tracking-tight leading-none ${
                    policyEngineEnforced
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {policyEngineEnforced ? 'Enforced' : 'Flag OFF'}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Policy Engine Flag
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {policyEngineEnforced
              ? 'Active policies evaluated on live cancellations'
              : 'Default OFF — versioned in DB until enabled'}
          </p>
        </div>
      </div>

      <NotAppliedNotice />

      {/* ─── 3. Custom DataTable Container ─────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col w-full min-w-0">
        {/* Table Header & Search Filter */}
        <div className="p-4 sm:px-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-[18px] h-[18px] text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight truncate">
                CANCELLATION POLICIES ({filteredRules.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Stipulates financial payouts and penalties when riders or drivers cancel accepted rides.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by rule, actor or scenario..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] shadow-2xs"
            />
          </div>
        </div>

        {/* Custom Shared DataTable Component */}
        <DataTable
          data={filteredRules}
          columns={columns}
          compact={true}
          isLoading={isLoading}
          selectable={false}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          hideToolbar={true}
          className="border-0 shadow-none rounded-none bg-transparent"
          onRowClick={(row) => setDetailRule(row)}
          resultLabel="cancellation policies"
          pageSizeOptions={[5, 10, 25, 50]}
        />
      </div>

      {/* Executive Details Popup Modal matching Tax & Commission */}
      <CancellationRuleDetailsModal
        rule={detailRule}
        canWrite={canWrite}
        onClose={() => setDetailRule(null)}
        onEdit={(rule) => navigate(`/pricing-management/cancellation-rules/${rule.id}/edit`)}
        onActivate={(rule) => {
          setActionRule(rule)
          setActionType('activate')
          setIsModalOpen(true)
        }}
      />

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
              Are you sure you want to perform this pricing modification on cancellation rule{' '}
              <strong>{actionRule?.ruleName}</strong>?
            </p>
            {actionType === 'activate' && (
              <p className="text-amber-600 font-bold bg-amber-50/50 p-2.5 rounded border border-amber-100">
                Notice: Activating this will automatically turn off any other active rule matching the
                actor &quot;{actionRule?.actor.toUpperCase()}&quot; and scenario &quot;
                {actionRule?.scenario.replace(/_/g, ' ')}&quot;.
              </p>
            )}
            {actionType === 'delete' && (
              <p className="text-rose-600 font-semibold bg-rose-50/60 p-2.5 rounded border border-rose-100">
                {actionRule?.status === 'active'
                  ? 'Active policies cannot be deleted directly. Deactivate this policy first.'
                  : 'This permanently deletes an inactive policy if no historical ride cancellations reference it.'}
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