import React, { useState } from 'react'
import { RefreshCw, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import { usePushHistory, useRetryPush } from '../hooks'
import type { BroadcastStatus, PushBroadcast } from '../types'

const STATUSES: BroadcastStatus[] = [
  'DRAFT',
  'SCHEDULED',
  'SENDING',
  'SENT',
  'FAILED',
  'CANCELLED',
]

function statusVariant(status: BroadcastStatus): 'success' | 'warning' | 'danger' | 'secondary' | 'neutral' {
  if (status === 'SENT') return 'success'
  if (status === 'FAILED') return 'danger'
  if (status === 'SCHEDULED' || status === 'SENDING') return 'warning'
  return 'secondary'
}

function formatTargeting(row: PushBroadcast): string {
  const t = row.targeting
  if (!t) return '—'
  if (t.all) return 'All users'
  if (t.roles?.length) return `Roles: ${t.roles.join(', ')}`
  if (t.userIds?.length) return `${t.userIds.length} user(s)`
  return '—'
}

export const PushHistoryPage: React.FC = () => {
  const navigate = useNavigate()
  const canWrite = hasPermission(useAuthStore((s) => s.user), 'communications:write')
  const [statusFilter, setStatusFilter] = useState<BroadcastStatus | ''>('')
  const { data, isLoading, refetch } = usePushHistory({
    limit: 50,
    status: statusFilter || undefined,
  })
  const retry = useRetryPush()

  const rows = data?.data ?? []

  const columns: DataTableColumn<PushBroadcast>[] = [
    {
      key: 'title',
      label: 'Notification',
      render: (val: string, row) => (
        <div className="max-w-xs text-left">
          <p className="font-bold text-xs text-slate-800 dark:text-white truncate">{val}</p>
          <p className="text-[10px] text-muted-foreground line-clamp-1">{row.body}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (val: BroadcastStatus) => <Badge variant={statusVariant(val)}>{val}</Badge>,
    },
    {
      key: 'targeting',
      label: 'Audience',
      render: (_: unknown, row) => <span className="text-xs">{formatTargeting(row)}</span>,
    },
    {
      key: 'sentCount',
      label: 'Delivery',
      align: 'center',
      render: (_: unknown, row) => (
        <span className="text-xs font-mono">
          {row.sentCount}/{row.totalRecipients}
          {row.failedCount > 0 ? (
            <span className="text-rose-500 ml-1">({row.failedCount} failed)</span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'scheduledAt',
      label: 'Schedule / Sent',
      render: (_: unknown, row) => (
        <div className="text-[10px] font-mono text-muted-foreground">
          {row.scheduledAt ? <div>Sched: {new Date(row.scheduledAt).toLocaleString()}</div> : null}
          {row.sentAt ? <div>Sent: {new Date(row.sentAt).toLocaleString()}</div> : null}
          {!row.scheduledAt && !row.sentAt ? '—' : null}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (val: string) => (
        <span className="text-[10px] font-mono text-muted-foreground">{new Date(val).toLocaleString()}</span>
      ),
    },
    ...(canWrite
      ? [
          {
            key: 'actions',
            label: 'Action',
            align: 'center' as const,
            render: (_: unknown, row: PushBroadcast) =>
              row.status === 'FAILED' ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  disabled={retry.isPending}
                  onClick={() => retry.mutate(row.id, { onSuccess: () => refetch() })}
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </Button>
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
          },
        ]
      : []),
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Push Broadcast History"
        description="Review sent and scheduled push campaigns with delivery metrics."
        actions={
          canWrite ? (
            <Button onClick={() => navigate('/communications/push/compose')} className="gap-1.5 text-xs h-9">
              <Send className="h-4 w-4" />
              Compose Push
            </Button>
          ) : undefined
        }
      />

      <div className="space-y-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as BroadcastStatus | '')}
          className="text-xs border border-border rounded-md px-2 py-1.5 bg-card"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <DataTable columns={columns} data={rows} isLoading={isLoading} resultLabel="broadcasts" />
      </div>
    </PageWrapper>
  )
}

export default PushHistoryPage
