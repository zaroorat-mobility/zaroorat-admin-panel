import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRefunds } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { FormTabs } from '@/shared/components/ui/FormTabs'
import { RefundStatusBadge } from '../components'
import { Button } from '@/shared/components/ui/Button'
import { ActionDropdown, type DropdownAction } from '@/modules/driver-management/components/ActionDropdown'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Eye, User, Plus, Clock, DollarSign, ShieldAlert, CreditCard, CheckCircle, Ban, Tag } from 'lucide-react'
import type { RefundRequest } from '../types'

export const RefundsListPage: React.FC = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'requested' | 'under_review' | 'approved' | 'processing' | 'completed' | 'rejected'>('all')

  const { data, isLoading, isError } = useRefunds({ search })
  const allRefunds = data?.data || []

  // Filter refunds by tab
  const getFilteredRefunds = () => {
    if (activeTab === 'all') return allRefunds
    return allRefunds.filter(r => r.status === activeTab)
  }

  const refunds = getFilteredRefunds()

  // KPI Calculations
  const requestedCount = allRefunds.filter(r => r.status === 'requested').length
  const underReviewCount = allRefunds.filter(r => r.status === 'under_review').length
  const approvedCount = allRefunds.filter(r => r.status === 'approved').length
  const processingCount = allRefunds.filter(r => r.status === 'processing').length
  const completedCount = allRefunds.filter(r => r.status === 'completed').length
  const rejectedCount = allRefunds.filter(r => r.status === 'rejected').length

  const totalRefundAmount = allRefunds
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (r.approvedAmount || 0), 0)

  const columns: DataTableColumn<RefundRequest>[] = [
    {
      key: 'refundId',
      label: 'Refund ID',
      align: 'left',
      render: (val: string, row) => (
        <button
          onClick={() => navigate(`/financial-operations/refunds/${row.id}`)}
          className="font-mono font-bold text-slate-800 dark:text-slate-100 hover:underline hover:text-primary"
        >
          {val}
        </button>
      )
    },
    {
      key: 'rideId',
      label: 'Ride ID',
      align: 'left',
      render: (val?: string) => (
        val ? (
          <button
            onClick={() => navigate(`/operations/ride-monitor/${val}`)}
            className="text-primary hover:underline font-mono font-bold"
          >
            #{val}
          </button>
        ) : (
          <span className="text-slate-400 font-mono">—</span>
        )
      )
    },
    {
      key: 'disputeId',
      label: 'Dispute ID',
      align: 'left',
      render: (val?: string) => (
        val ? (
          <button
            onClick={() => navigate(`/financial-operations/disputes/${val}`)}
            className="text-primary hover:underline font-mono font-bold"
          >
            #{val}
          </button>
        ) : (
          <span className="text-slate-400 font-mono">—</span>
        )
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
      key: 'refundType',
      label: 'Category Type',
      align: 'left',
      render: (val: string) => (
        <span className="font-bold text-slate-850 dark:text-white text-xs">
          {val.replace(/_/g, ' ')}
        </span>
      )
    },
    {
      key: 'refundSource',
      label: 'Source',
      align: 'center',
      render: (val: string) => (
        <span className="uppercase text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-650">
          {val}
        </span>
      )
    },
    {
      key: 'requestedAmount',
      label: 'Requested',
      align: 'right',
      render: (val: number) => (
        <span className="font-mono text-xs text-slate-500 font-semibold">
          ₹{val.toFixed(2)}
        </span>
      )
    },
    {
      key: 'approvedAmount',
      label: 'Approved',
      align: 'right',
      render: (val?: number) => (
        <strong className="text-slate-850 dark:text-white font-mono text-xs">
          {val !== undefined ? `₹${val.toFixed(2)}` : '—'}
        </strong>
      )
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (val: any) => <RefundStatusBadge status={val} />
    },
    {
      key: 'requestedAt',
      label: 'Requested Date',
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
            label: 'View Refund Details',
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/financial-operations/refunds/${row.id}`)
          }
        ]

        if (row.status === 'requested' || row.status === 'under_review') {
          dropActions.push({
            label: 'Review Request',
            icon: <Tag className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/financial-operations/refunds/${row.id}/review`)
          })
        }

        if (row.status === 'approved' || row.status === 'processing') {
          dropActions.push({
            label: 'Process Payout',
            icon: <CreditCard className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/financial-operations/refunds/${row.id}/process`)
          })
        }

        return <ActionDropdown actions={dropActions} />
      }
    }
  ]

  const tabs = [
    { id: 'all', label: 'All Requests' },
    { id: 'requested', label: `Requested (${requestedCount})` },
    { id: 'under_review', label: `Under Review (${underReviewCount})` },
    { id: 'approved', label: `Approved (${approvedCount})` },
    { id: 'processing', label: `Processing (${processingCount})` },
    { id: 'completed', label: `Completed (${completedCount})` },
    { id: 'rejected', label: `Rejected (${rejectedCount})` }
  ]

  const kpis = [
    { label: 'Refund Requests', value: requestedCount, icon: <ShieldAlert className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50' },
    { label: 'Under Review', value: underReviewCount, icon: <Clock className="h-4 w-4" />, color: 'text-amber-600 bg-amber-50' },
    { label: 'Approved', value: approvedCount, icon: <CreditCard className="h-4 w-4" />, color: 'text-purple-600 bg-purple-50' },
    { label: 'Completed', value: completedCount, icon: <CheckCircle className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Rejected', value: rejectedCount, icon: <Ban className="h-4 w-4" />, color: 'text-rose-600 bg-rose-50' },
    { label: 'Total Payouts Settled', value: `₹${totalRefundAmount.toFixed(2)}`, icon: <DollarSign className="h-4 w-4" />, color: 'text-primary bg-primary/10' }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Refund Management Center"
        description="Verify driver cancel waivers, passenger goodwill compensations, failed UPI transactions, and double charged settlements."
        actions={
          <Button
            onClick={() => navigate('/financial-operations/refunds/new')}
            className="gap-2 text-xs font-semibold h-9 rounded-lg bg-primary hover:bg-primary/95 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Create Refund</span>
          </Button>
        }
      />

      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-left">
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-3">
          <FormTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(id: any) => setActiveTab(id)}
          />
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search Refund Ref, Ride, Rider, Dispute..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
            />
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={refunds}
          isLoading={isLoading}
          isError={isError}
          selectable={false}
        />
      </div>
    </PageWrapper>
  )
}

export default RefundsListPage
