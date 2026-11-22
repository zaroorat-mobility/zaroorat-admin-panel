import React, { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import {
  Layers,
  Percent,
  Coins,
  Car,
  MapPin,
  Calendar,
  FileText,
  CheckCircle2,
  Plus,
  ChevronDown,
  Pencil,
  Eye,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
  Map,
  ArrowLeft,
  RefreshCw,
  Hexagon,
  Landmark,
} from 'lucide-react'
import { ActionDropdown, type DropdownAction } from '@/modules/driver-management/components/ActionDropdown'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { CardTableButton } from '@/shared/components/ui/CardTable'
import { useToast } from '@/shared/context/toast'
import { useCities, useServiceZones } from '@/modules/geographic-management/hooks'
import { useVehicleTypes, vehicleTypeLabel } from '@/modules/geographic-management/hooks/useVehicleTypes'
import {
  useCommissionConfigs,
  useCreateCommissionConfig,
  useActivateCommissionConfig,
  useDeactivateCommissionScope,
  useDeleteCommissionConfig,
  useGstRecoveryConfigs,
  useCreateGstRecoveryConfig,
  useTaxConfigs,
  useCreateTaxConfig,
  useLegalEntities,
  useCreateLegalEntity,
  useCreateGstRegistration,
} from '../../hooks'
import type { CommissionConfigDto, GstRecoveryConfigDto, ScopeInputDto } from '../../api/governance.api'
import type { GstConfig, TaxCommissionItem } from '../types'
import { CreateConfigurationModal } from '../components/CreateConfigurationModal'
import { TaxationSuccessModal } from '../components/TaxationSuccessModal'

const EMPTY_CONFIG: TaxCommissionItem = {
  id: 'unconfigured',
  version: 'v0',
  isCurrent: false,
  commissionRate: 0,
  gstRate: 0,
  totalDeduction: 0,
  applicableVehicles: [],
  applicableCities: [],
  applicableZones: [],
  effectiveFrom: 'Not configured',
  effectiveTo: null,
  applicationRule: 'Apply to new rides (rides accepted after effective date)',
  status: 'inactive',
  createdAt: '',
}

function toIsoDateOrNow(raw: string): string {
  if (!raw) return new Date().toISOString()
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
}

function formatDisplayDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getApiErrorText(err: unknown, fallback: string): string {
  const maybe = err as { response?: { data?: { error?: { message?: string }; message?: string } }; message?: string }
  return maybe?.response?.data?.error?.message || maybe?.response?.data?.message || maybe?.message || fallback
}

function mapServerStatus(status: string): TaxCommissionItem['status'] {
  const upper = status.toUpperCase()
  if (upper === 'ACTIVE' || upper === 'PARTIALLY_SUPERSEDED') return 'active'
  if (upper === 'SUPERSEDED' || upper === 'EXPIRED' || upper === 'RETIRED') return 'expired'
  return 'inactive'
}

function getActivationTimestamp(c: { approvedAt?: string | null; createdAt: string }): number {
  const raw = c.approvedAt || c.createdAt
  const ts = new Date(raw).getTime()
  return Number.isNaN(ts) ? 0 : ts
}

export const GstTaxationPage: React.FC = () => {
  const navigate = useNavigate()
  const { success: showSuccess, error: showError } = useToast()

  // Live PostgreSQL queries
  const commQ = useCommissionConfigs()
  const recoveryQ = useGstRecoveryConfigs()
  const taxQ = useTaxConfigs('PASSENGER_RIDE_GST')
  const legalQ = useLegalEntities()
  const { data: cities = [] } = useCities()
  const { data: serviceZones = [] } = useServiceZones({ activeOnly: true })
  const { data: vehicleTypes = [] } = useVehicleTypes()

  // Live PostgreSQL mutations
  const createCommissionMut = useCreateCommissionConfig()
  const activateCommissionMut = useActivateCommissionConfig()
  const deactivateScopeMut = useDeactivateCommissionScope()
  const deleteCommissionMut = useDeleteCommissionConfig()
  const createRecoveryMut = useCreateGstRecoveryConfig()
  const createTaxMut = useCreateTaxConfig()
  const createLegalEntityMut = useCreateLegalEntity()
  const createGstRegMut = useCreateGstRegistration()

  const [lastUpdated, setLastUpdated] = useState(() => {
    const now = new Date()
    return (
      now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ', ' +
      now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    )
  })

  // Modal & filter states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editTargetItem, setEditTargetItem] = useState<TaxCommissionItem | null>(null)
  const [deleteTargetItem, setDeleteTargetItem] = useState<TaxCommissionItem | null>(null)
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<TaxCommissionItem | null>(null)
  const [historyFilter, setHistoryFilter] = useState<'all' | 'active' | '30d'>('all')
  const [tableResetKey, setTableResetKey] = useState<number>(0)
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<Set<string>>(new Set())
  const [isGstinModalOpen, setIsGstinModalOpen] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [savedConfigItem, setSavedConfigItem] = useState<TaxCommissionItem | null>(null)

  const latestRecoveryRate = useMemo(() => {
    const list = recoveryQ.data ?? []
    const activeList = list.filter((r: GstRecoveryConfigDto) => r.status === 'ACTIVE')
    const active =
      activeList.sort((a, b) => getActivationTimestamp(b) - getActivationTimestamp(a))[0] ??
      list[0]
    return active ? active.recoveryRatePct : 0
  }, [recoveryQ.data])

  // Map live PostgreSQL Commission + GST Recovery rows into your UI cards & history table
  const historyList = useMemo<TaxCommissionItem[]>(() => {
    const list = commQ.data ?? []
    const recoveryByVersion = new globalThis.Map<number, GstRecoveryConfigDto>()
    for (const r of recoveryQ.data ?? []) {
      recoveryByVersion.set(r.version, r)
    }

    const cityNameByCode = new globalThis.Map<string, string>(
      cities.map((c) => [c.code.toUpperCase(), c.name]),
    )
    const vehicleNameById = new globalThis.Map<string, string>(
      vehicleTypes.map((v) => [v.id, vehicleTypeLabel(v)]),
    )
    const zoneNameById = new globalThis.Map<string, string>(
      serviceZones.map((z) => [z.id, z.name]),
    )

    const primaryActiveId =
      list
        .filter((c: CommissionConfigDto) => mapServerStatus(c.status) === 'active')
        .sort((a, b) => getActivationTimestamp(b) - getActivationTimestamp(a))[0]?.id ?? null

    // Always float Current first, then other Active rules (most recently activated first),
    // then Inactive/Expired rules (newest version first).
    const sortedList = [...list].sort((a, b) => {
      const aIsCurrent = primaryActiveId !== null && a.id === primaryActiveId
      const bIsCurrent = primaryActiveId !== null && b.id === primaryActiveId
      if (aIsCurrent !== bIsCurrent) return aIsCurrent ? -1 : 1

      const aIsActive = mapServerStatus(a.status) === 'active'
      const bIsActive = mapServerStatus(b.status) === 'active'
      if (aIsActive !== bIsActive) return aIsActive ? -1 : 1

      if (aIsActive && bIsActive) {
        const tsDiff = getActivationTimestamp(b) - getActivationTimestamp(a)
        if (tsDiff !== 0) return tsDiff
      }

      if (b.version !== a.version) return b.version - a.version
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return sortedList.map((c: CommissionConfigDto) => {
      const matchedRec = recoveryByVersion.get(c.version)
      const gstRate = matchedRec ? matchedRec.recoveryRatePct : latestRecoveryRate
      const cityLabels = Array.from(
        new Set(
          c.scopes
            .map((s) =>
              s.cityCode && s.cityCode !== '__GLOBAL__'
                ? cityNameByCode.get(s.cityCode.toUpperCase()) ?? s.cityCode
                : 'All Cities',
            ),
        ),
      )
      const vehicleIds = Array.from(
        new Set(
          c.scopes
            .map((s) =>
              s.vehicleTypeId && s.vehicleTypeId !== '00000000-0000-0000-0000-000000000000'
                ? s.vehicleTypeId
                : null,
            )
            .filter((id): id is string => Boolean(id)),
        ),
      )
      const vehicleLabels =
        vehicleIds.length > 0
          ? vehicleIds.map((id) => vehicleNameById.get(id) ?? id)
          : ['All Vehicles']
      const zoneLabels = Array.from(
        new Set(
          c.scopes.map((s) =>
            s.serviceZoneId && s.serviceZoneId !== '00000000-0000-0000-0000-000000000000'
              ? zoneNameById.get(s.serviceZoneId) ?? s.serviceZoneId.slice(0, 8)
              : 'All Zones',
          ),
        ),
      )
      const status = mapServerStatus(c.status)
      return {
        id: c.id,
        version: `v${c.version}`,
        isCurrent: primaryActiveId !== null && c.id === primaryActiveId,
        commissionRate: c.commissionRatePct,
        gstRate,
        totalDeduction: Number((c.commissionRatePct + gstRate).toFixed(2)),
        applicableVehicles: vehicleLabels,
        applicableVehicleIds: vehicleIds,
        applicableCities: cityLabels.length > 0 ? cityLabels : ['All Cities'],
        applicableZones: zoneLabels.length > 0 ? zoneLabels : ['All Zones'],
        effectiveFrom: formatDisplayDate(c.declaredEffectiveFrom),
        effectiveTo: c.declaredEffectiveTo ? formatDisplayDate(c.declaredEffectiveTo) : null,
        applicationRule: 'Apply to new rides (rides accepted after effective date)',
        includeBookingFee: c.includeBookingFee,
        roundOffRupee: c.roundOffRupee,
        status,
        createdAt: c.createdAt,
      }
    })
  }, [commQ.data, recoveryQ.data, cities, serviceZones, vehicleTypes, latestRecoveryRate])

  const activeConfig = useMemo<TaxCommissionItem>(() => {
    return (
      historyList.find((item) => item.isCurrent) ??
      historyList.find((item) => item.status === 'active') ??
      historyList[0] ??
      EMPTY_CONFIG
    )
  }, [historyList])

  const gstSettings = useMemo<GstConfig>(() => {
    const primaryEntity = (legalQ.data ?? [])[0]
    const primaryReg = primaryEntity?.gstRegistrations?.find((r) => r.isActive) ?? primaryEntity?.gstRegistrations?.[0]
    const activeTaxes = (taxQ.data ?? []).filter((t) => t.status === 'ACTIVE')
    const activeTax =
      activeTaxes.sort((a, b) => getActivationTimestamp(b) - getActivationTimestamp(a))[0] ??
      (taxQ.data ?? [])[0]
    const totalRate = activeTax?.ratePct ?? latestRecoveryRate
    return {
      cgst: Number((totalRate / 2).toFixed(2)),
      sgst: Number((totalRate / 2).toFixed(2)),
      igst: Number(totalRate.toFixed(2)),
      gstin: primaryReg?.gstin ?? 'Not Registered',
      sacCode: activeTax?.sacCode ?? '',
      status: activeTax?.isEnabled ? 'active' : 'inactive',
    }
  }, [legalQ.data, taxQ.data, latestRecoveryRate])

  // GSTIN form state
  const [formGstin, setFormGstin] = useState<string>('')
  const [formSac, setFormSac] = useState<string>('')

  const totalDeduction = Number((activeConfig.commissionRate + activeConfig.gstRate).toFixed(2))

  const handleRefresh = async () => {
    await Promise.allSettled([
      commQ.refetch(),
      recoveryQ.refetch(),
      taxQ.refetch(),
      legalQ.refetch(),
    ])
    const now = new Date()
    setLastUpdated(
      now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
        ', ' +
        now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    )
    showSuccess('Tax & Commission Refreshed', 'Synchronized live configurations from server.')
  }

  // Open modal in edit mode (optionally prefilled with a specific history row)
  const handleOpenEdit = (target?: TaxCommissionItem) => {
    setEditTargetItem(target ?? activeConfig)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  // Open modal in create mode
  const handleOpenCreate = () => {
    setEditTargetItem(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  // Activate an inactive/expired configuration row IN PLACE in PostgreSQL (no duplicate version, no create popup)
  const handleActivateHistoryItem = async (item: TaxCommissionItem) => {
    try {
      await activateCommissionMut.mutateAsync(item.id)
      setTableResetKey((k) => k + 1)
      showSuccess(
        'Configuration Activated',
        `${item.version} is now active. Any previous overlapping rule has been expired.`,
      )
    } catch (err) {
      showError(
        'Activation Failed',
        getApiErrorText(err, 'Could not activate configuration.'),
      )
    }
  }

  // Deactivate all enforced scopes of an active configuration row in PostgreSQL
  const handleDeactivateHistoryItem = async (item: TaxCommissionItem) => {
    const raw = (commQ.data ?? []).find((c) => c.id === item.id)
    const enforcedScopes = raw?.scopes.filter((s) => s.isEnforced && !s.closedAt) ?? []
    if (enforcedScopes.length === 0) {
      showError('Already Inactive', 'No active enforced scopes found for this configuration.')
      return
    }
    try {
      for (const scope of enforcedScopes) {
        await deactivateScopeMut.mutateAsync({ id: item.id, scopeId: scope.id })
      }
      showSuccess('Configuration Deactivated', `${item.version} has been deactivated in PostgreSQL.`)
    } catch (err) {
      showError(
        'Deactivation Failed',
        getApiErrorText(err, 'Could not deactivate configuration scopes.'),
      )
    }
  }

  const filteredHistoryList = useMemo(() => {
    if (historyFilter === 'active') {
      return historyList.filter((item) => item.status === 'active')
    }
    if (historyFilter === '30d') {
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
      return historyList.filter((item) => {
        const ts = new Date(item.createdAt).getTime()
        return Number.isNaN(ts) || ts >= cutoff
      })
    }
    return historyList
  }, [historyList, historyFilter])

  const historyColumns: DataTableColumn<TaxCommissionItem>[] = [
    {
      key: 'version',
      label: 'Version',
      sortable: true,
      align: 'left',
      render: (_: unknown, item: TaxCommissionItem) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <div className="min-w-7 h-7 px-1 rounded-md bg-[#1F2B6D] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
            {item.version}
          </div>
          <span className="font-bold text-slate-800 dark:text-white text-xs">
            {item.version}
          </span>
          {item.isCurrent && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/20 dark:text-emerald-400">
              Current
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'commissionRate',
      label: 'Commission',
      sortable: true,
      align: 'right',
      render: (_: unknown, item: TaxCommissionItem) => (
        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs whitespace-nowrap">
          {item.commissionRate.toFixed(2)}%
        </span>
      ),
    },
    {
      key: 'gstRate',
      label: 'Ride GST',
      sortable: true,
      align: 'right',
      render: (_: unknown, item: TaxCommissionItem) => (
        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs whitespace-nowrap">
          {item.gstRate.toFixed(2)}%
        </span>
      ),
    },
    {
      key: 'totalDeduction',
      label: 'Total Deduction',
      sortable: true,
      align: 'center',
      render: (_: unknown, item: TaxCommissionItem) => {
        const total = Number((item.commissionRate + item.gstRate).toFixed(2))
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-black font-mono bg-blue-50 text-[#1F2B6D] dark:bg-blue-950/40 dark:text-blue-300 whitespace-nowrap">
            {total.toFixed(2)}%
          </span>
        )
      },
    },
    {
      key: 'applicableCities',
      label: 'Applicability',
      align: 'left',
      render: (_: unknown, item: TaxCommissionItem) => {
        const cityDisplay =
          item.applicableCities.length === 1 && item.applicableCities[0] === 'All Cities'
            ? 'All Cities'
            : item.applicableCities.length <= 2
              ? item.applicableCities.join(', ')
              : `${item.applicableCities.length} Cities`
        return (
          <span className="text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">
            {item.applicableVehicles.join(', ')} • {cityDisplay}
          </span>
        )
      },
    },
    {
      key: 'effectiveFrom',
      label: 'Effective Period',
      align: 'center',
      render: (_: unknown, item: TaxCommissionItem) => (
        <span className="font-mono text-slate-600 dark:text-slate-400 text-[11.5px] whitespace-nowrap">
          {item.effectiveFrom} – {item.effectiveTo || 'No End Date'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (_: unknown, item: TaxCommissionItem) =>
        item.status === 'active' ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/20 dark:text-emerald-400 whitespace-nowrap">
            Active
          </span>
        ) : item.status === 'inactive' ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 whitespace-nowrap">
            Inactive
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 whitespace-nowrap">
            Expired
          </span>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      render: (_: unknown, item: TaxCommissionItem) => {
        const isActive = item.status === 'active'
        const rowActions: DropdownAction[] = [
          {
            label: 'View Details',
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => setSelectedHistoryItem(item),
          },
          {
            label: 'Edit Rates',
            icon: <Pencil className="h-3.5 w-3.5" />,
            onClick: () => handleOpenEdit(item),
          },
          isActive
            ? {
                label: 'Deactivate',
                icon: <ToggleLeft className="h-3.5 w-3.5" />,
                onClick: () => void handleDeactivateHistoryItem(item),
              }
            : {
                label: 'Activate Now',
                icon: <ToggleRight className="h-3.5 w-3.5" />,
                onClick: () => void handleActivateHistoryItem(item),
              },
          {
            label: 'Delete',
            icon: <Trash2 className="h-3.5 w-3.5" />,
            variant: 'danger',
            onClick: () => setDeleteTargetItem(item),
          },
        ]
        return (
          <div
            className="flex items-center justify-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <CardTableButton
              variant="outline"
              onClick={() => setSelectedHistoryItem(item)}
            >
              Details
            </CardTableButton>
            <ActionDropdown actions={rowActions} />
          </div>
        )
      },
    },
  ]

  // Confirm & delete configuration row from PostgreSQL
  const handleConfirmDelete = async () => {
    if (!deleteTargetItem) return
    try {
      await deleteCommissionMut.mutateAsync(deleteTargetItem.id)
      showSuccess('Configuration Deleted', `${deleteTargetItem.version} was deleted from PostgreSQL.`)
      setDeleteTargetItem(null)
    } catch (err) {
      showError(
        'Delete Failed',
        getApiErrorText(err, 'Could not delete configuration from server.'),
      )
    }
  }

  // Persist directly to PostgreSQL (Commission + GST Recovery + Passenger GST)
  const handleSaveModal = async (newConfigData: Omit<TaxCommissionItem, 'id' | 'createdAt'>) => {
    try {
      const hasAllCities = newConfigData.applicableCities.some(
        (c) => c.toLowerCase() === 'all cities',
      )
      const matchedCities = hasAllCities
        ? []
        : newConfigData.applicableCities
            .map((label) => {
              const match = cities.find(
                (c) =>
                  c.name.toLowerCase() === label.toLowerCase() ||
                  c.code.toLowerCase() === label.toLowerCase(),
              )
              return match?.code ?? null
            })
            .filter((code): code is string => Boolean(code))

      const activeVehicleCount = vehicleTypes.filter((v) => v.isActive).length
      const hasAllVehicles = newConfigData.applicableVehicles.some(
        (v) => v.toLowerCase() === 'all vehicles',
      )
      const explicitVehicleIds = (newConfigData.applicableVehicleIds ?? []).filter(Boolean)
      const matchedVehicleIds =
        hasAllVehicles
          ? []
          : explicitVehicleIds.length > 0
            ? explicitVehicleIds
            : newConfigData.applicableVehicles
                .map((label) => {
                  const norm = label.toLowerCase().trim()
                  const match = vehicleTypes.find(
                    (v) =>
                      vehicleTypeLabel(v).toLowerCase() === norm ||
                      (v.name || '').toLowerCase() === norm ||
                      (v.code || '').toLowerCase() === norm,
                  )
                  return match?.id ?? null
                })
                .filter((id): id is string => Boolean(id))

      const hasAllZones = newConfigData.applicableZones.some(
        (z) => z.toLowerCase() === 'all zones',
      )
      const matchedZones = hasAllZones
        ? []
        : newConfigData.applicableZones
            .map((label) =>
              serviceZones.find((z) => z.name.toLowerCase() === label.toLowerCase()) ?? null,
            )
            .filter((z): z is NonNullable<typeof z> => Boolean(z))

      const cityTargets: Array<string | null> = matchedCities.length > 0 ? matchedCities : [null]
      const vehicleTargets: Array<string | null> =
        matchedVehicleIds.length > 0 && matchedVehicleIds.length < activeVehicleCount
          ? matchedVehicleIds
          : [null]

      const scopes: ScopeInputDto[] = []
      if (matchedZones.length > 0) {
        for (const zone of matchedZones) {
          for (const vehicleTypeId of vehicleTargets) {
            scopes.push({
              cityCode: zone.cityCode,
              serviceZoneId: zone.id,
              ...(vehicleTypeId ? { vehicleTypeId } : {}),
            })
          }
        }
      } else {
        for (const cityCode of cityTargets) {
          for (const vehicleTypeId of vehicleTargets) {
            scopes.push({
              ...(cityCode ? { cityCode } : {}),
              ...(vehicleTypeId ? { vehicleTypeId } : {}),
            })
          }
        }
      }

      const declaredEffectiveFrom = toIsoDateOrNow(newConfigData.effectiveFrom)
      const declaredEffectiveTo = newConfigData.effectiveTo
        ? toIsoDateOrNow(newConfigData.effectiveTo)
        : null

      const createdComm = await createCommissionMut.mutateAsync({
        commissionRatePct: newConfigData.commissionRate,
        isEnabled: newConfigData.status === 'active',
        baseRule: 'RIDE_SUBTOTAL_BEFORE_DISCOUNT',
        includeBookingFee: Boolean(newConfigData.includeBookingFee),
        roundOffRupee: Boolean(newConfigData.roundOffRupee),
        declaredEffectiveFrom,
        declaredEffectiveTo,
        reason: `${modalMode === 'edit' ? 'Updated' : 'Created'} via Tax & Commission console`,
        activateImmediately: newConfigData.status === 'active',
        scopes,
      })

      await createRecoveryMut.mutateAsync({
        recoveryRatePct: newConfigData.gstRate,
        isEnabled: newConfigData.status === 'active',
        baseRule: 'TAXABLE_VALUE',
        roundOffRupee: Boolean(newConfigData.roundOffRupee),
        declaredEffectiveFrom,
        declaredEffectiveTo,
        activateImmediately: newConfigData.status === 'active',
        scopes,
      })

      await createTaxMut.mutateAsync({
        kind: 'PASSENGER_RIDE_GST',
        ratePct: newConfigData.gstRate,
        isEnabled: newConfigData.status === 'active',
        inclusive: false,
        waitingTaxable: false,
        sacCode: gstSettings.sacCode?.trim() || '996411',
        legalReference: 'Configured via Admin Tax & Commission console',
        declaredEffectiveFrom,
        declaredEffectiveTo,
        activateImmediately: newConfigData.status === 'active',
        scopes,
      })

      const savedItem: TaxCommissionItem = {
        id: createdComm.id,
        ...newConfigData,
        version: `v${createdComm.version}`,
        effectiveFrom: formatDisplayDate(createdComm.declaredEffectiveFrom),
        effectiveTo: createdComm.declaredEffectiveTo
          ? formatDisplayDate(createdComm.declaredEffectiveTo)
          : null,
        isCurrent: newConfigData.status === 'active',
        createdAt: createdComm.createdAt,
      }

      showSuccess(
        modalMode === 'edit' ? 'Configuration Saved' : 'New Configuration Saved',
        `Persisted version v${createdComm.version} in PostgreSQL.`,
      )
      setSavedConfigItem(savedItem)
      setIsModalOpen(false)
      setIsSuccessModalOpen(true)
    } catch (err) {
      showError('Failed to Save Configuration', getApiErrorText(err, 'Could not persist configuration to server.'))
    }
  }

  const handleSaveGstin = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanGstin = formGstin.trim().toUpperCase()
    if (cleanGstin.length !== 15) {
      showError('Invalid GSTIN', 'GSTIN must be exactly 15 characters.')
      return
    }
    try {
      let entityId = (legalQ.data ?? [])[0]?.id
      if (!entityId) {
        const created = await createLegalEntityMut.mutateAsync({
          legalEntityName: 'Zaroorat Mobility Private Limited',
          pan: cleanGstin.slice(2, 12),
          headOfficeAddress: 'Registered Corporate Office',
        })
        entityId = created.id
      }
      const stateCode = cleanGstin.slice(0, 2)
      await createGstRegMut.mutateAsync({
        legalEntityId: entityId,
        payload: {
          gstin: cleanGstin,
          stateCode,
          stateName: `State ${stateCode}`,
          registrationAddress: 'Registered State Office',
        },
      })
      setIsGstinModalOpen(false)
      showSuccess('Corporate GSTIN Saved', 'Persisted GST registration in PostgreSQL.')
    } catch (err) {
      showError('Failed to Save GSTIN', getApiErrorText(err, 'Could not persist GST registration.'))
    }
  }

  return (
    <PageWrapper className="space-y-4 pt-1 pb-6 px-3 sm:px-5 w-full max-w-full overflow-x-hidden text-left">
      {/* ─── 1. Header (Matching Geographic Management Standards) ───────────── */}
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
              Tax & Commission
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage platform commission, ride GST recovery, and statutory tax parameters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Last updated {lastUpdated}
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh data"
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-[#1F2B6D] dark:text-slate-300" />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white px-4 py-2 rounded-[10px] text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Configuration</span>
            <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-80" />
          </button>
        </div>
      </div>

      {/* ─── 2. Top 5 Metric Cards (Exact Geographic Management Tokens) ─────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Platform Commission */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none font-mono">
                  {activeConfig.commissionRate.toFixed(2)}%
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Platform Commission
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            Deducted per completed ride
          </p>
        </div>

        {/* Card 2: Ride GST Recovery */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none font-mono">
                  {activeConfig.gstRate.toFixed(2)}%
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Ride GST Recovery
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            {gstSettings.sacCode ? `SAC ${gstSettings.sacCode} recovery` : 'Ride GST recovery'}
          </p>
        </div>

        {/* Card 3: Total Deduction */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none font-mono">
                  {totalDeduction.toFixed(2)}%
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Total Deduction
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            Recovered from driver wallet
          </p>
        </div>

        {/* Card 4: Applicable Vehicles */}
        {(() => {
          const isAllVehicles =
            activeConfig.applicableVehicles.length === 0 ||
            activeConfig.applicableVehicles.some((v) => v.toLowerCase() === 'all vehicles')
          const activeVehicleCount = vehicleTypes.filter((v) => v.isActive).length
          const headline = isAllVehicles
            ? 'All'
            : `${activeConfig.applicableVehicles.length} ${
                activeConfig.applicableVehicles.length === 1 ? 'Type' : 'Types'
              }`
          const subtitle = isAllVehicles
            ? activeVehicleCount > 0
              ? `All Vehicles (${activeVehicleCount} active)`
              : 'All Vehicles'
            : activeConfig.applicableVehicles.join(', ')
          return (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-[42px] h-[42px] rounded-full bg-[#1F2B6D] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                      {headline}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                      Applicable Vehicles
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 truncate">
                {subtitle}
              </p>
            </div>
          )
        })()}

        {/* Card 5: Enforcement Status */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-[42px] h-[42px] rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-extrabold text-[#1F2B6D] dark:text-white tracking-tight leading-none">
                    Active
                  </p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/20 dark:text-emerald-400">
                    Live
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Enforcement Status
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            Enforced on all eligible trips
          </p>
        </div>
      </div>

      {/* ─── 3. Middle Section: Active Configuration & Quick Actions ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Column (8 cols): Active Configuration */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-4 flex flex-col justify-between">
          <div>
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Hexagon className="w-[20px] h-[20px] text-[#1F2B6D] dark:text-[#8B93D9]" strokeWidth={2.5} />
                <div>
                  <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight">
                    Active Configuration • Default Deduction (Current)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Applicable to selected vehicles, cities, and service zones.
                  </p>
                </div>
              </div>

              <div className="text-right flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11.5px] font-bold bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/20 dark:text-emerald-400">
                  Active
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline font-mono">
                  Effective From {activeConfig.effectiveFrom}
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenEdit()}
                  className="p-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="Edit Configuration"
                >
                  <Pencil className="w-3.5 h-3.5 text-[#1F2B6D] dark:text-blue-400" />
                  <span>Edit</span>
                </button>
              </div>
            </div>

            {/* Content: Full-Width Equation Box & Specifications Grid */}
            <div className="space-y-4 pt-3">
              {/* Equation Box */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-center">
                <div className="flex-1">
                  <span className="text-base sm:text-lg font-black text-[#1F2B6D] dark:text-white font-mono block leading-tight">
                    {activeConfig.commissionRate.toFixed(2)}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium leading-tight">
                    Platform Commission
                  </span>
                </div>

                <span className="text-slate-400 font-bold text-lg px-3">+</span>

                <div className="flex-1">
                  <span className="text-base sm:text-lg font-black text-[#1F2B6D] dark:text-white font-mono block leading-tight">
                    {activeConfig.gstRate.toFixed(2)}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium leading-tight">
                    Ride GST Recovery
                  </span>
                </div>

                <span className="text-slate-400 font-bold text-lg px-3">=</span>

                <div className="flex-1 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-lg py-1.5 px-3">
                  <span className="text-base sm:text-lg font-black text-[#1F2B6D] dark:text-blue-400 font-mono block leading-tight">
                    {totalDeduction.toFixed(2)}%
                  </span>
                  <span className="text-xs text-blue-700 dark:text-blue-300 font-bold leading-tight">
                    Total Deduction
                  </span>
                </div>
              </div>

              {/* Specs 2-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs pt-1">
                <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60 pb-2">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Car className="w-4 h-4 text-slate-400" />
                    <span>Vehicle Types:</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {activeConfig.applicableVehicles.join(', ')}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60 pb-2">
                  <div className="flex items-center gap-1.5 font-medium">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>Operating Cities:</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {activeConfig.applicableCities.join(', ')}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60 pb-2">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Map className="w-4 h-4 text-slate-400" />
                    <span>Service Zones:</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {activeConfig.applicableZones.join(', ')}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/60 pb-2">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Landmark className="w-4 h-4 text-slate-400" />
                    <span>Corporate GSTIN / SAC:</span>
                  </div>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">
                    {gstSettings.gstin}{gstSettings.sacCode ? ` (SAC ${gstSettings.sacCode})` : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400 sm:col-span-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-1.5 font-medium">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Application Rule:</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {activeConfig.applicationRule}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Quick Actions (Matching Geographic Management) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-[#1F2B6D] dark:text-white leading-none">
              Quick Actions
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Action 1: Add Configuration */}
              <button
                type="button"
                onClick={handleOpenCreate}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#1F2B6D]/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-[#1F2B6D] dark:text-white">
                  <Plus className="w-[18px] h-[18px]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-bold text-[#1F2B6D] dark:text-slate-100 leading-tight">
                    New Version
                  </p>
                  <p className="text-[11px] text-slate-400 leading-tight truncate">
                    Create rate card
                  </p>
                </div>
              </button>

              {/* Action 2: Edit Rates */}
              <button
                type="button"
                onClick={() => handleOpenEdit()}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#1F2B6D]/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-[#1F2B6D] dark:text-white">
                  <Percent className="w-[18px] h-[18px]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-bold text-[#1F2B6D] dark:text-slate-100 leading-tight">
                    Edit Rates
                  </p>
                  <p className="text-[11px] text-slate-400 leading-tight truncate">
                    Adjust percentages
                  </p>
                </div>
              </button>

              {/* Action 3: Corporate GSTIN */}
              <button
                type="button"
                onClick={() => {
                    setFormGstin(gstSettings.gstin === 'Not Registered' ? '' : gstSettings.gstin)
                    setFormSac(gstSettings.sacCode ?? '')
                    setIsGstinModalOpen(true)
                  }}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#1F2B6D]/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-[#1F2B6D] dark:text-white">
                  <Landmark className="w-[18px] h-[18px]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-bold text-[#1F2B6D] dark:text-slate-100 leading-tight">
                    GSTIN & SAC
                  </p>
                  <p className="text-[11px] text-slate-400 leading-tight truncate">
                    Legal tax identity
                  </p>
                </div>
              </button>

              {/* Action 4: Fare Rules */}
              <button
                type="button"
                onClick={() => navigate('/pricing-management/fare-rules')}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#1F2B6D]/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2.5 bg-white dark:bg-slate-900 cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-[#1F2B6D] dark:text-white">
                  <Car className="w-[18px] h-[18px]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-bold text-[#1F2B6D] dark:text-slate-100 leading-tight">
                    Fare Rules
                  </p>
                  <p className="text-[11px] text-slate-400 leading-tight truncate">
                    Base tariff cards
                  </p>
                </div>
              </button>
            </div>

            {/* Stepper Guide */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <h4 className="text-xs font-bold text-[#1F2B6D] dark:text-white">
                Configuration Process
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-[#1F2B6D] font-bold flex items-center justify-center text-[10px]">1</span>
                  <span>Set Deduction Rates (Commission & GST)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-[#1F2B6D] font-bold flex items-center justify-center text-[10px]">2</span>
                  <span>Choose Vehicle, City, and Zone Applicability</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-[#1F2B6D] font-bold flex items-center justify-center text-[10px]">3</span>
                  <span>Set Schedule & Activate Immediately</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. Bottom Section: Configuration History (Consistent DataTable) ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col w-full min-w-0">
        <div className="p-4 sm:px-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <Hexagon className="w-[18px] h-[18px] text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight truncate">
                CONFIGURATION HISTORY ({filteredHistoryList.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                All past and active tax & commission policy versions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setHistoryFilter((prev) => (prev === 'all' ? 'active' : prev === 'active' ? '30d' : 'all'))
              setTableResetKey((k) => k + 1)
            }}
            className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1 cursor-pointer flex-shrink-0"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {historyFilter === 'all'
                ? 'All Time'
                : historyFilter === 'active'
                  ? 'Active Only'
                  : 'Last 30 Days'}
            </span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <DataTable
          key={tableResetKey}
          data={filteredHistoryList}
          columns={historyColumns}
          compact={true}
          isLoading={commQ.isLoading}
          selectable={false}
          selectedIds={selectedHistoryIds}
          onSelectionChange={setSelectedHistoryIds}
          hideToolbar={true}
          className="border-0 shadow-none rounded-none bg-transparent"
          onRowClick={(row) => setSelectedHistoryItem(row)}
          resultLabel="configurations"
          pageSizeOptions={[5, 10, 25, 50]}
        />
      </div>

      {/* ─── 5. Modal: Create / Edit Configuration (4-Step Wizard) ────────────── */}
      <CreateConfigurationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        initialValues={modalMode === 'edit' ? (editTargetItem ?? activeConfig) : null}
        vehicleOptions={vehicleTypes}
        cityOptions={cities}
        zoneOptions={serviceZones}
      />

      {/* ─── 5.0 Confirm Delete Configuration ───────────────────────────────── */}
      <ConfirmationModal
        isOpen={Boolean(deleteTargetItem)}
        onCancel={() => setDeleteTargetItem(null)}
        onConfirm={() => void handleConfirmDelete()}
        title="Delete Configuration?"
        description={
          deleteTargetItem
            ? `Permanently delete ${deleteTargetItem.version} (${deleteTargetItem.commissionRate.toFixed(2)}% Commission · ${deleteTargetItem.gstRate.toFixed(2)}% GST) from PostgreSQL?`
            : ''
        }
        confirmText="Delete"
        variant="danger"
        loading={deleteCommissionMut.isPending}
      />

      {/* ─── 5.1 Success Modal: Taxation Setup Completed ────────────────────── */}
      <TaxationSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        onGoToOverview={() => {
          setIsSuccessModalOpen(false)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        onViewConfiguration={() => {
          setIsSuccessModalOpen(false)
          if (savedConfigItem) {
            setSelectedHistoryItem(savedConfigItem)
          } else {
            setSelectedHistoryItem(activeConfig)
          }
        }}
      />

      {/* ─── 6. Modal: Corporate GSTIN & SAC Code ─────────────────────────────── */}
      {isGstinModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] m-0 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#1F2B6D] dark:text-white">
                    Corporate GSTIN & SAC Settings
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Statutory tax identifier printed on ride invoices.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGstinModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveGstin} className="p-5 space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Corporate GSTIN (15 Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={formGstin}
                    onChange={(e) => setFormGstin(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] h-10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Services Accounting Code (SAC)
                  </label>
                  <input
                    type="text"
                    value={formSac}
                    onChange={(e) => setFormSac(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] h-10"
                  />
                  <p className="text-[10.5px] text-slate-400 mt-1">
                    SAC 9964: Passenger transport services by road.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <CardTableButton
                    variant="outline"
                    onClick={() => setIsGstinModalOpen(false)}
                  >
                    Cancel
                  </CardTableButton>
                  <button
                    type="submit"
                    className="bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white px-5 py-2 rounded-[10px] text-xs font-semibold shadow-sm transition cursor-pointer"
                  >
                    Save Registration
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* ─── 7. Modal: View Details ───────────────────────────────────────────── */}
      {selectedHistoryItem &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] m-0 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6"
            onClick={() => setSelectedHistoryItem(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 sm:px-7 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/60 dark:bg-slate-900/80">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="min-w-10 h-10 px-2 rounded-xl bg-[#1F2B6D] flex items-center justify-center text-white text-xs font-extrabold tracking-wide shadow-sm flex-shrink-0">
                    {selectedHistoryItem.version}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-[#1F2B6D] dark:text-white leading-tight">
                        Configuration Details ({selectedHistoryItem.version})
                      </h3>
                      {selectedHistoryItem.isCurrent && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/30 dark:text-emerald-400">
                          Current
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                          selectedHistoryItem.status === 'active'
                            ? 'bg-[#E8FAF0] text-[#10B981] dark:bg-emerald-950/30 dark:text-emerald-400'
                            : selectedHistoryItem.status === 'inactive'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {selectedHistoryItem.status}
                      </span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                      Complete tax, commission, scope, and schedule parameters stored in PostgreSQL.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedHistoryItem(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition cursor-pointer flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 sm:p-7 space-y-6 overflow-y-auto flex-1">
                {/* Rate Summary Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <Percent className="w-3.5 h-3.5 text-[#1F2B6D] dark:text-blue-400" />
                      <span>Platform Commission</span>
                    </div>
                    <p className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-2 leading-none">
                      {selectedHistoryItem.commissionRate.toFixed(2)}%
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1.5">Per completed ride</p>
                  </div>

                  <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <Coins className="w-3.5 h-3.5 text-[#1F2B6D] dark:text-blue-400" />
                      <span>Ride GST Recovery</span>
                    </div>
                    <p className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-2 leading-none">
                      {selectedHistoryItem.gstRate.toFixed(2)}%
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      {gstSettings.sacCode ? `SAC ${gstSettings.sacCode}` : 'Statutory GST recovery'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#1F2B6D]/20 dark:border-blue-500/30 bg-blue-50/70 dark:bg-blue-950/30 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#1F2B6D] dark:text-blue-300">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Total Deduction</span>
                    </div>
                    <p className="text-2xl font-extrabold font-mono text-[#1F2B6D] dark:text-blue-300 mt-2 leading-none">
                      {selectedHistoryItem.totalDeduction.toFixed(2)}%
                    </p>
                    <p className="text-[11px] text-[#1F2B6D]/70 dark:text-blue-300/70 mt-1.5">
                      Commission + Ride GST
                    </p>
                  </div>
                </div>

                {/* Applicability & Scope Details */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-500 dark:text-slate-400">
                      <Car className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>Applicable Vehicles</span>
                    </div>
                    <div className="flex flex-wrap sm:justify-end gap-1.5">
                      {selectedHistoryItem.applicableVehicles.map((vehicle) => (
                        <span
                          key={vehicle}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
                        >
                          {vehicle}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-500 dark:text-slate-400">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>Operating Cities</span>
                    </div>
                    <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white sm:text-right">
                      {selectedHistoryItem.applicableCities.join(', ')}
                    </span>
                  </div>

                  <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-500 dark:text-slate-400">
                      <Map className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>Service Zones</span>
                    </div>
                    <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white sm:text-right">
                      {selectedHistoryItem.applicableZones.join(', ')}
                    </span>
                  </div>

                  <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-500 dark:text-slate-400">
                      <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>Effective Period</span>
                    </div>
                    <span className="text-xs sm:text-[13px] font-mono font-bold text-slate-900 dark:text-white sm:text-right">
                      {selectedHistoryItem.effectiveFrom} – {selectedHistoryItem.effectiveTo || 'No End Date'}
                    </span>
                  </div>

                  <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-500 dark:text-slate-400">
                      <CheckCircle2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>Calculation Options</span>
                    </div>
                    <div className="flex flex-wrap sm:justify-end gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11.5px] font-semibold ${
                          selectedHistoryItem.includeBookingFee
                            ? 'bg-blue-50 text-[#1F2B6D] dark:bg-blue-950/40 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        Booking Fee: {selectedHistoryItem.includeBookingFee ? 'Included' : 'Excluded'}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11.5px] font-semibold ${
                          selectedHistoryItem.roundOffRupee
                            ? 'bg-blue-50 text-[#1F2B6D] dark:bg-blue-950/40 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        Round Off ₹1: {selectedHistoryItem.roundOffRupee ? 'Enabled' : 'Exact Paise'}
                      </span>
                    </div>
                  </div>

                  <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-500 dark:text-slate-400">
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>Application Rule</span>
                    </div>
                    <span className="text-xs sm:text-[13px] font-semibold text-slate-800 dark:text-slate-200 sm:text-right">
                      {selectedHistoryItem.applicationRule}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 sm:px-7 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedHistoryItem
                      setSelectedHistoryItem(null)
                      handleOpenEdit(target)
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Rates</span>
                  </button>
                  {selectedHistoryItem.status !== 'active' && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedHistoryItem
                        setSelectedHistoryItem(null)
                        void handleActivateHistoryItem(target)
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                    >
                      <ToggleRight className="w-4 h-4" />
                      <span>Activate Now</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedHistoryItem(null)}
                  className="bg-[#1F2B6D] hover:bg-[#182258] active:scale-[0.98] text-white px-5 py-2 rounded-[10px] text-xs font-semibold shadow-sm transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </PageWrapper>
  )
}

export default GstTaxationPage
