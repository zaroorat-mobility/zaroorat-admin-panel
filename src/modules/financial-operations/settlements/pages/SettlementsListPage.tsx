import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettlements } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { FormTabs } from '@/shared/components/ui/FormTabs'
import { Button } from '@/shared/components/ui/Button'
import { ActionDropdown, type DropdownAction } from '@/modules/driver-management/components/ActionDropdown'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { SettlementStatusBadge } from '../components'
import {
  Plus, Eye, Play, TrendingUp,
  DollarSign, Clock, CheckCircle2, Users, Landmark
} from 'lucide-react'
import type { SettlementBatch, SettlementStatus } from '../types'

type TabKey = SettlementStatus | 'all'

export const SettlementsListPage: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')

  const { data, isLoading, isError } = useSettlements()
  const batches = data?.data ?? []

  const filtered = batches.filter(b => {
    const matchTab = activeTab === 'all' || b.status === activeTab
    const matchSearch = !search ||
      b.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.generatedBy.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  // KPI calculations
  const pendingCount     = batches.filter(b => b.status === 'pending').length
  const processingCount  = batches.filter(b => b.status === 'processing').length
  const completedCount   = batches.filter(b => b.status === 'completed').length
  const totalDrivers     = batches.reduce((s, b) => s + b.totalDrivers, 0)
  const totalPayable     = batches.filter(b => b.status !== 'completed').reduce((s, b) => s + b.totalNetPayable, 0)
  const totalSettled     = batches.filter(b => b.status === 'completed').reduce((s, b) => s + b.totalNetPayable, 0)

  const kpis = [
    { label: 'Pending Approval', value: pendingCount, icon: <Clock className="h-4 w-4" />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20' },
    { label: 'Processing', value: processingCount, icon: <Play className="h-4 w-4" />, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20' },
    { label: 'Completed', value: completedCount, icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
    { label: 'Total Drivers', value: totalDrivers, icon: <Users className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20' },
    { label: 'Outstanding Payable', value: `₹${totalPayable.toLocaleString('en-IN')}`, icon: <DollarSign className="h-4 w-4" />, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20' },
    { label: 'Total Settled', value: `₹${totalSettled.toLocaleString('en-IN')}`, icon: <Landmark className="h-4 w-4" />, color: 'text-primary bg-primary/10' },
  ]

  const tabs = [
    { id: 'all', label: 'All Batches' },
    { id: 'draft', label: 'Draft' },
    { id: 'pending', label: `Pending (${pendingCount})` },
    { id: 'processing', label: `Processing (${processingCount})` },
    { id: 'completed', label: `Completed (${completedCount})` },
    { id: 'failed', label: 'Failed' },
  ]

  const columns: DataTableColumn<SettlementBatch>[] = [
    {
      key: 'batchNumber',
      label: 'Batch Reference',
      align: 'left',
      render: (val: string, row) => (
        <button
          onClick={() => navigate(`/financial-operations/settlements/${row.id}`)}
          className="font-mono font-black text-primary hover:underline"
        >
          {val}
        </button>
      )
    },
    {
      key: 'periodStart',
      label: 'Period',
      align: 'left',
      render: (val: string, row) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
          {val} → {row.periodEnd}
        </span>
      )
    },
    {
      key: 'totalDrivers',
      label: 'Drivers',
      align: 'center',
      render: (val: number) => (
        <span className="font-bold text-slate-700 dark:text-white flex items-center justify-center gap-1">
          <Users className="h-3.5 w-3.5 text-slate-400" />{val}
        </span>
      )
    },
    {
      key: 'totalGrossAmount',
      label: 'Gross Earnings',
      align: 'right',
      render: (val: number) => (
        <span className="font-mono text-xs text-slate-500 font-semibold">₹{val.toLocaleString('en-IN')}</span>
      )
    },
    {
      key: 'totalCommission',
      label: 'Commission',
      align: 'right',
      render: (val: number) => (
        <span className="font-mono text-xs text-rose-600 font-semibold">-₹{val.toLocaleString('en-IN')}</span>
      )
    },
    {
      key: 'totalNetPayable',
      label: 'Net Payable',
      align: 'right',
      render: (val: number) => (
        <strong className="font-mono text-sm text-emerald-600 dark:text-emerald-400">₹{val.toLocaleString('en-IN')}</strong>
      )
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (val: any) => <SettlementStatusBadge status={val} />
    },
    {
      key: 'generatedBy',
      label: 'Generated By',
      align: 'center',
      render: (val: string) => (
        <span className="font-semibold text-slate-650 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
          {val}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      align: 'center',
      render: (val: string) => (
        <span className="font-mono text-[10px] text-slate-500">
          {new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      render: (_, row) => {
        const actions: DropdownAction[] = [
          {
            label: 'View Settlement Details',
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/financial-operations/settlements/${row.id}`)
          }
        ]
        if (row.status === 'pending') {
          actions.push({
            label: 'Start Processing',
            icon: <Play className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/financial-operations/settlements/${row.id}`)
          })
        }
        if (row.status === 'completed') {
          actions.push({
            label: 'View Analytics',
            icon: <TrendingUp className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/financial-operations/settlements/${row.id}`)
          })
        }
        return <ActionDropdown actions={actions} />
      }
    }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Settlement Management"
        description="Manage driver settlement batches, earnings reconciliation, and payout processing for the platform."
        actions={
          <Button
            onClick={() => navigate('/financial-operations/settlements/run')}
            className="gap-2 text-xs font-semibold h-9 rounded-lg bg-primary hover:bg-primary/95 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Generate Settlement</span>
          </Button>
        }
      />

      <div className="space-y-6">
        {/* KPI Summaries */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 text-left">
          {kpis.map((k, idx) => (
            <Card key={idx} className="premium-card">
              <CardContent className="p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">{k.label}</span>
                  <span className={`p-1 rounded ${k.color}`}>{k.icon}</span>
                </div>
                <p className="text-base font-black text-slate-850 dark:text-white tracking-tight">{k.value}</p>
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
              placeholder="Search batch, generator..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
            />
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          isError={isError}
          selectable={false}
        />
      </div>
    </PageWrapper>
  )
}

export default SettlementsListPage
