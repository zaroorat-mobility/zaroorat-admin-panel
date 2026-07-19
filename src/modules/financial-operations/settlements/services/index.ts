import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type {
  SettlementBatch,
  DriverSettlement,
  DriverLedgerEntry,
  SettlementStatus
} from '../types'
import { logAuditAction } from '@/shared/services/auditLogger'

const SETTLEMENTS_KEY = 'zaroorat_settlements_db'
const LEDGER_KEY = 'zaroorat_driver_ledger_db'

const getDb = <T>(key: string, seedFn: () => T[]): T[] => {
  const raw = localStorage.getItem(key)
  if (!raw) {
    const seed = seedFn()
    localStorage.setItem(key, JSON.stringify(seed))
    return seed
  }
  return JSON.parse(raw)
}

const saveDb = <T>(key: string, data: T[]) =>
  localStorage.setItem(key, JSON.stringify(data))

// ─────────────────────────────────────────────────────────────────────────────
// SEED DRIVERS
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_DRIVERS: DriverSettlement[] = [
  {
    driverId: 'driver-1',
    driverName: 'Ravi Kumar',
    totalTrips: 42,
    grossEarnings: 18900,
    commissionPercent: 7,
    commissionAmount: 1323,
    refundAdjustments: 350,
    penalties: 200,
    bonuses: 500,
    incentives: 300,
    netPayable: 17827,
    walletBalance: 17827,
    status: 'pending'
  },
  {
    driverId: 'driver-2',
    driverName: 'Suresh Nair',
    totalTrips: 31,
    grossEarnings: 13950,
    commissionPercent: 7,
    commissionAmount: 977,
    refundAdjustments: 121,
    penalties: 0,
    bonuses: 250,
    incentives: 150,
    netPayable: 13252,
    walletBalance: 13252,
    status: 'pending'
  },
  {
    driverId: 'driver-3',
    driverName: 'Mohan Das',
    totalTrips: 28,
    grossEarnings: 11200,
    commissionPercent: 7,
    commissionAmount: 784,
    refundAdjustments: 0,
    penalties: 100,
    bonuses: 400,
    incentives: 0,
    netPayable: 10716,
    walletBalance: 10716,
    status: 'pending'
  }
]

// ─────────────────────────────────────────────────────────────────────────────
// SEED BATCHES
// ─────────────────────────────────────────────────────────────────────────────

const seedBatches = (): SettlementBatch[] => {
  const now = Date.now()
  return [
    {
      id: 'set-001',
      batchNumber: 'SET-2026-1001',
      periodStart: new Date(now - 15 * 86400000).toISOString().split('T')[0],
      periodEnd: new Date(now - 1 * 86400000).toISOString().split('T')[0],
      totalDrivers: 3,
      totalGrossAmount: 44050,
      totalCommission: 3084,
      totalRefundAdjustments: 471,
      totalPenalties: 300,
      totalBonuses: 1150,
      totalNetPayable: 41795,
      status: 'pending',
      generatedBy: 'Finance Manager',
      drivers: MOCK_DRIVERS,
      adjustments: [],
      createdAt: new Date(now - 2 * 86400000).toISOString(),
      updatedAt: new Date(now - 2 * 86400000).toISOString(),
      timeline: [
        {
          action: 'Batch Generated',
          actor: 'Finance Manager',
          timestamp: new Date(now - 2 * 86400000).toISOString(),
          notes: 'Auto-calculated from ride earnings for period 01 Jul – 15 Jul 2026'
        }
      ]
    },
    {
      id: 'set-002',
      batchNumber: 'SET-2026-1000',
      periodStart: new Date(now - 30 * 86400000).toISOString().split('T')[0],
      periodEnd: new Date(now - 16 * 86400000).toISOString().split('T')[0],
      totalDrivers: 2,
      totalGrossAmount: 28500,
      totalCommission: 1995,
      totalRefundAdjustments: 0,
      totalPenalties: 100,
      totalBonuses: 500,
      totalNetPayable: 26905,
      status: 'completed',
      generatedBy: 'Finance Manager',
      processedAt: new Date(now - 14 * 86400000).toISOString(),
      completedAt: new Date(now - 13 * 86400000).toISOString(),
      drivers: [
        { ...MOCK_DRIVERS[0], status: 'paid', netPayable: 14500, walletBalance: 0 },
        { ...MOCK_DRIVERS[1], status: 'paid', netPayable: 12405, walletBalance: 0 }
      ],
      adjustments: [],
      createdAt: new Date(now - 15 * 86400000).toISOString(),
      updatedAt: new Date(now - 13 * 86400000).toISOString(),
      timeline: [
        { action: 'Batch Generated', actor: 'Finance Manager', timestamp: new Date(now - 15 * 86400000).toISOString() },
        { action: 'Settlement Processing', actor: 'Finance Manager', timestamp: new Date(now - 14 * 86400000).toISOString() },
        { action: 'Settlement Completed', actor: 'System', timestamp: new Date(now - 13 * 86400000).toISOString(), notes: 'All driver wallets credited via batch transfer.' }
      ]
    }
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED LEDGER
// ─────────────────────────────────────────────────────────────────────────────

const seedLedger = (): DriverLedgerEntry[] => {
  const now = Date.now()
  const entries: DriverLedgerEntry[] = []
  let balance = 0
  const txns = [
    { type: 'RIDE_EARNING' as const, desc: 'Trip #ride-101 — Bandra to Andheri', amt: 280 },
    { type: 'RIDE_EARNING' as const, desc: 'Trip #ride-102 — Andheri to Kurla Auto', amt: 95 },
    { type: 'PLATFORM_COMMISSION' as const, desc: 'Commission 7% on ₹280', amt: -19.6 },
    { type: 'PLATFORM_COMMISSION' as const, desc: 'Commission 7% on ₹95', amt: -6.65 },
    { type: 'RIDE_EARNING' as const, desc: 'Trip #ride-108 — Goregaon to Borivali', amt: 320 },
    { type: 'PLATFORM_COMMISSION' as const, desc: 'Commission 7% on ₹320', amt: -22.4 },
    { type: 'BONUS' as const, desc: 'Weekly completion bonus — 30+ trips', amt: 250 },
    { type: 'REFUND_DEDUCTION' as const, desc: 'Refund REF-2026-1002 — Double payment deduction', amt: -121 },
    { type: 'INCENTIVE' as const, desc: 'Peak hour surge incentive — Evening slots', amt: 150 },
    { type: 'PENALTY' as const, desc: 'Complaint #comp-301 — Penalty for route deviation', amt: -200 },
    { type: 'SETTLEMENT_PAYOUT' as const, desc: 'Settlement batch SET-2026-1000 payout', amt: -500 },
    { type: 'RIDE_EARNING' as const, desc: 'Trip #ride-115 — Vile Parle to Santacruz', amt: 145 },
    { type: 'PLATFORM_COMMISSION' as const, desc: 'Commission 7% on ₹145', amt: -10.15 },
  ]

  txns.forEach((t, i) => {
    balance = Math.round((balance + t.amt) * 100) / 100
    entries.push({
      id: `led-${i + 1}`,
      driverId: 'driver-1',
      driverName: 'Ravi Kumar',
      type: t.type,
      description: t.desc,
      amount: t.amt,
      balance,
      entryDate: new Date(now - (txns.length - i) * 86400000 * 0.5).toISOString(),
      createdAt: new Date(now - (txns.length - i) * 86400000 * 0.5).toISOString(),
      updatedAt: new Date(now - (txns.length - i) * 86400000 * 0.5).toISOString()
    })
  })
  return entries
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICES
// ─────────────────────────────────────────────────────────────────────────────

const getSettlements = async (params?: QueryParams): Promise<PaginatedResponse<SettlementBatch>> => {
  const db = getDb(SETTLEMENTS_KEY, seedBatches)
  const search = ((params?.search as string) || '').toLowerCase()
  let filtered = [...db]
  if (search) {
    filtered = filtered.filter(s =>
      s.batchNumber.toLowerCase().includes(search) ||
      s.status.toLowerCase().includes(search) ||
      s.generatedBy.toLowerCase().includes(search)
    )
  }
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return {
    data: filtered,
    meta: { currentPage: 1, totalPages: 1, pageSize: 20, totalCount: filtered.length }
  }
}

const getSettlementById = async (id: string): Promise<SettlementBatch> => {
  const db = getDb(SETTLEMENTS_KEY, seedBatches)
  const found = db.find(s => s.id === id)
  if (!found) throw new Error(`Settlement batch ${id} not found`)
  return found
}

const searchDrivers = async (query: string): Promise<{ driverId: string; driverName: string }[]> => {
  const raw = localStorage.getItem('zaroorat_drivers_db')
  let list: { id: string; driverName: string }[] = []
  if (raw) {
    try {
      list = JSON.parse(raw)
    } catch (e) {}
  }
  if (!list.length) {
    list = [
      { id: 'drv-driver-1', driverName: 'Ravi Kumar' },
      { id: 'drv-driver-2', driverName: 'Suresh Nair' },
      { id: 'drv-driver-3', driverName: 'Mohan Das' },
      { id: 'drv-driver-4', driverName: 'Alok Mishra' },
      { id: 'drv-driver-5', driverName: 'Priya Sharma' }
    ]
  }
  const q = query.toLowerCase()
  return list
    .filter(d => d.id.toLowerCase().includes(q) || d.driverName.toLowerCase().includes(q))
    .map(d => ({ driverId: d.id, driverName: d.driverName }))
}

const getDriverBreakdown = async (
  driverId: string,
  _periodStart: string,
  _periodEnd: string
): Promise<DriverSettlement> => {
  const raw = localStorage.getItem('zaroorat_drivers_db')
  let name = 'Unknown Driver'
  if (raw) {
    try {
      const list = JSON.parse(raw)
      const found = list.find((d: any) => d.id === driverId)
      if (found) name = found.driverName
    } catch (e) {}
  }
  if (name === 'Unknown Driver') {
    const fallbacks: Record<string, string> = {
      'drv-driver-1': 'Ravi Kumar',
      'drv-driver-2': 'Suresh Nair',
      'drv-driver-3': 'Mohan Das',
      'driver-1': 'Ravi Kumar',
      'driver-2': 'Suresh Nair',
      'driver-3': 'Mohan Das',
    }
    name = fallbacks[driverId] || `Driver (${driverId})`
  }

  // Deterministic calculation based on driver ID to make it realistic
  const hash = driverId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const totalTrips = (hash % 25) + 10
  const grossEarnings = totalTrips * 320
  const commissionPercent = 7
  const commissionAmount = Math.round(grossEarnings * commissionPercent) / 100
  const refundAdjustments = hash % 2 === 0 ? (hash % 150) + 50 : 0
  const penalties = hash % 5 === 0 ? 100 : 0
  const bonuses = (hash % 3) * 150 + 100
  const incentives = (hash % 2) * 100
  const netPayable = grossEarnings - commissionAmount - refundAdjustments - penalties + bonuses + incentives

  return {
    driverId,
    driverName: name,
    totalTrips,
    grossEarnings,
    commissionPercent,
    commissionAmount,
    refundAdjustments,
    penalties,
    bonuses,
    incentives,
    netPayable,
    walletBalance: netPayable,
    status: 'pending'
  }
}

const generateSettlementBatch = async (
  periodStart: string,
  periodEnd: string,
  generatedBy: string,
  drivers: DriverSettlement[]
): Promise<SettlementBatch> => {
  const db = getDb(SETTLEMENTS_KEY, seedBatches)
  const now = new Date().toISOString()
  const batchNum = `SET-2026-${1000 + db.length + 1}`

  const totalGross = drivers.reduce((s, d) => s + d.grossEarnings, 0)
  const totalComm = drivers.reduce((s, d) => s + d.commissionAmount, 0)
  const totalRefund = drivers.reduce((s, d) => s + d.refundAdjustments, 0)
  const totalPenalties = drivers.reduce((s, d) => s + d.penalties, 0)
  const totalBonuses = drivers.reduce((s, d) => s + (d.bonuses + d.incentives), 0)
  const totalNet = drivers.reduce((s, d) => s + d.netPayable, 0)

  const batch: SettlementBatch = {
    id: `set-${Date.now()}`,
    batchNumber: batchNum,
    periodStart,
    periodEnd,
    totalDrivers: drivers.length,
    totalGrossAmount: totalGross,
    totalCommission: totalComm,
    totalRefundAdjustments: totalRefund,
    totalPenalties: totalPenalties,
    totalBonuses: totalBonuses,
    totalNetPayable: totalNet,
    status: 'draft',
    generatedBy,
    drivers,
    adjustments: [],
    createdAt: now,
    updatedAt: now,
    timeline: [
      {
        action: 'Settlement Generated',
        actor: generatedBy,
        timestamp: now,
        notes: `Period: ${periodStart} → ${periodEnd}. ${drivers.length} drivers, ₹${totalNet.toFixed(2)} net payable.`
      }
    ]
  }

  db.unshift(batch)
  saveDb(SETTLEMENTS_KEY, db)

  logAuditAction(
    `SETTLEMENT_GENERATED: ${batch.id}`,
    `Settlement batch ${batchNum} generated for ${drivers.length} drivers. Net: ₹${totalNet.toFixed(2)}`,
    batch.id,
    'payment'
  )

  return batch
}


const updateSettlementStatus = async (
  id: string,
  status: SettlementStatus,
  actor: string
): Promise<SettlementBatch> => {
  const db = getDb(SETTLEMENTS_KEY, seedBatches)
  const idx = db.findIndex(s => s.id === id)
  if (idx === -1) throw new Error(`Settlement ${id} not found`)

  const batch = db[idx]
  const now = new Date().toISOString()

  batch.status = status
  batch.updatedAt = now

  const actionMap: Record<string, string> = {
    pending: 'Settlement Approved for Processing',
    processing: 'Settlement Processing Started',
    completed: 'Settlement Completed',
    failed: 'Settlement Failed'
  }

  const auditMap: Record<string, string> = {
    pending: 'SETTLEMENT_APPROVED',
    processing: 'SETTLEMENT_PROCESSING',
    completed: 'SETTLEMENT_COMPLETED',
    failed: 'SETTLEMENT_FAILED'
  }

  if (status === 'processing') batch.processedAt = now
  if (status === 'completed') {
    batch.completedAt = now
    batch.drivers = batch.drivers.map(d => ({ ...d, status: 'paid' as const, walletBalance: 0 }))
  }

  batch.timeline.push({
    action: actionMap[status] || `Status changed to ${status}`,
    actor,
    timestamp: now
  })

  db[idx] = batch
  saveDb(SETTLEMENTS_KEY, db)

  logAuditAction(
    `${auditMap[status] || 'SETTLEMENT_UPDATED'}: ${batch.id}`,
    `Settlement batch ${batch.batchNumber} moved to ${status}`,
    batch.id,
    'payment'
  )

  return batch
}

// ─── Driver Ledger ───────────────────────────────────────────────────────────

const getDriverLedger = async (driverId: string): Promise<DriverLedgerEntry[]> => {
  const db = getDb(LEDGER_KEY, seedLedger)
  return db.filter(e => e.driverId === driverId)
    .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
}

export const SettlementService = {
  getSettlements,
  getSettlementById,
  generateSettlementBatch,
  updateSettlementStatus,
  getDriverLedger,
  searchDrivers,
  getDriverBreakdown
}

export default SettlementService

