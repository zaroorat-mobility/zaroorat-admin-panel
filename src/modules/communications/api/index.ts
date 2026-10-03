import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { PaginatedResponse } from '@/shared/types'
import type {
  DeliveryHistoryItem,
  DeliveryHistoryParams,
  ListTemplatesParams,
  NotificationTemplate,
  PushBroadcast,
  PushHistoryParams,
  SchedulePushInput,
  SendPushInput,
  TemplateInput,
} from '../types'

export const getTemplates = async (
  params?: ListTemplatesParams,
): Promise<PaginatedResponse<NotificationTemplate>> => {
  const response = await api.get<PaginatedResponse<NotificationTemplate>>(
    API_ENDPOINTS.communications.templates,
    { params },
  )
  return response.data
}

export const createTemplate = async (data: TemplateInput): Promise<NotificationTemplate> => {
  const response = await api.post<{ data: NotificationTemplate }>(
    API_ENDPOINTS.communications.templates,
    data,
  )
  return response.data.data
}

export const updateTemplate = async (
  id: string,
  data: Partial<TemplateInput>,
): Promise<NotificationTemplate> => {
  const response = await api.put<{ data: NotificationTemplate }>(
    API_ENDPOINTS.communications.template(id),
    data,
  )
  return response.data.data
}

export const getDeliveryHistory = async (
  params?: DeliveryHistoryParams,
): Promise<PaginatedResponse<DeliveryHistoryItem>> => {
  const response = await api.get<PaginatedResponse<DeliveryHistoryItem>>(
    API_ENDPOINTS.communications.history,
    { params },
  )
  return response.data
}

export const sendPush = async (data: SendPushInput): Promise<PushBroadcast> => {
  const response = await api.post<{ data: PushBroadcast }>(
    API_ENDPOINTS.communications.pushSend,
    data,
  )
  return response.data.data
}

/// `idempotencyKey` belongs to the compose draft, not the call: resubmitting the same draft
/// (a double click, a retry after a timeout) schedules one broadcast, not two.
export const schedulePush = async (
  data: SchedulePushInput,
  idempotencyKey: string,
): Promise<PushBroadcast> => {
  const response = await api.post<{ data: PushBroadcast }>(
    API_ENDPOINTS.communications.pushSchedule,
    data,
    { headers: { 'Idempotency-Key': idempotencyKey } },
  )
  return response.data.data
}

export const getPushHistory = async (
  params?: PushHistoryParams,
): Promise<PaginatedResponse<PushBroadcast>> => {
  const response = await api.get<PaginatedResponse<PushBroadcast>>(
    API_ENDPOINTS.communications.pushHistory,
    { params },
  )
  return response.data
}

export const retryPush = async (id: string): Promise<PushBroadcast> => {
  const response = await api.post<{ data: PushBroadcast }>(
    API_ENDPOINTS.communications.pushRetry(id),
  )
  return response.data.data
}
