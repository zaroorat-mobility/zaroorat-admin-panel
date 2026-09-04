import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type { FinanceAuditLog } from '../transactions/types'

const getFinanceAuditLogs = async (
  params?: QueryParams,
): Promise<PaginatedResponse<FinanceAuditLog>> => {
  const response = await api.get<PaginatedResponse<FinanceAuditLog>>(
    API_ENDPOINTS.finance.auditLogs,
    { params },
  )
  return response.data
}

/** Audit writes are owned by the backend; kept as a no-op for call-site compatibility. */
const writeFinanceAudit = (
  _correlationId: string,
  _user: string,
  _action: string,
  _module: FinanceAuditLog['module'],
  _entityType: FinanceAuditLog['entityType'],
  _entityId: string,
  _severity: FinanceAuditLog['severity'],
  _notes?: string,
  _oldValue?: string,
  _newValue?: string,
) => {
  // no-op
}

export const FinanceAuditService = {
  getFinanceAuditLogs,
  writeFinanceAudit,
}

export default FinanceAuditService
