import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type { FinanceAuditLog } from '../transactions/types'

const AUDITS_KEY = 'zaroorat_finance_audit_logs_db'

const getDb = (): FinanceAuditLog[] => {
  const raw = localStorage.getItem(AUDITS_KEY)
  if (!raw) {
    const seed = seedFinanceAudits()
    localStorage.setItem(AUDITS_KEY, JSON.stringify(seed))
    return seed
  }
  return JSON.parse(raw)
}

const saveDb = (data: FinanceAuditLog[]) => {
  localStorage.setItem(AUDITS_KEY, JSON.stringify(data))
}

const seedFinanceAudits = (): FinanceAuditLog[] => {
  const list: FinanceAuditLog[] = []
  const now = Date.now()
  const users = ['Finance Manager', 'Support Agent 03', 'Operations Admin', 'System Agent']
  
  const auditTemplates = [
    { action: 'TRANSACTION_CAPTURED', module: 'transactions' as const, entityType: 'ride' as const, severity: 'info' as const, notes: 'Payment capture completed successfully via Razorpay.' },
    { action: 'TRANSACTION_FAILED', module: 'transactions' as const, entityType: 'ride' as const, severity: 'critical' as const, notes: 'Payment authorization failed: Insufficient funds.' },
    { action: 'TRANSACTION_REVERSED', module: 'transactions' as const, entityType: 'ride' as const, severity: 'critical' as const, notes: 'Charge reversal initiated due to gateway timeout resolution.' },
    { action: 'REFUND_APPROVED', module: 'refunds' as const, entityType: 'refund' as const, severity: 'warning' as const, notes: 'Refund request approved by manager clearance tier.' },
    { action: 'REFUND_COMPLETED', module: 'refunds' as const, entityType: 'refund' as const, severity: 'info' as const, notes: 'Refund payout settled successfully through gateway node.' },
    { action: 'DISPUTE_CREATED', module: 'disputes' as const, entityType: 'dispute' as const, severity: 'warning' as const, notes: 'Upfront estimate fare discrepancy dispute filed by rider.' },
    { action: 'DISPUTE_RESOLVED', module: 'disputes' as const, entityType: 'dispute' as const, severity: 'info' as const, notes: 'Dispute resolved in favor of rider. Fare rules override applied.' },
    { action: 'SETTLEMENT_GENERATED', module: 'settlements' as const, entityType: 'settlement' as const, severity: 'info' as const, notes: 'Driver settlement batch calculated for period 01 Jul - 15 Jul.' },
    { action: 'SETTLEMENT_PAID', module: 'settlements' as const, entityType: 'settlement' as const, severity: 'info' as const, notes: 'Batch payout completed. Driver wallets updated to zero balance.' }
  ]

  for (let i = 1; i <= 35; i++) {
    const template = auditTemplates[i % auditTemplates.length]
    const timeOffset = i * 6 * 3600000 // Spaced out
    
    list.push({
      id: `flog-${i}`,
      correlationId: `CORR-FIN-${202600 + i}`,
      user: users[i % users.length],
      ipAddress: `192.168.10.${10 + i}`,
      action: template.action,
      module: template.module,
      entityType: template.entityType,
      entityId: `${template.entityType}-${1000 + i}`,
      oldValue: i % 4 === 0 ? 'STATUS: pending' : undefined,
      newValue: i % 4 === 0 ? 'STATUS: approved' : undefined,
      severity: template.severity,
      notes: template.notes,
      createdAt: new Date(now - timeOffset).toISOString(),
      updatedAt: new Date(now - timeOffset).toISOString()
    })
  }

  return list
}

const getFinanceAuditLogs = async (params?: QueryParams): Promise<PaginatedResponse<FinanceAuditLog>> => {
  const db = getDb()
  const search = ((params?.search as string) || '').toLowerCase()
  const moduleFilter = params?.module as string
  const severityFilter = params?.severity as string

  let filtered = [...db]

  if (search) {
    filtered = filtered.filter(l =>
      l.correlationId.toLowerCase().includes(search) ||
      l.action.toLowerCase().includes(search) ||
      l.user.toLowerCase().includes(search) ||
      l.entityId.toLowerCase().includes(search)
    )
  }

  if (moduleFilter && moduleFilter !== 'all') {
    filtered = filtered.filter(l => l.module === moduleFilter)
  }
  if (severityFilter && severityFilter !== 'all') {
    filtered = filtered.filter(l => l.severity === severityFilter)
  }

  // Sort desc
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return {
    data: filtered,
    meta: { currentPage: 1, totalPages: 1, pageSize: 50, totalCount: filtered.length }
  }
}

const writeFinanceAudit = (
  correlationId: string,
  user: string,
  action: string,
  module: FinanceAuditLog['module'],
  entityType: FinanceAuditLog['entityType'],
  entityId: string,
  severity: FinanceAuditLog['severity'],
  notes?: string,
  oldValue?: string,
  newValue?: string
) => {
  const db = getDb()
  const newLog: FinanceAuditLog = {
    id: `flog-${Date.now()}`,
    correlationId,
    user,
    ipAddress: '127.0.0.1',
    action,
    module,
    entityType,
    entityId,
    oldValue,
    newValue,
    severity,
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  db.unshift(newLog)
  saveDb(db)
}

export const FinanceAuditService = {
  getDb,
  getFinanceAuditLogs,
  writeFinanceAudit
}

export default FinanceAuditService
