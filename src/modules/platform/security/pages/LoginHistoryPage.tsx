import React, { useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { Pagination } from '@/shared/components/Pagination'
import { useLoginHistory } from '../hooks'
import type { LoginHistoryEntry } from '../types'
import { usePlatformPageActions } from '../../layout/platform-page-context'

export const LoginHistoryPage: React.FC = () => {
  const [page, setPage] = useState(1)
  const limit = 20
  const { data, isLoading, isError, refetch, isFetching } = useLoginHistory({ page, limit })

  const entries = data?.data ?? []
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

  const columns: DataTableColumn<LoginHistoryEntry>[] = [
    {
      key: 'userEmail',
      label: 'User',
      align: 'left',
      render: (_val: string | null, row) => (
        <div className="text-left">
          <p className="font-semibold text-sm">{row.userEmail || row.userId}</p>
          <p className="text-[10px] font-mono text-slate-400">{row.userId.slice(0, 8)}…</p>
        </div>
      ),
    },
    {
      key: 'loginMethod',
      label: 'Method',
      align: 'center',
      render: (val: string | null) => (
        <Badge variant="neutral" outline>{val || 'password'}</Badge>
      ),
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      align: 'center',
      render: (val: string | null) => <span className="font-mono text-xs">{val || '—'}</span>,
    },
    {
      key: 'createdAt',
      label: 'Login Time',
      align: 'center',
      render: (val: string) => (
        <span className="font-mono text-[10px]">{new Date(val).toLocaleString('en-IN')}</span>
      ),
    },
    {
      key: 'active',
      label: 'Session',
      align: 'center',
      render: (val: boolean) => (
        <Badge variant={val ? 'success' : 'neutral'}>{val ? 'Active' : 'Ended'}</Badge>
      ),
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={entries}
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
    </>
  )
}

export default LoginHistoryPage
