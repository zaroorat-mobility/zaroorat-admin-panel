import React, { useMemo, useState } from 'react'
import {
  useReferralCodes,
  useActivateReferralCode,
  useDeactivateReferralCode,
  useReferralPrograms,
  useReferralSegment,
} from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { ActionDropdown, type DropdownAction } from '@/modules/driver-management/components/ActionDropdown'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import { ToggleLeft, ToggleRight } from 'lucide-react'
import type { ReferralCodeRow } from '../../types'

export const CodesListPage: React.FC = () => {
  const segment = useReferralSegment()
  const canWrite = hasPermission(useAuthStore((s) => s.user), 'referrals:write')
  const [programId, setProgramId] = useState('')
  const { data: programs } = useReferralPrograms({ audience: segment.audience, limit: 100 })
  const { data, isLoading } = useReferralCodes({
    audience: segment.audience,
    limit: 50,
    ...(programId ? { programId } : {}),
  })
  const activate = useActivateReferralCode()
  const deactivate = useDeactivateReferralCode()

  const programOptions = programs?.data ?? []
  const rows = data?.data ?? []

  const columns: DataTableColumn<ReferralCodeRow>[] = useMemo(
    () => [
      {
        key: 'code',
        label: 'Code',
        render: (v: string) => <span className="font-mono font-bold text-primary">{v}</span>,
      },
      {
        key: 'programCode',
        label: 'Program',
        render: (v: string) => <span className="font-mono text-xs">{v}</span>,
      },
      {
        key: 'userPhone',
        label: segment.segment === 'driver' ? 'Driver' : 'Rider',
        render: (_: string | null, row) => (
          <div className="text-xs">
            <p>{row.userPhone || '—'}</p>
            <p className="text-muted-foreground">{row.userEmail || row.userId.slice(0, 8)}</p>
          </div>
        ),
      },
      {
        key: 'usesCount',
        label: 'Uses',
        render: (v: number, row) => (
          <span className="font-mono text-xs">
            {v}
            {row.maxUses != null ? ` / ${row.maxUses}` : ''}
          </span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created',
        render: (v: string) => (
          <span className="text-[10px] font-mono">{new Date(v).toLocaleDateString()}</span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (v: string) => <StatusBadge status={v} />,
      },
      {
        key: 'id',
        label: 'Actions',
        align: 'center',
        render: (_: string, row) => {
          if (!canWrite) return null
          const dropActions: DropdownAction[] = row.isActive
            ? [
                {
                  label: 'Deactivate',
                  icon: <ToggleLeft className="h-3.5 w-3.5" />,
                  onClick: () => deactivate.mutate(row.id),
                },
              ]
            : [
                {
                  label: 'Activate',
                  icon: <ToggleRight className="h-3.5 w-3.5" />,
                  onClick: () => activate.mutate(row.id),
                },
              ]
          return <ActionDropdown actions={dropActions} />
        },
      },
    ],
    [canWrite, deactivate, activate, segment.segment],
  )

  return (
    <PageWrapper>
      <PageHeader title={segment.codesTitle} description={segment.description.codes} />
      {programOptions.length > 1 && (
        <div className="mt-4 mb-4 max-w-xs">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Filter by program
          </label>
          <select
            className="w-full rounded border px-3 py-2 text-sm"
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
          >
            <option value="">All programs</option>
            {programOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code}
                {p.name ? ` — ${p.name}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}
      <DataTable columns={columns} data={rows} isLoading={isLoading} />
    </PageWrapper>
  )
}

export default CodesListPage
