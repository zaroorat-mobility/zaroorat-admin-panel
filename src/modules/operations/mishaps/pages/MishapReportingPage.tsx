import React, { useState } from 'react'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { InfoCard, InfoCardGrid } from '@/shared/components/InfoCard'
import { DataTable } from '@/shared/components/DataTable'
import { Button } from '@/shared/components/ui/Button'
import { AlertTriangle, ShieldAlert, CheckCircle2, Clock, MapPin } from 'lucide-react'

interface MishapEvent {
  id: string
  rideId: string
  reportedAt: string
  type: 'accident' | 'medical' | 'vehicle_breakdown' | 'harassment'
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'reported' | 'first_responder_dispatched' | 'resolved'
  description: string
}

export const MishapReportingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active')

  const mishaps: MishapEvent[] = [
    { id: 'MSH-101', rideId: 'R-7702', reportedAt: '2026-07-24 16:15', type: 'accident', severity: 'critical', status: 'first_responder_dispatched', description: 'Minor collision at outer ring road junction. Police contacted.' },
    { id: 'MSH-102', rideId: 'R-7705', reportedAt: '2026-07-24 15:40', type: 'vehicle_breakdown', severity: 'medium', status: 'reported', description: 'Flat tire near highway toll. Dispatching towing service.' },
    { id: 'MSH-103', rideId: 'R-7690', reportedAt: '2026-07-24 12:10', type: 'medical', severity: 'high', status: 'resolved', description: 'Passenger complained of extreme dizziness. Ambulance dispatched; passenger stabilized.' },
    { id: 'MSH-104', rideId: 'R-7685', reportedAt: '2026-07-23 18:20', type: 'harassment', severity: 'high', status: 'resolved', description: 'Verbal dispute reported. Safety call center intervened and closed dispute.' }
  ]

  const filteredMishaps = mishaps.filter(m => 
    activeTab === 'active' ? m.status !== 'resolved' : m.status === 'resolved'
  )

  const columns = [
    {
      key: 'id',
      label: 'Mishap ID',
      render: (val: string) => <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{val}</span>
    },
    {
      key: 'rideId',
      label: 'Ride ID',
      render: (val: string) => (
        <span className="font-mono text-primary font-bold">#{val}</span>
      )
    },
    {
      key: 'type',
      label: 'Incident Type',
      render: (val: string) => (
        <span className="capitalize font-semibold text-slate-800 dark:text-slate-200">
          {val.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'severity',
      label: 'Severity',
      render: (val: string) => {
        const colors: Record<string, string> = {
          low: 'bg-slate-50 border-slate-150 text-slate-500',
          medium: 'bg-amber-50 border-amber-150 text-amber-700',
          high: 'bg-orange-50 border-orange-150 text-orange-700',
          critical: 'bg-rose-50 border-rose-150 text-rose-700 font-bold animate-pulse'
        }
        return (
          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider ${colors[val]}`}>
            {val}
          </span>
        )
      }
    },
    {
      key: 'reportedAt',
      label: 'Reported Time',
      render: (val: string) => (
        <span className="font-mono text-slate-500 text-[10px]">
          {val}
        </span>
      )
    },
    {
      key: 'description',
      label: 'Mishap Details',
      render: (val: string) => (
        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 block max-w-xs truncate" title={val}>
          {val}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Incident Status',
      render: (val: string) => {
        const colors: Record<string, string> = {
          reported: 'bg-indigo-50 border-indigo-150 text-indigo-750 dark:bg-indigo-950/20 dark:text-indigo-400',
          first_responder_dispatched: 'bg-rose-50 border-rose-200 text-rose-800 font-bold dark:bg-rose-950/20 dark:text-rose-450 animate-pulse',
          resolved: 'bg-emerald-50 border-emerald-150 text-emerald-700'
        }
        return (
          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider ${colors[val]}`}>
            {val.replace(/_/g, ' ')}
          </span>
        )
      }
    },
    {
      key: 'actions',
      label: 'Escalate / Action',
      align: 'center' as const,
      render: (_, row: MishapEvent) => (
        <div className="flex justify-center gap-1.5">
          {row.status !== 'resolved' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-[10px] h-7 bg-rose-600 hover:bg-rose-700 text-white border-transparent font-bold"
                onClick={() => alert(`Escalated mishap ${row.id} to level-3 emergency response!`)}
              >
                <ShieldAlert className="h-3 w-3" />
                <span>Level-3 Escalate</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-[10px] h-7 border-border font-bold text-slate-700"
                onClick={() => alert(`Marking mishap ${row.id} as resolved`)}
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                <span>Resolve</span>
              </Button>
            </>
          ) : (
            <span className="text-[10px] text-slate-400 font-bold">Resolved & Archived</span>
          )}
        </div>
      )
    }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Mishap Reporting Console"
        description="Monitor road mishaps, medical emergencies, accident alerts, and coordinate level-3 critical response escalation."
      />

      <div className="space-y-6 text-left">
        {/* KPI Row */}
        <InfoCardGrid cols={3}>
          <InfoCard
            label="Active Road Mishaps"
            value="2 Emergency Alerts"
            icon={<AlertTriangle className="w-5 h-5" />}
            variant="red"
            subtitle="Critical dispatch: 1 responder en-route"
          />
          <InfoCard
            label="Average Dispatch SLA"
            value="4.8 Minutes"
            icon={<Clock className="w-5 h-5" />}
            variant="blue"
            subtitle="Within standard 5-minute limit"
          />
          <InfoCard
            label="Active Responders"
            value="12 Hotspots"
            icon={<MapPin className="w-5 h-5" />}
            variant="blue"
            subtitle="Coordinated with trauma services"
          />
        </InfoCardGrid>

        {/* Tab filters */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-border">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                activeTab === 'active' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Active Incidents ({mishaps.filter(m => m.status !== 'resolved').length})
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                activeTab === 'resolved' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Resolved / Archived ({mishaps.filter(m => m.status === 'resolved').length})
            </button>
          </div>
        </div>

        {/* Sync Data Table */}
        <DataTable
          columns={columns}
          data={filteredMishaps}
          selectable={false}
          resultLabel="mishap incidents"
        />
      </div>
    </PageWrapper>
  )
}

export default MishapReportingPage
