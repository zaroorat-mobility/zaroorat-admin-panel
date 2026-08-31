import React, { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { Pagination } from '@/shared/components/Pagination'
import { useQueueJobs } from '../hooks'
import type { JobStatus, JobSummary } from '../types'
import { JobDetailDrawer } from '../components/JobDetailDrawer'
import { usePlatformPageActions } from '../../layout/platform-page-context'

const STATUS_OPTIONS: JobStatus[] = ['waiting', 'active', 'delayed', 'failed', 'completed']

const statusVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
  if (status === 'completed') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'active') return 'info'
  if (status === 'delayed') return 'warning'
  return 'neutral'
}

export const QueueJobsPage: React.FC = () => {
  const { queueName } = useParams<{ queueName: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const queue = queueName ?? ''
  const status = (searchParams.get('status') as JobStatus) || 'waiting'
  const [page, setPage] = useState(0)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const limit = 20

  const { data, isLoading, isError, refetch, isFetching } = useQueueJobs(queue, { status, page, limit })
  const jobs = data?.data ?? []

  usePlatformPageActions(
    useMemo(
      () => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/platform/jobs')}
            className="gap-2 text-xs font-semibold h-9 rounded-lg border-border"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2 text-xs font-semibold h-9 rounded-lg border-border"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      ),
      [isFetching, navigate, refetch],
    ),
  )

  const columns: DataTableColumn<JobSummary>[] = [
    {
      key: 'id',
      label: 'Job ID',
      align: 'left',
      render: (val: string) => (
        <button
          onClick={() => setSelectedJobId(val)}
          className="font-mono text-xs font-bold text-primary hover:underline"
        >
          {val}
        </button>
      ),
    },
    { key: 'name', label: 'Name', align: 'left', render: (v: string) => <span className="font-semibold text-sm">{v}</span> },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (val: string) => <Badge variant={statusVariant(val)}>{val}</Badge>,
    },
    { key: 'attemptsMade', label: 'Attempts', align: 'center' },
    {
      key: 'timestamp',
      label: 'Created',
      align: 'center',
      render: (val: string | null) => (
        <span className="font-mono text-[10px]">{val ? new Date(val).toLocaleString('en-IN') : '—'}</span>
      ),
    },
    {
      key: 'failedReason',
      label: 'Error',
      align: 'left',
      render: (val: string | null) => (
        <span className="text-xs text-red-600 truncate max-w-[200px] block">{val || '—'}</span>
      ),
    },
  ]

  return (
    <>
      <div className="space-y-4">
        <Card className="premium-card">
          <CardContent className="p-4 flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSearchParams({ status: s })
                  setPage(0)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  status === s
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {s}
              </button>
            ))}
          </CardContent>
        </Card>

        <DataTable
          columns={columns}
          data={jobs}
          isLoading={isLoading}
          isError={isError}
          selectable={false}
          searchPlaceholder="Search jobs…"
          hidePagination
        />

        {jobs.length >= limit && (
          <Pagination
            currentPage={page + 1}
            totalPages={page + 2}
            onPageChange={(p) => setPage(p - 1)}
          />
        )}
      </div>

      <JobDetailDrawer
        queue={queue}
        jobId={selectedJobId}
        onClose={() => setSelectedJobId(null)}
      />
    </>
  )
}

export default QueueJobsPage
