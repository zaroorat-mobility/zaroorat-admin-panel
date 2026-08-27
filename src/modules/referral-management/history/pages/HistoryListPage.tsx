import React, { useState } from 'react'
import { useReferralHistory, useReferralPrograms } from '../../hooks'
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
  const [programId, setProgramId] = useState('')
  const [status, setStatus] = useState<string>('all')
  const { data: programs } = useReferralPrograms({ limit: 100 })
  const { data, isLoading } = useReferralHistory({
    limit: 50,
    ...(programId ? { programId } : {}),
    ...(status !== 'all' ? { status } : {}),
  })

  const rows = data?.data ?? []
  const columns: DataTableColumn<ReferralHistoryRow>[] = [
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
      label: 'New user',
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
      key: 'qualifyingRides',
      label: 'Rides',
      render: (v: number) => <span className="font-mono text-xs">{v}</span>,
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
            ? row.rewards
                .map((r) => `${r.beneficiary}: ₹${r.amount} (${r.status})`)
                .join(' · ')
            : '—'}
        </span>
      ),
    },
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Referral history"
        description="Track invite lifecycle from pending through rewarded, including payouts."
      />
      <div className="mt-4 mb-4 flex flex-wrap gap-3">
        <select
          className="rounded border px-3 py-2 text-sm"
          value={programId}
          onChange={(e) => setProgramId(e.target.value)}
        >
          <option value="">All programs</option>
          {(programs?.data ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.code}
            </option>
          ))}
        </select>
        <select
          className="rounded border px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All statuses' : s}
            </option>
          ))}
        </select>
      </div>
      <DataTable columns={columns} data={rows} isLoading={isLoading} />
    </PageWrapper>
  )
}

export default HistoryListPage
