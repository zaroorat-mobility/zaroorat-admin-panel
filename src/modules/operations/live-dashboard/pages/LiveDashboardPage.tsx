import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  Car,
  Clock,
  AlertTriangle,
  Users,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  User,
  ExternalLink,
} from 'lucide-react'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { FormTabs } from '@/shared/components/ui/FormTabs'
import { Card } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { LiveMap } from '@/shared/components/maps/LiveMap'
import {
  useLiveSummary,
  useActiveRides,
  useLiveDrivers,
  useLiveAlerts,
  useLiveMap,
} from '../../hooks'
import type { BackendActiveRide, BackendLiveDriver } from '../../api'

export const LiveDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'rides' | 'drivers' | 'map' | 'alerts'>('rides')
  const [search, setSearch] = useState('')
  const [refreshInterval, setRefreshInterval] = useState<number>(15000)

  const pollConfig: { refetchInterval: number | false } = {
    refetchInterval: refreshInterval > 0 ? refreshInterval : false,
  }

  const { data: summary, refetch: refetchSummary, isFetching: isFetchingSummary } = useLiveSummary(
    undefined,
    pollConfig
  )
  const { data: activeRidesData, isLoading: isLoadingRides, refetch: refetchRides } = useActiveRides(
    { search, limit: 50 },
    pollConfig
  )
  const { data: driversData, isLoading: isLoadingDrivers, refetch: refetchDrivers } = useLiveDrivers(
    { search, limit: 50 },
    pollConfig
  )
  const { data: alertsData, refetch: refetchAlerts } = useLiveAlerts(
    undefined,
    pollConfig
  )
  const { data: mapData, refetch: refetchMap } = useLiveMap(
    undefined,
    pollConfig
  )

  const handleRefreshAll = () => {
    refetchSummary()
    refetchRides()
    refetchDrivers()
    refetchAlerts()
    refetchMap()
  }

  const activeRides = activeRidesData?.data || []
  const drivers = driversData?.data || []
  const alerts = alertsData || []

  const rideColumns: DataTableColumn<BackendActiveRide>[] = [
    {
      key: 'rideCode',
      label: 'Ride ID / Code',
      align: 'left',
      render: (val: string, row) => (
        <div>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{val || row.id.slice(0, 8)}</span>
          <div className="text-[10px] text-muted-foreground font-mono">
            {new Date(row.bookingTime).toLocaleTimeString()}
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
        if (val === 'IN_PROGRESS') variant = 'success'
        else if (val === 'DRIVER_ARRIVING' || val === 'DRIVER_ARRIVED') variant = 'warning'
        else if (val === 'SEARCHING' || val === 'REQUESTED') variant = 'neutral'
        return <Badge variant={variant}>{val.replace(/_/g, ' ')}</Badge>
      },
    },
    {
      key: 'customer',
      label: 'Customer',
      align: 'left',
      render: (_: any, row) => (
        <div className="space-y-0.5 text-xs text-left">
          <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-slate-400" />
            {row.customer.fullName || 'Customer'}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
            <Phone className="h-3 w-3 text-slate-400" />
            {row.customer.phone}
          </div>
        </div>
      ),
    },
    {
      key: 'driver',
      label: 'Driver & Vehicle',
      align: 'left',
      render: (_: any, row) => (
        <div className="space-y-0.5 text-xs text-left">
          {row.driver ? (
            <>
              <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
                <Car className="h-3.5 w-3.5 text-blue-500" />
                {row.driver.fullName}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                {row.vehicle.licensePlate || 'N/A'} • {row.vehicle.typeName || row.vehicle.typeCode}
              </div>
            </>
          ) : (
            <span className="text-amber-500 text-xs italic">Searching for driver...</span>
          )}
        </div>
      ),
    },
    {
      key: 'pickup',
      label: 'Route',
      align: 'left',
      render: (_: any, row) => (
        <div className="space-y-1 text-xs max-w-[220px]">
          <div className="flex items-start gap-1 text-slate-700 dark:text-slate-200 truncate">
            <MapPin className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
            <span className="truncate">{row.pickup.address}</span>
          </div>
          <div className="flex items-start gap-1 text-slate-500 truncate">
            <MapPin className="h-3 w-3 text-rose-500 shrink-0 mt-0.5" />
            <span className="truncate">{row.drop.address}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'elapsedMinutes',
      label: 'Duration / Wait',
      align: 'center',
      render: (val: number, row) => (
        <div className="text-xs text-center font-mono">
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            {val} min elapsed
          </div>
          {row.waitTimeMin > 5 && (
            <div className="text-[10px] text-rose-500 font-bold flex items-center justify-center gap-0.5">
              <AlertTriangle className="h-2.5 w-2.5" />
              {row.waitTimeMin}m wait
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Action',
      align: 'center',
      render: (_: any, row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/operations/ride-monitor/${row.id}`)}
          className="h-7 text-xs flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          View
        </Button>
      ),
    },
  ]

  const driverColumns: DataTableColumn<BackendLiveDriver>[] = [
    {
      key: 'driverNumber',
      label: 'Driver ID',
      align: 'left',
      render: (val: string, row) => (
        <div>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{val || row.id.slice(0, 8)}</span>
          <div className="font-medium text-xs text-slate-800 dark:text-white">{row.fullName}</div>
        </div>
      ),
    },
    {
      key: 'phoneNumber',
      label: 'Contact',
      align: 'left',
      render: (val: string) => (
        <span className="font-mono text-xs text-muted-foreground">{val}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (val: string) => {
        let variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'secondary'
        if (val === 'ONLINE') variant = 'success'
        else if (val === 'ON_TRIP' || val === 'BUSY') variant = 'warning'
        else if (val === 'OFFLINE') variant = 'danger'
        return <Badge variant={variant}>{val}</Badge>
      },
    },
    {
      key: 'vehicle',
      label: 'Vehicle',
      align: 'left',
      render: (_: any, row) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-700 dark:text-slate-200">
            {row.vehicle?.licensePlate || 'N/A'}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {row.vehicle?.model || ''} ({row.vehicle?.type || 'Standard'})
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Live GPS',
      align: 'left',
      render: (_: any, row) => (
        <div className="text-xs font-mono">
          {row.location ? (
            <div>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {row.location.lat.toFixed(4)}, {row.location.lng.toFixed(4)}
              </span>
              <div className="text-[10px] text-muted-foreground">
                {row.location.speedKmh ? `${Math.round(row.location.speedKmh)} km/h • ` : ''}
                {new Date(row.location.updatedAt).toLocaleTimeString()}
              </div>
            </div>
          ) : (
            <span className="text-slate-400 italic">No GPS signal</span>
          )}
        </div>
      ),
    },
    {
      key: 'currentRide',
      label: 'Active Ride',
      align: 'center',
      render: (_: any, row) =>
        row.currentRide ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/operations/ride-monitor/${row.currentRide?.id}`)}
            className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            {row.currentRide.rideCode}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">Idle</span>
        ),
    },
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Live Operations Dashboard"
        description="Real-time monitoring of ongoing rides, online driver fleet, and dispatch operations."
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
              onClick={handleRefreshAll}
              disabled={isFetchingSummary}
              className="flex items-center gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetchingSummary ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <Card className="p-3.5 flex flex-col justify-between border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Active Rides</span>
            <Activity className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">
            {summary?.activeRidesCount ?? 0}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {summary?.inProgressCount ?? 0} in-progress • {summary?.assignedCount ?? 0} assigned
          </div>
        </Card>

        <Card className="p-3.5 flex flex-col justify-between border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Searching Requests</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-amber-600 dark:text-amber-400">
            {summary?.searchingRequestsCount ?? 0}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Matching in progress
          </div>
        </Card>

        <Card className="p-3.5 flex flex-col justify-between border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Long Wait Alerts</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-rose-600 dark:text-rose-400">
            {summary?.longWaitCount ?? 0}
          </div>
          <div className="text-[10px] text-rose-500 font-semibold mt-1">
            &gt; 5 min without match
          </div>
        </Card>

        <Card className="p-3.5 flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Online Drivers</span>
            <Users className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">
            {summary?.onlineDriversCount ?? 0}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            {summary?.availableDriversCount ?? 0} available • {summary?.busyDriversCount ?? 0} busy
          </div>
        </Card>

        <Card className="p-3.5 flex flex-col justify-between border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Completed Today</span>
            <CheckCircle className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">
            {summary?.completedTodayCount ?? 0}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Past 24h successful
          </div>
        </Card>

        <Card className="p-3.5 flex flex-col justify-between border-l-4 border-l-slate-400">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Cancelled Today</span>
            <XCircle className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold mt-2 text-slate-700 dark:text-slate-300">
            {summary?.cancelledTodayCount ?? 0}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Customer/driver/system
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <FormTabs
        tabs={[
          { id: 'rides', label: `Active Rides (${activeRides.length})` },
          { id: 'drivers', label: `Driver Fleet (${drivers.length})` },
          { id: 'map', label: 'Live Map' },
          { id: 'alerts', label: `Alerts & Delays (${alerts.length})` },
        ]}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
      />

      <div className="mt-4">
        {activeTab === 'rides' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by code, customer, driver..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <DataTable
              data={activeRides}
              columns={rideColumns}
              isLoading={isLoadingRides}
            />
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search driver number, name, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <DataTable
              data={drivers}
              columns={driverColumns}
              isLoading={isLoadingDrivers}
            />
          </div>
        )}

        {activeTab === 'map' && (
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Live Operations Map</h3>
                <p className="text-xs text-muted-foreground">
                  Active rides, pickup/drop pins, and online driver telemetry.
                </p>
              </div>
              <Badge variant="secondary">
                {mapData?.rides.length ?? 0} Rides • {mapData?.drivers.length ?? 0} Drivers
              </Badge>
            </div>

            <LiveMap
              height="520px"
              routes={(mapData?.rides ?? []).map((r) => ({
                id: r.id,
                pickup: { lat: r.pickup.lat, lng: r.pickup.lng, label: r.pickup.address },
                drop: { lat: r.drop.lat, lng: r.drop.lng, label: r.drop.address },
                driverLocation: r.driverLocation
                  ? { lat: r.driverLocation.lat, lng: r.driverLocation.lng }
                  : null,
              }))}
              markers={(mapData?.drivers ?? []).map((d) => ({
                id: d.id,
                lat: d.lat,
                lng: d.lng,
                label: d.name,
                kind: 'driver' as const,
              }))}
            />
          </Card>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Card
                key={alert.id}
                className={`p-4 border-l-4 ${
                  alert.severity === 'CRITICAL'
                    ? 'border-l-rose-500 bg-rose-50/10'
                    : alert.severity === 'HIGH'
                    ? 'border-l-amber-500 bg-amber-50/10'
                    : 'border-l-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{alert.title}</span>
                      <Badge variant={alert.severity === 'CRITICAL' ? 'danger' : alert.severity === 'HIGH' ? 'warning' : 'neutral'}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      Timestamp: {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  {alert.entityType === 'ride' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/operations/ride-monitor/${alert.entityId}`)}
                      className="text-xs"
                    >
                      View Ride
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/operations/dispatch`)}
                      className="text-xs"
                    >
                      Dispatch Console
                    </Button>
                  )}
                </div>
              </Card>
            ))}
            {alerts.length === 0 && (
              <Card className="p-8 text-center text-xs text-muted-foreground italic">
                No active operational alerts or delays detected.
              </Card>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}

export default LiveDashboardPage
