import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRides } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { FormTabs } from '@/shared/components/ui/FormTabs'
import { RideStatusBadge } from '../components/RideStatusBadge'
import { RideSummaryCard } from '../components/RideSummaryCard'
import { ActionDropdown, type DropdownAction } from '@/modules/driver-management/components/ActionDropdown'
import { Eye, User, Phone, DollarSign } from 'lucide-react'
import type { Ride } from '../types'

export const RideMonitorPage: React.FC = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'live' | 'completed' | 'cancelled'>('live')

  const { data, isLoading, isError } = useRides({ search })
  const allRides = data?.data || []

  // Filter rides by tab
  const getFilteredRides = () => {
    switch (activeTab) {
      case 'live':
        return allRides.filter(r => ['REQUESTED', 'SEARCHING', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'OTP_VERIFIED', 'IN_PROGRESS', 'PAYMENT_PENDING'].includes(r.status))
      case 'completed':
        return allRides.filter(r => r.status === 'COMPLETED')
      case 'cancelled':
        return allRides.filter(r => ['CANCELLED_BY_RIDER', 'CANCELLED_BY_DRIVER', 'NO_DRIVER_FOUND', 'RIDER_NO_SHOW'].includes(r.status))
      default:
        return []
    }
  }

  const rides = getFilteredRides()

  const columns: DataTableColumn<Ride>[] = [
    {
      key: 'id',
      label: 'Ride ID',
      align: 'left',
      render: (val: string) => <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{val}</span>
    },
    {
      key: 'riderName',
      label: 'Rider / Passenger',
      align: 'left',
      render: (val: string, row) => (
        <div className="space-y-0.5 text-xs text-left">
          <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-slate-400" />
            {val}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
            <Phone className="h-3 w-3 text-slate-400" />
            {row.riderMobile}
          </div>
        </div>
      )
    },
    {
      key: 'driverName',
      label: 'Driver / Vehicle',
      align: 'left',
      render: (val: string | undefined, row) => (
        <div className="space-y-0.5 text-xs text-left">
          {val ? (
            <>
              <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-slate-400" />
                {val}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono uppercase">
                {row.vehiclePlate} — {row.vehicleType}
              </div>
            </>
          ) : (
            <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded font-bold border border-amber-100">Unassigned / Searching</span>
          )}
        </div>
      )
    },
    {
      key: 'pickupLocation',
      label: 'Route Details',
      align: 'left',
      render: (_, row) => (
        <div className="space-y-1 text-left max-w-[200px] text-[10px]">
          <div className="flex gap-1.5 items-start text-slate-600 dark:text-slate-350">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1">{row.pickupLocation}</span>
          </div>
          <div className="flex gap-1.5 items-start text-slate-650 dark:text-slate-350">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1">{row.dropLocation}</span>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (val: any) => <RideStatusBadge status={val} />
    },
    {
      key: 'finalFare',
      label: 'Fare & Pay',
      align: 'right',
      render: (val: number, row) => (
        <div className="space-y-0.5 text-right">
          <div className="font-bold text-slate-800 dark:text-white flex items-center justify-end gap-0.5">
            <DollarSign className="h-3.5 w-3.5 text-slate-400" />
            {val.toFixed(2)}
          </div>
          <div className="text-[9px] uppercase font-black text-slate-450 tracking-wider">
            {row.paymentMethod} • {row.paymentStatus}
          </div>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Created At',
      align: 'center',
      render: (val: string) => (
        <span className="font-mono text-[10px] text-slate-500">
          {new Date(val).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      render: (_, row) => {
        const dropActions: DropdownAction[] = [
          {
            label: 'Investigate Ride',
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/operations/ride-monitor/${row.id}`)
          }
        ]

        if (row.driverId) {
          dropActions.push({
            label: 'View Driver Profile',
            icon: <User className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/driver-management/drivers/${row.driverId}`)
          })
        }

        dropActions.push({
          label: 'View Rider Profile',
          icon: <User className="h-3.5 w-3.5" />,
          onClick: () => navigate(`/rider-management/riders/${row.riderId}`)
        })

        return <ActionDropdown actions={dropActions} />
      }
    }
  ]

  const tabs = [
    { id: 'live', label: 'Live Rides' },
    { id: 'completed', label: 'Completed Today' },
    { id: 'cancelled', label: 'Cancelled Today' }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Operations Control Center"
        description="Monitor in-flight vehicles, dispatcher status funnels, ride events, and live SOS alerts."
      />

      <div className="space-y-6">
        {/* KPI Funnel summary */}
        <RideSummaryCard rides={allRides} />

        {/* Tab filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-3">
          <FormTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(id: any) => setActiveTab(id)}
          />
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by ID, Rider, Driver, Plate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
            />
          </div>
        </div>

        {/* Rides Data Table */}
        <DataTable
          columns={columns}
          data={rides}
          isLoading={isLoading}
          isError={isError}
          selectable={false}
        />
      </div>
    </PageWrapper>
  )
}

export default RideMonitorPage
