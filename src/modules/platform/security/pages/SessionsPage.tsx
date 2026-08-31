import React, { useMemo, useState } from 'react'
import { RefreshCw, LogOut, ShieldOff } from 'lucide-react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { Pagination } from '@/shared/components/Pagination'
import { useForceLogoutAll, useRevokeSession, useSecuritySessions } from '../hooks'
import type { AdminSession } from '../types'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import { usePlatformPageActions } from '../../layout/platform-page-context'

export const SessionsPage: React.FC = () => {
  const { user } = useAuthStore()
  const canWrite = hasPermission(user, 'security:write')
  const [page, setPage] = useState(1)
  const [activeOnly, setActiveOnly] = useState(true)
  const limit = 20

  const { data, isLoading, isError, refetch, isFetching } = useSecuritySessions({
    page,
    limit,
    activeOnly: activeOnly ? 'true' : 'false',
  })
  const revokeMutation = useRevokeSession()
  const forceLogoutMutation = useForceLogoutAll()

  const sessions = data?.data ?? []
  const meta = data?.meta

  usePlatformPageActions(
    useMemo(
      () => (
        <div className="flex items-center gap-2">
          {canWrite && (
            <Button
              variant="outline"
              className="gap-2 text-xs font-semibold h-9 text-red-600 border-red-200"
              disabled={forceLogoutMutation.isPending}
              onClick={() => {
                if (window.confirm('Force logout all active admin sessions?')) {
                  forceLogoutMutation.mutate(undefined)
                }
              }}
            >
              <LogOut className="h-4 w-4" />
              Force Logout All
            </Button>
          )}
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
      [canWrite, forceLogoutMutation.isPending, isFetching, refetch],
    ),
  )

  const columns: DataTableColumn<AdminSession>[] = [
    {
      key: 'userEmail',
      label: 'User',
      align: 'left',
      render: (_val: string | null, row) => (
        <div className="text-left">
          <p className="font-semibold text-sm">{row.userEmail || row.userPhone || row.userId}</p>
          <p className="text-[10px] font-mono text-slate-400">{row.userId.slice(0, 8)}…</p>
        </div>
      ),
    },
    {
      key: 'ipAddress',
      label: 'IP / Agent',
      align: 'left',
      render: (_val: string | null, row) => (
        <div className="text-left">
          <p className="text-xs font-mono">{row.ipAddress || '—'}</p>
          <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{row.userAgent || '—'}</p>
        </div>
      ),
    },
    {
      key: 'startedAt',
      label: 'Started',
      align: 'center',
      render: (val: string) => (
        <span className="font-mono text-[10px]">{new Date(val).toLocaleString('en-IN')}</span>
      ),
    },
    {
      key: 'active',
      label: 'Status',
      align: 'center',
      render: (val: boolean, row) => (
        <div className="flex flex-col items-center gap-1">
          <Badge variant={val ? 'success' : 'neutral'}>{val ? 'Active' : 'Expired'}</Badge>
          {row.mfaVerified && <Badge variant="info" outline>MFA</Badge>}
        </div>
      ),
    },
    {
      key: 'id',
      label: 'Action',
      align: 'center',
      render: (_val: string, row) =>
        canWrite && row.active ? (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 gap-1 text-red-600 border-red-200"
            disabled={revokeMutation.isPending}
            onClick={() => revokeMutation.mutate(row.id)}
          >
            <ShieldOff className="h-3.5 w-3.5" />
            Revoke
          </Button>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
  ]

  return (
    <div className="space-y-4">
      <Card className="premium-card">
        <CardContent className="p-4 flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => {
                setActiveOnly(e.target.checked)
                setPage(1)
              }}
              className="rounded border-border"
            />
            Active sessions only
          </label>
          {meta && (
            <span className="text-xs text-slate-500">{meta.total} session(s) total</span>
          )}
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={sessions}
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

export default SessionsPage
