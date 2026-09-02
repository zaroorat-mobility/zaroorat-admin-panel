import React, { useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { useMonitoringErrors } from '../hooks'
import type { StoredErrorEvent } from '../types'
import { usePlatformPageActions } from '../../layout/platform-page-context'

export const ErrorsPage: React.FC = () => {
  const [limit, setLimit] = useState(50)
  const { data = [], isLoading, isError, refetch, isFetching } = useMonitoringErrors(limit)

  usePlatformPageActions(
    useMemo(
      () => (
        <div className="flex items-center gap-2">
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="text-xs border border-border rounded-lg px-2 py-1.5 bg-slate-50 dark:bg-slate-950"
          >
            {[25, 50, 100, 200].map((n) => (
              <option key={n} value={n}>{n} rows</option>
            ))}
          </select>
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
      [isFetching, limit, refetch],
    ),
  )

  const columns: DataTableColumn<StoredErrorEvent>[] = [
    {
      key: 'occurredAt',
      label: 'Occurred At',
      align: 'center',
      render: (val: string) => (
        <span className="font-mono text-[10px] text-slate-500">
          {new Date(val).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'severity',
      label: 'Severity',
      align: 'center',
      render: (val: string) => (
        <Badge variant={val === 'error' ? 'danger' : 'warning'}>{val}</Badge>
      ),
    },
    {
      key: 'source',
      label: 'Source',
      align: 'left',
      render: (val: string) => <span className="font-mono text-xs">{val}</span>,
    },
    {
      key: 'message',
      label: 'Message',
      align: 'left',
      render: (val: string) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 break-words">{val}</span>
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
      searchPlaceholder="Search errors…"
    />
  )
}

export default ErrorsPage
