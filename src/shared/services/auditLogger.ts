export interface AuditLogEntry {
  id: string
  timestamp: string
  actor: string
  action: string
  entityId?: string
  entityType?: 'driver' | 'rider' | 'vehicle' | 'fare_config' | 'payment' | 'sos' | 'ride' | 'complaint'
  notes?: string
}

export const logAuditAction = (
  action: string,
  notes?: string,
  entityId?: string,
  entityType?: 'driver' | 'rider' | 'vehicle' | 'fare_config' | 'payment' | 'sos' | 'ride' | 'complaint',
  actor: string = 'Admin Operator'
) => {
  try {
    const dbKey = 'zaroorat_audit_logs_db'
    const db = localStorage.getItem(dbKey)
    const logs: AuditLogEntry[] = db ? JSON.parse(db) : []
    
    const newEntry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      entityId,
      entityType,
      notes
    }
    
    logs.push(newEntry)
    localStorage.setItem(dbKey, JSON.stringify(logs))
  } catch (error) {
    console.error('Failed to write audit log entry:', error)
  }
}
