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

export const FinanceAuditService = {
  getFinanceAuditLogs,
}

export default FinanceAuditService
