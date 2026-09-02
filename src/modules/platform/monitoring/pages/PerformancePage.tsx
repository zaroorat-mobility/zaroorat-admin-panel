import React, { useMemo, useState } from 'react'
import { RefreshCw, Gauge, Database, Clock } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { useMonitoringPerformance } from '../hooks'
import type { QueueBacklog } from '../types'
import { cn } from '@/shared/utils'
import { usePlatformPageActions } from '../../layout/platform-page-context'

const formatBytes = (bytes: number | null): string => {
  if (bytes === null) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatUptime = (seconds: number | null): string => {
  if (seconds === null) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

export const PerformancePage: React.FC = () => {
  const { data, isLoading, isError, refetch, isFetching } = useMonitoringPerformance()

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

  const queueColumns: DataTableColumn<QueueBacklog>[] = [
    { key: 'queue', label: 'Queue', align: 'left', render: (v: string) => <span className="font-mono font-semibold">{v}</span> },
    { key: 'waiting', label: 'Waiting', align: 'center' },
    { key: 'active', label: 'Active', align: 'center' },
    { key: 'delayed', label: 'Delayed', align: 'center' },
    {
      key: 'failed',
      label: 'Failed',
      align: 'center',
      render: (v: number) => (
        <Badge variant={v > 0 ? 'danger' : 'neutral'}>{v}</Badge>
      ),
    },
    { key: 'completed', label: 'Completed', align: 'center' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: data?.requestTotal ?? '—', icon: Gauge },
          {
            label: 'Error Rate',
            value: data ? `${(data.errorRate * 100).toFixed(2)}%` : '—',
            icon: Gauge,
            warn: (data?.errorRate ?? 0) > 0.05,
          },
          { label: '5xx Errors', value: data?.serverErrorCount ?? '—', icon: Gauge },
          { label: '4xx Errors', value: data?.clientErrorCount ?? '—', icon: Gauge },
        ].map(({ label, value, icon: Icon, warn }) => (
          <Card key={label} className="premium-card">
            <CardContent className="p-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
              </div>
              <p className={cn('text-2xl font-bold', warn && 'text-amber-600')}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Outbox Pending', value: data?.outboxPending ?? '—', icon: Database },
          {
            label: 'Outbox Failed',
            value: data?.outboxFailed ?? '—',
            icon: Database,
            warn: (data?.outboxFailed ?? 0) > 0,
          },
          { label: 'Heap Used', value: formatBytes(data?.heapUsedBytes ?? null), icon: Database },
          { label: 'Process Uptime', value: formatUptime(data?.processUptimeSeconds ?? null), icon: Clock },
        ].map(({ label, value, icon: Icon, warn }) => (
          <Card key={label} className="premium-card">
            <CardContent className="p-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
              </div>
              <p className={cn('text-xl font-bold', warn && 'text-red-600')}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {data?.collectedAt && (
        <p className="text-xs text-slate-400 text-left">
          Collected at {new Date(data.collectedAt).toLocaleString('en-IN')}
        </p>
      )}

      <DataTable
        columns={queueColumns}
        data={data?.queueBacklog ?? []}
        isLoading={isLoading}
        isError={isError}
        selectable={false}
        searchPlaceholder="Filter queues…"
      />
    </div>
  )
}

export default PerformancePage
