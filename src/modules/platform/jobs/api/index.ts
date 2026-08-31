import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { JobStatus, JobSummary, QueueSummary, SchedulerEntry } from '../types'

export const getJobQueues = async (): Promise<QueueSummary[]> => {
  const response = await api.get<{ data: QueueSummary[] }>(API_ENDPOINTS.jobs.queues)
  return response.data.data
}

export const getQueueJobs = async (
  queueName: string,
  params?: { status?: JobStatus; page?: number; limit?: number },
): Promise<{ data: JobSummary[]; meta: { page: number; limit: number } }> => {
  const response = await api.get<{ data: JobSummary[]; meta: { page: number; limit: number } }>(
    API_ENDPOINTS.jobs.queueJobs(queueName),
    { params },
  )
  return response.data
}

export const getJobSchedulers = async (): Promise<SchedulerEntry[]> => {
  const response = await api.get<{ data: SchedulerEntry[] }>(API_ENDPOINTS.jobs.schedulers)
  return response.data.data
}

export const getJobDetail = async (queue: string, jobId: string): Promise<JobSummary> => {
  const response = await api.get<{ data: JobSummary }>(API_ENDPOINTS.jobs.jobDetail(queue, jobId))
  return response.data.data
}

export const mutateJob = async (
  queue: string,
  jobId: string,
  action: 'retry' | 'remove',
): Promise<void> => {
  await api.post(API_ENDPOINTS.jobs.mutateJob(queue, jobId), { action })
}
