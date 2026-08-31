import React, { useState } from 'react'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { Badge } from '@/shared/components/ui/Badge'
import { useDeliveryHistory } from '../hooks'
import type { DeliveryHistoryItem, DeliveryStatus, NotificationChannel } from '../types'

const CHANNELS: NotificationChannel[] = ['PUSH', 'SMS', 'EMAIL', 'IN_APP', 'WHATSAPP']
const STATUSES: DeliveryStatus[] = ['PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'READ']

function statusVariant(status: DeliveryStatus): 'success' | 'warning' | 'danger' | 'secondary' | 'neutral' {
  if (status === 'DELIVERED' || status === 'READ') return 'success'
  if (status === 'FAILED') return 'danger'
  if (status === 'QUEUED' || status === 'PENDING') return 'warning'
  return 'secondary'
}

export const DeliveryHistoryPage: React.FC = () => {
  const [channelFilter, setChannelFilter] = useState<NotificationChannel | ''>('')
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | ''>('')

  const { data, isLoading } = useDeliveryHistory({
    limit: 50,
    channel: channelFilter || undefined,
    status: statusFilter || undefined,
  })

  const rows = data?.data ?? []

  const columns: DataTableColumn<DeliveryHistoryItem>[] = [
    {
      key: 'channel',
      label: 'Channel',
      render: (val: string) => (
        <span className="text-[10px] font-bold uppercase tracking-wide">{val}</span>
      ),
    },
    {
      key: 'recipient',
      label: 'Recipient',
      render: (val: string | null) => (
        <span className="font-mono text-xs text-slate-700 dark:text-slate-200">{val ?? '—'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (val: DeliveryStatus) => <Badge variant={statusVariant(val)}>{val}</Badge>,
    },
    {
      key: 'failureReason',
      label: 'Failure Reason',
      render: (val: string | null) =>
        val ? <span className="text-xs text-rose-600 line-clamp-2">{val}</span> : '—',
    },
    {
      key: 'sentAt',
      label: 'Timeline',
      render: (_: unknown, row) => (
        <div className="text-[10px] font-mono text-muted-foreground space-y-0.5">
          {row.sentAt ? <div>Sent: {new Date(row.sentAt).toLocaleString()}</div> : null}
          {row.deliveredAt ? <div>Delivered: {new Date(row.deliveredAt).toLocaleString()}</div> : null}
          {row.openedAt ? <div>Opened: {new Date(row.openedAt).toLocaleString()}</div> : null}
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
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Delivery History"
        description="Audit log of individual notification deliveries across all channels."
      />

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as NotificationChannel | '')}
            className="text-xs border border-border rounded-md px-2 py-1.5 bg-card"
          >
            <option value="">All channels</option>
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DeliveryStatus | '')}
            className="text-xs border border-border rounded-md px-2 py-1.5 bg-card"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <DataTable columns={columns} data={rows} isLoading={isLoading} resultLabel="deliveries" />
      </div>
    </PageWrapper>
  )
}

export default DeliveryHistoryPage
