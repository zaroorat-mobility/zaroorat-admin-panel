import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useComplaints } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { FormTabs } from '@/shared/components/ui/FormTabs'
import { ComplaintStatusBadge } from '../components'
import { Button } from '@/shared/components/ui/Button'
import { ActionDropdown, type DropdownAction } from '@/modules/driver-management/components/ActionDropdown'
import { Eye, User, Plus } from 'lucide-react'
import type { Complaint } from '../types'

export const ComplaintsListPage: React.FC = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'resolved'>('all')

  const { data, isLoading, isError } = useComplaints({ search })
  const allTickets = data?.data || []

  // Filter tickets by tab
  const getFilteredTickets = () => {
    switch (activeTab) {
      case 'open':
        return allTickets.filter(t => t.status === 'open' || t.status === 'assigned' || t.status === 'investigating')
      case 'resolved':
        return allTickets.filter(t => t.status === 'resolved' || t.status === 'closed')
      default:
        return allTickets
    }
  }

  const tickets = getFilteredTickets()

  // Calculate SLA Timeline Indicators
  const getSlaBadge = (createdAt: string, priority: string, resolvedAt?: string) => {
    const limits: Record<string, number> = {
      critical: 15 * 60 * 1000,
      high: 60 * 60 * 1000,
      medium: 4 * 60 * 60 * 1000,
      low: 24 * 60 * 60 * 1000
    }
    const limit = limits[priority.toLowerCase()] || 24 * 60 * 60 * 1000
    const createdTime = new Date(createdAt).getTime()
    const endTime = resolvedAt ? new Date(resolvedAt).getTime() : Date.now()
    const elapsed = endTime - createdTime
    const breached = elapsed > limit

    if (breached) {
      return (
        <span className="px-1.5 py-0.5 rounded font-black text-[9px] bg-rose-50 border border-rose-100 text-rose-700 dark:bg-rose-950/20">
          BREACHED SLA
        </span>
      )
    }
    return (
      <span className="px-1.5 py-0.5 rounded font-black text-[9px] bg-emerald-50 border border-emerald-100 text-emerald-700 dark:bg-emerald-950/20">
        WITHIN SLA
      </span>
    )
  }

  const columns: DataTableColumn<Complaint>[] = [
    {
      key: 'id',
      label: 'Ticket ID',
      align: 'left',
      render: (val: string) => <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{val}</span>
    },
    {
      key: 'rideId',
      label: 'Ride ID',
      align: 'left',
      render: (val?: string) => val ? (
        <button
          onClick={() => navigate(`/operations/ride-monitor/${val}`)}
          className="text-primary hover:underline font-mono font-bold"
        >
          #{val}
        </button>
      ) : <span className="text-slate-400 font-bold">—</span>
    },
    {
      key: 'raisedByName',
      label: 'Raised By',
      align: 'left',
      render: (val: string, row) => (
        <div className="text-left text-xs font-medium">
          <div className="font-bold text-slate-855 dark:text-white flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-slate-400" />
            {val}
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wide border bg-slate-50 font-bold text-slate-500">
            {row.raisedBy}
          </span>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      align: 'left',
      render: (val: string) => <strong className="text-slate-800 dark:text-slate-200 text-xs">{val}</strong>
    },
    {
      key: 'priority',
      label: 'Priority',
      align: 'center',
      render: (val: string) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
          val === 'critical'
            ? 'bg-rose-100 text-rose-700 border-rose-200'
            : val === 'high'
            ? 'bg-red-50 text-red-650 border-red-100'
            : val === 'medium'
            ? 'bg-amber-50 text-amber-700 border-amber-100'
            : 'bg-slate-50 text-slate-450 border-slate-100'
        }`}>
          {val}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (val: any) => <ComplaintStatusBadge status={val} />
    },
    {
      key: 'sla',
      label: 'SLA Status',
      align: 'center',
      render: (_, row) => getSlaBadge(row.createdAt, row.priority, row.resolvedAt)
    },
    {
      key: 'createdAt',
      label: 'Created',
      align: 'center',
      render: (val: string) => (
        <span className="font-mono text-[10px] text-slate-500">
          {new Date(val).toLocaleDateString('en-IN')}
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
            label: 'View Ticket',
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/operations/complaints/${row.id}`)
          }
        ]

        if (row.rideId) {
          dropActions.push({
            label: 'Investigate Ride',
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/operations/ride-monitor/${row.rideId}`)
          })
        }

        return <ActionDropdown actions={dropActions} />
      }
    }
  ]

  const tabs = [
    { id: 'all', label: 'All Tickets' },
    { id: 'open', label: 'Active Support Queue' },
    { id: 'resolved', label: 'Archive / Resolved' }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Complaints & Support Tickets"
        description="Investigate passenger complaints, driver feedback, app bugs, route discrepancies, and wallet disputes."
        actions={
          <Button
            onClick={() => navigate('/operations/complaints/new')}
            className="gap-2 text-xs font-semibold h-9 rounded-lg bg-primary hover:bg-primary/95 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Create Complaint</span>
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Filters and search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-3">
          <FormTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(id: any) => setActiveTab(id)}
          />
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by ID, Category, Raiser..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
            />
          </div>
        </div>

        {/* Complaints Data Table */}
        <DataTable
          columns={columns}
          data={tickets}
          isLoading={isLoading}
          isError={isError}
          selectable={false}
        />
      </div>
    </PageWrapper>
  )
}

export default ComplaintsListPage
