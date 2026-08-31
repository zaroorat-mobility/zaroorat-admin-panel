import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Compass,
  User,
  Phone,
  MapPin,
  RefreshCw,
  Search,
  CheckCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { FormTabs } from '@/shared/components/ui/FormTabs'
import { Card } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Drawer } from '@/shared/components/ui/Drawer'
import {
  useDispatchRequests,
  useDispatchRequest,
} from '../../hooks'
import type { BackendDispatchRequestListItem, BackendDispatchCandidate } from '../../api'

export const DispatchConsolePage: React.FC = () => {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<number>(15000)

  const {
    data: requestsData,
    isLoading: isLoadingRequests,
    refetch: refetchRequests,
    isFetching: isFetchingRequests,
  } = useDispatchRequests(
    {
      status: statusFilter,
      search: search.trim() || undefined,
      limit: 50,
    },
    { refetchInterval: (refreshInterval > 0 ? refreshInterval : false) as number | false }
  )

  const { data: requestDetail, isLoading: isLoadingDetail } = useDispatchRequest(
    selectedRequestId || ''
  )

  const requests = requestsData?.data || []

  const columns: DataTableColumn<BackendDispatchRequestListItem>[] = [
    {
      key: 'id',
      label: 'Request ID',
      align: 'left',
      render: (val: string, row) => (
        <div>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{val.slice(0, 8)}</span>
          <div className="text-[10px] text-muted-foreground font-mono">
            {new Date(row.createdAt).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (val: string) => {
        let variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'secondary'
        if (val === 'MATCHED') variant = 'success'
        else if (val === 'SEARCHING' || val === 'CREATED') variant = 'warning'
        else if (val === 'EXPIRED' || val === 'ABANDONED') variant = 'danger'
        return <Badge variant={variant}>{val}</Badge>
      },
    },
    {
      key: 'customerName',
      label: 'Customer',
      align: 'left',
      render: (val: string, row) => (
        <div className="space-y-0.5 text-xs text-left">
          <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-slate-400" />
            {val}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
            <Phone className="h-3 w-3 text-slate-400" />
            {row.customerPhone}
          </div>
        </div>
      ),
    },
    {
      key: 'vehicleTypeName',
      label: 'Category',
      align: 'left',
      render: (val: string) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{val}</span>
      ),
    },
    {
      key: 'pickupAddress',
      label: 'Pickup / Drop',
      align: 'left',
      render: (val: string, row) => (
        <div className="space-y-1 text-xs max-w-[200px]">
          <div className="flex items-start gap-1 text-slate-700 dark:text-slate-200 truncate">
            <MapPin className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
            <span className="truncate">{val}</span>
          </div>
          <div className="flex items-start gap-1 text-slate-500 truncate">
            <MapPin className="h-3 w-3 text-rose-500 shrink-0 mt-0.5" />
            <span className="truncate">{row.dropAddress || 'Not specified'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'dispatchRoundsCount',
      label: 'Dispatch Rounds',
      align: 'center',
      render: (val: number, row) => (
        <div className="text-xs text-center font-mono">
          <span className="font-bold text-slate-800 dark:text-slate-200">{val} rounds</span>
          <div className="text-[10px] text-muted-foreground">{row.totalOffersCount} drivers notified</div>
        </div>
      ),
    },
    {
      key: 'acceptedDriver',
      label: 'Assigned Driver / Ride',
      align: 'left',
      render: (_: any, row) =>
        row.acceptedDriver ? (
          <div className="text-xs space-y-0.5">
            <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              {row.acceptedDriver.fullName}
            </div>
            {row.rideCode && (
              <div className="font-mono text-[10px] text-primary font-bold">
                Ride: {row.rideCode}
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">Unassigned</span>
        ),
    },
    {
      key: 'actions',
      label: 'Inspect',
      align: 'center',
      render: (_: any, row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSelectedRequestId(row.id)}
          className="h-7 text-xs flex items-center gap-1"
        >
          Details
          <ChevronRight className="h-3 w-3" />
        </Button>
      ),
    },
  ]

  const candidateColumns: DataTableColumn<BackendDispatchCandidate>[] = [
    {
      key: 'dispatchRound',
      label: 'Round',
      align: 'center',
      render: (val: number) => <span className="font-mono font-bold">R{val}</span>,
    },
    {
      key: 'driver',
      label: 'Driver',
      align: 'left',
      render: (_: any, row) => (
        <div className="text-xs space-y-0.5">
          <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-slate-400" />
            {row.driver.fullName}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">{row.driver.phone}</div>
        </div>
      ),
    },
    {
      key: 'vehicle',
      label: 'Vehicle',
      align: 'left',
      render: (_: any, row) => (
        <div className="text-xs font-mono">
          {row.vehicle?.licensePlate || 'N/A'}
          <div className="text-[10px] text-muted-foreground">{row.vehicle?.model || ''}</div>
        </div>
      ),
    },
    {
      key: 'response',
      label: 'Response',
      align: 'center',
      render: (val: string) => {
        let variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'secondary'
        if (val === 'ACCEPTED') variant = 'success'
        else if (val === 'PENDING') variant = 'warning'
        else if (val === 'REJECTED' || val === 'TIMEOUT') variant = 'danger'
        return <Badge variant={variant}>{val}</Badge>
      },
    },
    {
      key: 'driverEtaSeconds',
      label: 'Distance / ETA',
      align: 'center',
      render: (val: number | null, row) => (
        <div className="text-xs text-center font-mono">
          <div>{row.driverDistanceM ? `${(row.driverDistanceM / 1000).toFixed(1)} km` : '-'}</div>
          <div className="text-[10px] text-muted-foreground">{val ? `${Math.round(val / 60)} min ETA` : '-'}</div>
        </div>
      ),
    },
    {
      key: 'rejectReason',
      label: 'Notes / Reason',
      align: 'left',
      render: (val: string | null) => (
        <span className="text-xs text-muted-foreground italic">{val || '-'}</span>
      ),
    },
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Dispatch & Matching Console"
        description="Visibility into algorithmic ride matching, driver notification rounds, candidate telemetry, and dispatch lifecycle."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-card border border-border text-foreground text-xs rounded-md px-2.5 py-1.5 focus:outline-none"
            >
              <option value={5000}>Refresh: 5s</option>
              <option value={15000}>Refresh: 15s</option>
              <option value={30000}>Refresh: 30s</option>
              <option value={0}>Pause auto-refresh</option>
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetchRequests()}
              disabled={isFetchingRequests}
              className="flex items-center gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetchingRequests ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Tabs / Filter */}
      <FormTabs
        tabs={[
          { id: 'all', label: 'All Requests' },
          { id: 'SEARCHING', label: 'Searching' },
          { id: 'MATCHED', label: 'Matched / Assigned' },
          { id: 'EXPIRED', label: 'Expired (No Drivers)' },
          { id: 'ABANDONED', label: 'Abandoned / Cancelled' },
        ]}
        activeTab={statusFilter}
        onChange={(tab) => setStatusFilter(tab)}
      />

      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by customer phone, name, vehicle type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <DataTable
          data={requests}
          columns={columns}
          isLoading={isLoadingRequests}
        />
      </div>

      {/* Request Details Drawer */}
      <Drawer
        isOpen={!!selectedRequestId}
        onClose={() => setSelectedRequestId(null)}
        title={`Dispatch Inspection: ${selectedRequestId?.slice(0, 8)}`}
        size="lg"
      >
        {isLoadingDetail ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading dispatch rounds...</div>
        ) : requestDetail ? (
          <div className="p-5 space-y-6">
            {/* Header Info */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Request {requestDetail.id.slice(0, 8)}
                  </h3>
                  <Badge variant={requestDetail.status === 'MATCHED' ? 'success' : requestDetail.status === 'SEARCHING' ? 'warning' : 'secondary'}>
                    {requestDetail.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Created at {new Date(requestDetail.createdAt).toLocaleString()}
                </div>
              </div>

              {requestDetail.ride && (
                <Button
                  size="sm"
                  onClick={() => navigate(`/operations/ride-monitor/${requestDetail.ride?.id}`)}
                  className="text-xs flex items-center gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Assigned Ride ({requestDetail.ride.rideCode})
                </Button>
              )}
            </div>

            {/* Matching Round KPI Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-3 text-center border-border">
                <span className="text-[11px] text-muted-foreground">Total Rounds</span>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {requestDetail.summary.totalRounds}
                </div>
              </Card>
              <Card className="p-3 text-center border-border">
                <span className="text-[11px] text-muted-foreground">Drivers Offered</span>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {requestDetail.summary.totalDispatches}
                </div>
              </Card>
              <Card className="p-3 text-center border-border">
                <span className="text-[11px] text-muted-foreground">Rejected / Timeout</span>
                <div className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">
                  {requestDetail.summary.rejectedCount + requestDetail.summary.timeoutCount}
                </div>
              </Card>
              <Card className="p-3 text-center border-border">
                <span className="text-[11px] text-muted-foreground">Accepted</span>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {requestDetail.summary.acceptedCount}
                </div>
              </Card>
            </div>

            {/* Customer & Route Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg p-3 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Customer & Vehicle</h4>
                <div className="text-xs space-y-1">
                  <div><span className="text-muted-foreground">Customer:</span> <span className="font-semibold">{requestDetail.customer.fullName}</span> ({requestDetail.customer.phone})</div>
                  <div><span className="text-muted-foreground">Vehicle Category:</span> <span className="font-semibold">{requestDetail.vehicleType.name}</span></div>
                  <div><span className="text-muted-foreground">Quoted Fare:</span> <span className="font-mono font-semibold">₹{requestDetail.quotedFare?.toFixed(2) || 'N/A'}</span></div>
                  {requestDetail.surgeMultiplier > 1 && (
                    <div><span className="text-muted-foreground">Surge Multiplier:</span> <span className="text-amber-500 font-bold">{requestDetail.surgeMultiplier}x</span></div>
                  )}
                </div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Route & Distance</h4>
                <div className="text-xs space-y-1">
                  <div><span className="text-muted-foreground">Pickup:</span> {requestDetail.pickup.address}</div>
                  <div><span className="text-muted-foreground">Drop:</span> {requestDetail.drop.address || 'N/A'}</div>
                  <div><span className="text-muted-foreground">Est. Distance:</span> {requestDetail.estimatedDistanceKm ? `${requestDetail.estimatedDistanceKm} km` : 'N/A'}</div>
                  <div><span className="text-muted-foreground">Est. Duration:</span> {requestDetail.estimatedDurationMin ? `${requestDetail.estimatedDurationMin} min` : 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Candidates and Dispatch Rounds */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-primary" /> Dispatch Notification Rounds & Candidates ({requestDetail.candidates.length})
              </h4>
              <DataTable
                data={requestDetail.candidates}
                columns={candidateColumns}
              />
            </div>
          </div>
        ) : null}
      </Drawer>
    </PageWrapper>
  )
}

export default DispatchConsolePage
