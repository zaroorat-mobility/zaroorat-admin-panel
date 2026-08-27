import React from 'react'
import { usePromoReportOverview } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { InfoCardGrid, InfoCard } from '@/shared/components/InfoCard'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { Tag, Users, IndianRupee, Activity } from 'lucide-react'
import type { ReportOverview } from '../../types'

type PromoRow = ReportOverview['promotions'][number]

export const PromoReportsPage: React.FC = () => {
  const { data, isLoading } = usePromoReportOverview()
  const rows = data?.promotions ?? []

  const columns: DataTableColumn<PromoRow>[] = [
    {
      key: 'code',
      label: 'Code',
      render: (v: string) => <span className="font-mono font-bold text-primary">{v}</span>,
    },
    { key: 'title', label: 'Title', render: (v: string | null) => v || '—' },
    { key: 'usedCount', label: 'Usage' },
    {
      key: 'usageLimitTotal',
      label: 'Limit',
      render: (v: number | null) => (v != null ? String(v) : '∞'),
    },
    {
      key: 'discountAmount',
      label: 'Discount ₹',
      render: (v: number) => `₹${v.toFixed(2)}`,
    },
    { key: 'uniqueUsers', label: 'Unique users' },
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Coupon performance"
        description="Total usage, discount amount, revenue impact, and unique users."
      />
      <InfoCardGrid className="mt-4 mb-6">
        <InfoCard
          label="Total usage"
          value={String(data?.totalUsage ?? 0)}
          icon={<Activity className="h-5 w-5" />}
          loading={isLoading}
        />
        <InfoCard
          label="Discount amount"
          value={`₹${(data?.totalDiscountAmount ?? 0).toFixed(0)}`}
          icon={<IndianRupee className="h-5 w-5" />}
          variant="green"
          loading={isLoading}
        />
        <InfoCard
          label="Revenue impact"
          value={`₹${(data?.revenueImpact ?? 0).toFixed(0)}`}
          icon={<Tag className="h-5 w-5" />}
          variant="blue"
          loading={isLoading}
        />
        <InfoCard
          label="Unique users"
          value={String(data?.uniqueUsers ?? 0)}
          icon={<Users className="h-5 w-5" />}
          loading={isLoading}
        />
      </InfoCardGrid>
      <DataTable columns={columns} data={rows} isLoading={isLoading} />
    </PageWrapper>
  )
}

export default PromoReportsPage
