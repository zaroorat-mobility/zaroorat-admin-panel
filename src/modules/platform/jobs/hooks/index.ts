import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getJobDetail, getJobQueues, getJobSchedulers, getQueueJobs, mutateJob } from '../api'
import type { JobStatus } from '../types'

const keys = {
  queues: ['jobs', 'queues'] as const,
  schedulers: ['jobs', 'schedulers'] as const,
  queueJobs: (queue: string, status: JobStatus, page: number) =>
    ['jobs', 'queue', queue, status, page] as const,
  jobDetail: (queue: string, jobId: string) => ['jobs', 'detail', queue, jobId] as const,
}

export const useJobQueues = (options?: { refetchInterval?: number | false }) =>
  useQuery({
    queryKey: keys.queues,
    queryFn: getJobQueues,
    refetchInterval: options?.refetchInterval ?? 15000,
  })

export const useJobSchedulers = () =>
  useQuery({
    queryKey: keys.schedulers,
    queryFn: getJobSchedulers,
  })

export const useQueueJobs = (
  queue: string,
  params?: { status?: JobStatus; page?: number; limit?: number },
) =>
  useQuery({
    queryKey: keys.queueJobs(queue, params?.status ?? 'waiting', params?.page ?? 0),
    queryFn: () => getQueueJobs(queue, params),
    enabled: Boolean(queue),
  })

export const useJobDetail = (queue: string, jobId: string | null) =>
  useQuery({
    queryKey: keys.jobDetail(queue, jobId ?? ''),
    queryFn: () => getJobDetail(queue, jobId!),
    enabled: Boolean(queue && jobId),
  })

export const useMutateJob = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      queue,
      jobId,
      action,
    }: {
      queue: string
      jobId: string
      action: 'retry' | 'remove'
    }) => mutateJob(queue, jobId, action),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({
        queryKey: keys.jobDetail(variables.queue, variables.jobId),
      })
    },
  })
}
