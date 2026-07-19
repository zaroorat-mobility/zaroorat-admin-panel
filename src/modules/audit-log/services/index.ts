import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type { AuditLogItem } from '../types'

const AUDIT_DB_KEY = 'zaroorat_audit_logs_db'

const getAuditDb = (): AuditLogItem[] => {
  const db = localStorage.getItem(AUDIT_DB_KEY)
  if (!db) {
    const seed = makeSeedAuditLogs()
    localStorage.setItem(AUDIT_DB_KEY, JSON.stringify(seed))
    return seed
  }
  return JSON.parse(db)
}

const makeSeedAuditLogs = (): AuditLogItem[] => {
  const now = new Date()
  return [
    {
      id: 'aud-seed-1',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      actor: 'Admin Operator',
      action: 'Driver Registration Approved',
      entityId: 'drv-1',
      entityType: 'driver',
      notes: 'KYC check passed, monetization plan set to Commission (7%).',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'aud-seed-2',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      actor: 'Admin Operator',
      action: 'Rider Account Suspended',
      entityId: 'rid-3',
      entityType: 'rider',
      notes: 'Excessive cancellations and negative wallet balance unpaid.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'aud-seed-3',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 12).toISOString(),
      actor: 'System Auto-job',
      action: 'Vehicle Document Expired',
      entityId: 'drv-2',
      entityType: 'vehicle',
      notes: 'Flagged RC document for review automatically due to age limit exceed.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
}

const getAuditLogs = async (params?: QueryParams): Promise<PaginatedResponse<AuditLogItem>> => {
  const db = getAuditDb()
  const search = ((params?.search as string) || '').toLowerCase()
  const entityTypeFilter = params?.entityType as string
  const startDate = params?.startDate as string
  const endDate = params?.endDate as string

  let filtered = [...db]

  // Sort by newest first
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  if (search) {
    filtered = filtered.filter(item =>
      item.actor.toLowerCase().includes(search) ||
      item.action.toLowerCase().includes(search) ||
      (item.notes || '').toLowerCase().includes(search) ||
      (item.entityId || '').toLowerCase().includes(search)
    )
  }

  if (entityTypeFilter && entityTypeFilter !== 'all') {
    filtered = filtered.filter(item => item.entityType === entityTypeFilter)
  }

  if (startDate) {
    filtered = filtered.filter(item => new Date(item.timestamp) >= new Date(startDate))
  }

  if (endDate) {
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999) // include whole end day
    filtered = filtered.filter(item => new Date(item.timestamp) <= end)
  }

  return {
    data: filtered,
    meta: {
      currentPage: 1,
      totalPages: Math.ceil(filtered.length / 25),
      pageSize: 25,
      totalCount: filtered.length
    }
  }
}

export const AuditLogService = {
  getAuditLogs
}

export default AuditLogService
