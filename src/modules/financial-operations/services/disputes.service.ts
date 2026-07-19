import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type { PaymentDispute, DisputeStatus, DisputeResolutionType } from '../types'
import { logAuditAction } from '@/shared/services/auditLogger'

const DISPUTES_KEY = 'zaroorat_disputes_db'

// Helper database getters and setters
const getDb = <T>(key: string, seedFn: () => T[]): T[] => {
  const db = localStorage.getItem(key)
  if (!db) {
    const seed = seedFn()
    localStorage.setItem(key, JSON.stringify(seed))
    return seed
  }
  return JSON.parse(db)
}

const saveDb = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data))
}

const seedDisputes = (): PaymentDispute[] => {
  const baseTime = Date.now()
  return [
    {
      id: 'dis-401',
      rideId: 'ride-101',
      type: 'FARE_DIFFERENCE',
      status: 'open',
      riderId: 'rider-1',
      riderName: 'Aditya Sharma',
      driverId: 'driver-1',
      driverName: 'Rajesh Kumar',
      amount: 70.00,
      requestedAmount: 70.00,
      reason: 'Estimated ride fare was ₹235, but final charged fare was ₹305. The rider claims they were stuck in normal traffic and should not be charged extra.',
      version: 1,
      createdAt: new Date(baseTime - 15 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseTime - 15 * 60 * 1000).toISOString(),
      timeline: [
        { action: 'Dispute Created', actor: 'Rider Client App', timestamp: new Date(baseTime - 15 * 60 * 1000).toISOString(), notes: 'System logged dispute for extra ₹70.00' }
      ]
    },
    {
      id: 'dis-402',
      rideId: 'ride-107',
      type: 'UNCOLLECTED_CASH',
      status: 'assigned',
      assignedTo: 'Support Agent A',
      assignedAt: new Date(baseTime - 7 * 60 * 1000).toISOString(),
      riderId: 'rider-7',
      riderName: 'Suresh Pillai',
      driverId: 'driver-5',
      driverName: 'Manoj Kumar',
      amount: 393.00,
      requestedAmount: 393.00,
      reason: 'Driver Manoj Kumar reports that rider left the vehicle at CST without paying the cash fare of ₹393. Spoke to passenger who stated they would pay online but did not.',
      version: 1,
      createdAt: new Date(baseTime - 12 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseTime - 7 * 60 * 1000).toISOString(),
      timeline: [
        { action: 'Dispute Created', actor: 'Driver Client App', timestamp: new Date(baseTime - 12 * 60 * 1000).toISOString() },
        { action: 'Dispute Assigned', actor: 'Support Agent A', timestamp: new Date(baseTime - 7 * 60 * 1000).toISOString(), notes: 'Assigned to Agent A for call trace logs.' }
      ]
    },
    {
      id: 'dis-403',
      rideId: 'ride-102',
      type: 'DOUBLE_CHARGE',
      status: 'resolved',
      riderId: 'rider-2',
      riderName: 'Priya Patel',
      driverId: 'driver-2',
      driverName: 'Vikram Singh',
      amount: 121.00,
      requestedAmount: 121.00,
      reason: 'Passenger was charged twice for the auto trip. UPI transaction failed initially but was debited, and card payment was also charged.',
      resolvedBy: 'Support Agent B',
      resolvedAt: new Date(baseTime - 2 * 60 * 60 * 1000).toISOString(),
      resolutionType: 'Adjust Fare',
      resolutionNotes: 'Verified double debit transaction logs. Reversal process initiated for the card payment. Refund of ₹121 credited to user card account.',
      adjustmentAmount: 121.00,
      version: 1,
      createdAt: new Date(baseTime - 3 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseTime - 2 * 60 * 60 * 1000).toISOString(),
      timeline: [
        { action: 'Dispute Created', actor: 'Rider Client App', timestamp: new Date(baseTime - 3 * 60 * 60 * 1000).toISOString() },
        { action: 'Investigation Started', actor: 'Support Agent B', timestamp: new Date(baseTime - 2.5 * 60 * 65 * 1000).toISOString(), notes: 'UPI payment ledger check.' },
        { action: 'Dispute Resolved', actor: 'Support Agent B', timestamp: new Date(baseTime - 2 * 60 * 60 * 1000).toISOString(), notes: 'Adjusted fare and reversed card charges.' }
      ]
    }
  ]
}

const getDisputes = async (params?: QueryParams): Promise<PaginatedResponse<PaymentDispute>> => {
  const db = getDb(DISPUTES_KEY, seedDisputes)
  const search = ((params?.search as string) || '').toLowerCase()
  let filtered = [...db]

  if (search) {
    filtered = filtered.filter(d =>
      d.id.toLowerCase().includes(search) ||
      d.rideId.toLowerCase().includes(search) ||
      d.riderName.toLowerCase().includes(search) ||
      d.driverName.toLowerCase().includes(search) ||
      d.type.toLowerCase().includes(search)
    )
  }

  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

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

const getDisputeById = async (id: string): Promise<PaymentDispute> => {
  const db = getDb(DISPUTES_KEY, seedDisputes)
  const found = db.find(d => d.id === id)
  if (!found) throw new Error(`Dispute ${id} not found`)
  return found
}

const createDispute = async (data: Omit<PaymentDispute, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'timeline'>): Promise<PaymentDispute> => {
  const db = getDb(DISPUTES_KEY, seedDisputes)
  const now = new Date().toISOString()

  const dispute: PaymentDispute = {
    ...data,
    id: `dis-${Date.now()}`,
    version: 1,
    createdAt: now,
    updatedAt: now,
    timeline: [
      { action: 'Dispute Created', actor: 'Admin Operator', timestamp: now, notes: `Reason: ${data.reason.substring(0, 45)}...` }
    ]
  }

  db.push(dispute)
  saveDb(DISPUTES_KEY, db)

  logAuditAction(
    `DISPUTE_CREATED: ${dispute.id}`,
    `Dispute logged for Ride ID ${dispute.rideId}. Type: ${dispute.type}, Amount: ₹${dispute.amount}`,
    dispute.id,
    'payment'
  )

  return dispute
}

const assignDispute = async (id: string, agentName: string): Promise<PaymentDispute> => {
  const db = getDb(DISPUTES_KEY, seedDisputes)
  const idx = db.findIndex(d => d.id === id)
  if (idx === -1) throw new Error(`Dispute ${id} not found`)

  const dispute = db[idx]
  const now = new Date().toISOString()

  dispute.status = 'assigned'
  dispute.assignedTo = agentName
  dispute.assignedAt = now
  dispute.updatedAt = now
  dispute.timeline.push({
    action: 'Dispute Assigned',
    actor: 'Admin Operator',
    timestamp: now,
    notes: `Assigned to ${agentName}`
  })

  db[idx] = dispute
  saveDb(DISPUTES_KEY, db)

  logAuditAction(
    `DISPUTE_ASSIGNED: ${dispute.id}`,
    `Ticket assigned to operator: ${agentName}`,
    dispute.id,
    'payment'
  )

  return dispute
}

const updateDisputeStatus = async (id: string, status: DisputeStatus, notes?: string): Promise<PaymentDispute> => {
  const db = getDb(DISPUTES_KEY, seedDisputes)
  const idx = db.findIndex(d => d.id === id)
  if (idx === -1) throw new Error(`Dispute ${id} not found`)

  const dispute = db[idx]
  const now = new Date().toISOString()

  const oldStatus = dispute.status
  dispute.status = status
  dispute.updatedAt = now
  dispute.timeline.push({
    action: `Dispute Status Updated to ${status}`,
    actor: 'Admin Operator',
    timestamp: now,
    notes: notes || `Moved from ${oldStatus}`
  })

  db[idx] = dispute
  saveDb(DISPUTES_KEY, db)

  logAuditAction(
    `DISPUTE_UPDATED: ${dispute.id}`,
    `Shifted state from ${oldStatus} to ${status}. Details: ${notes || 'None'}`,
    dispute.id,
    'payment'
  )

  return dispute
}

const resolveDispute = async (
  id: string,
  resolutionType: DisputeResolutionType,
  notes: string,
  adjustmentAmount?: number
): Promise<PaymentDispute> => {
  const db = getDb(DISPUTES_KEY, seedDisputes)
  const idx = db.findIndex(d => d.id === id)
  if (idx === -1) throw new Error(`Dispute ${id} not found`)

  const dispute = db[idx]
  const now = new Date().toISOString()

  dispute.status = 'resolved'
  dispute.resolvedBy = 'Admin Operator'
  dispute.resolvedAt = now
  dispute.resolutionType = resolutionType
  dispute.resolutionNotes = notes
  dispute.adjustmentAmount = adjustmentAmount
  dispute.updatedAt = now
  dispute.timeline.push({
    action: 'Dispute Resolved',
    actor: 'Admin Operator',
    timestamp: now,
    notes: `Resolved [Type: ${resolutionType}]. Notes: ${notes}${adjustmentAmount !== undefined ? ` (Adj: ₹${adjustmentAmount})` : ''}`
  })

  db[idx] = dispute
  saveDb(DISPUTES_KEY, db)

  logAuditAction(
    `DISPUTE_RESOLVED: ${dispute.id}`,
    `Dispute resolved with type ${resolutionType}. Notes: ${notes}`,
    dispute.id,
    'payment'
  )

  return dispute
}

const closeDispute = async (id: string, notes?: string): Promise<PaymentDispute> => {
  const db = getDb(DISPUTES_KEY, seedDisputes)
  const idx = db.findIndex(d => d.id === id)
  if (idx === -1) throw new Error(`Dispute ${id} not found`)

  const dispute = db[idx]
  const now = new Date().toISOString()

  dispute.status = 'closed'
  if (!dispute.resolvedAt) {
    dispute.resolvedAt = now
    dispute.resolvedBy = 'Admin Operator'
  }
  dispute.updatedAt = now
  dispute.timeline.push({
    action: 'Dispute Closed',
    actor: 'Admin Operator',
    timestamp: now,
    notes: notes || 'Dispute finalized and closed.'
  })

  db[idx] = dispute
  saveDb(DISPUTES_KEY, db)

  logAuditAction(
    `DISPUTE_CLOSED: ${dispute.id}`,
    `Dispute ticket officially closed. Notes: ${notes || 'None'}`,
    dispute.id,
    'payment'
  )

  return dispute
}

export const FinancialService = {
  getDisputes,
  getDisputeById,
  createDispute,
  assignDispute,
  updateDisputeStatus,
  resolveDispute,
  closeDispute
}

export default FinancialService
