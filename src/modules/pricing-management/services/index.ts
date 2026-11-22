import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type { FareRule, SurgeRule, CancellationRule } from '../types'
import type { AuditLogEntry } from '@/shared/services/auditLogger'
import * as pricingApi from '../api'
import * as governanceApi from '../api/governance.api'
import * as fiscalApi from '../api/fiscal.api'

// All administrative mutations record audit rows transactionally in PostgreSQL (`admin_audit_logs`)
// on the server — zero browser-side audit storage.

const getFareRules = (params?: QueryParams): Promise<PaginatedResponse<FareRule>> =>
  pricingApi.getFareRules(params)
const getFareRuleById = (id: string): Promise<FareRule> => pricingApi.getFareRuleById(id)
const getFareRuleVersions = (id: string): Promise<FareRule[]> => pricingApi.getFareRuleVersions(id)
const createFareRule = (
  data: Omit<FareRule, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
): Promise<FareRule> => pricingApi.createFareRule(data)
const updateFareRule = (id: string, updates: Partial<FareRule>): Promise<FareRule> =>
  pricingApi.updateFareRule(id, updates)
const deleteFareRule = (id: string): Promise<void> => pricingApi.deleteFareRule(id)
const activateFareRule = (id: string): Promise<FareRule> => pricingApi.activateFareRule(id)
const deactivateFareRule = (id: string): Promise<FareRule> => pricingApi.deactivateFareRule(id)

const getSurgeRules = (params?: QueryParams): Promise<PaginatedResponse<SurgeRule>> =>
  pricingApi.getSurgeRules(params)
const getSurgeRuleById = (id: string): Promise<SurgeRule> => pricingApi.getSurgeRuleById(id)
const getSurgeRuleVersions = (id: string): Promise<SurgeRule[]> =>
  pricingApi.getSurgeRuleVersions(id)
const updateCitySurgeCap = (cityCode: string, maxSurgeMultiplier: number) =>
  pricingApi.updateCitySurgeCap(cityCode, maxSurgeMultiplier)
const createSurgeRule = (
  data: Omit<SurgeRule, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<SurgeRule> => pricingApi.createSurgeRule(data)
const updateSurgeRule = (id: string, updates: Partial<SurgeRule>): Promise<SurgeRule> =>
  pricingApi.updateSurgeRule(id, updates)
const deleteSurgeRule = (id: string): Promise<void> => pricingApi.deleteSurgeRule(id)
const activateSurgeRule = (id: string): Promise<SurgeRule> => pricingApi.activateSurgeRule(id)
const deactivateSurgeRule = (id: string): Promise<SurgeRule> => pricingApi.deactivateSurgeRule(id)

const getCancellationRules = (
  params?: QueryParams,
): Promise<PaginatedResponse<CancellationRule>> => pricingApi.getCancellationRules(params)
const getCancellationRuleById = (id: string): Promise<CancellationRule> =>
  pricingApi.getCancellationRuleById(id)
const getCancellationRuleVersions = (id: string): Promise<CancellationRule[]> =>
  pricingApi.getCancellationRuleVersions(id)
const evaluateCancellationPolicy = (
  input: pricingApi.EvaluateCancellationInput,
): Promise<pricingApi.EvaluateCancellationResult> =>
  pricingApi.evaluateCancellationPolicy(input)
const createCancellationRule = (
  data: Omit<CancellationRule, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
): Promise<CancellationRule> => pricingApi.createCancellationRule(data)
const updateCancellationRule = (
  id: string,
  updates: Partial<CancellationRule>,
): Promise<CancellationRule> => pricingApi.updateCancellationRule(id, updates)
const deleteCancellationRule = (id: string): Promise<void> => pricingApi.deleteCancellationRule(id)
const activateCancellationRule = (id: string): Promise<CancellationRule> =>
  pricingApi.activateCancellationRule(id)
const deactivateCancellationRule = (id: string): Promise<CancellationRule> =>
  pricingApi.deactivateCancellationRule(id)

// Live server-backed audit logs from GET /api/v1/admin/audit/logs
const getPricingHistory = (params?: QueryParams): Promise<PaginatedResponse<AuditLogEntry>> =>
  governanceApi.getServerPricingAuditLogs(params)

export const PricingManagementService = {
  getFareRules,
  getFareRuleById,
  getFareRuleVersions,
  createFareRule,
  updateFareRule,
  deleteFareRule,
  activateFareRule,
  deactivateFareRule,

  getSurgeRules,
  getSurgeRuleById,
  getSurgeRuleVersions,
  updateCitySurgeCap,
  createSurgeRule,
  updateSurgeRule,
  deleteSurgeRule,
  activateSurgeRule,
  deactivateSurgeRule,

  getCancellationRules,
  getCancellationRuleById,
  getCancellationRuleVersions,
  evaluateCancellationPolicy,
  createCancellationRule,
  updateCancellationRule,
  deleteCancellationRule,
  activateCancellationRule,
  deactivateCancellationRule,

  getPricingHistory,
  getSurgeZones: pricingApi.getSurgeZones,

  // Phase 4 & 5 Governance APIs
  getPricingSummary: governanceApi.getPricingSummary,
  getCommissionConfigs: governanceApi.getCommissionConfigs,
  createCommissionConfig: governanceApi.createCommissionConfig,
  approveCommissionConfig: governanceApi.approveCommissionConfig,
  activateCommissionConfig: governanceApi.activateCommissionConfig,
  deactivateCommissionScope: governanceApi.deactivateCommissionScope,
  deleteCommissionConfig: governanceApi.deleteCommissionConfig,
  getTaxConfigs: governanceApi.getTaxConfigs,
  createTaxConfig: governanceApi.createTaxConfig,
  approveTaxConfig: governanceApi.approveTaxConfig,
  getGstRecoveryConfigs: governanceApi.getGstRecoveryConfigs,
  createGstRecoveryConfig: governanceApi.createGstRecoveryConfig,
  approveGstRecoveryConfig: governanceApi.approveGstRecoveryConfig,
  getLegalEntities: governanceApi.getLegalEntities,
  createLegalEntity: governanceApi.createLegalEntity,
  createGstRegistration: governanceApi.createGstRegistration,
  getCitySupplyRegistrations: governanceApi.getCitySupplyRegistrations,
  createCitySupplyRegistration: governanceApi.createCitySupplyRegistration,
  getSettlementFailures: governanceApi.getSettlementFailures,
  recoverSettlementFailure: governanceApi.recoverSettlementFailure,
  waiveSettlementFailure: governanceApi.waiveSettlementFailure,
  getPricingReconciliation: governanceApi.getPricingReconciliation,
  sweepStaleReservations: governanceApi.sweepStaleReservations,

  // Phase 6 (M-09) Fiscal Documents, Gapless Series & Persisted Templates
  getFiscalDocuments: fiscalApi.getFiscalDocuments,
  createFiscalDownloadUrl: fiscalApi.createFiscalDownloadUrl,
  downloadFiscalPdfBlob: fiscalApi.downloadFiscalPdfBlob,
  previewSampleFiscalPdfBlob: fiscalApi.previewSampleFiscalPdfBlob,
  exportFiscalDocumentsCsvBlob: fiscalApi.exportFiscalDocumentsCsvBlob,
  voidFiscalDocument: fiscalApi.voidFiscalDocument,
  getDocumentSeries: fiscalApi.getDocumentSeries,
  createDocumentSeries: fiscalApi.createDocumentSeries,
  getComplianceTemplates: fiscalApi.getComplianceTemplates,
  createComplianceTemplate: fiscalApi.createComplianceTemplate,
  approveComplianceTemplatePreview: fiscalApi.approveComplianceTemplatePreview,
  activateComplianceTemplate: fiscalApi.activateComplianceTemplate,
}

export default PricingManagementService
