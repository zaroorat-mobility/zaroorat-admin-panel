import React from 'react'
import { RotateCcw, Trash2 } from 'lucide-react'
import { Drawer } from '@/shared/components/ui/Drawer'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { useJobDetail, useMutateJob } from '../hooks'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'

interface Props {
  queue: string
  jobId: string | null
  onClose: () => void
}

const statusVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
  if (status === 'completed') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'active') return 'info'
  if (status === 'delayed') return 'warning'
  return 'neutral'
}

export const JobDetailDrawer: React.FC<Props> = ({ queue, jobId, onClose }) => {
  const { user } = useAuthStore()
  const canWrite = hasPermission(user, 'jobs:write')
  const { data: job, isLoading, isError } = useJobDetail(queue, jobId)
  const mutateMutation = useMutateJob()

  const handleAction = (action: 'retry' | 'remove') => {
    if (!jobId) return
    const label = action === 'retry' ? 'retry this job' : 'remove this job'
    if (!window.confirm(`Are you sure you want to ${label}?`)) return
    mutateMutation.mutate(
      { queue, jobId, action },
      { onSuccess: () => action === 'remove' && onClose() },
    )
  }

  return (
    <Drawer
      isOpen={Boolean(jobId)}
      onClose={onClose}
      title={job ? `Job ${job.id}` : 'Job Details'}
      size="md"
      footer={
        canWrite && job ? (
          <div className="flex gap-2 w-full justify-end">
            <Button variant="ghost" onClick={onClose} className="text-xs h-8">
              Close
            </Button>
            {job.status === 'failed' && (
              <Button
                variant="outline"
                className="text-xs h-8 gap-1"
                disabled={mutateMutation.isPending}
                onClick={() => handleAction('retry')}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Retry
              </Button>
            )}
            <Button
              variant="outline"
              className="text-xs h-8 gap-1 text-red-600 border-red-200"
              disabled={mutateMutation.isPending}
              onClick={() => handleAction('remove')}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </Button>
          </div>
        ) : (
          <Button variant="ghost" onClick={onClose} className="text-xs h-8">
            Close
          </Button>
        )
      }
    >
      {isLoading && <p className="text-sm text-slate-500">Loading job…</p>}
      {isError && <p className="text-sm text-red-600">Failed to load job details.</p>}
      {job && (
        <div className="space-y-5 text-xs text-left">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-border">
            <span className="font-bold uppercase text-slate-500">Status</span>
            <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
          </div>

          <div className="space-y-2.5">
            {[
              { label: 'Queue', value: job.queue },
              { label: 'Name', value: job.name },
              { label: 'Attempts', value: String(job.attemptsMade) },
              {
                label: 'Created',
                value: job.timestamp ? new Date(job.timestamp).toLocaleString('en-IN') : '—',
              },
              {
                label: 'Processed',
                value: job.processedOn ? new Date(job.processedOn).toLocaleString('en-IN') : '—',
              },
              {
                label: 'Finished',
                value: job.finishedOn ? new Date(job.finishedOn).toLocaleString('en-IN') : '—',
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-slate-500">{label}</span>
                <span className="font-mono text-slate-800 dark:text-white">{value}</span>
              </div>
            ))}
          </div>

          {job.failedReason && (
            <div className="space-y-1">
              <p className="font-bold uppercase text-slate-500 text-[10px]">Failure Reason</p>
              <p className="text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-100 text-xs break-words">
                {job.failedReason}
              </p>
            </div>
          )}

          <div className="space-y-1">
            <p className="font-bold uppercase text-slate-500 text-[10px]">Payload</p>
            <pre className="bg-slate-950 text-slate-100 p-3 rounded-lg overflow-x-auto text-[10px] font-mono">
              {JSON.stringify(job.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </Drawer>
  )
}

export default JobDetailDrawer
