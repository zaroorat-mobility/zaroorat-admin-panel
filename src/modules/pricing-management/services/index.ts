import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type { FareRule, SurgeRule, CancellationRule } from '../types'
import { logAuditAction, type AuditLogEntry } from '@/shared/services/auditLogger'
import * as pricingApi from '../api'

const AUDIT_LOGS_KEY = 'zaroorat_audit_logs_db'

const getAuditDb = (): AuditLogEntry[] => {
  const db = localStorage.getItem(AUDIT_LOGS_KEY)
  if (!db) return []
  try {
    return JSON.parse(db) as AuditLogEntry[]
  } catch {
    return []
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FARE RULES
// ─────────────────────────────────────────────────────────────────────────────

const getFareRules = (params?: QueryParams): Promise<PaginatedResponse<FareRule>> =>
  pricingApi.getFareRules(params)

const getFareRuleById = (id: string): Promise<FareRule> => pricingApi.getFareRuleById(id)

const createFareRule = async (
  data: Omit<FareRule, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
): Promise<FareRule> => {
  const rule = await pricingApi.createFareRule(data)
  logAuditAction(
    `Created Fare Rule: ${rule.ruleName} (V${rule.version})`,
    `Vehicle: ${rule.vehicleType.toUpperCase()}, Base Fare: ₹${rule.baseFare}, Min Fare: ₹${rule.minimumFare}, Status: ${rule.status}`,
    rule.id,
    'fare_config',
  )
  return rule
}

const updateFareRule = async (id: string, updates: Partial<FareRule>): Promise<FareRule> => {
  const rule = await pricingApi.updateFareRule(id, updates)
  logAuditAction(
    `Updated Fare Rule to ${rule.ruleName} (V${rule.version})`,
    'Created new version due to updates',
    rule.id,
    'fare_config',
  )
  return rule
}

const deleteFareRule = async (id: string): Promise<void> => {
  await pricingApi.deleteFareRule(id)
  logAuditAction(`Deleted Fare Rule`, `Fare rule ${id} deactivated`, id, 'fare_config')
}

const activateFareRule = async (id: string): Promise<FareRule> => {
  const rule = await pricingApi.activateFareRule(id)
  logAuditAction(
    `Activated Fare Rule: ${rule.ruleName} (V${rule.version})`,
    `Vehicle: ${rule.vehicleType.toUpperCase()} rule is now active.`,
    rule.id,
    'fare_config',
  )
  return rule
}

const deactivateFareRule = async (id: string): Promise<FareRule> => {
  const rule = await pricingApi.deactivateFareRule(id)
  logAuditAction(
    `Deactivated Fare Rule: ${rule.ruleName} (V${rule.version})`,
    `Vehicle: ${rule.vehicleType.toUpperCase()} rule is now inactive.`,
    rule.id,
    'fare_config',
  )
  return rule
}

// ─────────────────────────────────────────────────────────────────────────────
// SURGE RULES (mapped to surge windows)
// ─────────────────────────────────────────────────────────────────────────────

const getSurgeRules = (params?: QueryParams): Promise<PaginatedResponse<SurgeRule>> =>
  pricingApi.getSurgeRules(params)

const getSurgeRuleById = (id: string): Promise<SurgeRule> => pricingApi.getSurgeRuleById(id)

const createSurgeRule = async (
  data: Omit<SurgeRule, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
): Promise<SurgeRule> => {
  const rule = await pricingApi.createSurgeRule(data)
  const vt = Array.isArray(rule.vehicleType) ? rule.vehicleType.join(', ') : rule.vehicleType
  logAuditAction(
    `Created Surge Rule: ${rule.ruleName}`,
    `Vehicle: ${vt.toUpperCase()}, Multiplier: ${rule.multiplier}x, Status: ${rule.status}`,
    rule.id,
    'fare_config',
  )
  return rule
}

const updateSurgeRule = async (id: string, updates: Partial<SurgeRule>): Promise<SurgeRule> => {
  const rule = await pricingApi.updateSurgeRule(id, updates)
  logAuditAction(
    `Updated Surge Rule: ${rule.ruleName}`,
    'Surge window updated',
    rule.id,
    'fare_config',
  )
  return rule
}

const deleteSurgeRule = async (id: string): Promise<void> => {
  await pricingApi.deleteSurgeRule(id)
  logAuditAction(`Deleted Surge Rule`, `Surge window ${id} deactivated`, id, 'fare_config')
}

const activateSurgeRule = async (id: string): Promise<SurgeRule> => {
  const rule = await pricingApi.activateSurgeRule(id)
  logAuditAction(
    `Activated Surge Rule: ${rule.ruleName}`,
    `Multiplier ${rule.multiplier}x is now active.`,
    rule.id,
    'fare_config',
  )
  return rule
}

const deactivateSurgeRule = async (id: string): Promise<SurgeRule> => {
  const rule = await pricingApi.deactivateSurgeRule(id)
  logAuditAction(
    `Deactivated Surge Rule: ${rule.ruleName}`,
    'Surge window deactivated.',
    rule.id,
    'fare_config',
  )
  return rule
}

// ─────────────────────────────────────────────────────────────────────────────
// CANCELLATION RULES
// ─────────────────────────────────────────────────────────────────────────────

const getCancellationRules = (
  params?: QueryParams,
): Promise<PaginatedResponse<CancellationRule>> => pricingApi.getCancellationRules(params)

const getCancellationRuleById = (id: string): Promise<CancellationRule> =>
  pricingApi.getCancellationRuleById(id)

const createCancellationRule = async (
  data: Omit<CancellationRule, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
): Promise<CancellationRule> => {
  const rule = await pricingApi.createCancellationRule(data)
  logAuditAction(
    `Created Cancellation Rule: ${rule.ruleName}`,
    `Actor: ${rule.actor.toUpperCase()}, Scenario: ${rule.scenario}, Fee: ${rule.chargeAmount}`,
    rule.id,
    'fare_config',
  )
  return rule
}

const updateCancellationRule = async (
  id: string,
  updates: Partial<CancellationRule>,
): Promise<CancellationRule> => {
  const rule = await pricingApi.updateCancellationRule(id, updates)
  logAuditAction(
    `Updated Cancellation Rule: ${rule.ruleName}`,
    'Cancellation policy updated',
    rule.id,
    'fare_config',
  )
  return rule
}

const deleteCancellationRule = async (id: string): Promise<void> => {
  await pricingApi.deleteCancellationRule(id)
  logAuditAction(
    `Deleted Cancellation Rule`,
    `Cancellation policy ${id} deactivated`,
    id,
    'fare_config',
  )
}

const activateCancellationRule = async (id: string): Promise<CancellationRule> => {
  const rule = await pricingApi.activateCancellationRule(id)
  logAuditAction(
    `Activated Cancellation Rule: ${rule.ruleName}`,
    `Actor: ${rule.actor.toUpperCase()}, Scenario: ${rule.scenario} rule is now active.`,
    rule.id,
    'fare_config',
  )
  return rule
}

const deactivateCancellationRule = async (id: string): Promise<CancellationRule> => {
  const rule = await pricingApi.deactivateCancellationRule(id)
  logAuditAction(
    `Deactivated Cancellation Rule: ${rule.ruleName}`,
    `Actor: ${rule.actor.toUpperCase()}, Scenario: ${rule.scenario} rule deactivated.`,
    rule.id,
    'fare_config',
  )
  return rule
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICING HISTORY (local audit log — out of scope for API this pass)
// ─────────────────────────────────────────────────────────────────────────────

const getPricingHistory = async (
  params?: QueryParams,
): Promise<PaginatedResponse<AuditLogEntry>> => {
  let filtered = getAuditDb().filter((item) => item.entityType === 'fare_config')
  const search = ((params?.search as string) || '').toLowerCase()
  if (search) {
    filtered = filtered.filter(
      (item) =>
        item.actor.toLowerCase().includes(search) ||
        item.action.toLowerCase().includes(search) ||
        (item.notes && item.notes.toLowerCase().includes(search)),
    )
  }
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return {
    data: filtered,
    meta: {
      currentPage: 1,
      totalPages: Math.max(1, Math.ceil(filtered.length / 25)),
      pageSize: 25,
      totalCount: filtered.length,
    },
  }
}

export const PricingManagementService = {
  getFareRules,
  getFareRuleById,
  createFareRule,
  updateFareRule,
  deleteFareRule,
  activateFareRule,
  deactivateFareRule,

  getSurgeRules,
  getSurgeRuleById,
  createSurgeRule,
  updateSurgeRule,
  deleteSurgeRule,
  activateSurgeRule,
  deactivateSurgeRule,

  getCancellationRules,
  getCancellationRuleById,
  createCancellationRule,
  updateCancellationRule,
  deleteCancellationRule,
  activateCancellationRule,
  deactivateCancellationRule,

  getPricingHistory,
  getSurgeZones: pricingApi.getSurgeZones,
}

export default PricingManagementService
