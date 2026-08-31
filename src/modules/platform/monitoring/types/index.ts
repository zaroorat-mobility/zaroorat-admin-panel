export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export interface ComponentHealth {
  name: string
  status: HealthStatus
  message?: string
  latencyMs?: number
}

export interface MonitoringHealth {
  overall: HealthStatus
  components: ComponentHealth[]
  checkedAt: string
}

export interface QueueBacklog {
  queue: string
  waiting: number
  active: number
  delayed: number
  failed: number
  completed: number
}

export interface MonitoringPerformance {
  requestTotal: number
  errorRate: number
  serverErrorCount: number
  clientErrorCount: number
  queueBacklog: QueueBacklog[]
  outboxPending: number | null
  outboxFailed: number | null
  processUptimeSeconds: number | null
  heapUsedBytes: number | null
  collectedAt: string
}

export interface StoredErrorEvent {
  id: string
  message: string
  source: string
  severity: 'error' | 'warn'
  occurredAt: string
  metadata?: Record<string, unknown>
}

export type AlertSeverity = 'critical' | 'operational' | 'business'

export interface MonitoringAlert {
  id: string
  severity: AlertSeverity
  title: string
  message: string
  source: string
  createdAt: string
  acknowledged: boolean
  acknowledgedAt?: string
  acknowledgedBy?: string
}
