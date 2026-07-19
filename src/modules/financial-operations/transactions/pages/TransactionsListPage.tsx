import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTransactions } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { FormTabs } from '@/shared/components/ui/FormTabs'
import { Button } from '@/shared/components/ui/Button'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { ActionDropdown, type DropdownAction } from '@/modules/driver-management/components/ActionDropdown'
import { TransactionStatusBadge, PaymentMethodBadge, TransactionSummaryDrawer } from '../components'
import { ExportService } from '../../services'
import {
  DollarSign, Activity, Download, Eye, ShieldAlert, CreditCard, Clock, Landmark
} from 'lucide-react'
import type { Transaction, TransactionStatus } from '../types'

type TabKey = TransactionStatus | 'all'

export const TransactionsListPage: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')
  const [gatewayFilter, setGatewayFilter] = useState('all')

  // Drawer states
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Query transactions list
  const { data: res, isLoading, isError } = useTransactions({
    search,
    status: activeTab,
    gateway: gatewayFilter
  })
  const allTxns = res?.data || []

  // Filter calculations for lists
  const capturedCount = allTxns.filter(t => t.status === 'captured').length
  const processingCount = allTxns.filter(t => t.status === 'processing').length
  const failedCount = allTxns.filter(t => t.status === 'failed').length
  const refundedCount = allTxns.filter(t => t.status === 'fully_refunded' || t.status === 'partially_refunded').length
  const reversedCount = allTxns.filter(t => t.status === 'reversed').length

  // Calculate top KPI statistics dynamically from the seed list
  const gtv = allTxns.filter(t => t.status === 'captured').reduce((sum, t) => sum + t.amount, 0)
  const refundTotal = allTxns.reduce((sum, t) => sum + t.refundAmount, 0)
  const netCollection = gtv - refundTotal
  const failedTotalAmount = allTxns.filter(t => t.status === 'failed').reduce((sum, t) => sum + t.rideFare, 0)
  const averageValue = gtv / (allTxns.filter(t => t.status === 'captured').length || 1)
  const successRate = allTxns.length > 0 ? Math.round((allTxns.filter(t => t.status === 'captured').length / allTxns.length) * 100) : 100

  const handleExport = (format: 'csv' | 'xlsx') => {
    const reportData = allTxns.map(t => ({
      'Transaction ID': t.transactionId,
      'Gateway Reference': t.gatewayReference || 'N/A',
      'Transaction Type': t.type,
      'Payment Method': t.paymentMethod,
      'Linked Entity ID': t.entityId,
      'Linked Entity Type': t.entityType,
      'Gateway': t.paymentGateway || 'N/A',
      'Charged Amount (INR)': t.amountCharged,
      'Captured Amount (INR)': t.amountCaptured,
      'Refunded Amount (INR)': t.refundAmount,
      'Variance (INR)': t.variance,
      'Status': t.status,
      'Created At': t.createdAt
    }))
    if (format === 'csv') {
      ExportService.exportToCSV('transactions_ledger_report', reportData)
    } else {
      ExportService.exportToExcel('transactions_ledger_report', reportData)
    }
  }

  const handleOpenDrawer = (txn: Transaction) => {
    setSelectedTxn(txn)
    setIsDrawerOpen(true)
  }

  const columns: DataTableColumn<Transaction>[] = [
    {
      key: 'transactionId',
      label: 'Transaction ID',
      align: 'left',
      render: (val: string, row) => (
        <button
          onClick={() => handleOpenDrawer(row)}
          className="font-mono font-black text-primary hover:underline hover:text-primary/90 text-xs"
        >
          {val}
        </button>
      )
    },
    {
      key: 'gatewayReference',
      label: 'Gateway Ref',
      align: 'left',
      render: (val?: string) => (
        <span className="font-mono text-slate-500 font-semibold">{val || '—'}</span>
      )
    },
    {
      key: 'type',
      label: 'Type',
      align: 'left',
      render: (val: string) => (
        <span className="font-bold text-slate-800 dark:text-white uppercase text-[10px]">
          {val.replace(/_/g, ' ')}
        </span>
      )
    },
    {
      key: 'paymentMethod',
      label: 'Method',
      align: 'center',
      render: (val: any) => <PaymentMethodBadge method={val} />
    },
    {
      key: 'entityId',
      label: 'Linked Entity',
      align: 'left',
      render: (val: string, row) => (
        <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
          {row.entityType === 'ride' ? <Activity className="h-3.5 w-3.5 text-slate-400" /> : <Landmark className="h-3.5 w-3.5 text-slate-400" />}
          {val}
        </span>
      )
    },
    {
      key: 'paymentGateway',
      label: 'Gateway',
      align: 'center',
      render: (val?: string) => (
        <span className="uppercase font-black text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-dark-700 text-slate-650">
          {val || '—'}
        </span>
      )
    },
    {
      key: 'amountCaptured',
      label: 'Amount',
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
      render: (val: any) => <TransactionStatusBadge status={val} />
    },
    {
      key: 'variance',
      label: 'Variance',
      align: 'right',
      render: (val: number) => (
        <span className={`font-mono text-xs font-bold ${val !== 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
          ₹{val.toFixed(2)}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Created At',
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
        const dropActions: DropdownAction[] = [
          {
            label: 'View Detailed Ledger',
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/financial-operations/transactions/${row.id}`)
          }
        ]
        
        // Link conditionally to Ride Details
        if (row.rideId) {
          dropActions.push({
            label: 'View Linked Ride',
            icon: <Activity className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/operations/ride-monitor/${row.rideId}`)
          })
        }

        // Deep link redirection shortcuts
        if (row.entityType === 'refund' && row.entityId) {
          dropActions.push({
            label: 'View Linked Refund Ticket',
            icon: <Landmark className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/financial-operations/refunds/${row.entityId}`)
          })
        } else if (row.status === 'captured') {
          dropActions.push({
            label: 'Create Refund Request',
            icon: <Landmark className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/financial-operations/refunds/new?rideId=${row.rideId || ''}`)
          })
        }

        if (row.entityType === 'dispute' && row.entityId) {
          dropActions.push({
            label: 'View Dispute Ticket',
            icon: <ShieldAlert className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/financial-operations/disputes/${row.entityId}`)
          })
        } else if (row.status === 'captured') {
          dropActions.push({
            label: 'Create Dispute',
            icon: <ShieldAlert className="h-3.5 w-3.5" />,
            onClick: () => navigate(`/financial-operations/disputes/new?rideId=${row.rideId || ''}`)
          })
        }

        return <ActionDropdown actions={dropActions} />
      }
    }
  ]

  const tabs = [
    { id: 'all', label: 'All Transactions' },
    { id: 'captured', label: `Captured (${capturedCount})` },
    { id: 'processing', label: `Processing (${processingCount})` },
    { id: 'failed', label: `Failed (${failedCount})` },
    { id: 'refunded', label: `Refunded (${refundedCount})` },
    { id: 'reversed', label: `Reversed (${reversedCount})` }
  ]

  const kpis = [
    { label: 'Gross GTV Vol', value: `₹${gtv.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: <DollarSign className="h-4 w-4" />, color: 'text-primary bg-primary/10' },
    { label: 'Net Collection', value: `₹${netCollection.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: <Landmark className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Total Refunded', value: `₹${refundTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: <Clock className="h-4 w-4" />, color: 'text-rose-600 bg-rose-50' },
    { label: 'Failed Attempts', value: `₹${failedTotalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: <ShieldAlert className="h-4 w-4" />, color: 'text-rose-700 bg-rose-50' },
    { label: 'Average Ticket Value', value: `₹${averageValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: <CreditCard className="h-4 w-4" />, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'PG Success Rate', value: `${successRate}%`, icon: <Activity className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50' }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Transaction Ledger"
        description="Immutable financial ledger log containing all transaction details, payment methods, PG status codes, and reconciliation variances."
        actions={
          <div className="flex gap-2">
            <Button
              onClick={() => handleExport('csv')}
              className="gap-1.5 text-xs font-semibold h-9 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
            <Button
              onClick={() => handleExport('xlsx')}
              className="gap-1.5 text-xs font-semibold h-9 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700"
            >
              <Download className="h-4 w-4" />
              <span>Export Excel</span>
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-left">
          {kpis.map((k, idx) => (
            <Card key={idx} className="premium-card">
              <CardContent className="p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-455 uppercase tracking-wider">{k.label}</span>
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
          <div className="flex items-center gap-2">
            <select
              value={gatewayFilter}
              onChange={e => setGatewayFilter(e.target.value)}
              className="px-2 py-1.5 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-primary h-[34px] font-semibold text-slate-650"
            >
              <option value="all">All Gateways</option>
              <option value="razorpay">Razorpay</option>
              <option value="phonepe">PhonePe</option>
              <option value="cashfree">Cashfree</option>
              <option value="paytm">Paytm</option>
            </select>
            <div className="relative w-full sm:w-60">
              <input
                type="text"
                placeholder="Search Txn ID, Gate Ref, Ride ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
              />
            </div>
          </div>
        </div>

        {/* Transactions Data Table */}
        <DataTable
          columns={columns}
          data={allTxns}
          isLoading={isLoading}
          isError={isError}
          selectable={false}
        />

        {/* Transaction Summary Drawer overlay component */}
        <TransactionSummaryDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          txn={selectedTxn}
          onViewDetails={id => {
            setIsDrawerOpen(false)
            navigate(`/financial-operations/transactions/${id}`)
          }}
        />
      </div>
    </PageWrapper>
  )
}

export default TransactionsListPage
