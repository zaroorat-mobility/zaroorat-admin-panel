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
import * as communicationsApi from '../api'

export const CommunicationsService = {
  getTemplates: (params?: ListTemplatesParams): Promise<PaginatedResponse<NotificationTemplate>> =>
    communicationsApi.getTemplates(params),
  createTemplate: (data: TemplateInput) => communicationsApi.createTemplate(data),
  updateTemplate: (id: string, data: Partial<TemplateInput>) =>
    communicationsApi.updateTemplate(id, data),
  getDeliveryHistory: (
    params?: DeliveryHistoryParams,
  ): Promise<PaginatedResponse<DeliveryHistoryItem>> => communicationsApi.getDeliveryHistory(params),
  sendPush: (data: SendPushInput) => communicationsApi.sendPush(data),
  schedulePush: (data: SchedulePushInput) => communicationsApi.schedulePush(data),
  getPushHistory: (params?: PushHistoryParams): Promise<PaginatedResponse<PushBroadcast>> =>
    communicationsApi.getPushHistory(params),
  retryPush: (id: string) => communicationsApi.retryPush(id),
}
