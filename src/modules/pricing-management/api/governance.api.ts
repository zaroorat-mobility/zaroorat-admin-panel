import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { PaginatedResponse, QueryParams } from '@/shared/types'
import type { AuditLogEntry } from '@/shared/services/auditLogger'

export const PRICING_AUDIT_ENTITY_TYPES = [
  'pricing_rule',
  'surge_window',
  'surge_zone',
  'cancellation_policy',
  'commission_configuration',
  'commission_configuration_scope',
  'tax_configuration',
  'gst_recovery_configuration',
  'legal_entity',
  'company_gst_registration',
  'city_supply_registration',
  'commission_collection_failure',
  'fiscal_document',
  'document_series',
  'compliance_template',
] as const

export interface ConfigScopeDto {
  id: string
  configId: string
  scopeLevel: 'GLOBAL' | 'GLOBAL_VEHICLE' | 'CITY' | 'CITY_VEHICLE' | 'ZONE' | 'ZONE_VEHICLE'
  cityCode: string
  serviceZoneId: string
  vehicleTypeId: string
  effectiveFrom: string
  effectiveTo: string | null
  isEnforced: boolean
  supersededByScopeId: string | null
  closedAt: string | null
}

export interface ScopeInputDto {
  cityCode?: string | null
  serviceZoneId?: string | null
  vehicleTypeId?: string | null
}

export interface CommissionConfigDto {
  id: string
  familyId: string
  version: number
  status: string
  commissionRatePct: number
  isEnabled: boolean
  baseRule: 'RIDE_SUBTOTAL_BEFORE_DISCOUNT' | 'RIDE_SUBTOTAL_AFTER_DISCOUNT' | 'PRE_TAX_TOTAL'
  includeSurge: boolean
  includeWaiting: boolean
  includeBookingFee: boolean
  applyMinimumFloor: boolean
  roundOffRupee: boolean
  applyTo: 'NEW_RIDES_ONLY'
  declaredEffectiveFrom: string
  declaredEffectiveTo: string | null
  reason: string | null
  createdBy: string
  approvedBy: string | null
  approvedAt: string | null
  createdAt: string
  scopes: ConfigScopeDto[]
}

export interface TaxConfigDto {
  id: string
  familyId: string
  version: number
  kind: 'PASSENGER_RIDE_GST' | 'COMMISSION_GST'
  status: string
  ratePct: number
  isEnabled: boolean
  inclusive: boolean
  waitingTaxable: boolean | null
  sacCode: string | null
  legalReference: string | null
  applyTo: 'NEW_RIDES_ONLY'
  declaredEffectiveFrom: string
  declaredEffectiveTo: string | null
  createdBy: string
  approvedBy: string | null
  approvedAt: string | null
  createdAt: string
  scopes: ConfigScopeDto[]
}

export interface GstRecoveryConfigDto {
  id: string
  familyId: string
  version: number
  status: string
  recoveryRatePct: number
  isEnabled: boolean
  baseRule: 'PASSENGER_GST_AMOUNT' | 'TAXABLE_VALUE' | 'RIDE_SUBTOTAL_BEFORE_DISCOUNT'
  roundOffRupee: boolean
  legalReference: string | null
  applyTo: 'NEW_RIDES_ONLY'
  declaredEffectiveFrom: string
  declaredEffectiveTo: string | null
  createdBy: string
  approvedBy: string | null
  approvedAt: string | null
  createdAt: string
  scopes: ConfigScopeDto[]
}

export interface CompanyGstRegistrationDto {
  id: string
  legalEntityId: string
  gstin: string
  stateCode: string
  stateName: string
  registrationAddress: string
  effectiveFrom: string
  effectiveTo: string | null
  isActive: boolean
}

export interface LegalEntityDto {
  id: string
  legalEntityName: string
  tradeName: string | null
  pan: string
  headOfficeAddress: string
  isActive: boolean
  gstRegistrations: CompanyGstRegistrationDto[]
}

export interface CitySupplyRegistrationDto {
  id: string
  cityCode: string
  supplyKind: 'PASSENGER_RIDE' | 'PLATFORM_COMMISSION'
  legalEntityId: string
  gstRegistrationId: string
  effectiveFrom: string
  effectiveTo: string | null
  isActive: boolean
  legalEntity: LegalEntityDto
  gstRegistration: CompanyGstRegistrationDto
}

export interface PricingSummaryDto {
  counts: {
    activeFareRules: number
    activeSurgeWindows: number
    activeCancellationPolicies: number
    openSettlementFailures: number
    activeDocumentSeries?: number
    activeComplianceTemplates?: number
  }
  activeGlobalBaseline: {
    commission: { configId: string; version: number; ratePct: number | null; isEnabled: boolean } | null
    passengerGst: {
      configId: string
      version: number
      ratePct: number | null
      sacCode: string | null
      waitingTaxable: boolean | null
      isEnabled: boolean
    } | null
    gstRecovery: { configId: string; version: number; ratePct: number | null; isEnabled: boolean } | null
    combinedDriverDeductionPct: number | null
  }
  flags: {
    commissionWalletDeduction: boolean
    passengerGstEnabled: boolean
    gstRecoveryEnabled: boolean
    walletReservationEnabled: boolean
    cancellationPolicyEnforcement?: boolean
    fiscalDocumentsIssue?: boolean
  }
}

export interface SettlementFailureDto {
  id: string
  rideId: string
  driverId: string
  kind: 'COMMISSION' | 'GST_RECOVERY'
  amount: number
  balanceAtAttempt: number
  status: 'OPEN' | 'RECOVERED' | 'WAIVED'
  recoveryWalletTxnId: string | null
  recoveryLedgerGroupId: string | null
  waiverReason: string | null
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string
}

export interface DailyReconciliationReportDto {
  checkedAt: string
  allPassed: boolean
  invariants: Array<{
    id: number
    name: string
    passed: boolean
    driftAmount: number
    violationCount: number
    details: Record<string, unknown>
  }>
}

interface ServerAuditLogDto {
  id: string
  actorId: string | null
  actorName: string | null
  action: string
  entityType: string | null
  entityId: string | null
  summary: string | null
  createdAt: string
}

export const getPricingSummary = async (): Promise<PricingSummaryDto> => {
  const res = await api.get<{ data: PricingSummaryDto }>(API_ENDPOINTS.pricingGovernance.summary)
  return res.data.data
}

export const getCommissionConfigs = async (): Promise<CommissionConfigDto[]> => {
  const res = await api.get<{ data: CommissionConfigDto[] }>(
    API_ENDPOINTS.pricingGovernance.commissionConfigs,
  )
  return res.data.data
}

export const createCommissionConfig = async (payload: {
  commissionRatePct: number
  isEnabled?: boolean
  baseRule?: CommissionConfigDto['baseRule']
  includeSurge?: boolean
  includeWaiting?: boolean
  includeBookingFee?: boolean
  applyMinimumFloor?: boolean
  roundOffRupee?: boolean
  applyTo?: 'NEW_RIDES_ONLY'
  declaredEffectiveFrom?: string
  declaredEffectiveTo?: string | null
  reason?: string | null
  activateImmediately?: boolean
  scopes: ScopeInputDto[]
}): Promise<CommissionConfigDto> => {
  const res = await api.post<{ data: CommissionConfigDto }>(
    API_ENDPOINTS.pricingGovernance.commissionConfigs,
    { ...payload, applyTo: 'NEW_RIDES_ONLY' },
  )
  return res.data.data
}

export const approveCommissionConfig = async (id: string): Promise<CommissionConfigDto> => {
  const res = await api.post<{ data: CommissionConfigDto }>(
    API_ENDPOINTS.pricingGovernance.approveCommissionConfig(id),
  )
  return res.data.data
}

export const activateCommissionConfig = async (id: string): Promise<CommissionConfigDto> => {
  const res = await api.post<{ data: CommissionConfigDto }>(
    API_ENDPOINTS.pricingGovernance.activateCommissionConfig(id),
  )
  return res.data.data
}

export const deactivateCommissionScope = async (
  id: string,
  scopeId: string,
): Promise<ConfigScopeDto> => {
  const res = await api.post<{ data: ConfigScopeDto }>(
    API_ENDPOINTS.pricingGovernance.deactivateCommissionScope(id, scopeId),
  )
  return res.data.data
}

export const deleteCommissionConfig = async (
  id: string,
): Promise<{ id: string; deleted: boolean }> => {
  const res = await api.delete<{ data: { id: string; deleted: boolean } }>(
    API_ENDPOINTS.pricingGovernance.deleteCommissionConfig(id),
  )
  return res.data.data
}

export const getTaxConfigs = async (
  kind?: 'PASSENGER_RIDE_GST' | 'COMMISSION_GST',
): Promise<TaxConfigDto[]> => {
  const res = await api.get<{ data: TaxConfigDto[] }>(API_ENDPOINTS.pricingGovernance.taxConfigs, {
    params: kind ? { kind } : undefined,
  })
  return res.data.data
}

export const createTaxConfig = async (payload: {
  kind: 'PASSENGER_RIDE_GST' | 'COMMISSION_GST'
  ratePct: number
  isEnabled?: boolean
  inclusive?: boolean
  waitingTaxable?: boolean | null
  sacCode?: string | null
  legalReference?: string | null
  applyTo?: 'NEW_RIDES_ONLY'
  declaredEffectiveFrom?: string
  declaredEffectiveTo?: string | null
  activateImmediately?: boolean
  scopes: ScopeInputDto[]
}): Promise<TaxConfigDto> => {
  const res = await api.post<{ data: TaxConfigDto }>(API_ENDPOINTS.pricingGovernance.taxConfigs, {
    ...payload,
    applyTo: 'NEW_RIDES_ONLY',
  })
  return res.data.data
}

export const approveTaxConfig = async (id: string): Promise<TaxConfigDto> => {
  const res = await api.post<{ data: TaxConfigDto }>(
    API_ENDPOINTS.pricingGovernance.approveTaxConfig(id),
  )
  return res.data.data
}

export const getGstRecoveryConfigs = async (): Promise<GstRecoveryConfigDto[]> => {
  const res = await api.get<{ data: GstRecoveryConfigDto[] }>(
    API_ENDPOINTS.pricingGovernance.gstRecoveryConfigs,
  )
  return res.data.data
}

export const createGstRecoveryConfig = async (payload: {
  recoveryRatePct: number
  isEnabled?: boolean
  baseRule?: GstRecoveryConfigDto['baseRule']
  roundOffRupee?: boolean
  legalReference?: string | null
  applyTo?: 'NEW_RIDES_ONLY'
  declaredEffectiveFrom?: string
  declaredEffectiveTo?: string | null
  activateImmediately?: boolean
  scopes: ScopeInputDto[]
}): Promise<GstRecoveryConfigDto> => {
  const res = await api.post<{ data: GstRecoveryConfigDto }>(
    API_ENDPOINTS.pricingGovernance.gstRecoveryConfigs,
    { ...payload, applyTo: 'NEW_RIDES_ONLY' },
  )
  return res.data.data
}

export const approveGstRecoveryConfig = async (id: string): Promise<GstRecoveryConfigDto> => {
  const res = await api.post<{ data: GstRecoveryConfigDto }>(
    API_ENDPOINTS.pricingGovernance.approveGstRecoveryConfig(id),
  )
  return res.data.data
}

export const getLegalEntities = async (): Promise<LegalEntityDto[]> => {
  const res = await api.get<{ data: LegalEntityDto[] }>(
    API_ENDPOINTS.pricingGovernance.legalEntities,
  )
  return res.data.data
}

export const createLegalEntity = async (payload: {
  legalEntityName: string
  tradeName?: string | null
  pan: string
  headOfficeAddress: string
}): Promise<LegalEntityDto> => {
  const res = await api.post<{ data: LegalEntityDto }>(
    API_ENDPOINTS.pricingGovernance.legalEntities,
    payload,
  )
  return res.data.data
}

export const createGstRegistration = async (
  legalEntityId: string,
  payload: {
    gstin: string
    stateCode: string
    stateName: string
    registrationAddress: string
  },
): Promise<CompanyGstRegistrationDto> => {
  const res = await api.post<{ data: CompanyGstRegistrationDto }>(
    API_ENDPOINTS.pricingGovernance.createGstRegistration(legalEntityId),
    payload,
  )
  return res.data.data
}

export const getCitySupplyRegistrations = async (
  cityCode?: string,
): Promise<CitySupplyRegistrationDto[]> => {
  const res = await api.get<{ data: CitySupplyRegistrationDto[] }>(
    API_ENDPOINTS.pricingGovernance.citySupplyRegistrations,
    { params: cityCode ? { cityCode } : undefined },
  )
  return res.data.data
}

export const createCitySupplyRegistration = async (payload: {
  cityCode: string
  supplyKind: 'PASSENGER_RIDE' | 'PLATFORM_COMMISSION'
  legalEntityId: string
  gstRegistrationId: string
}): Promise<CitySupplyRegistrationDto> => {
  const res = await api.post<{ data: CitySupplyRegistrationDto }>(
    API_ENDPOINTS.pricingGovernance.citySupplyRegistrations,
    payload,
  )
  return res.data.data
}

export const getSettlementFailures = async (params?: {
  status?: 'OPEN' | 'RECOVERED' | 'WAIVED'
  kind?: 'COMMISSION' | 'GST_RECOVERY'
  page?: number
  limit?: number
}): Promise<PaginatedResponse<SettlementFailureDto>> => {
  const res = await api.get<PaginatedResponse<SettlementFailureDto>>(
    API_ENDPOINTS.pricingGovernance.settlementFailures,
    { params },
  )
  return res.data
}

export const recoverSettlementFailure = async (id: string) => {
  const res = await api.post<{ data: unknown }>(
    API_ENDPOINTS.pricingGovernance.recoverSettlementFailure(id),
  )
  return res.data.data
}

export const waiveSettlementFailure = async (id: string, reason: string) => {
  const res = await api.post<{ data: unknown }>(
    API_ENDPOINTS.pricingGovernance.waiveSettlementFailure(id),
    { reason },
  )
  return res.data.data
}

export const getPricingReconciliation = async (): Promise<DailyReconciliationReportDto> => {
  const res = await api.get<{ data: DailyReconciliationReportDto }>(
    API_ENDPOINTS.pricingGovernance.reconciliation,
  )
  return res.data.data
}

export const sweepStaleReservations = async (): Promise<{
  releasedCancelledCount: number
  alertedCompletedRideIds: string[]
}> => {
  const res = await api.post<{
    data: { releasedCancelledCount: number; alertedCompletedRideIds: string[] }
  }>(API_ENDPOINTS.pricingGovernance.sweepReservations)
  return res.data.data
}

export const getServerPricingAuditLogs = async (
  params?: QueryParams,
): Promise<PaginatedResponse<AuditLogEntry>> => {
  const page = Number(params?.page ?? 1)
  const limit = Number(params?.limit ?? 50)
  const search = typeof params?.search === 'string' && params.search.trim() ? params.search.trim() : undefined

  const res = await api.get<{
    data: ServerAuditLogDto[]
    meta: { page: number; limit: number; total: number }
  }>(API_ENDPOINTS.pricingGovernance.auditLogs, {
    params: {
      page,
      limit,
      entityTypes: PRICING_AUDIT_ENTITY_TYPES.join(','),
      ...(search ? { search } : {}),
    },
  })

  const totalCount = res.data.meta?.total ?? res.data.data.length
  return {
    data: res.data.data.map((row) => ({
      id: row.id,
      timestamp: row.createdAt,
      actor: row.actorName ?? row.actorId ?? 'System Admin',
      action: row.summary || `${row.action} ${row.entityType ?? 'pricing'}`,
      entityId: row.entityId ?? undefined,
      entityType: 'fare_config' as const,
      notes: row.entityType ? `${row.entityType} · ${row.action}` : row.action,
    })),
    meta: {
      currentPage: res.data.meta?.page ?? page,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      pageSize: res.data.meta?.limit ?? limit,
      totalCount,
    },
  }
}
