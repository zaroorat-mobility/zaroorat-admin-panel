import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type { RefundRequest } from '../types'
import { logAuditAction } from '@/shared/services/auditLogger'

const REFUNDS_KEY = 'zaroorat_refunds_db'

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

// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA
// ─────────────────────────────────────────────────────────────────────────────

const seedRefunds = (): RefundRequest[] => {
  const baseTime = Date.now()
  return [
    {
      id: 'ref-501',
      refundId: 'REF-2026-1001',
      rideId: 'ride-101',
      disputeId: 'dis-401',
      riderId: 'rider-1',
      riderName: 'Aditya Sharma',
      refundType: 'DISPUTE_RESOLUTION',
      requestedAmount: 70.00,
      reason: 'Rider was overcharged ₹70.00 above the upfront estimate due to route calculation congestion mismatch.',
      status: 'requested',
      requestedAt: new Date(baseTime - 10 * 60 * 1000).toISOString(),
      approvalLevel: 'support',
      refundSource: 'dispute',
      createdAt: new Date(baseTime - 10 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseTime - 10 * 60 * 1000).toISOString(),
      timeline: [
        { action: 'Refund Requested', actor: 'Support Agent A', timestamp: new Date(baseTime - 10 * 60 * 1000).toISOString(), notes: 'Logged via estimate mismatch dispute' }
      ]
    },
    {
      id: 'ref-502',
      refundId: 'REF-2026-1002',
      rideId: 'ride-102',
      disputeId: 'dis-403',
      riderId: 'rider-2',
      riderName: 'Priya Patel',
      refundType: 'DOUBLE_PAYMENT',
      requestedAmount: 121.00,
      approvedAmount: 121.00,
      reason: 'Rider double paid for auto booking. Card charged after initial UPI transaction delay.',
      status: 'completed',
      requestedAt: new Date(baseTime - 4 * 60 * 60 * 1000).toISOString(),
      reviewedBy: 'Support Agent B',
      reviewedAt: new Date(baseTime - 3 * 60 * 60 * 1000).toISOString(),
      processedBy: 'Finance Supervisor',
      processedAt: new Date(baseTime - 2 * 60 * 60 * 1000).toISOString(),
      notes: 'Verified double debit transaction logs. Reversal process completed.',
      approvalLevel: 'support',
      refundSource: 'dispute',
      createdAt: new Date(baseTime - 4 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseTime - 2 * 60 * 60 * 1000).toISOString(),
      timeline: [
        { action: 'Refund Requested', actor: 'Support Agent B', timestamp: new Date(baseTime - 4 * 60 * 60 * 1000).toISOString() },
        { action: 'Refund Approved', actor: 'Support Agent B', timestamp: new Date(baseTime - 3 * 60 * 60 * 1000).toISOString(), notes: 'Approve refund amount: ₹121.00' },
        { action: 'Refund Completed', actor: 'Finance Supervisor', timestamp: new Date(baseTime - 2 * 60 * 60 * 1000).toISOString(), notes: 'Transferred via card gateway credit' }
      ]
    },
    {
      id: 'ref-503',
      refundId: 'REF-2026-1003',
      rideId: 'ride-108',
      riderId: 'rider-3',
      riderName: 'Deepika Sen',
      refundType: 'SERVICE_ISSUE',
      requestedAmount: 650.00,
      reason: 'Driver major route deviation leading to passenger panic and trip safety ticket closure.',
      status: 'under_review',
      requestedAt: new Date(baseTime - 24 * 60 * 60 * 1000).toISOString(),
      approvalLevel: 'finance',
      refundSource: 'complaint',
      createdAt: new Date(baseTime - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseTime - 24 * 60 * 60 * 1000).toISOString(),
      timeline: [
        { action: 'Refund Requested', actor: 'Complaint Operator', timestamp: new Date(baseTime - 24 * 60 * 60 * 1000).toISOString() },
        { action: 'Review Started', actor: 'Finance Analyst', timestamp: new Date(baseTime - 20 * 60 * 60 * 1000).toISOString(), notes: 'Flagged for finance tier approval as amount > ₹500' }
      ]
    }
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICES DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

const getRefunds = async (params?: QueryParams): Promise<PaginatedResponse<RefundRequest>> => {
  const db = getDb(REFUNDS_KEY, seedRefunds)
  const search = ((params?.search as string) || '').toLowerCase()
  let filtered = [...db]

  if (search) {
    filtered = filtered.filter(r =>
      r.id.toLowerCase().includes(search) ||
      r.refundId.toLowerCase().includes(search) ||
      (r.rideId && r.rideId.toLowerCase().includes(search)) ||
      (r.disputeId && r.disputeId.toLowerCase().includes(search)) ||
      r.riderName.toLowerCase().includes(search) ||
      r.refundType.toLowerCase().includes(search)
    )
  }

  filtered.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())

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

const getRefundById = async (id: string): Promise<RefundRequest> => {
  const db = getDb(REFUNDS_KEY, seedRefunds)
  const found = db.find(r => r.id === id)
  if (!found) throw new Error(`Refund request ${id} not found`)
  return found
}

const createRefund = async (
  data: Omit<RefundRequest, 'id' | 'refundId' | 'createdAt' | 'updatedAt' | 'timeline' | 'requestedAt' | 'status' | 'approvalLevel'>
): Promise<RefundRequest> => {
  const db = getDb(REFUNDS_KEY, seedRefunds)
  const now = new Date().toISOString()
  const randomId = Math.floor(Math.random() * 9000) + 1000

  const request: RefundRequest = {
    ...data,
    id: `ref-${Date.now()}`,
    refundId: `REF-2026-${randomId}`,
    status: 'requested',
    requestedAt: now,
    approvalLevel: data.requestedAmount > 500 ? 'finance' : 'support',
    createdAt: now,
    updatedAt: now,
    timeline: [
      { action: 'Refund Requested', actor: 'Admin Operator', timestamp: now, notes: `Reason: ${data.reason.substring(0, 45)}...` }
    ]
  }

  db.push(request)
  saveDb(REFUNDS_KEY, db)

  logAuditAction(
    `REFUND_REQUESTED: ${request.id}`,
    `Refund logged for Ride ID ${request.rideId || 'None'}. Type: ${request.refundType}, Level: ${request.approvalLevel}, Amount: ₹${request.requestedAmount}`,
    request.id,
    'payment'
  )

  return request
}

const startRefundReview = async (id: string, reviewerName: string): Promise<RefundRequest> => {
  const db = getDb(REFUNDS_KEY, seedRefunds)
  const idx = db.findIndex(r => r.id === id)
  if (idx === -1) throw new Error(`Refund ${id} not found`)

  const request = db[idx]
  const now = new Date().toISOString()

  request.status = 'under_review'
  request.updatedAt = now
  request.timeline.push({
    action: 'Review Started',
    actor: reviewerName,
    timestamp: now,
    notes: `Assigned review agent: ${reviewerName}`
  })

  db[idx] = request
  saveDb(REFUNDS_KEY, db)

  logAuditAction(
    `REFUND_UPDATED: ${request.id}`,
    `Started review processing for refund request ${request.id}`,
    request.id,
    'payment'
  )

  return request
}

const approveRefund = async (
  id: string,
  approvedAmount: number,
  notes: string,
  reviewerName: string
): Promise<RefundRequest> => {
  const db = getDb(REFUNDS_KEY, seedRefunds)
  const idx = db.findIndex(r => r.id === id)
  if (idx === -1) throw new Error(`Refund ${id} not found`)

  const request = db[idx]
  const now = new Date().toISOString()

  request.status = 'approved'
  request.approvedAmount = approvedAmount
  request.reviewedBy = reviewerName
  request.reviewedAt = now
  request.notes = notes
  request.updatedAt = now
  request.timeline.push({
    action: 'Refund Approved',
    actor: reviewerName,
    timestamp: now,
    notes: `Approved amount: ₹${approvedAmount}. Notes: ${notes}`
  })

  db[idx] = request
  saveDb(REFUNDS_KEY, db)

  logAuditAction(
    `REFUND_APPROVED: ${request.id}`,
    `Approved refund request. Approved amount: ₹${approvedAmount}`,
    request.id,
    'payment'
  )

  return request
}

const rejectRefund = async (id: string, reason: string, reviewerName: string): Promise<RefundRequest> => {
  const db = getDb(REFUNDS_KEY, seedRefunds)
  const idx = db.findIndex(r => r.id === id)
  if (idx === -1) throw new Error(`Refund ${id} not found`)

  const request = db[idx]
  const now = new Date().toISOString()

  request.status = 'rejected'
  request.reviewedBy = reviewerName
  request.reviewedAt = now
  request.notes = reason
  request.updatedAt = now
  request.timeline.push({
    action: 'Refund Rejected',
    actor: reviewerName,
    timestamp: now,
    notes: `Rejection reason: ${reason}`
  })

  db[idx] = request
  saveDb(REFUNDS_KEY, db)

  logAuditAction(
    `REFUND_REJECTED: ${request.id}`,
    `Rejected refund request. Reason: ${reason}`,
    request.id,
    'payment'
  )

  return request
}

const markRefundProcessing = async (id: string, processorName: string): Promise<RefundRequest> => {
  const db = getDb(REFUNDS_KEY, seedRefunds)
  const idx = db.findIndex(r => r.id === id)
  if (idx === -1) throw new Error(`Refund ${id} not found`)

  const request = db[idx]
  const now = new Date().toISOString()

  request.status = 'processing'
  request.processedBy = processorName
  request.processedAt = now
  request.updatedAt = now
  request.timeline.push({
    action: 'Refund Processing',
    actor: processorName,
    timestamp: now,
    notes: 'Triggered gateway settlement transaction batching.'
  })

  db[idx] = request
  saveDb(REFUNDS_KEY, db)

  logAuditAction(
    `REFUND_PROCESSING: ${request.id}`,
    `Shifted state to processing for refund request ${request.id}`,
    request.id,
    'payment'
  )

  return request
}

const markRefundCompleted = async (id: string, processorName: string): Promise<RefundRequest> => {
  const db = getDb(REFUNDS_KEY, seedRefunds)
  const idx = db.findIndex(r => r.id === id)
  if (idx === -1) throw new Error(`Refund ${id} not found`)

  const request = db[idx]
  const now = new Date().toISOString()

  request.status = 'completed'
  request.processedBy = processorName
  request.processedAt = now
  request.updatedAt = now
  request.timeline.push({
    action: 'Refund Completed',
    actor: processorName,
    timestamp: now,
    notes: 'Gateway payout settled. Transaction reference: PG-REFUND-SUCCESS-9920'
  })

  db[idx] = request
  saveDb(REFUNDS_KEY, db)

  logAuditAction(
    `REFUND_COMPLETED: ${request.id}`,
    `Refund marked completed and transaction finalized.`,
    request.id,
    'payment'
  )

  return request
}

export const RefundService = {
  getRefunds,
  getRefundById,
  createRefund,
  startRefundReview,
  approveRefund,
  rejectRefund,
  markRefundProcessing,
  markRefundCompleted
}

export default RefundService
