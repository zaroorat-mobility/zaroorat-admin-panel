import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useReferralPrograms,
  useActivateReferralProgram,
  useDeactivateReferralProgram,
  useReferralSegment,
} from '../../hooks'
import { programsBasePath } from '../../constants'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { InfoCardGrid, InfoCard } from '@/shared/components/InfoCard'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Button } from '@/shared/components/ui/Button'
import { ActionDropdown, type DropdownAction } from '@/modules/driver-management/components/ActionDropdown'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import { Plus, Gift, Edit2, ToggleLeft, ToggleRight } from 'lucide-react'
import type { ReferralProgram } from '../../types'

function formatEligibility(row: ReferralProgram): string {
  const label = row.qualifyingEvent.replace(/_/g, ' ').toLowerCase()
  return row.qualifyingThreshold > 1 ? `${label} ×${row.qualifyingThreshold}` : label
}

export const ProgramsListPage: React.FC = () => {
  const navigate = useNavigate()
  const segment = useReferralSegment()
  const canWrite = hasPermission(useAuthStore((s) => s.user), 'referrals:write')
  const { data, isLoading } = useReferralPrograms({ audience: segment.audience })
  const activate = useActivateReferralProgram()
  const deactivate = useDeactivateReferralProgram()
  const basePath = programsBasePath(segment.segment)

  const rows = data?.data ?? []
  const active = rows.filter((r) => r.isActive).length

  const columns: DataTableColumn<ReferralProgram>[] = useMemo(
    () => [
      {
        key: 'code',
        label: 'Code',
        render: (v: string) => <span className="font-mono font-bold text-primary">{v}</span>,
      },
      {
        key: 'name',
        label: 'Name',
        render: (v: string | null) => v || '—',
      },
      {
        key: 'referrerReward',
        label: 'Referrer',
        render: (v: number) => <span>₹{v}</span>,
      },
      {
        key: 'refereeReward',
        label: segment.newUserLabel.replace(' reward', ''),
        render: (v: number) => <span>₹{v}</span>,
      },
      {
        key: 'qualifyingEvent',
        label: 'Qualifies on',
        render: (_: string, row) => <span className="text-xs capitalize">{formatEligibility(row)}</span>,
      },
      {
        key: 'validFrom',
        label: 'Window',
        render: (_: string, row) => (
          <div className="text-[10px] font-mono text-slate-500">
            <p>{new Date(row.validFrom).toLocaleDateString()}</p>
            <p>→ {new Date(row.validTo).toLocaleDateString()}</p>
          </div>
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
          const dropActions: DropdownAction[] = [
            {
              label: 'Edit',
              icon: <Edit2 className="h-3.5 w-3.5" />,
              onClick: () => navigate(`${basePath}/${row.id}/edit`),
            },
          ]
          if (row.isActive) {
            dropActions.push({
              label: 'Deactivate',
              icon: <ToggleLeft className="h-3.5 w-3.5" />,
              onClick: () => deactivate.mutate(row.id),
            })
          } else {
            dropActions.push({
              label: 'Activate',
              icon: <ToggleRight className="h-3.5 w-3.5" />,
              onClick: () => activate.mutate(row.id),
            })
          }
          return <ActionDropdown actions={dropActions} />
        },
      },
    ],
    [basePath, canWrite, deactivate, activate, navigate, segment.newUserLabel],
  )

  return (
    <PageWrapper>
      <PageHeader
        title={segment.programsTitle}
        description={segment.description.programs}
        actions={
          canWrite ? (
            <Button onClick={() => navigate(`${basePath}/new`)}>
              <Plus className="h-4 w-4 mr-1" /> New program
            </Button>
          ) : undefined
        }
      />

      <InfoCardGrid className="mt-4 mb-6">
        <InfoCard
          label="Programs"
          value={String(rows.length)}
          icon={<Gift className="h-5 w-5" />}
          loading={isLoading}
        />
        <InfoCard
          label="Active"
          value={String(active)}
          icon={<Gift className="h-5 w-5" />}
          variant="green"
          loading={isLoading}
        />
      </InfoCardGrid>
      <DataTable columns={columns} data={rows} isLoading={isLoading} />
    </PageWrapper>
  )
}

export default ProgramsListPage
