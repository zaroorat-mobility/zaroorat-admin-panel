import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useSurgeRules,
  useDeleteSurgeRule,
  useActivateSurgeRule,
  useDeactivateSurgeRule,
} from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { ActionDropdown, type DropdownAction } from '@/modules/driver-management/components/ActionDropdown'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { useToast } from '@/shared/context/toast'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import {
  Zap,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Eye,
  ArrowLeft,
  RefreshCw,
  Pencil,
  Search,
  Clock,
  Calendar,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'
import type { SurgeRule } from '../types'
import { SurgeRuleDetailsModal } from '../components/SurgeRuleDetailsModal'

export const SurgeRulesListPage: React.FC = () => {
  const navigate = useNavigate()
  const { success: showSuccess, error: showError } = useToast()
  const user = useAuthStore((state) => state.user)
  const canWrite = hasPermission(user, 'pricing:write')

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Modal triggers
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [actionRule, setActionRule] = useState<SurgeRule | null>(null)
  const [actionType, setActionType] = useState<'activate' | 'deactivate' | 'delete' | null>(null)
  const [detailRule, setDetailRule] = useState<SurgeRule | null>(null)

  // React Query
  const { data, isLoading, refetch } = useSurgeRules()

  const { mutate: deleteRule, isPending: isDeleting } = useDeleteSurgeRule()
  const { mutate: activateRule, isPending: isActivating } = useActivateSurgeRule()
  const { mutate: deactivateRule, isPending: isDeactivating } = useDeactivateSurgeRule()

  const allRules = data?.data || []

  const filteredRules = useMemo(() => {
    if (!searchQuery.trim()) return allRules
    const q = searchQuery.toLowerCase()
    return allRules.filter((rule) => {
      return (
        rule.ruleName.toLowerCase().includes(q) ||
        (rule.vehicleLabel && rule.vehicleLabel.toLowerCase().includes(q)) ||
        (rule.zoneName && rule.zoneName.toLowerCase().includes(q))
      )
    })
  }, [allRules, searchQuery])

  // Metrics
  const totalRules = allRules.length
  const activeRules = allRules.filter((r) => r.status === 'active').length
  const inactiveRules = totalRules - activeRules
  const highSurgeCount = allRules.filter((r) => (r.multiplier ?? 1) >= 1.5).length

  const handleConfirmAction = () => {
    if (!actionRule || !actionType) return

    const successCallback = {
      onSuccess: () => {
        showSuccess(
          'Surge Rule Updated',
          `${actionRule.ruleName} has been ${
            actionType === 'delete'
              ? 'deleted'
              : actionType === 'activate'
                ? 'activated'
                : 'deactivated'
          }.`,
        )
        setIsModalOpen(false)
        setActionRule(null)
        setActionType(null)
        refetch()
      },
      onError: (err: unknown) => {
        const maybe = err as {
          response?: { data?: { error?: { message?: string }; message?: string } }
          message?: string
        }
        const msg =
          maybe?.response?.data?.error?.message ||
          maybe?.response?.data?.message ||
          (err instanceof Error ? err.message : 'Operation could not complete')
        showError('Action Failed', msg)
      },
    }

    if (actionType === 'delete') {
      deleteRule(actionRule.id, successCallback)
    } else if (actionType === 'activate') {
      activateRule(actionRule.id, successCallback)
    } else if (actionType === 'deactivate') {
      deactivateRule(actionRule.id, successCallback)
    }
  }

  // Custom DataTable Columns definition
  const columns: DataTableColumn<SurgeRule>[] = useMemo(
    () => [
      {
        key: 'ruleName',
        label: 'Rule Name',
        sortable: true,
        align: 'left',
        render: (_: unknown, row: SurgeRule) => (
          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-[13px] whitespace-nowrap">
            {row.ruleName}
          </span>
        ),
      },
      {
        key: 'vehicleCategory',
        label: 'Vehicle Category',
        sortable: true,
        align: 'left',
        render: (_: unknown, row: SurgeRule) => (
          <span className="font-medium text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap">
            {row.vehicleLabel ?? 'All vehicles'}
          </span>
        ),
      },
      {
        key: 'surgeZone',
        label: 'Surge Zone',
        sortable: true,
        align: 'left',
        render: (_: unknown, row: SurgeRule) => (
          <span className="text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
            {row.zoneName ?? 'Citywide'}
          </span>
        ),
      },
      {
        key: 'multiplier',
        label: 'Multiplier',
        sortable: true,
        align: 'center',
        render: (_: unknown, row: SurgeRule) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/70 dark:border-rose-900/50">
            {row.multiplier !== undefined ? `${row.multiplier.toFixed(1)}x` : '—'}
          </span>
        ),
      },
      {
        key: 'dailyHours',
        label: 'Daily Hours',
        sortable: true,
        align: 'center',
        render: (_: unknown, row: SurgeRule) => {
          const hoursText =
            row.isPeakHourOnly && row.peakHourStart && row.peakHourEnd
              ? `${row.peakHourStart} – ${row.peakHourEnd}`
              : row.startTime || row.endTime
                ? `${row.startTime || '00:00'} – ${row.endTime || '23:59'}`
                : 'All Day'
          return (
            <span className="inline-flex items-center gap-1.5 font-mono text-[11.5px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {hoursText}
            </span>
          )
        },
      },
      {
        key: 'effectiveDates',
        label: 'Effective Dates',
        sortable: true,
        align: 'center',
        render: (_: unknown, row: SurgeRule) => (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {row.effectiveFrom} {row.effectiveTo ? `to ${row.effectiveTo}` : 'onwards'}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        align: 'center',
        render: (_: unknown, row: SurgeRule) =>
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
        render: (_: unknown, row: SurgeRule) => {
          const dropActions: DropdownAction[] = [
            {
              label: 'View Details',
              icon: <Eye className="w-4 h-4" />,
              onClick: () => setDetailRule(row),
            },
          ]

          if (canWrite) {
            dropActions.push({
              label: 'Edit Configuration',
              icon: <Pencil className="w-4 h-4" />,
              onClick: () => navigate(`/pricing-management/surge-rules/${row.id}/edit`),
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
                onClick={() => navigate(`/pricing-management/surge-rules/${row.id}/edit`)}
                title="Edit Surge Rule"
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
              Surge Tariffs Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enable/disable real-time surge parameters, multiplier boundaries, and active surge schedules.
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
              onClick={() => navigate('/pricing-management/surge-rules/new')}
              className="bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Surge Rule</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── 2. Top 4 Metric Cards (Matching Geographic Management) ─────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Surge Rules */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {totalRules}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Total Surge Rules
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {activeRules} active • {inactiveRules} inactive
          </p>
        </div>

        {/* Active Rules */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {activeRules}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Active Surge Rules
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            Multiplier rules in effect
          </p>
        </div>

        {/* High Surge Rules */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-rose-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {highSurgeCount}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  High Multipliers (≥1.5x)
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            Requires cap verification
          </p>
        </div>

        {/* Inactive Rules */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <ToggleLeft className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {inactiveRules}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Inactive Rules
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {inactiveRules > 0 ? `${inactiveRules} disabled schedules` : 'No inactive rules'}
          </p>
        </div>
      </div>

      {/* ─── 3. Custom DataTable Container ─────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col w-full min-w-0">
        {/* Table Header & Search Filter */}
        <div className="p-4 sm:px-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <Zap className="w-[18px] h-[18px] text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight truncate">
                SURGE RULES ({filteredRules.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Dynamic pricing multipliers applied when demand exceeds standard vehicle capacity.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by rule, vehicle or zone..."
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
          resultLabel="surge rules"
          pageSizeOptions={[5, 10, 25, 50]}
        />
      </div>

      {/* Executive Details Popup Modal matching Tax & Commission */}
      <SurgeRuleDetailsModal
        rule={detailRule}
        canWrite={canWrite}
        onClose={() => setDetailRule(null)}
        onEdit={(rule) => navigate(`/pricing-management/surge-rules/${rule.id}/edit`)}
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
        title={`${actionType === 'delete' ? 'Delete' : actionType === 'activate' ? 'Activate' : 'Deactivate'} Surge Rule`}
        description={
          <div className="space-y-2 text-xs text-muted-foreground w-full text-left">
            <p>
              Are you sure you want to perform this pricing modification on surge rule{' '}
              <strong>{actionRule?.ruleName}</strong>?
            </p>
            {actionType === 'activate' && (
              <p className="text-amber-600 font-bold bg-amber-50/50 p-2.5 rounded border border-amber-100">
                Notice: Activating this will automatically turn off any other active surge rules for
                this vehicle type.
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