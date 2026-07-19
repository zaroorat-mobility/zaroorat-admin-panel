import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReconciliation } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { Button } from '@/shared/components/ui/Button'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { ExportService } from '../../services'
import {
  ArrowLeft, Download, ShieldAlert, CheckCircle2, AlertTriangle, DollarSign
} from 'lucide-react'
import type { Transaction } from '../types'

export const TransactionReconciliationPage: React.FC = () => {
  const navigate = useNavigate()
  const [gatewayFilter, setGatewayFilter] = useState('all')
  const [varianceOnly, setVarianceOnly] = useState(false)
  const [search, setSearch] = useState('')

  // Query records
  const { data, isLoading, isError } = useReconciliation({
    gateway: gatewayFilter,
    varianceOnly,
    search
  })

  // Destructure query result
  const records = data?.data || []
  const summary = data?.summary || { totalRecords: 0, matchedRecords: 0, varianceRecords: 0, varianceAmount: 0 }

  const handleExport = () => {
    const dataToExport = records.map(r => ({
      'Transaction ID': r.transactionId,
      'Ride ID': r.rideId || 'N/A',
      'Expected Ride Fare': r.rideFare,
      'PG Amount Charged': r.amountCharged,
      'PG Amount Captured': r.amountCaptured,
      'Refund Amount': r.refundAmount,
      'Settlement Payout Impact': r.settlementImpact,
      'Variance Mismatch': r.variance,
      'Reconciliation Status': r.varianceStatus,
      'Reconciled By': r.reconciledBy || 'N/A',
      'Last Reconciled At': r.lastReconciledAt || 'N/A'
    }))
    ExportService.exportToCSV('variance_reconciliation_report', dataToExport)
  }

  const columns: DataTableColumn<Transaction>[] = [
    {
      key: 'transactionId',
      label: 'Transaction ID',
      align: 'left',
      render: (val: string, row) => (
        <button
          onClick={() => navigate(`/financial-operations/transactions/${row.id}`)}
          className="font-mono font-black text-primary hover:underline hover:text-primary/90 text-xs"
        >
          {val}
        </button>
      )
    },
    {
      key: 'rideFare',
      label: 'Ride Fare',
      align: 'right',
      render: (val: number) => <span className="font-mono text-slate-550">₹{val.toFixed(2)}</span>
    },
    {
      key: 'amountCharged',
      label: 'Charged',
      align: 'right',
      render: (val: number) => <span className="font-mono text-slate-550">₹{val.toFixed(2)}</span>
    },
    {
      key: 'amountCaptured',
      label: 'Captured',
      align: 'right',
      render: (val: number) => <span className="font-mono font-bold text-slate-700 dark:text-white">₹{val.toFixed(2)}</span>
    },
    {
      key: 'refundAmount',
      label: 'Refunded',
      align: 'right',
      render: (val: number) => <span className="font-mono text-rose-500 font-semibold">-₹{val.toFixed(2)}</span>
    },
    {
      key: 'settlementImpact',
      label: 'Settlement Payout',
      align: 'right',
      render: (val: number) => <span className="font-mono text-emerald-600 font-bold">₹{val.toFixed(2)}</span>
    },
    {
      key: 'variance',
      label: 'Variance',
      align: 'right',
      render: (val: number) => (
        <span className={`font-mono text-xs font-black ${val !== 0 ? 'text-rose-600' : 'text-slate-400'}`}>
          {val !== 0 ? `₹${val.toFixed(2)}` : '₹0.00'}
        </span>
      )
    },
    {
      key: 'varianceStatus',
      label: 'Status',
      align: 'center',
      render: (val: string) => {
        const styles: Record<string, string> = {
          matched: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          variance_found: 'bg-rose-50 text-rose-700 border-rose-100 font-bold',
          under_review: 'bg-amber-50 text-amber-700 border-amber-100',
          resolved: 'bg-indigo-50 text-indigo-700 border-indigo-100'
        }
        return (
          <span className={`px-1.5 py-0.5 rounded text-[8px] border uppercase font-black tracking-wider ${styles[val] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
            {val.replace(/_/g, ' ')}
          </span>
        )
      }
    },
    {
      key: 'reconciledBy',
      label: 'Audited By',
      align: 'center',
      render: (val: string | undefined, row) => (
        val ? (
          <div className="text-[10px] font-semibold text-slate-650">
            <span className="block font-bold">{val}</span>
            <span className="block text-[8px] text-slate-400 font-mono">
              {row.lastReconciledAt ? new Date(row.lastReconciledAt).toLocaleDateString('en-IN') : ''}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 font-mono">—</span>
        )
      )
    }
  ]

  const kpis = [
    { label: 'Total Fares Analyzed', value: summary.totalRecords, icon: <DollarSign className="h-4.5 w-4.5 text-primary" />, color: 'text-primary bg-primary/10' },
    { label: 'Matched Fares (No Variance)', value: summary.matchedRecords, icon: <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Variance Mismatch Alerts', value: summary.varianceRecords, icon: <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />, color: 'text-rose-600 bg-rose-50' },
    { label: 'Total Discrepancy Amount', value: `₹${summary.varianceAmount.toLocaleString('en-IN')}`, icon: <ShieldAlert className="h-4.5 w-4.5 text-rose-500" />, color: 'text-rose-700 bg-rose-50' }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Variance Reconciliation Analyzer"
        description="Verify upfront ride estimates against final payment capture collections, active refunds, and payout balances."
        actions={
          <div className="flex gap-2">
            <Button
              onClick={() => navigate('/financial-operations/transactions')}
              className="btn-secondary flex items-center gap-2 text-xs font-semibold h-9 rounded-lg"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Ledger
            </Button>
            <Button
              onClick={handleExport}
              className="gap-1.5 text-xs font-semibold h-9 rounded-lg bg-primary hover:bg-primary/95 text-white"
            >
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {kpis.map((k, idx) => (
            <Card key={idx} className="premium-card">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">{k.label}</span>
                  <span className={`p-1 rounded ${k.color}`}>{k.icon}</span>
                </div>
                <p className="text-xl font-black text-slate-850 dark:text-white tracking-tight">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-3">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-350 cursor-pointer">
              <input
                type="checkbox"
                checked={varianceOnly}
                onChange={e => setVarianceOnly(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
              />
              Show Variance Mismatches Only
            </label>
          </div>
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
                placeholder="Search Txn ID, Ride ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={records}
          isLoading={isLoading}
          isError={isError}
          selectable={false}
        />
      </div>
    </PageWrapper>
  )
}

export default TransactionReconciliationPage
