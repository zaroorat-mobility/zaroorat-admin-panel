export interface QueueSummary {
  name: string
  waiting: number
  active: number
  delayed: number
  failed: number
  completed: number
}

export interface JobSummary {
  id: string
  name: string
  queue: string
  status: string
  attemptsMade: number
  timestamp: string | null
  processedOn: string | null
  finishedOn: string | null
  failedReason: string | null
  data: unknown
}

export interface SchedulerEntry {
  id: string
  queue: string
  jobName: string
  pattern: string
  timezone: string
  nextRunAt: string | null
}

export type JobStatus = 'waiting' | 'active' | 'delayed' | 'failed' | 'completed'
