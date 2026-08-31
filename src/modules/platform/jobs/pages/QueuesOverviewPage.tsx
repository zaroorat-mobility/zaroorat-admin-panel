import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Clock, Layers } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { useJobQueues, useJobSchedulers } from '../hooks'
import type { QueueSummary, SchedulerEntry } from '../types'
import { cn } from '@/shared/utils'
import { usePlatformPageActions } from '../../layout/platform-page-context'

export const QueuesOverviewPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: queues = [], isLoading, isError, refetch, isFetching } = useJobQueues()
  const { data: schedulers = [] } = useJobSchedulers()

  usePlatformPageActions(
    useMemo(
      () => (
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2 text-xs font-semibold h-9 rounded-lg border-border"
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          Refresh
        </Button>
      ),
      [isFetching, refetch],
    ),
  )

  const queueColumns: DataTableColumn<QueueSummary>[] = [
    {
      key: 'name',
      label: 'Queue',
      align: 'left',
      render: (val: string) => (
        <button
          onClick={() => navigate(`/platform/jobs/queues/${val}`)}
          className="font-mono font-bold text-primary hover:underline text-left"
        >
          {val}
        </button>
      ),
    },
    { key: 'waiting', label: 'Waiting', align: 'center' },
    { key: 'active', label: 'Active', align: 'center' },
    { key: 'delayed', label: 'Delayed', align: 'center' },
    {
      key: 'failed',
      label: 'Failed',
      align: 'center',
      render: (v: number, row) => (
        <button
          onClick={() => v > 0 && navigate(`/platform/jobs/queues/${row.name}?status=failed`)}
          className={cn(v > 0 && 'cursor-pointer')}
        >
          <Badge variant={v > 0 ? 'danger' : 'neutral'}>{v}</Badge>
        </button>
      ),
    },
    { key: 'completed', label: 'Completed', align: 'center' },
  ]

  const schedulerColumns: DataTableColumn<SchedulerEntry>[] = [
    { key: 'queue', label: 'Queue', align: 'left', render: (v: string) => <span className="font-mono text-xs">{v}</span> },
    { key: 'jobName', label: 'Job Name', align: 'left', render: (v: string) => <span className="font-semibold text-sm">{v}</span> },
    { key: 'pattern', label: 'Cron Pattern', align: 'center', render: (v: string) => <Badge variant="neutral" outline>{v}</Badge> },
    { key: 'timezone', label: 'Timezone', align: 'center', render: (v: string) => <span className="text-xs">{v}</span> },
    {
      key: 'nextRunAt',
      label: 'Next Run',
      align: 'center',
      render: (v: string | null) => (
        <span className="font-mono text-[10px]">{v ? new Date(v).toLocaleString('en-IN') : '—'}</span>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Queue Overview</h3>
        </div>
        <DataTable
          columns={queueColumns}
          data={queues}
          isLoading={isLoading}
          isError={isError}
          selectable={false}
          searchPlaceholder="Search queues…"
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Schedulers</h3>
          <Badge variant="neutral">{schedulers.length}</Badge>
        </div>
        {schedulers.length === 0 ? (
          <Card className="premium-card">
            <CardContent className="p-6 text-sm text-slate-500 text-left">No schedulers registered.</CardContent>
          </Card>
        ) : (
          <DataTable
            columns={schedulerColumns}
            data={schedulers}
            isLoading={false}
            isError={false}
            selectable={false}
            searchPlaceholder=""
          />
        )}
      </div>
    </div>
  )
}

export default QueuesOverviewPage
