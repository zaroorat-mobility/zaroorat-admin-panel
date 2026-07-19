import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVehicles } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { ExpiryIndicator, ActionDropdown } from '../../components'
import { InfoCard, InfoCardGrid } from '@/shared/components/InfoCard'
import { Car, Eye, BadgeAlert } from 'lucide-react'
import type { VehicleEntity } from '../../types'

export const VehiclesListPage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data, isLoading, isError } = useVehicles()

  const columns: DataTableColumn<VehicleEntity>[] = [
    {
      key: 'registrationPlate',
      label: 'Registration Number',
      sortable: true,
      align: 'left',
      render: (value) => (
        <span className="font-mono font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded dark:bg-slate-800">
          {value}
        </span>
      ),
    },
    {
      key: 'vehicleType',
      label: 'Vehicle Type',
      sortable: true,
      render: (value, row) => (
        <div>
          <span className="capitalize font-semibold text-xs text-slate-650">{value}</span>
          {row.brand && (
            <p className="text-[10px] text-slate-450 mt-0.5">{row.brand} {row.model}</p>
          )}
        </div>
      ),
    },
    {
      key: 'driverName',
      label: 'Driver Name',
      sortable: true,
      render: (value, row) => (
        <div
          className="cursor-pointer hover:underline text-primary font-semibold"
          onClick={() => navigate(`/driver-management/drivers/${row.driverId}`)}
        >
          {value}
        </div>
      ),
    },
    {
      key: 'insuranceExpiry',
      label: 'Insurance Expiry',
      sortable: true,
      render: (value) => <ExpiryIndicator expiryDate={value} />,
    },
    {
      key: 'permitExpiry',
      label: 'Permit Expiry',
      sortable: true,
      render: (value) => <ExpiryIndicator expiryDate={value} />,
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider",
          value
            ? "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-450"
            : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
        )}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      render: (_, row) => (
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <ActionDropdown
            actions={[
              {
                label: 'View Details',
                icon: <Eye className="h-3.5 w-3.5" />,
                onClick: () => navigate(`/driver-management/vehicles/${row.id}`)
              }
            ]}
          />
        </div>
      )
    }
  ]

  const activeData = data?.data ?? []

  // Metrics calculations
  const totalVehicles = activeData.length
  const activeCount = activeData.filter(v => v.isActive).length
  const inactiveCount = activeData.filter(v => !v.isActive).length

  // Documents expiries checklist warnings
  const today = new Date()
  const criticalDocumentsCount = activeData.filter(v => {
    const ins = v.insuranceExpiry ? new Date(v.insuranceExpiry) : null
    const pmt = v.permitExpiry ? new Date(v.permitExpiry) : null
    const isInsCritical = ins ? (ins < today || (ins.getTime() - today.getTime()) / (1000 * 3600 * 24) <= 60) : false
    const isPmtCritical = pmt ? (pmt < today || (pmt.getTime() - today.getTime()) / (1000 * 3600 * 24) <= 60) : false
    return isInsCritical || isPmtCritical
  }).length

  return (
    <PageWrapper>
      <PageHeader
        title="Vehicles Directory"
        description="Verify active registered vehicles fleet, vehicle models, insurance covers and commercial permits."
      />

      <div className="space-y-6">
        <InfoCardGrid cols={4}>
          <InfoCard
            label="Total Fleet Size"
            value={totalVehicles}
            icon={<Car className="h-5 w-5 text-slate-500" />}
            variant="blue"
            loading={isLoading}
          />
          <InfoCard
            label="Active Fleet Vehicles"
            value={activeCount}
            icon={<Car className="h-5 w-5 text-emerald-500" />}
            variant="green"
            loading={isLoading}
          />
          <InfoCard
            label="Inactive Fleet Vehicles"
            value={inactiveCount}
            icon={<Car className="h-5 w-5 text-slate-405" />}
            variant="amber"
            loading={isLoading}
          />
          <InfoCard
            label="Expiries/Warnings"
            value={criticalDocumentsCount}
            icon={<BadgeAlert className="h-5 w-5 text-rose-500" />}
            variant="red"
            loading={isLoading}
          />
        </InfoCardGrid>

        <DataTable
          data={activeData}
          columns={columns}
          isLoading={isLoading}
          isError={isError}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          searchPlaceholder="Search by Registration Plate, Driver name..."
          onRowClick={(row) => navigate(`/driver-management/vehicles/${row.id}`)}
        />
      </div>
    </PageWrapper>
  )
}

// Inline fallback for cn
import { cn } from '@/shared/utils'

export default VehiclesListPage
