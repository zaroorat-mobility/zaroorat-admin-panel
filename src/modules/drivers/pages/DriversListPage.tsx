import React, { useState } from 'react'
import { Plus, Download, Users, UserCheck, UserX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDrivers } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Button } from '@/shared/components/ui/Button'
import { InfoCard, InfoCardGrid } from '@/shared/components/InfoCard'
import type { DriverEntity } from '../types'

export const DriversListPage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Query drivers matching state hook values
  const { data, isLoading, isError, refetch } = useDrivers()

  // Columns definition mapping for new DataTable
  const columns: DataTableColumn<DriverEntity>[] = [
    { key: 'name', label: 'Driver', sortable: true, align: 'left' },
    { key: 'phone', label: 'Phone Number', align: 'left' },
    { key: 'vehicleType', label: 'Vehicle Type', sortable: true },
    { key: 'vehicleNumber', label: 'Registration Number' },
    {
      key: 'onlineStatus',
      label: 'Online Status',
      render: (_, row) => {
        const isOnline = row.id !== 'd3' // Mock online indicator
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold justify-center">
            {isOnline ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-600">Online</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                <span className="text-muted-foreground">Offline</span>
              </>
            )}
          </span>
        )
      },
    },
    {
      key: 'status',
      label: 'Verification Status',
      sortable: true,
      render: (value) => <StatusBadge status={value} />,
    },
  ]

  const demoDrivers: DriverEntity[] = [
    { id: 'd1', name: 'Rajesh Kumar', email: 'rajesh.k@gmail.com', phone: '9765432101', vehicleType: 'Sedan Cab', vehicleNumber: 'MH-12-PQ-4567', status: 'active', rating: 4.9, createdAt: '12 Jan 2026', updatedAt: '' },
    { id: 'd2', name: 'Sunil Verma', email: 'sunil.v@gmail.com', phone: '9765432102', vehicleType: 'Auto', vehicleNumber: 'KA-03-TR-9876', status: 'pending', rating: 4.2, createdAt: '14 Jan 2026', updatedAt: '' },
    { id: 'd3', name: 'Devendra Pal', email: 'dev.pal@gmail.com', phone: '9765432103', vehicleType: 'Bike', vehicleNumber: 'DL-04-MS-1212', status: 'inactive', rating: 3.5, createdAt: '18 Jan 2026', updatedAt: '' },
  ]

  const activeData = data?.data ?? (isLoading ? [] : demoDrivers)

  // Metrics summary calculations
  const totalDrivers = activeData.length
  const activeDrivers = activeData.filter(d => d.status === 'active').length
  const pendingDrivers = activeData.filter(d => d.status === 'pending').length

  return (
    <PageWrapper>
      {/* Dynamic breadcrumbs with actions */}
      <PageHeader
        title="Drivers Directory"
        description="Monitor online statuses, verify vehicle registrations, and audit driver onboarding paths."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 text-xs font-semibold h-9 rounded-lg">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button variant="primary" className="gap-2 text-xs font-semibold h-9 rounded-lg">
              <Plus className="h-4 w-4" />
              <span>Register Driver</span>
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Unified Info Card Grid */}
        <InfoCardGrid cols={3}>
          <InfoCard
            label="Total Partners"
            value={totalDrivers}
            icon={<Users className="w-5 h-5" />}
            variant="blue"
            loading={isLoading}
          />
          <InfoCard
            label="Verified Partners"
            value={activeDrivers}
            icon={<UserCheck className="w-5 h-5" />}
            variant="blue"
            loading={isLoading}
          />
          <InfoCard
            label="Pending Verification"
            value={pendingDrivers}
            icon={<UserX className="w-5 h-5" />}
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
          onRowClick={(row) => navigate(`/drivers/${row.id}`)}
          searchPlaceholder="Search driver records..."
          statusKey="status"
          actionConfig={{
            onView: (row) => navigate(`/drivers/${row.id}`),
            onEdit: (row) => navigate(`/drivers/${row.id}`),
          }}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          emptyState={{
            title: "No Drivers Found",
            description: "There are no registered drivers yet. Register the first driver to get started.",
            actionLabel: "Register Driver",
            onAction: () => navigate('/drivers/new')
          }}
        />
      </div>
    </PageWrapper>
  )
}

export default DriversListPage
