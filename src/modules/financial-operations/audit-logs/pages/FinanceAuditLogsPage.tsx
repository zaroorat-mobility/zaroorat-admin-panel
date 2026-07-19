import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinanceAuditLogs } from '../../transactions/hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { Button } from '@/shared/components/ui/Button'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import type { FinanceAuditLog } from '../../transactions/types'

export const FinanceAuditLogsPage: React.FC = () => {
  const navigate = useNavigate()
  const [moduleFilter, setModuleFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [search, setSearch] = useState('')

  // Query logs
  const { data: res, isLoading, isError } = useFinanceAuditLogs({
    module: moduleFilter,
    severity: severityFilter,
    search
  })
  const logs = res?.data || []

  // Direct entity deep links navigator
  const handleEntityClick = (type: string, id: string) => {
    if (type === 'ride') {
      navigate(`/operations/ride-monitor/${id}`)
    } else if (type === 'refund') {
      navigate(`/financial-operations/refunds`)
    } else if (type === 'dispute') {
      navigate(`/financial-operations/disputes`)
    } else if (type === 'settlement') {
      navigate(`/financial-operations/settlements`)
    } else if (type === 'adjustment') {
      navigate(`/financial-operations/transactions`)
    }
  }

  const columns: DataTableColumn<FinanceAuditLog>[] = [
    {
      key: 'createdAt',
      label: 'Date & Time',
      align: 'left',
      render: (val: string) => (
        <span className="font-mono text-slate-500 text-xs">
          {new Date(val).toLocaleString('en-IN')}
        </span>
      )
    },
    {
      key: 'correlationId',
      label: 'Correlation ID',
      align: 'left',
      render: (val: string) => <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{val}</span>
    },
    {
      key: 'user',
      label: 'User Account',
      align: 'left',
      render: (val: string, row) => (
        <div className="text-xs">
          <span className="font-bold text-slate-800 dark:text-white block">{val}</span>
          <span className="text-[10px] text-slate-400 block font-mono">IP: {row.ipAddress}</span>
        </div>
      )
    },
    {
      key: 'action',
      label: 'Compliance Action',
      align: 'left',
      render: (val: string) => (
        <span className="font-mono text-[10px] font-black text-slate-850 dark:text-slate-100 uppercase tracking-wide">
          {val.replace(/_/g, ' ')}
        </span>
      )
    },
    {
      key: 'module',
      label: 'Finance Module',
      align: 'center',
      render: (val: string) => (
        <span className="uppercase text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-dark-700 text-slate-650">
          {val}
        </span>
      )
    },
    {
      key: 'entityId',
      label: 'Linked Entity',
      align: 'left',
      render: (val: string, row) => (
        <button
          onClick={() => handleEntityClick(row.entityType, val)}
          className="text-primary hover:underline font-mono font-bold text-[11px] inline-flex items-center gap-0.5"
        >
          {val} <ArrowUpRight className="h-3 w-3" />
        </button>
      )
    },
    {
      key: 'oldValue',
      label: 'Compliance Diff State',
      align: 'left',
      render: (_, row) => {
        if (!row.oldValue && !row.newValue) return <span className="text-slate-400 font-mono">—</span>
        return (
          <div className="text-[9px] font-mono p-1 bg-slate-50 dark:bg-slate-850 rounded border border-border space-y-0.5">
            {row.oldValue && <span className="text-rose-600 block">-{row.oldValue}</span>}
            {row.newValue && <span className="text-emerald-600 block">+{row.newValue}</span>}
          </div>
        )
      }
    },
    {
      key: 'severity',
      label: 'Severity',
      align: 'center',
      render: (val: string) => {
        const style = val === 'critical' ? 'bg-rose-50 text-rose-700 border-rose-100 font-bold' : val === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-blue-50 text-blue-700 border-blue-100'
        return (
          <span className={`px-1.5 py-0.5 rounded text-[8px] border uppercase font-black tracking-wider ${style}`}>
            {val}
          </span>
        )
      }
    },
    {
      key: 'notes',
      label: 'Audit Notes',
      align: 'left',
      render: (val?: string) => <span className="text-slate-500 leading-relaxed max-w-xs block font-medium">{val || '—'}</span>
    }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Finance Audit Trail Logs"
        description="Reconcile and query all compliance-tracked financial activities, operator overrides, IP addresses, and correlation reference codes."
        actions={
          <Button
            onClick={() => navigate('/financial-operations')}
            className="btn-secondary flex items-center gap-2 text-xs font-semibold h-9 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard Home
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-3 text-left">
          <div className="flex items-center gap-2">
            <select
              value={moduleFilter}
              onChange={e => setModuleFilter(e.target.value)}
              className="px-2 py-1.5 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-primary h-[34px] font-semibold text-slate-650"
            >
              <option value="all">All Modules</option>
              <option value="transactions">Transactions</option>
              <option value="disputes">Disputes</option>
              <option value="refunds">Refunds</option>
              <option value="settlements">Settlements</option>
              <option value="dashboard">Dashboard</option>
            </select>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="px-2 py-1.5 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-primary h-[34px] font-semibold text-slate-650"
            >
              <option value="all">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              placeholder="Search Action, User, Corr ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
            />
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={logs}
          isLoading={isLoading}
          isError={isError}
          selectable={false}
        />
      </div>
    </PageWrapper>
  )
}

export default FinanceAuditLogsPage
