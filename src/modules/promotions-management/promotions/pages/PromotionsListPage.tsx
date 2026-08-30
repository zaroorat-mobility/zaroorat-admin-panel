import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  usePromotions,
  useActivatePromotion,
  useDeactivatePromotion,
} from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { InfoCardGrid, InfoCard } from '@/shared/components/InfoCard'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Button } from '@/shared/components/ui/Button'
import { ActionDropdown, type DropdownAction } from '@/modules/driver-management/components/ActionDropdown'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import { Plus, Tag, Percent, Edit2, ToggleLeft, ToggleRight } from 'lucide-react'
import type { Promotion } from '../../types'

export const PromotionsListPage: React.FC = () => {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const canWrite = hasPermission(user, 'campaigns:write')
  const { data, isLoading } = usePromotions()
  const activate = useActivatePromotion()
  const deactivate = useDeactivatePromotion()

  const rows = data?.data ?? []
  const active = rows.filter((r) => r.isActive).length

  const columns: DataTableColumn<Promotion>[] = [
    {
      key: 'code',
      label: 'Code',
      render: (val: string) => (
        <span className="font-mono font-bold text-primary">{val}</span>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      render: (val: string | null, row) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">{val || '—'}</p>
          <p className="text-[10px] text-muted-foreground line-clamp-1">{row.description}</p>
        </div>
      ),
    },
    {
      key: 'discountType',
      label: 'Discount',
      render: (_: string, row) => (
        <span className="text-sm">
          {row.discountType === 'PERCENT' ? `${row.discountValue}%` : `₹${row.discountValue}`}
          {row.maxDiscount != null ? ` (max ₹${row.maxDiscount})` : ''}
        </span>
      ),
    },
    {
      key: 'minFare',
      label: 'Min fare',
      render: (val: number) => <span>₹{val}</span>,
    },
    {
      key: 'applicableCity',
      label: 'City',
      render: (val: string | null) => (
        <span className="font-mono text-xs">{val || 'All'}</span>
      ),
    },
    {
      key: 'applicableVehicleTypeId',
      label: 'Vehicle',
      render: (val: string | null) => (
        <span className="text-xs">{val ? 'Restricted' : 'All'}</span>
      ),
    },
    {
      key: 'firstRideOnly',
      label: '1st ride',
      render: (val: boolean) => (val ? 'Yes' : 'No'),
    },
    {
      key: 'usedCount',
      label: 'Usage',
      render: (val: number, row) => (
        <span className="font-mono text-xs">
          {val}
          {row.usageLimitTotal != null ? ` / ${row.usageLimitTotal}` : ''}
          <span className="text-muted-foreground"> · {row.usageLimitPerUser}/user</span>
        </span>
      ),
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
      render: (val: string) => <StatusBadge status={val} />,
    },
    {
      key: 'id',
      label: 'Actions',
      align: 'center',
      render: (_: string, row) => {
        const dropActions: DropdownAction[] = []
        if (canWrite) {
          dropActions.push({
            label: 'Edit',
            icon: <Edit2 className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/promotions-management/promotions/${row.id}/edit`),
          })
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
        }
        return dropActions.length ? <ActionDropdown actions={dropActions} /> : null
      },
    },
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Promotions"
        description="Shared promo / coupon codes with discount rules, limits, and eligibility."
        actions={
          canWrite ? (
            <Button onClick={() => navigate('/promotions-management/promotions/new')}>
              <Plus className="h-4 w-4 mr-1" /> New promotion
            </Button>
          ) : undefined
        }
      />
      <InfoCardGrid className="mt-4 mb-6">
        <InfoCard
          label="Total"
          value={String(rows.length)}
          icon={<Tag className="h-5 w-5" />}
          loading={isLoading}
        />
        <InfoCard
          label="Active"
          value={String(active)}
          icon={<Percent className="h-5 w-5" />}
          variant="green"
          loading={isLoading}
        />
      </InfoCardGrid>
      <DataTable columns={columns} data={rows} isLoading={isLoading} />
    </PageWrapper>
  )
}

export default PromotionsListPage
