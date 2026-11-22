import React, { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  useFareRules,
  useDeleteFareRule,
  useActivateFareRule,
  useDeactivateFareRule,
} from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { ActionDropdown, type DropdownAction } from '@/modules/driver-management/components/ActionDropdown'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { useToast } from '@/shared/context/toast'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import {
  Car,
  Plus,
  Pencil,
  Search,
  Copy,
  Upload,
  CheckCircle2,
  PauseCircle,
  MapPin,
  Layers,
  Info,
  ChevronDown,
  Trash2,
  Eye,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import type { FareRule } from '../types'
import { FareRuleDetailsModal } from '../components/FareRuleDetailsModal'
import { useVehicleTypes, vehicleTypeLabel } from '@/modules/geographic-management/hooks/useVehicleTypes'

interface DisplayFareRule {
  id: string
  code: string
  ruleName: string
  cityZone: string
  vehicleCategory: string
  vehicleTypeId?: string
  baseFare: string
  minFare: string
  perKm: string
  perMin: string
  status: 'active' | 'inactive'
  effectiveRange: string
  version: string
  rawRule?: FareRule
}

/** One table row from a server fare rule. Labels come from the DTO's exact vehicle type. */
export function toDisplayFareRule(r: FareRule): DisplayFareRule {
    // The server's own label for the exact type, never a guess from the code's spelling.
    const vLabel = `${r.vehicleTypeName ?? r.vehicleType} · ${r.vehicleType}`
    const code = (r.vehicleTypeName ?? r.vehicleType).slice(0, 2).toUpperCase()

    const cityLabel = r.serviceZoneName
      ? `${r.serviceZoneName} (${r.cityCode})`
      : r.cityCode === 'GLOBAL'
        ? 'All cities (GLOBAL)'
        : r.cityCode

    return {
      id: r.id,
      code,
      ruleName: r.ruleName,
      cityZone: cityLabel,
      vehicleCategory: vLabel,
      vehicleTypeId: r.vehicleTypeId,
      baseFare: `₹${r.baseFare.toFixed(2)}`,
      minFare: `₹${(r.minimumFare ?? r.baseFare).toFixed(2)}`,
      perKm: `₹${r.perKmRate.toFixed(2)}`,
      perMin: `₹${r.perMinuteRate.toFixed(2)}`,
      status: r.status,
      effectiveRange: `${new Date(r.effectiveFrom).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })} – ${r.effectiveTo
        ? new Date(r.effectiveTo).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
        : '∞'
        }`,
      version: `v${r.version}`,
      rawRule: r,
    }
}

export const FareRulesListPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const filterCityCode = searchParams.get('cityCode') ?? ''
  const user = useAuthStore((state) => state.user)
  const canWrite = hasPermission(user, 'pricing:write')

  // Toast hook from shared context
  const { success: showSuccess, error: showError, info: showInfo } = useToast()

  // Filter state
  const [selectedCity, setSelectedCity] = useState(filterCityCode)
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [selectedServiceType, setSelectedServiceType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Applied filter state (triggered by Apply button or initial query)
  const [appliedFilters, setAppliedFilters] = useState({
    city: filterCityCode,
    vehicle: '',
    serviceType: '',
    status: '',
    search: '',
  })

  // Table selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Modal triggers
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [actionRule, setActionRule] = useState<FareRule | null>(null)
  const [actionType, setActionType] = useState<'activate' | 'deactivate' | 'delete' | null>(null)
  const [detailRule, setDetailRule] = useState<FareRule | null>(null)

  // React Query hooks
  const { data, refetch, isLoading } = useFareRules()
  const { data: vehicleCatalog = [] } = useVehicleTypes()
  const { mutate: deleteRule, isPending: isDeleting } = useDeleteFareRule()
  const { mutate: activateRule, isPending: isActivating } = useActivateFareRule()
  const { mutate: deactivateRule, isPending: isDeactivating } = useDeactivateFareRule()

  // Only what the server returned: an empty table is the truth when no rule exists. This used
  // to pad the list with invented demo rules whenever there were fewer than eight real ones.
  const allDisplayRules = useMemo<DisplayFareRule[]>(() => {
    const rawRules = data?.data || []
    return rawRules.map(toDisplayFareRule)
  }, [data])

  // Filter application
  const filteredRules = useMemo(() => {
    return allDisplayRules.filter((r) => {
      // City / Zone filter
      if (appliedFilters.city) {
        const c = appliedFilters.city.toLowerCase()
        if (!r.cityZone.toLowerCase().includes(c)) return false
      }
      // Vehicle Category filter
      if (appliedFilters.vehicle) {
        if (r.vehicleTypeId !== appliedFilters.vehicle) return false
      }
      // Service Type filter (matches live backend serviceType)
      if (appliedFilters.serviceType) {
        if ((r.rawRule?.serviceType ?? '') !== appliedFilters.serviceType) return false
      }
      // Status filter
      if (appliedFilters.status && r.status !== appliedFilters.status) {
        return false
      }
      // Search query
      if (appliedFilters.search.trim()) {
        const q = appliedFilters.search.toLowerCase()
        const matchesName = r.ruleName.toLowerCase().includes(q)
        const matchesCity = r.cityZone.toLowerCase().includes(q)
        const matchesVehicle = r.vehicleCategory.toLowerCase().includes(q)
        const matchesId = r.id.toLowerCase().includes(q)
        if (!matchesName && !matchesCity && !matchesVehicle && !matchesId) return false
      }
      return true
    })
  }, [allDisplayRules, appliedFilters])

  // Enrich rules with rowIndex
  const enrichedRules = useMemo(() => {
    return filteredRules.map((rule, idx) => ({
      ...rule,
      rowIndex: idx + 1,
    }))
  }, [filteredRules])

  // Real figures only. These had floors of 36 / 24 / 12 so the cards never showed fewer.
  const loadedRules = data?.data ?? []
  const totalFareRulesCount = data?.meta?.totalCount ?? loadedRules.length
  const activeFareRulesCount = loadedRules.filter((r) => r.status === 'active').length
  const inactiveFareRulesCount = loadedRules.filter((r) => r.status === 'inactive').length
  const citiesCovered = [...new Set(loadedRules.map((r) => r.cityCode))]
  const vehicleTypesCovered = [...new Set(loadedRules.map((r) => r.vehicleTypeName ?? r.vehicleType))]
  const serviceTypesCovered = [...new Set(loadedRules.map((r) => r.serviceType ?? 'all'))]

  // Filter handlers
  const handleApplyFilters = () => {
    setAppliedFilters({
      city: selectedCity,
      vehicle: selectedVehicle,
      serviceType: selectedServiceType,
      status: selectedStatus,
      search: searchQuery,
    })
    showInfo('Filters applied', `Showing ${filteredRules.length} matching fare rules`)
  }

  const handleResetFilters = () => {
    setSelectedCity('')
    setSelectedVehicle('')
    setSelectedServiceType('')
    setSelectedStatus('')
    setSearchQuery('')
    setAppliedFilters({
      city: '',
      vehicle: '',
      serviceType: '',
      status: '',
      search: '',
    })
    showInfo('Filters reset', 'Displaying all configured fare rules')
  }

  // RFC-4180 formula-safe CSV Export
  const handleExport = () => {
    const csvCell = (raw: string | number) => {
      const text = String(raw)
      const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
      return `"${safe.replace(/"/g, '""')}"`
    }
    const headers = [
      '#',
      'Rule Name',
      'City / Zone',
      'Vehicle Category',
      'Base Fare',
      'Minimum Fare',
      'Per Km',
      'Per Minute',
      'Status',
      'Effective Range',
      'Version',
    ]
    const rows = filteredRules.map((r, i) => [
      csvCell(i + 1),
      csvCell(r.ruleName),
      csvCell(r.cityZone),
      csvCell(r.vehicleCategory),
      csvCell(r.baseFare),
      csvCell(r.minFare),
      csvCell(r.perKm),
      csvCell(r.perMin),
      csvCell(r.status),
      csvCell(r.effectiveRange),
      csvCell(r.version),
    ])
    const csvContent = [headers.map(csvCell).join(','), ...rows.map((e) => e.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Fare_Rules_Export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showSuccess('Export complete', `Exported ${filteredRules.length} fare rules to CSV`)
  }

  // Duplicate rule
  const handleDuplicate = (rule: DisplayFareRule) => {
    navigate(`/pricing-management/fare-rules/new?duplicateId=${rule.id}`)
  }

  // Confirmation modal execution
  const handleConfirmAction = () => {
    if (!actionRule || !actionType) return

    const successCallback = {
      onSuccess: () => {
        showSuccess(
          'Rule updated',
          `Fare rule ${actionRule.ruleName} has been ${actionType === 'delete' ? 'deleted' : actionType === 'activate' ? 'activated' : 'deactivated'
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
        showError('Action failed', msg)
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

  const columns: DataTableColumn<DisplayFareRule & { rowIndex: number }>[] = useMemo(
    () => [
      {
        key: 'rowIndex',
        label: '#',
        width: '48px',
        align: 'center',
        render: (v: number) => (
          <span className="font-semibold text-slate-500 dark:text-slate-400 text-xs">
            {v}
          </span>
        ),
      },
      {
        key: 'ruleName',
        label: 'Rule Name',
        sortable: true,
        align: 'left',
        render: (v: string) => (
          <span className="font-bold text-slate-900 dark:text-white text-xs whitespace-nowrap">
            {v}
          </span>
        ),
      },
      {
        key: 'cityZone',
        label: 'City / Zone',
        sortable: true,
        align: 'left',
        render: (v: string) => (
          <span className="font-medium text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">
            {v}
          </span>
        ),
      },
      {
        key: 'vehicleCategory',
        label: 'Vehicle Category',
        sortable: true,
        align: 'left',
        render: (_: unknown, row: DisplayFareRule) => (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <div className="w-6 h-6 rounded bg-[#1F2B6D] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
              {row.code}
            </div>
            <span className="font-bold text-slate-800 dark:text-white text-xs">
              {row.vehicleCategory}
            </span>
          </div>
        ),
      },
      {
        key: 'baseFare',
        label: 'Base Fare',
        sortable: true,
        align: 'right',
        render: (v: string) => (
          <span className="font-semibold text-slate-900 dark:text-white text-xs whitespace-nowrap">
            {v}
          </span>
        ),
      },
      {
        key: 'minFare',
        label: 'Minimum Fare',
        sortable: true,
        align: 'right',
        render: (v: string) => (
          <span className="font-semibold text-slate-900 dark:text-white text-xs whitespace-nowrap">
            {v}
          </span>
        ),
      },
      {
        key: 'perKm',
        label: 'Per Km',
        sortable: true,
        align: 'right',
        render: (v: string) => (
          <span className="font-semibold text-slate-900 dark:text-white text-xs whitespace-nowrap">
            {v}
          </span>
        ),
      },
      {
        key: 'perMin',
        label: 'Per Minute',
        sortable: true,
        align: 'right',
        render: (v: string) => (
          <span className="font-semibold text-slate-900 dark:text-white text-xs whitespace-nowrap">
            {v}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        align: 'center',
        render: (v: string) =>
          v === 'active' ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/20 dark:text-emerald-400 whitespace-nowrap">
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEE2E2] text-[#EF4444] dark:bg-rose-950/20 dark:text-rose-400 whitespace-nowrap">
              Inactive
            </span>
          ),
      },
      {
        key: 'effectiveRange',
        label: 'Effective From – To',
        align: 'center',
        render: (v: string) => (
          <span className="text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">
            {v}
          </span>
        ),
      },
      {
        key: 'version',
        label: 'Version',
        align: 'center',
        render: (v: string) => (
          <span className="font-semibold text-[#1F2B6D] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded text-[11px]">
            {v}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'center',
        render: (_: unknown, row: DisplayFareRule) => {
          const dropActions: DropdownAction[] = [
            {
              label: 'View Details',
              icon: <Eye className="w-4 h-4" />,
              onClick: () => {
                if (row.rawRule) setDetailRule(row.rawRule)
              },
            },
          ]

          if (canWrite) {
            dropActions.push({
              label: 'Edit Configuration',
              icon: <Pencil className="w-4 h-4" />,
              onClick: () => navigate(`/pricing-management/fare-rules/${row.id}/edit`),
            })
            dropActions.push({
              label: 'Duplicate Rule',
              icon: <Copy className="w-4 h-4" />,
              onClick: () => handleDuplicate(row),
            })
            if (row.status === 'inactive') {
              dropActions.push({
                label: 'Activate Rule',
                icon: <ToggleRight className="w-4 h-4 text-emerald-600" />,
                onClick: () => {
                  if (!row.rawRule) return
                  setActionRule(row.rawRule)
                  setActionType('activate')
                  setIsModalOpen(true)
                },
              })
            } else {
              dropActions.push({
                label: 'Deactivate Rule',
                icon: <ToggleLeft className="w-4 h-4 text-amber-600" />,
                onClick: () => {
                  if (!row.rawRule) return
                  setActionRule(row.rawRule)
                  setActionType('deactivate')
                  setIsModalOpen(true)
                },
              })
            }
            dropActions.push({
              label: 'Delete Rule',
              icon: <Trash2 className="w-4 h-4 text-rose-500" />,
              onClick: () => {
                if (!row.rawRule) return
                setActionRule(row.rawRule)
                setActionType('delete')
                setIsModalOpen(true)
              },
              variant: 'danger',
            })
          }

          return (
            <div
              className="flex items-center justify-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => navigate(`/pricing-management/fare-rules/${row.id}/edit`)}
                title="Edit Configuration"
                className="p-1 text-slate-500 hover:text-[#1F2B6D] dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDuplicate(row)}
                title="Duplicate Rule"
                className="p-1 text-slate-500 hover:text-[#1F2B6D] dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <ActionDropdown actions={dropActions} />
            </div>
          )
        },
      },
    ],
    [canWrite, navigate, handleDuplicate],
  )

  return (
    <PageWrapper className="space-y-4 pt-1 pb-6 px-3 sm:px-5 w-full max-w-full overflow-x-hidden">
      {/* ─── 1. Header with Title & Action Controls (Matching Geographic & Pricing Control Center) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2B6D] dark:text-white">
            Fare Rules
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create and manage base fare rules (rate cards) by city, vehicle, service type and zone.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleExport}
            className="px-3.5 py-2 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/pricing-management/fare-rules/new')}
            className="bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white px-4 py-2 rounded-[10px] text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Fare Rule</span>
          </button>
        </div>
      </div>

      {/* ─── 2. Top 6 Metric Cards (Exact Geographic Management Card Design) ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5 w-full min-w-0">
        {/* Card 1: Total Fare Rules */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {totalFareRulesCount}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Total Fare Rules
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {activeFareRulesCount} active • {inactiveFareRulesCount} inactive
          </p>
        </div>

        {/* Card 2: Active Rules */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                    {activeFareRulesCount}
                  </p>
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Active Rules
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            Published rate cards
          </p>
        </div>

        {/* Card 3: Inactive Rules */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <PauseCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {inactiveFareRulesCount}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Inactive Rules
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {inactiveFareRulesCount > 0 ? 'Archived or disabled' : 'No inactive rules'}
          </p>
        </div>

        {/* Card 4: Cities Covered */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {citiesCovered.length}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Cities Covered
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {citiesCovered.join(', ') || 'None yet'}
          </p>
        </div>

        {/* Card 5: Vehicle Categories */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                  {vehicleTypesCovered.length}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Vehicle Categories
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {vehicleTypesCovered.join(', ') || 'None yet'}
          </p>
        </div>

        {/* Card 6: Service Types */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                    {serviceTypesCovered.length}
                  </p>
                  <span title="Instant booking supported" className="inline-flex items-center">
                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Service Types
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            Instant point-to-point
          </p>
        </div>
      </div>

      {/* ─── 3. Filter Bar (Clean Geographic & Pricing Control Center Styling) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:px-5 shadow-sm w-full min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-3 items-end">
          {/* City / Zone */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-[#1F2B6D] dark:text-slate-300 mb-1">
              City / Zone
            </label>
            <div className="relative">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1F2B6D] appearance-none shadow-2xs cursor-pointer"
              >
                <option value="">All Cities</option>
                {citiesCovered.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Vehicle Category */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-[#1F2B6D] dark:text-slate-300 mb-1">
              Vehicle Category
            </label>
            <div className="relative">
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1F2B6D] appearance-none shadow-2xs cursor-pointer"
              >
                <option value="">All Vehicles</option>
                {vehicleCatalog.map((v) => (
                  <option key={v.id} value={v.id}>
                    {vehicleTypeLabel(v)} · {v.code}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Service Type */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-[#1F2B6D] dark:text-slate-300 mb-1">
              Service Type
            </label>
            <div className="relative">
              <select
                value={selectedServiceType}
                onChange={(e) => setSelectedServiceType(e.target.value)}
                className="w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1F2B6D] appearance-none shadow-2xs cursor-pointer"
              >
                <option value="">All Services</option>
                <option value="instant">Instant</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Status */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-[#1F2B6D] dark:text-slate-300 mb-1">
              Status
            </label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1F2B6D] appearance-none shadow-2xs cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Search by rule name, ID or zone... */}
          <div className="lg:col-span-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by rule name, ID or zone..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1F2B6D] shadow-2xs"
              />
            </div>
          </div>

          {/* Action Buttons: Reset & Apply */}
          <div className="lg:col-span-1 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#1F2B6D] dark:hover:text-white px-2 py-2 transition cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleApplyFilters}
              className="bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* ─── 4. Fare Rules Table Card (Matching Pricing Control Center Padding & Theme) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col w-full min-w-0">
        <div className="p-4 sm:px-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <Car className="w-[18px] h-[18px] text-[#1F2B6D]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight truncate">
                FARE RULES ({enrichedRules.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Standard tariff definitions applied during quotation and ride settlement.
              </p>
            </div>
          </div>
        </div>

        <DataTable
          data={enrichedRules}
          columns={columns}
          compact={true}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          hideToolbar={true}
          className="border-0 shadow-none rounded-none bg-transparent"
          onRowClick={(row) => {
            if (row.rawRule) setDetailRule(row.rawRule)
          }}
          resultLabel="fare rules"
          pageSizeOptions={[5, 10, 25, 50]}
        />
      </div>

      {/* Executive Details Popup Modal matching Tax & Commission */}
      <FareRuleDetailsModal
        rule={detailRule}
        canWrite={canWrite}
        onClose={() => setDetailRule(null)}
        onEdit={(rule) => navigate(`/pricing-management/fare-rules/${rule.id}/edit`)}
        onDuplicate={(rule) => navigate(`/pricing-management/fare-rules/new?duplicateId=${rule.id}`)}
        onActivate={(rule) => {
          setActionRule(rule)
          setActionType('activate')
          setIsModalOpen(true)
        }}
      />

      {/* Confirmation Modal for Lifecycle actions */}
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
              Are you sure you want to perform this pricing modification on rule{' '}
              <strong>{actionRule?.ruleName}</strong>?
            </p>
            {actionType === 'activate' && (
              <p className="text-amber-600 font-bold bg-amber-50/50 p-2.5 rounded border border-amber-100">
                Notice: Activating this will automatically turn off any other active rule for the
                same vehicle, city, service type, and zone.
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
