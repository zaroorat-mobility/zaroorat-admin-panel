import React, { useMemo } from 'react'
import { RefreshCw, CheckCircle } from 'lucide-react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { useAckMonitoringAlert, useMonitoringAlerts } from '../hooks'
import type { AlertSeverity, MonitoringAlert } from '../types'
import { cn } from '@/shared/utils'
import { usePlatformPageActions } from '../../layout/platform-page-context'

const severityVariant = (severity: AlertSeverity): 'danger' | 'warning' | 'info' => {
  if (severity === 'critical') return 'danger'
  if (severity === 'operational') return 'warning'
  return 'info'
}

export const AlertsPage: React.FC = () => {
  const { data = [], isLoading, isError, refetch, isFetching } = useMonitoringAlerts()
  const ackMutation = useAckMonitoringAlert()

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

  const columns: DataTableColumn<MonitoringAlert>[] = [
    {
      key: 'severity',
      label: 'Severity',
      align: 'center',
      render: (val: AlertSeverity) => <Badge variant={severityVariant(val)}>{val}</Badge>,
    },
    {
      key: 'title',
      label: 'Alert',
      align: 'left',
      render: (val: string, row) => (
        <div className="text-left">
          <p className="font-semibold text-sm">{val}</p>
          <p className="text-xs text-slate-500 mt-0.5">{row.message}</p>
        </div>
      ),
    },
    {
      key: 'source',
      label: 'Source',
      align: 'center',
      render: (val: string) => <Badge variant="neutral" outline>{val}</Badge>,
    },
    {
      key: 'acknowledged',
      label: 'Status',
      align: 'center',
      render: (val: boolean) => (
        <Badge variant={val ? 'success' : 'warning'}>{val ? 'Acknowledged' : 'Open'}</Badge>
      ),
    },
    {
      key: 'id',
      label: 'Action',
      align: 'center',
      render: (_val: string, row) =>
        row.acknowledged ? (
          <span className="text-xs text-slate-400">—</span>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 gap-1"
            disabled={ackMutation.isPending}
            onClick={() => ackMutation.mutate(row.id)}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Ack
          </Button>
        ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      isError={isError}
      selectable={false}
      searchPlaceholder="Search alerts…"
    />
  )
}

export default AlertsPage
