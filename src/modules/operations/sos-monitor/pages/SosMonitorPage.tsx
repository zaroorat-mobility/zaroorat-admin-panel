import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSOSAlerts } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { FormTabs } from '@/shared/components/ui/FormTabs'
import { SosTimer, SosSeverityBadge, SosDetailsDrawer } from '../components'
import { Button } from '@/shared/components/ui/Button'
import { ShieldAlert, CheckCircle, Clock, Eye, BellRing } from 'lucide-react'
import type { SOSAlert } from '../types'

export const SosMonitorPage: React.FC = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'open' | 'acknowledged' | 'resolved'>('open')

  // Selected alert for details drawer
  const [selectedAlert, setSelectedAlert] = useState<SOSAlert | null>(null)

  // React Query with 10s auto refetch interval
  const { data, isLoading, isError, refetch } = useSOSAlerts({ search })
  const allAlerts = data?.data || []

  // Filter alerts by tab
  const getFilteredAlerts = () => {
    switch (activeTab) {
      case 'open':
        return allAlerts.filter(a => a.status === 'open' || a.status === 'escalated')
      case 'acknowledged':
        return allAlerts.filter(a => a.status === 'acknowledged')
      case 'resolved':
        return allAlerts.filter(a => a.status === 'resolved')
      default:
        return []
    }
  }

  const alerts = getFilteredAlerts()

  // KPI Calculations
  const openCount = allAlerts.filter(a => a.status === 'open' || a.status === 'escalated').length
  const ackCount = allAlerts.filter(a => a.status === 'acknowledged').length
  const criticalCount = allAlerts.filter(a => a.priority === 'critical' && a.status !== 'resolved').length

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const resolvedToday = allAlerts.filter(a => 
    a.status === 'resolved' && 
    new Date(a.updatedAt).getTime() >= startOfToday.getTime()
  ).length

  const columns: DataTableColumn<SOSAlert>[] = [
    {
      key: 'id',
      label: 'Incident ID',
      align: 'left',
      render: (val: string) => <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{val}</span>
    },
    {
      key: 'rideId',
      label: 'Ride ID',
      align: 'left',
      render: (val: string) => (
        <button
          onClick={() => navigate(`/operations/ride-monitor/${val}`)}
          className="text-primary hover:underline font-mono font-bold"
        >
          #{val}
        </button>
      )
    },
    {
      key: 'riderName',
      label: 'Rider / Passenger',
      align: 'left',
      render: (val: string) => <span className="font-bold text-slate-800 dark:text-slate-150">{val}</span>
    },
    {
      key: 'driverName',
      label: 'Driver / Vehicle',
      align: 'left',
      render: (val: string, row) => (
        <div className="text-left text-xs">
          <div className="font-bold text-slate-850 dark:text-white">{val}</div>
          <div className="text-[10px] text-muted-foreground font-mono uppercase">{row.vehiclePlate}</div>
        </div>
      )
    },
    {
      key: 'priority',
      label: 'Severity Level',
      align: 'center',
      render: (val: any) => <SosSeverityBadge priority={val} />
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (val: string) => (
        <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase border ${
          val === 'resolved'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20'
            : val === 'acknowledged'
            ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20'
            : val === 'escalated'
            ? 'bg-red-100 text-red-700 border-red-200 animate-pulse font-bold'
            : 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse dark:bg-rose-950/20'
        }`}>
          {val}
        </span>
      )
    },
    {
      key: 'timeRaised',
      label: 'Active Duration',
      align: 'center',
      render: (val: string, row) => (
        <SosTimer timeRaised={val} status={row.status} />
      )
    },
    {
      key: 'actions',
      label: 'Operations Actions',
      align: 'center',
      render: (_, row) => (
        <Button
          variant="outline"
          onClick={() => setSelectedAlert(row)}
          className="gap-1 h-8 text-[10px] font-semibold border-border bg-slate-50 hover:bg-slate-100"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>{row.status === 'open' || row.status === 'escalated' ? 'Investigate / Ack' : row.status === 'acknowledged' ? 'Resolve' : 'View Logs'}</span>
        </Button>
      )
    }
  ]

  const tabs = [
    { id: 'open', label: `Open Alerts (${openCount})` },
    { id: 'acknowledged', label: `Acknowledged (${ackCount})` },
    { id: 'resolved', label: `Resolved today (${resolvedToday})` }
  ]

  const kpis = [
    { label: 'Active Alerts', value: openCount, icon: <BellRing className="h-4 w-4" />, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20' },
    { label: 'Acknowledged', value: ackCount, icon: <Clock className="h-4 w-4" />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20' },
    { label: 'Critical Unresolved', value: criticalCount, icon: <ShieldAlert className="h-4 w-4" />, color: 'text-red-650 bg-red-100/50' },
    { label: 'Resolved Today', value: resolvedToday, icon: <CheckCircle className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="SOS Monitoring Center"
        description="Live incident logs, automated dispatch responses, operator call tracking, and response times logs."
      />

      <div className="space-y-6">
        {/* KPI Summaries */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {kpis.map((k, idx) => (
            <Card key={idx} className="premium-card">
              <CardContent className="p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">{k.label}</span>
                  <span className={`p-1.5 rounded ${k.color}`}>{k.icon}</span>
                </div>
                <p className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tab Filters and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-3">
          <FormTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(id: any) => setActiveTab(id)}
          />
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search ID, Ride, Rider, Driver..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
            />
          </div>
        </div>

        {/* Alerts List Table */}
        <DataTable
          columns={columns}
          data={alerts}
          isLoading={isLoading}
          isError={isError}
          selectable={false}
        />
      </div>

      {/* SOS Detail Drawer Modal */}
      {selectedAlert && (
        <SosDetailsDrawer
          alert={selectedAlert}
          onClose={() => {
            setSelectedAlert(null)
            refetch()
          }}
        />
      )}
    </PageWrapper>
  )
}

export default SosMonitorPage
