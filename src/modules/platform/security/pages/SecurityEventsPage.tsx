import React, { useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { Pagination } from '@/shared/components/Pagination'
import { useSecurityEvents } from '../hooks'
import type { SecurityEvent } from '../types'
import { usePlatformPageActions } from '../../layout/platform-page-context'

const ACTION_OPTIONS = [
  'all',
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'EXPORT',
  'APPROVE',
  'REJECT',
] as const

export const SecurityEventsPage: React.FC = () => {
  const [page, setPage] = useState(1)
  const [action, setAction] = useState<string>('all')
  const limit = 20

  const { data, isLoading, isError, refetch, isFetching } = useSecurityEvents({
    page,
    limit,
    ...(action !== 'all' ? { action } : {}),
  })

  const events = data?.data ?? []
  const meta = data?.meta

  usePlatformPageActions(
    useMemo(
      () => (
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2 text-xs font-semibold h-9 rounded-lg border-border"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      ),
      [isFetching, refetch],
    ),
  )

  const columns: DataTableColumn<SecurityEvent>[] = [
    {
      key: 'createdAt',
      label: 'Timestamp',
      align: 'center',
      render: (val: string) => (
        <span className="font-mono text-[10px]">{new Date(val).toLocaleString('en-IN')}</span>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      align: 'center',
      render: (val: string) => <Badge variant="info">{val}</Badge>,
    },
    {
      key: 'actorId',
      label: 'Actor',
      align: 'left',
      render: (val: string | null) => (
        <span className="font-mono text-xs">{val ? `${val.slice(0, 8)}…` : 'System'}</span>
      ),
    },
    {
      key: 'entityType',
      label: 'Entity',
      align: 'left',
      render: (_val: string | null, row) => (
        <div className="text-left">
          {row.entityType && <Badge variant="neutral" outline>{row.entityType}</Badge>}
          {row.entityId && (
            <p className="text-[10px] font-mono text-slate-400 mt-0.5">{row.entityId.slice(0, 12)}…</p>
          )}
        </div>
      ),
    },
    {
      key: 'summary',
      label: 'Summary',
      align: 'left',
      render: (val: string | null, row) => (
        <div className="text-left">
          <p className="text-xs text-slate-600 dark:text-slate-300">{val || '—'}</p>
          {row.ipAddress && (
            <p className="text-[10px] font-mono text-slate-400">{row.ipAddress}</p>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <Card className="premium-card">
        <CardContent className="p-4">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 text-left">
            Filter by action
          </label>
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value)
              setPage(1)
            }}
            className="text-xs border border-border rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-950 min-w-[160px]"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt === 'all' ? 'All actions' : opt}</option>
            ))}
          </select>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={events}
        isLoading={isLoading}
        isError={isError}
        selectable={false}
        searchPlaceholder=""
        hidePagination
      />

      {meta && meta.total > limit && (
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(meta.total / limit)}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}

export default SecurityEventsPage
