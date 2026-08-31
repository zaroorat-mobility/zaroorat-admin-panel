import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type { AuditLogItem } from '../types'

interface AuditLogApiItem {
  id: string
  actorId: string | null
  action: string
  entityType: string | null
  entityId: string | null
  summary: string | null
  createdAt: string
}

interface AuditLogApiResponse {
  data: AuditLogApiItem[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

const mapAuditLogItem = (row: AuditLogApiItem): AuditLogItem => ({
  id: row.id,
  timestamp: row.createdAt,
  actor: row.actorId ?? 'System',
  action: row.action,
  entityId: row.entityId ?? undefined,
  entityType: (row.entityType as AuditLogItem['entityType']) ?? undefined,
  notes: row.summary ?? undefined,
  createdAt: row.createdAt,
  updatedAt: row.createdAt,
})

const getAuditLogs = async (params?: QueryParams): Promise<PaginatedResponse<AuditLogItem>> => {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 25
  const entityType = params?.entityType as string | undefined

  const response = await api.get<AuditLogApiResponse>(API_ENDPOINTS.audit.logs, {
    params: {
      page,
      limit,
      ...(entityType && entityType !== 'all' ? { entityType } : {}),
    },
  })

  const { data, meta } = response.data
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit))

  return {
    data: data.map(mapAuditLogItem),
    meta: {
      currentPage: meta.page,
      totalPages,
      pageSize: meta.limit,
      totalCount: meta.total,
    },
  }
}

export const AuditLogService = {
  getAuditLogs,
}

export default AuditLogService
