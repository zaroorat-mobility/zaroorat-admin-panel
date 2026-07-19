import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type { FareRule, SurgeRule, CancellationRule } from '../types'
import { logAuditAction, type AuditLogEntry } from '@/shared/services/auditLogger'

const FARE_RULES_KEY = 'zaroorat_fare_rules_db'
const SURGE_RULES_KEY = 'zaroorat_surge_rules_db'
const CANCEL_RULES_KEY = 'zaroorat_cancellation_rules_db'
const AUDIT_LOGS_KEY = 'zaroorat_audit_logs_db'

// Helper getters/setters
const getDb = <T>(key: string, seedFn: () => T[]): T[] => {
  const db = localStorage.getItem(key)
  if (!db) {
    const seed = seedFn()
    localStorage.setItem(key, JSON.stringify(seed))
    return seed
  }
  
  try {
    const parsed = JSON.parse(db) as any[]
    if (parsed.length > 0) {
      // Reset database if any legacy records without ruleName are found
      if (
        (key === FARE_RULES_KEY && !parsed[0].ruleName) ||
        (key === SURGE_RULES_KEY && !parsed[0].ruleName) ||
        (key === CANCEL_RULES_KEY && !parsed[0].ruleName)
      ) {
        const seed = seedFn()
        localStorage.setItem(key, JSON.stringify(seed))
        return seed
      }
    }
  } catch (e) {
    const seed = seedFn()
    localStorage.setItem(key, JSON.stringify(seed))
    return seed
  }

  return JSON.parse(db)
}

const saveDb = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data))
}

// Seed Generators
const seedFareRules = (): FareRule[] => [
  {
    id: 'fr-cab-1',
    ruleName: 'Cab Standard Tariff V1',
    version: 1,
    vehicleType: 'cab',
    baseFare: 60.00,
    minimumFare: 80.00,
    perKmRate: 15.00,
    perMinuteRate: 1.50,
    freeWaitingMinutes: 5,
    waitingChargePerMinute: 3.00,
    nightEnabled: true,
    nightStartTime: '22:00',
    nightEndTime: '05:00',
    nightChargePercentage: 25,
    status: 'active',
    effectiveFrom: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
  },
  {
    id: 'fr-auto-1',
    ruleName: 'Auto Base Tariff V1',
    version: 1,
    vehicleType: 'auto',
    baseFare: 40.00,
    minimumFare: 50.00,
    perKmRate: 10.00,
    perMinuteRate: 1.00,
    freeWaitingMinutes: 3,
    waitingChargePerMinute: 2.00,
    nightEnabled: true,
    nightStartTime: '22:00',
    nightEndTime: '05:00',
    nightChargePercentage: 15,
    status: 'active',
    effectiveFrom: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
  },
  {
    id: 'fr-bike-1',
    ruleName: 'Bike Standard Tariff V1',
    version: 1,
    vehicleType: 'bike',
    baseFare: 20.00,
    minimumFare: 30.00,
    perKmRate: 6.00,
    perMinuteRate: 0.50,
    freeWaitingMinutes: 2,
    waitingChargePerMinute: 1.00,
    nightEnabled: false,
    nightStartTime: '23:00',
    nightEndTime: '05:00',
    nightChargePercentage: 10,
    status: 'active',
    effectiveFrom: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
  }
]

const seedSurgeRules = (): SurgeRule[] => [
  {
    id: 'sr-cab-1',
    ruleName: 'Cab Peak Hour Surge V1',
    version: 1,
    vehicleType: 'cab',
    multiplier: 1.5,
    startTime: '08:00',
    endTime: '11:00',
    effectiveFrom: new Date().toISOString().split('T')[0],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sr-auto-1',
    ruleName: 'Auto Monsoon Rush V1',
    version: 1,
    vehicleType: 'auto',
    multiplier: 1.2,
    startTime: '17:00',
    endTime: '20:00',
    effectiveFrom: new Date().toISOString().split('T')[0],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sr-bike-1',
    ruleName: 'Bike Night Rush V1',
    version: 1,
    vehicleType: 'bike',
    multiplier: 1.3,
    startTime: '22:00',
    endTime: '02:00',
    effectiveFrom: new Date().toISOString().split('T')[0],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

const seedCancellationRules = (): CancellationRule[] => [
  {
    id: 'cr-rider-assign-1',
    ruleName: 'Rider Cancel After Driver Assigned V1',
    version: 1,
    actor: 'rider',
    scenario: 'after_assignment',
    chargeType: 'fixed',
    chargeAmount: 20.00,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cr-rider-arrive-1',
    ruleName: 'Rider Cancel After Driver Arrives V1',
    version: 1,
    actor: 'rider',
    scenario: 'after_arrival',
    chargeType: 'fixed',
    chargeAmount: 40.00,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cr-driver-accept-1',
    ruleName: 'Driver Cancel Fine V1',
    version: 1,
    actor: 'driver',
    scenario: 'after_assignment',
    chargeType: 'fixed',
    chargeAmount: 30.00,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cr-rider-noshow-1',
    ruleName: 'Rider No Show Penalty V1',
    version: 1,
    actor: 'rider',
    scenario: 'no_show',
    chargeType: 'fixed',
    chargeAmount: 50.00,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

// ─────────────────────────────────────────────────────────────────────────────
// FARE RULES SERVICES
// ─────────────────────────────────────────────────────────────────────────────

const getFareRules = async (params?: QueryParams): Promise<PaginatedResponse<FareRule>> => {
  const db = getDb(FARE_RULES_KEY, seedFareRules)
  const search = ((params?.search as string) || '').toLowerCase()
  let filtered = [...db]

  if (search) {
    filtered = filtered.filter(r => 
      r.ruleName.toLowerCase().includes(search) || 
      r.vehicleType.toLowerCase().includes(search)
    )
  }

  // Sort by updatedAt descending
  filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return {
    data: filtered,
    meta: {
      currentPage: 1,
      totalPages: Math.ceil(filtered.length / 10),
      pageSize: 10,
      totalCount: filtered.length
    }
  }
}

const getFareRuleById = async (id: string): Promise<FareRule> => {
  const db = getDb(FARE_RULES_KEY, seedFareRules)
  const found = db.find(r => r.id === id)
  if (!found) throw new Error(`Fare rule ${id} not found`)
  return found
}

const createFareRule = async (data: Omit<FareRule, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<FareRule> => {
  const db = getDb(FARE_RULES_KEY, seedFareRules)
  const now = new Date().toISOString()
  
  // Exclusivity Check: If status is active, deactivate other rules for the same vehicle type
  if (data.status === 'active') {
    db.forEach(r => {
      if (r.vehicleType === data.vehicleType && r.status === 'active') {
        r.status = 'inactive'
        r.updatedAt = now
      }
    })
  }

  const rule: FareRule = {
    ...data,
    id: `fr-${Date.now()}`,
    version: 1,
    createdAt: now,
    updatedAt: now
  }

  db.push(rule)
  saveDb(FARE_RULES_KEY, db)

  logAuditAction(
    `Created Fare Rule: ${rule.ruleName} (V1)`,
    `Vehicle: ${rule.vehicleType.toUpperCase()}, Base Fare: ₹${rule.baseFare}, Min Fare: ₹${rule.minimumFare}, Status: ${rule.status}`,
    rule.id,
    'fare_config'
  )

  return rule
}

const updateFareRule = async (id: string, updates: Partial<FareRule>): Promise<FareRule> => {
  const db = getDb(FARE_RULES_KEY, seedFareRules)
  const idx = db.findIndex(r => r.id === id)
  if (idx === -1) throw new Error(`Fare rule ${id} not found`)

  const oldRule = db[idx]
  const now = new Date().toISOString()

  // Deactivate old rule
  oldRule.status = 'inactive'
  oldRule.updatedAt = now

  // Exclusivity Check: If updates are setting status to active, deactivate other rules of the same vehicle type
  const targetStatus = updates.status !== undefined ? updates.status : oldRule.status
  const targetVehicleType = oldRule.vehicleType

  if (targetStatus === 'active') {
    db.forEach(r => {
      if (r.vehicleType === targetVehicleType && r.status === 'active' && r.id !== id) {
        r.status = 'inactive'
        r.updatedAt = now
      }
    })
  }

  // Versioning: Create a new version of the rule
  const newRule: FareRule = {
    ...oldRule,
    ...updates,
    id: `fr-${Date.now()}`,
    version: oldRule.version + 1,
    status: targetStatus,
    createdAt: now,
    updatedAt: now
  }

  db.push(newRule)
  saveDb(FARE_RULES_KEY, db)

  const diffs: string[] = []
  if (updates.ruleName !== undefined && updates.ruleName !== oldRule.ruleName) diffs.push(`Name: "${oldRule.ruleName}"➔"${updates.ruleName}"`)
  if (updates.baseFare !== undefined && updates.baseFare !== oldRule.baseFare) diffs.push(`Base: ₹${oldRule.baseFare}➔₹${updates.baseFare}`)
  if (updates.minimumFare !== undefined && updates.minimumFare !== oldRule.minimumFare) diffs.push(`Min: ₹${oldRule.minimumFare}➔₹${updates.minimumFare}`)
  if (updates.perKmRate !== undefined && updates.perKmRate !== oldRule.perKmRate) diffs.push(`Per-km: ₹${oldRule.perKmRate}➔₹${updates.perKmRate}`)
  if (updates.perMinuteRate !== undefined && updates.perMinuteRate !== oldRule.perMinuteRate) diffs.push(`Per-min: ₹${oldRule.perMinuteRate}➔₹${updates.perMinuteRate}`)
  if (updates.status !== undefined && updates.status !== oldRule.status) diffs.push(`Status: ${oldRule.status}➔${updates.status}`)

  logAuditAction(
    `Updated Fare Rule to ${newRule.ruleName} (V${newRule.version})`,
    diffs.join(', ') || 'Created new version due to updates',
    newRule.id,
    'fare_config'
  )

  return newRule
}

const deleteFareRule = async (id: string): Promise<void> => {
  const db = getDb(FARE_RULES_KEY, seedFareRules)
  const idx = db.findIndex(r => r.id === id)
  if (idx === -1) throw new Error(`Fare rule ${id} not found`)

  const old = db[idx]
  saveDb(FARE_RULES_KEY, db.filter(r => r.id !== id))

  logAuditAction(
    `Deleted Fare Rule: ${old.ruleName} (V${old.version})`,
    `Vehicle: ${old.vehicleType.toUpperCase()}, Base Fare: ₹${old.baseFare}`,
    id,
    'fare_config'
  )
}

const activateFareRule = async (id: string): Promise<FareRule> => {
  const db = getDb(FARE_RULES_KEY, seedFareRules)
  const idx = db.findIndex(r => r.id === id)
  if (idx === -1) throw new Error(`Fare rule ${id} not found`)

  const rule = db[idx]
  const now = new Date().toISOString()

  // Deactivate other active rules for same vehicle type
  db.forEach(r => {
    if (r.vehicleType === rule.vehicleType && r.status === 'active' && r.id !== id) {
      r.status = 'inactive'
      r.updatedAt = now
    }
  })

  rule.status = 'active'
  rule.updatedAt = now

  saveDb(FARE_RULES_KEY, db)

  logAuditAction(
    `Activated Fare Rule: ${rule.ruleName} (V${rule.version})`,
    `Vehicle: ${rule.vehicleType.toUpperCase()} rule is now active.`,
    rule.id,
    'fare_config'
  )

  return rule
}

const deactivateFareRule = async (id: string): Promise<FareRule> => {
  const db = getDb(FARE_RULES_KEY, seedFareRules)
  const idx = db.findIndex(r => r.id === id)
  if (idx === -1) throw new Error(`Fare rule ${id} not found`)

  const rule = db[idx]
  const now = new Date().toISOString()

  rule.status = 'inactive'
  rule.updatedAt = now

  saveDb(FARE_RULES_KEY, db)

  logAuditAction(
    `Deactivated Fare Rule: ${rule.ruleName} (V${rule.version})`,
    `Vehicle: ${rule.vehicleType.toUpperCase()} rule is now inactive.`,
    rule.id,
    'fare_config'
  )

  return rule
}

// ─────────────────────────────────────────────────────────────────────────────
// SURGE RULES SERVICES
// ─────────────────────────────────────────────────────────────────────────────

const getSurgeRules = async (params?: QueryParams): Promise<PaginatedResponse<SurgeRule>> => {
  const db = getDb(SURGE_RULES_KEY, seedSurgeRules)
  const search = ((params?.search as string) || '').toLowerCase()
  let filtered = [...db]

  if (search) {
    filtered = filtered.filter(r => 
      r.ruleName.toLowerCase().includes(search) || 
      r.vehicleType.toLowerCase().includes(search)
    )
  }

  filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return {
    data: filtered,
    meta: {
      currentPage: 1,
      totalPages: Math.ceil(filtered.length / 10),
      pageSize: 10,
      totalCount: filtered.length
    }
  }
}

const getSurgeRuleById = async (id: string): Promise<SurgeRule> => {
  const db = getDb(SURGE_RULES_KEY, seedSurgeRules)
  const found = db.find(r => r.id === id)
  if (!found) throw new Error(`Surge rule ${id} not found`)
  return found
}

const createSurgeRule = async (data: Omit<SurgeRule, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<SurgeRule> => {
  const db = getDb(SURGE_RULES_KEY, seedSurgeRules)
  const now = new Date().toISOString()

  // Exclusivity Check
  if (data.status === 'active') {
    db.forEach(r => {
      if (r.vehicleType === data.vehicleType && r.status === 'active') {
        r.status = 'inactive'
        r.updatedAt = now
      }
    })
  }

  const rule: SurgeRule = {
    ...data,
    id: `sr-${Date.now()}`,
    version: 1,
    createdAt: now,
    updatedAt: now
  }

  db.push(rule)
  saveDb(SURGE_RULES_KEY, db)

  logAuditAction(
    `Created Surge Rule: ${rule.ruleName} (V1)`,
    `Vehicle: ${rule.vehicleType.toUpperCase()}, Multiplier: ${rule.multiplier}x, Status: ${rule.status}`,
    rule.id,
    'fare_config'
  )

  return rule
}

const updateSurgeRule = async (id: string, updates: Partial<SurgeRule>): Promise<SurgeRule> => {
  const db = getDb(SURGE_RULES_KEY, seedSurgeRules)
  const idx = db.findIndex(r => r.id === id)
  if (idx === -1) throw new Error(`Surge rule ${id} not found`)

  const oldRule = db[idx]
  const now = new Date().toISOString()

  // Deactivate old version
  oldRule.status = 'inactive'
  oldRule.updatedAt = now

  const targetStatus = updates.status !== undefined ? updates.status : oldRule.status
  const targetVehicleType = oldRule.vehicleType

  if (targetStatus === 'active') {
    db.forEach(r => {
      if (r.vehicleType === targetVehicleType && r.status === 'active' && r.id !== id) {
        r.status = 'inactive'
        r.updatedAt = now
      }
    })
  }

  // Versioning: Create a new version
  const newRule: SurgeRule = {
    ...oldRule,
    ...updates,
    id: `sr-${Date.now()}`,
    version: oldRule.version + 1,
    status: targetStatus,
    createdAt: now,
    updatedAt: now
  }

  db.push(newRule)
  saveDb(SURGE_RULES_KEY, db)

  const diffs: string[] = []
  if (updates.ruleName !== undefined && updates.ruleName !== oldRule.ruleName) diffs.push(`Name: "${oldRule.ruleName}"➔"${updates.ruleName}"`)
  if (updates.multiplier !== undefined && updates.multiplier !== oldRule.multiplier) diffs.push(`Multiplier: ${oldRule.multiplier}x➔${updates.multiplier}x`)
  if (updates.status !== undefined && updates.status !== oldRule.status) diffs.push(`Status: ${oldRule.status}➔${updates.status}`)

  logAuditAction(
    `Updated Surge Rule to ${newRule.ruleName} (V${newRule.version})`,
    diffs.join(', ') || 'Created new version due to updates',
    newRule.id,
    'fare_config'
  )

  return newRule
}

const deleteSurgeRule = async (id: string): Promise<void> => {
  const db = getDb(SURGE_RULES_KEY, seedSurgeRules)
  const idx = db.findIndex(r => r.id === id)
  if (idx === -1) throw new Error(`Surge rule ${id} not found`)

  const old = db[idx]
  saveDb(SURGE_RULES_KEY, db.filter(r => r.id !== id))

  logAuditAction(
    `Deleted Surge Rule: ${old.ruleName} (V${old.version})`,
    `Vehicle: ${old.vehicleType.toUpperCase()}, Multiplier: ${old.multiplier}x`,
    id,
    'fare_config'
  )
}

const activateSurgeRule = async (id: string): Promise<SurgeRule> => {
  const db = getDb(SURGE_RULES_KEY, seedSurgeRules)
  const idx = db.findIndex(r => r.id === id)
  if (idx === -1) throw new Error(`Surge rule ${id} not found`)

  const rule = db[idx]
  const now = new Date().toISOString()

  // Deactivate other active surge rules for same vehicle type
  db.forEach(r => {
    if (r.vehicleType === rule.vehicleType && r.status === 'active' && r.id !== id) {
      r.status = 'inactive'
      r.updatedAt = now
    }
  })

  rule.status = 'active'
  rule.updatedAt = now

  saveDb(SURGE_RULES_KEY, db)

  logAuditAction(
    `Activated Surge Rule: ${rule.ruleName} (V${rule.version})`,
    `Vehicle: ${rule.vehicleType.toUpperCase()} surge multiplier ${rule.multiplier}x is now active.`,
    rule.id,
    'fare_config'
  )

  return rule
}

const deactivateSurgeRule = async (id: string): Promise<SurgeRule> => {
  const db = getDb(SURGE_RULES_KEY, seedSurgeRules)
  const idx = db.findIndex(r => r.id === id)
  if (idx === -1) throw new Error(`Surge rule ${id} not found`)

  const rule = db[idx]
  const now = new Date().toISOString()

  rule.status = 'inactive'
  rule.updatedAt = now

  saveDb(SURGE_RULES_KEY, db)

  logAuditAction(
    `Deactivated Surge Rule: ${rule.ruleName} (V${rule.version})`,
    `Vehicle: ${rule.vehicleType.toUpperCase()} surge rule deactivated.`,
    rule.id,
    'fare_config'
  )

  return rule
}

// ─────────────────────────────────────────────────────────────────────────────
// CANCELLATION RULES SERVICES
// ─────────────────────────────────────────────────────────────────────────────

const getCancellationRules = async (params?: QueryParams): Promise<PaginatedResponse<CancellationRule>> => {
  const db = getDb(CANCEL_RULES_KEY, seedCancellationRules)
  const search = ((params?.search as string) || '').toLowerCase()
  let filtered = [...db]

  if (search) {
    filtered = filtered.filter(r => 
      r.ruleName.toLowerCase().includes(search) || 
      r.actor.toLowerCase().includes(search) || 
      r.scenario.toLowerCase().includes(search)
    )
  }

  filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return {
    data: filtered,
    meta: {
      currentPage: 1,
      totalPages: Math.ceil(filtered.length / 10),
      pageSize: 10,
      totalCount: filtered.length
    }
  }
}

const getCancellationRuleById = async (id: string): Promise<CancellationRule> => {
  const db = getDb(CANCEL_RULES_KEY, seedCancellationRules)
  const found = db.find(r => r.id === id)
  if (!found) throw new Error(`Cancellation rule ${id} not found`)
  return found
}

const createCancellationRule = async (data: Omit<CancellationRule, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<CancellationRule> => {
  const db = getDb(CANCEL_RULES_KEY, seedCancellationRules)
  const now = new Date().toISOString()

  // Exclusivity Check: Only one active rule per (actor + scenario) combination
  if (data.status === 'active') {
    db.forEach(r => {
      if (r.actor === data.actor && r.scenario === data.scenario && r.status === 'active') {
        r.status = 'inactive'
        r.updatedAt = now
      }
    })
  }

  const rule: CancellationRule = {
    ...data,
    id: `cr-${Date.now()}`,
    version: 1,
    createdAt: now,
    updatedAt: now
  }

  db.push(rule)
  saveDb(CANCEL_RULES_KEY, db)

  logAuditAction(
    `Created Cancellation Rule: ${rule.ruleName} (V1)`,
    `Actor: ${rule.actor.toUpperCase()}, Scenario: ${rule.scenario}, Fee: ${rule.chargeType === 'fixed' ? '₹' : ''}${rule.chargeAmount}${rule.chargeType === 'percentage' ? '%' : ''}, Status: ${rule.status}`,
    rule.id,
    'fare_config'
  )

  return rule
}

const updateCancellationRule = async (id: string, updates: Partial<CancellationRule>): Promise<CancellationRule> => {
  const db = getDb(CANCEL_RULES_KEY, seedCancellationRules)
  const idx = db.findIndex(r => r.id === id)
  if (idx === -1) throw new Error(`Cancellation rule ${id} not found`)

  const oldRule = db[idx]
  const now = new Date().toISOString()

  // Deactivate old version
  oldRule.status = 'inactive'
  oldRule.updatedAt = now

  const targetStatus = updates.status !== undefined ? updates.status : oldRule.status
  const targetActor = oldRule.actor
  const targetScenario = oldRule.scenario

  if (targetStatus === 'active') {
    db.forEach(r => {
      if (r.actor === targetActor && r.scenario === targetScenario && r.status === 'active' && r.id !== id) {
        r.status = 'inactive'
        r.updatedAt = now
      }
    })
  }

  // Versioning: Create new version
  const newRule: CancellationRule = {
    ...oldRule,
    ...updates,
    id: `cr-${Date.now()}`,
    version: oldRule.version + 1,
    status: targetStatus,
    createdAt: now,
    updatedAt: now
  }

  db.push(newRule)
  saveDb(CANCEL_RULES_KEY, db)

  const diffs: string[] = []
  if (updates.ruleName !== undefined && updates.ruleName !== oldRule.ruleName) diffs.push(`Name: "${oldRule.ruleName}"➔"${updates.ruleName}"`)
  if (updates.chargeAmount !== undefined && updates.chargeAmount !== oldRule.chargeAmount) diffs.push(`Amount: ${oldRule.chargeAmount}➔${updates.chargeAmount}`)
  if (updates.status !== undefined && updates.status !== oldRule.status) diffs.push(`Status: ${oldRule.status}➔${updates.status}`)

  logAuditAction(
    `Updated Cancellation Rule to ${newRule.ruleName} (V${newRule.version})`,
    diffs.join(', ') || 'Created new version due to updates',
    newRule.id,
    'fare_config'
  )

  return newRule
}

const deleteCancellationRule = async (id: string): Promise<void> => {
  const db = getDb(CANCEL_RULES_KEY, seedCancellationRules)
  const idx = db.findIndex(r => r.id === id)
  if (idx === -1) throw new Error(`Cancellation rule ${id} not found`)

  const old = db[idx]
  saveDb(CANCEL_RULES_KEY, db.filter(r => r.id !== id))

  logAuditAction(
    `Deleted Cancellation Rule: ${old.ruleName} (V${old.version})`,
    `Actor: ${old.actor.toUpperCase()}, Scenario: ${old.scenario}, Fee: ${old.chargeAmount}`,
    id,
    'fare_config'
  )
}

const activateCancellationRule = async (id: string): Promise<CancellationRule> => {
  const db = getDb(CANCEL_RULES_KEY, seedCancellationRules)
  const idx = db.findIndex(r => r.id === id)
  if (idx === -1) throw new Error(`Cancellation rule ${id} not found`)

  const rule = db[idx]
  const now = new Date().toISOString()

  // Deactivate other active rules with same actor + scenario
  db.forEach(r => {
    if (r.actor === rule.actor && r.scenario === rule.scenario && r.status === 'active' && r.id !== id) {
      r.status = 'inactive'
      r.updatedAt = now
    }
  })

  rule.status = 'active'
  rule.updatedAt = now

  saveDb(CANCEL_RULES_KEY, db)

  logAuditAction(
    `Activated Cancellation Rule: ${rule.ruleName} (V${rule.version})`,
    `Actor: ${rule.actor.toUpperCase()}, Scenario: ${rule.scenario} rule is now active.`,
    rule.id,
    'fare_config'
  )

  return rule
}

const deactivateCancellationRule = async (id: string): Promise<CancellationRule> => {
  const db = getDb(CANCEL_RULES_KEY, seedCancellationRules)
  const idx = db.findIndex(r => r.id === id)
  if (idx === -1) throw new Error(`Cancellation rule ${id} not found`)

  const rule = db[idx]
  const now = new Date().toISOString()

  rule.status = 'inactive'
  rule.updatedAt = now

  saveDb(CANCEL_RULES_KEY, db)

  logAuditAction(
    `Deactivated Cancellation Rule: ${rule.ruleName} (V${rule.version})`,
    `Actor: ${rule.actor.toUpperCase()}, Scenario: ${rule.scenario} rule deactivated.`,
    rule.id,
    'fare_config'
  )

  return rule
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOG PRICING HISTORY SERVICES
// ─────────────────────────────────────────────────────────────────────────────

const getPricingHistory = async (params?: QueryParams): Promise<PaginatedResponse<AuditLogEntry>> => {
  const db = getDb<AuditLogEntry>(AUDIT_LOGS_KEY, () => [])
  
  // Filter for pricing mutations: entityType === 'fare_config'
  let filtered = db.filter(item => item.entityType === 'fare_config')
  
  const search = ((params?.search as string) || '').toLowerCase()
  if (search) {
    filtered = filtered.filter(item =>
      item.actor.toLowerCase().includes(search) ||
      item.action.toLowerCase().includes(search) ||
      (item.notes && item.notes.toLowerCase().includes(search))
    )
  }

  // Sort by timestamp descending
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const page = 1
  const limit = 25
  
  return {
    data: filtered,
    meta: {
      currentPage: page,
      totalPages: Math.ceil(filtered.length / limit),
      pageSize: limit,
      totalCount: filtered.length
    }
  }
}

export const PricingManagementService = {
  // Fare rules
  getFareRules,
  getFareRuleById,
  createFareRule,
  updateFareRule,
  deleteFareRule,
  activateFareRule,
  deactivateFareRule,

  // Surge rules
  getSurgeRules,
  getSurgeRuleById,
  createSurgeRule,
  updateSurgeRule,
  deleteSurgeRule,
  activateSurgeRule,
  deactivateSurgeRule,

  // Cancellation rules
  getCancellationRules,
  getCancellationRuleById,
  createCancellationRule,
  updateCancellationRule,
  deleteCancellationRule,
  activateCancellationRule,
  deactivateCancellationRule,

  // History log
  getPricingHistory
}

export default PricingManagementService
