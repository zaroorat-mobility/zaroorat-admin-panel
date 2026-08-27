import React, { useMemo, useState } from 'react'
import { useReferralHistory, useReferralPrograms, useReferralSegment } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { StatusBadge } from '@/shared/components/StatusBadge'
import type { ReferralHistoryRow } from '../../types'

const STATUSES = [
  'all',
  'PENDING',
  'SIGNED_UP',
  'QUALIFIED',
  'REWARDED',
  'EXPIRED',
  'CANCELLED',
] as const

export const HistoryListPage: React.FC = () => {
  const segment = useReferralSegment()
  const [programId, setProgramId] = useState('')
  const [status, setStatus] = useState<string>('all')
  const { data: programs } = useReferralPrograms({ audience: segment.audience, limit: 100 })
  const { data, isLoading } = useReferralHistory({
    audience: segment.audience,
    limit: 50,
    ...(programId ? { programId } : {}),
    ...(status !== 'all' ? { status } : {}),
  })

  const programOptions = programs?.data ?? []
  const rows = data?.data ?? []
  const refereeLabel = segment.segment === 'driver' ? 'New driver' : 'New rider'

  const columns: DataTableColumn<ReferralHistoryRow>[] = useMemo(
    () => [
      {
        key: 'createdAt',
        label: 'When',
        render: (v: string) => (
          <span className="text-[10px] font-mono">{new Date(v).toLocaleString()}</span>
        ),
      },
      {
        key: 'programCode',
        label: 'Program',
        render: (v: string) => <span className="font-mono text-xs">{v}</span>,
      },
      {
        key: 'referralCode',
        label: 'Code',
        render: (v: string | null) => (
          <span className="font-mono text-xs">{v || '—'}</span>
        ),
      },
      {
        key: 'referrerPhone',
        label: 'Referrer',
        render: (_: string | null, row) => (
          <div className="text-xs">
            <p>{row.referrerPhone || '—'}</p>
            <p className="text-muted-foreground truncate max-w-[140px]">
              {row.referrerEmail || row.referrerId.slice(0, 8)}
            </p>
          </div>
        ),
      },
      {
        key: 'refereePhone',
        label: refereeLabel,
        render: (_: string | null, row) => (
          <div className="text-xs">
            <p>{row.refereePhone || '—'}</p>
            <p className="text-muted-foreground truncate max-w-[140px]">
              {row.refereeEmail || (row.refereeId ? row.refereeId.slice(0, 8) : '—')}
            </p>
          </div>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (v: string) => <StatusBadge status={v.toLowerCase()} />,
      },
      {
        key: 'rewards',
        label: 'Rewards',
        render: (_: unknown, row) => (
          <span className="text-xs">
            {row.rewards?.length
              ? row.rewards.map((r) => `₹${r.amount} (${r.status})`).join(' · ')
              : '—'}
          </span>
        ),
      },
    ],
    [refereeLabel],
  )

  return (
    <PageWrapper>
      <PageHeader title={segment.historyTitle} description={segment.description.history} />
      <div className="mt-4 mb-4 flex flex-wrap gap-3">
        {programOptions.length > 1 && (
          <select
            className="rounded border px-3 py-2 text-sm"
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
          >
            <option value="">All programs</option>
            {programOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code}
              </option>
            ))}
          </select>
        )}
        <select
          className="rounded border px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All statuses' : s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>
      <DataTable columns={columns} data={rows} isLoading={isLoading} />
    </PageWrapper>
  )
}

export default HistoryListPage
