import { useQuery } from '@tanstack/react-query'
import type { QueryParams } from '@/shared/types'
import { AuditLogService } from '../services'

export const useAuditLogs = (params?: QueryParams) => {
  return useQuery({
    queryKey: ['audit-log', 'list', params],
    queryFn: () => AuditLogService.getAuditLogs(params),
  })
}
