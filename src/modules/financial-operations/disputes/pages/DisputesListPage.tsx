import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDisputes } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { FormTabs } from '@/shared/components/ui/FormTabs'
import { DisputeStatusBadge } from '../components'
import { Button } from '@/shared/components/ui/Button'
import { ActionDropdown, type DropdownAction } from '@/modules/driver-management/components/ActionDropdown'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Eye, User, Plus, Clock, DollarSign, ShieldAlert, CreditCard, CheckCircle } from 'lucide-react'
import type { PaymentDispute } from '../types'

export const DisputesListPage: React.FC = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'resolved'>('all')

  const { data, isLoading, isError } = useDisputes({ search })
  const allDisputes = data?.data || []

  // Filter disputes by tab
  const getFilteredDisputes = () => {
    switch (activeTab) {
      case 'active':
        return allDisputes.filter(d => ['open', 'assigned', 'investigating', 'pending_approval'].includes(d.status))
      case 'resolved':
        return allDisputes.filter(d => d.status === 'resolved' || d.status === 'closed')
      default:
        return allDisputes
    }
  }

  const disputes = getFilteredDisputes()

  // KPI Calculations
  const openCount = allDisputes.filter(d => d.status === 'open').length
  const investigatingCount = allDisputes.filter(d => d.status === 'investigating' || d.status === 'assigned').length
  const pendingApprovalCount = allDisputes.filter(d => d.status === 'pending_approval').length
  
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const resolvedToday = allDisputes.filter(d => 
    d.status === 'resolved' && 
    new Date(d.updatedAt).getTime() >= startOfToday.getTime()
  ).length

  const totalAmountInDispute = allDisputes
    .filter(d => ['open', 'assigned', 'investigating', 'pending_approval'].includes(d.status))
    .reduce((sum, d) => sum + d.amount, 0)

  const columns: DataTableColumn<PaymentDispute>[] = [
    {
      key: 'id',
      label: 'Dispute ID',
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
      key: 'type',
      label: 'Dispute Type',
      align: 'left',
      render: (val: string) => (
        <span className="font-bold text-slate-800 dark:text-white text-xs">
          {val.replace(/_/g, ' ')}
        </span>
      )
    },
    {
      key: 'riderName',
      label: 'Rider / Passenger',
      align: 'left',
      render: (val: string) => (
        <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-slate-400" />
          {val}
        </span>
      )
    },
    {
      key: 'driverName',
      label: 'Driver / Partner',
      align: 'left',
      render: (val: string) => (
        <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-slate-400" />
          {val}
        </span>
      )
    },
    {
      key: 'amount',
      label: 'Disputed Amount',
      align: 'right',
      render: (val: number) => (
        <strong className="text-slate-850 dark:text-white font-mono text-xs">
          ₹{val.toFixed(2)}
        </strong>
      )
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (val: any) => <DisputeStatusBadge status={val} />
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      align: 'center',
      render: (val?: string) => (
        <span className="font-semibold text-slate-650 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
          {val || 'Unassigned'}
        </span>
      )
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
            label: 'Investigate Dispute',
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/financial-operations/disputes/${row.id}`)
          },
          {
            label: 'View Linked Ride',
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/operations/ride-monitor/${row.rideId}`)
          }
        ]
        return <ActionDropdown actions={dropActions} />
      }
    }
  ]

  const tabs = [
    { id: 'all', label: 'All Disputes' },
    { id: 'active', label: `Active Queue (${allDisputes.filter(d => ['open', 'assigned', 'investigating', 'pending_approval'].includes(d.status)).length})` },
    { id: 'resolved', label: `Resolved Today (${resolvedToday})` }
  ]

  const kpis = [
    { label: 'Open Disputes', value: openCount, icon: <ShieldAlert className="h-4 w-4" />, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20' },
    { label: 'Investigating', value: investigatingCount, icon: <Clock className="h-4 w-4" />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20' },
    { label: 'Pending Approval', value: pendingApprovalCount, icon: <CreditCard className="h-4 w-4" />, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20' },
    { label: 'Resolved Today', value: resolvedToday, icon: <CheckCircle className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
    { label: 'Total In Dispute', value: `₹${totalAmountInDispute.toFixed(2)}`, icon: <DollarSign className="h-4 w-4" />, color: 'text-primary bg-primary/10' }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Payment Disputes Center"
        description="Investigate upfront estimate vs. final fare mismatches, uncollected driver cash reports, double debits, and cancel fee disputes."
        actions={
          <Button
            onClick={() => navigate('/financial-operations/disputes/new')}
            className="gap-2 text-xs font-semibold h-9 rounded-lg bg-primary hover:bg-primary/95 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Log Dispute</span>
          </Button>
        }
      />

      <div className="space-y-6">
        {/* KPI Summaries */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 text-left">
          {kpis.map((k, idx) => (
            <Card key={idx} className="premium-card">
              <CardContent className="p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">{k.label}</span>
                  <span className={`p-1 rounded ${k.color}`}>{k.icon}</span>
                </div>
                <p className="text-lg font-black text-slate-850 dark:text-white tracking-tight">{k.value}</p>
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
              placeholder="Search Dispute, Ride, Rider, Type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
            />
          </div>
        </div>

        {/* Disputes Data Table */}
        <DataTable
          columns={columns}
          data={disputes}
          isLoading={isLoading}
          isError={isError}
          selectable={false}
        />
      </div>
    </PageWrapper>
  )
}

export default DisputesListPage
