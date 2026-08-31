import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  DeliveryHistoryParams,
  ListTemplatesParams,
  PushHistoryParams,
  SchedulePushInput,
  SendPushInput,
  TemplateInput,
} from '../types'
import { CommunicationsService } from '../services'

const QK = {
  templates: (params?: ListTemplatesParams) => ['communications', 'templates', params ?? {}] as const,
  deliveryHistory: (params?: DeliveryHistoryParams) =>
    ['communications', 'delivery-history', params ?? {}] as const,
  pushHistory: (params?: PushHistoryParams) => ['communications', 'push-history', params ?? {}] as const,
}

export const useTemplates = (params?: ListTemplatesParams) =>
  useQuery({
    queryKey: QK.templates(params),
    queryFn: () => CommunicationsService.getTemplates(params),
  })

export const useCreateTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: TemplateInput) => CommunicationsService.createTemplate(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communications', 'templates'] }),
  })
}

export const useUpdateTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TemplateInput> }) =>
      CommunicationsService.updateTemplate(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communications', 'templates'] }),
  })
}

export const useDeliveryHistory = (params?: DeliveryHistoryParams) =>
  useQuery({
    queryKey: QK.deliveryHistory(params),
    queryFn: () => CommunicationsService.getDeliveryHistory(params),
  })

export const usePushHistory = (params?: PushHistoryParams) =>
  useQuery({
    queryKey: QK.pushHistory(params),
    queryFn: () => CommunicationsService.getPushHistory(params),
  })

export const useSendPush = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SendPushInput) => CommunicationsService.sendPush(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communications', 'push-history'] })
      qc.invalidateQueries({ queryKey: ['communications', 'delivery-history'] })
    },
  })
}

export const useSchedulePush = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SchedulePushInput) => CommunicationsService.schedulePush(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communications', 'push-history'] }),
  })
}

export const useRetryPush = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => CommunicationsService.retryPush(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communications', 'push-history'] })
      qc.invalidateQueries({ queryKey: ['communications', 'delivery-history'] })
    },
  })
}
