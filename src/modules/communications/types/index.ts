import type { QueryParams } from '@/shared/types'

export type NotificationChannel = 'PUSH' | 'SMS' | 'EMAIL' | 'IN_APP' | 'WHATSAPP'

export type DeliveryStatus = 'PENDING' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ'

export type BroadcastStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'SENDING'
  | 'SENT'
  | 'FAILED'
  | 'CANCELLED'

export interface NotificationTemplate {
  id: string
  eventKey: string
  channel: NotificationChannel
  subject: string | null
  body: string
  variables: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TemplateInput {
  eventKey: string
  channel: NotificationChannel
  subject?: string | null
  body: string
  variables?: string[]
  isActive?: boolean
}

export interface BroadcastTargeting {
  userIds?: string[]
  roles?: string[]
  all?: boolean
}

export interface PushBroadcast {
  id: string
  title: string
  body: string
  channel: NotificationChannel
  targeting: BroadcastTargeting | null
  status: BroadcastStatus
  scheduledAt: string | null
  sentAt: string | null
  sentCount: number
  failedCount: number
  totalRecipients: number
  failureReason: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface SendPushInput {
  title: string
  body: string
  targeting: BroadcastTargeting
  templateId?: string
  data?: Record<string, string>
}

export interface SchedulePushInput extends SendPushInput {
  scheduledAt: string
}

export interface DeliveryHistoryItem {
  id: string
  channel: NotificationChannel
  templateId: string | null
  recipient: string | null
  status: DeliveryStatus
  failureReason: string | null
  sentAt: string | null
  deliveredAt: string | null
  openedAt: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface ListTemplatesParams extends QueryParams {
  channel?: NotificationChannel
  eventKey?: string
  isActive?: 'true' | 'false' | 'all'
}

export interface DeliveryHistoryParams extends QueryParams {
  channel?: NotificationChannel
  status?: DeliveryStatus
}

export interface PushHistoryParams extends QueryParams {
  status?: BroadcastStatus
}
