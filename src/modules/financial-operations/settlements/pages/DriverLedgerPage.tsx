import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDriverLedger } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import {
  ArrowLeft, TrendingUp, TrendingDown, Wallet, BookOpen
} from 'lucide-react'
import type { LedgerEntryType, DriverLedgerEntry } from '../types'

const ledgerIcon = (type: LedgerEntryType) => {
  const positive = ['RIDE_EARNING', 'BONUS', 'INCENTIVE', 'ADJUSTMENT']
  return positive.includes(type)
    ? <TrendingUp className="h-4 w-4 text-emerald-500" />
    : <TrendingDown className="h-4 w-4 text-rose-500" />
}

const ledgerColor = (type: LedgerEntryType): string => {
  const map: Partial<Record<LedgerEntryType, string>> = {
    RIDE_EARNING: 'text-emerald-600',
    BONUS: 'text-emerald-600',
    INCENTIVE: 'text-emerald-600',
    PLATFORM_COMMISSION: 'text-rose-600',
    REFUND_DEDUCTION: 'text-orange-600',
    PENALTY: 'text-rose-600',
    SETTLEMENT_PAYOUT: 'text-indigo-600',
    ADJUSTMENT: 'text-blue-600',
  }
  return map[type] || 'text-slate-600'
}

const typeBadge = (type: LedgerEntryType) => {
  const map: Partial<Record<LedgerEntryType, string>> = {
    RIDE_EARNING: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    BONUS: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    INCENTIVE: 'bg-teal-50 text-teal-700 border-teal-100',
    PLATFORM_COMMISSION: 'bg-rose-50 text-rose-700 border-rose-100',
    REFUND_DEDUCTION: 'bg-orange-50 text-orange-700 border-orange-100',
    PENALTY: 'bg-red-50 text-red-700 border-red-100',
    SETTLEMENT_PAYOUT: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    ADJUSTMENT: 'bg-blue-50 text-blue-700 border-blue-100',
  }
  return `px-1.5 py-0.5 rounded text-[9px] font-black uppercase border tracking-wider ${map[type] || 'bg-slate-50 text-slate-500 border-slate-200'}`
}

export const DriverLedgerPage: React.FC = () => {
  const { driverId } = useParams<{ driverId: string }>()
  const navigate = useNavigate()

  const { data: entries = [], isLoading, isError } = useDriverLedger(driverId!)

  const currentBalance = entries[0]?.balance ?? 0
  const totalEarnings  = entries.filter(e => e.amount > 0).reduce((s, e) => s + e.amount, 0)
  const totalDeductions = entries.filter(e => e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0)
  const driverName = entries[0]?.driverName ?? driverId

  const kpis = [
    { label: 'Wallet Balance', value: `₹${currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: <Wallet className="h-4 w-4" />, color: 'text-primary bg-primary/10' },
    { label: 'Total Credits', value: `₹${totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: <TrendingUp className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Total Deductions', value: `₹${totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: <TrendingDown className="h-4 w-4" />, color: 'text-rose-600 bg-rose-50' },
  ]

  const columns: DataTableColumn<DriverLedgerEntry>[] = [
    {
      key: 'entryDate',
      label: 'Date',
      align: 'left',
      render: (val: string) => (
        <span className="font-mono text-slate-500">
          {new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    {
      key: 'type',
      label: 'Type',
      align: 'left',
      render: (val: LedgerEntryType) => (
        <div className="flex items-center gap-1.5">
          {ledgerIcon(val)}
          <span className={typeBadge(val)}>{val.replace(/_/g, ' ')}</span>
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      align: 'left',
      render: (val: string) => (
        <span className="text-slate-600 dark:text-slate-300 font-medium">{val}</span>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
      render: (val: number, row) => (
        <span className={`font-mono font-bold ${ledgerColor(row.type)}`}>
          {val >= 0 ? '+' : ''}₹{val.toFixed(2)}
        </span>
      )
    },
    {
      key: 'balance',
      label: 'Running Balance',
      align: 'right',
      render: (val: number) => (
        <strong className="font-mono text-slate-800 dark:text-white">₹{val.toFixed(2)}</strong>
      )
    }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title={`Driver Ledger — ${driverName}`}
        description={`Full earnings ledger, commissions, deductions, and settlement payouts for driver ${driverId}`}
        actions={
          <Button
            onClick={() => navigate('/financial-operations/settlements')}
            className="btn-secondary flex items-center gap-2 text-xs font-semibold"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        }
      />

      <div className="space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {kpis.map((k, idx) => (
            <Card key={idx} className="premium-card">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">{k.label}</span>
                  <span className={`p-1 rounded ${k.color}`}>{k.icon}</span>
                </div>
                <p className="text-xl font-black text-slate-850 dark:text-white tracking-tight">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ledger Table */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-left">
            <BookOpen className="h-4.5 w-4.5 text-primary" />
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Ledger Transactions</h3>
          </div>

          <DataTable
            columns={columns}
            data={entries}
            isLoading={isLoading}
            isError={isError}
            selectable={false}
          />
        </div>
      </div>
    </PageWrapper>
  )
}

export default DriverLedgerPage
