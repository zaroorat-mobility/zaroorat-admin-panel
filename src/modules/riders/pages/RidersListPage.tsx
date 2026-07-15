import React, { useState } from 'react'
import { Plus, Download, Users, UserCheck, UserX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useRiders } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Button } from '@/shared/components/ui/Button'
import { InfoCard, InfoCardGrid } from '@/shared/components/InfoCard'
import type { RiderEntity } from '../types'

export const RidersListPage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Query riders matching state hook values
  const { data, isLoading } = useRiders()

  // Columns definition mapping for new DataTable
  const columns: DataTableColumn<RiderEntity>[] = [
    { key: 'name', label: 'Name', sortable: true, align: 'left' },
    { key: 'phone', label: 'Phone Number', align: 'left' },
    { key: 'totalRides', label: 'Trips Taken', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'createdAt',
      label: 'Joined Date',
      sortable: true,
      render: (value) => <span>{value || '15 Jan 2026'}</span>,
    },
  ]

  const demoRiders: RiderEntity[] = [
    { id: 'r1', name: 'Kabir Dev', email: 'kabir.dev@gmail.com', phone: '9887766554', rating: 4.8, totalRides: 42, status: 'active', createdAt: '15 Jan 2026', updatedAt: '' },
    { id: 'r2', name: 'Shreya Iyer', email: 'shreya.iyer@gmail.com', phone: '9887766555', rating: 4.5, totalRides: 19, status: 'active', createdAt: '20 Jan 2026', updatedAt: '' },
    { id: 'r3', name: 'Amit Vyas', email: 'amit.vyas@gmail.com', phone: '9887766556', rating: 3.9, totalRides: 8, status: 'inactive', createdAt: '02 Feb 2026', updatedAt: '' },
  ]

  const activeData = data?.data ?? (isLoading ? [] : demoRiders)

  // Metrics summary calculations
  const totalRiders = activeData.length
  const activeRiders = activeData.filter(r => r.status === 'active').length
  const inactiveRiders = totalRiders - activeRiders

  return (
    <PageWrapper>
      {/* PageHeader with dynamic layout and action buttons */}
      <PageHeader
        title="Riders Directory"
        description="Monitor passenger accounts, review trip statistics and export datasets."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 text-xs font-semibold h-9 rounded-lg">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button className="gap-2 text-xs font-semibold h-9 rounded-lg">
              <Plus className="h-4 w-4" />
              <span>Create Rider</span>
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Unified Info Card Grid */}
        <InfoCardGrid cols={3}>
          <InfoCard
            label="Total Passengers"
            value={totalRiders}
            icon={<Users className="w-5 h-5" />}
            variant="blue"
          />
          <InfoCard
            label="Active Passengers"
            value={activeRiders}
            icon={<UserCheck className="w-5 h-5" />}
            variant="green"
          />
          <InfoCard
            label="Inactive Passengers"
            value={inactiveRiders}
            icon={<UserX className="w-5 h-5" />}
            variant="amber"
          />
        </InfoCardGrid>

        {/* Responsive data table */}
        <DataTable
          columns={columns}
          data={activeData}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={(row) => navigate(`/riders/${row.id}`)}
          searchPlaceholder="Search passenger records..."
          statusKey="status"
          actionConfig={{
            onView: (row) => navigate(`/riders/${row.id}`),
            onEdit: (row) => navigate(`/riders/${row.id}`),
          }}
        />
      </div>
    </PageWrapper>
  )
}
export default RidersListPage
