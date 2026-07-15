import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVerifications } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { InfoCard, InfoCardGrid } from '@/shared/components/InfoCard'
import { ClipboardList, ShieldCheck, ShieldAlert } from 'lucide-react'
import type { VerificationEntity } from '../types'

export const VerificationListPage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Query verifications matching state hook values
  const { data, isLoading, isError, refetch } = useVerifications()

  // Columns definition mapping for new DataTable
  const columns: DataTableColumn<VerificationEntity>[] = [
    { key: 'driverName', label: 'Driver', sortable: true, align: 'left' },
    { key: 'vehicleType', label: 'Vehicle Category', sortable: true },
    {
      key: 'documentType',
      label: 'KYC Document',
      sortable: true,
      render: (value) => <span className="uppercase font-semibold text-xs text-slate-500">{value}</span>,
    },
    {
      key: 'submittedAt',
      label: 'Submission Date',
      sortable: true,
      render: (value) => <span>{new Date(value).toLocaleDateString()}</span>,
    },
    {
      key: 'status',
      label: 'Review Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />,
    },
  ]

  const demoVerifications: VerificationEntity[] = [
    { id: 'v1', driverId: 'd1', driverName: 'Rajesh Kumar', vehicleType: 'Sedan Cab', documentType: 'license', status: 'approved', submittedAt: '2026-07-14T10:00:00Z', createdAt: '', updatedAt: '' },
    { id: 'v2', driverId: 'd2', driverName: 'Sunil Verma', vehicleType: 'Auto', documentType: 'rc', status: 'pending', submittedAt: '2026-07-14T15:24:00Z', createdAt: '', updatedAt: '' },
    { id: 'v3', driverId: 'd3', driverName: 'Devendra Pal', vehicleType: 'Bike', documentType: 'aadhaar', status: 'pending', submittedAt: '2026-07-14T16:10:00Z', createdAt: '', updatedAt: '' },
  ]

  const activeData = data?.data ?? (isLoading ? [] : demoVerifications)

  // Metrics summary calculations
  const totalAudits = activeData.length
  const approvedAudits = activeData.filter(v => v.status === 'approved').length
  const pendingAudits = activeData.filter(v => v.status === 'pending').length

  return (
    <PageWrapper>
      {/* PageHeader with dynamic layout */}
      <PageHeader
        title="Document Verifications"
        description="Verify submitted driver profiles, identity records and transport permits."
      />

      <div className="space-y-6">
        {/* Unified Info Card Grid */}
        <InfoCardGrid cols={3}>
          <InfoCard
            label="Total Verification Audits"
            value={totalAudits}
            icon={<ClipboardList className="w-5 h-5" />}
            variant="blue"
            loading={isLoading}
          />
          <InfoCard
            label="Approved Drivers"
            value={approvedAudits}
            icon={<ShieldCheck className="w-5 h-5" />}
            variant="blue"
            loading={isLoading}
          />
          <InfoCard
            label="Pending Audits"
            value={pendingAudits}
            icon={<ShieldAlert className="w-5 h-5" />}
            variant="blue"
            loading={isLoading}
          />
        </InfoCardGrid>

        {/* Responsive data table with integrated state logic */}
        <DataTable
          columns={columns}
          data={activeData}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={(row) => navigate(`/verification/${row.id}`)}
          searchPlaceholder="Search verification audits..."
          statusKey="status"
          actionConfig={{
            onView: (row) => navigate(`/verification/${row.id}`),
          }}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          emptyState={{
            title: "No Verifications Found",
            description: "There are no pending document verification requests at the moment."
          }}
        />
      </div>
    </PageWrapper>
  )
}
export default VerificationListPage
