import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuditLogs } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { Button } from '@/shared/components/ui/Button'
import { Search, RefreshCw } from 'lucide-react'
import type { AuditLogItem } from '../types'
import { cn } from '@/shared/utils'

export const AuditLogPage: React.FC = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [entityType, setEntityType] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data, isLoading, isError, refetch } = useAuditLogs({
    search,
    entityType,
    startDate,
    endDate
  })

  const logs = data?.data || []

  const handleClearFilters = () => {
    setSearch('')
    setEntityType('all')
    setStartDate('')
    setEndDate('')
  }

  const columns: DataTableColumn<AuditLogItem>[] = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      align: 'center',
      render: (val: string) => (
        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
          {new Date(val).toLocaleString('en-IN')}
        </span>
      )
    },
    {
      key: 'actor',
      label: 'Operator / System',
      align: 'left',
      render: (val: string) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {val}
        </span>
      )
    },
    {
      key: 'action',
      label: 'Action Category',
      align: 'left',
      render: (val: string, row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-700 dark:text-slate-350">{val}</span>
          {row.entityType && (
            <span className={cn(
              "self-start text-[8px] uppercase tracking-wider font-extrabold px-1 py-0.5 rounded border mt-0.5",
              row.entityType === 'driver' && "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450",
              row.entityType === 'rider' && "bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-450",
              row.entityType === 'vehicle' && "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-450",
              row.entityType === 'fare_config' && "bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450",
              row.entityType === 'sos' && "bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450",
              row.entityType === 'payment' && "bg-purple-50 border-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-450"
            )}>
              {row.entityType}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'entityId',
      label: 'Target Reference',
      align: 'center',
      render: (val: string, row) => {
        if (!val) return <span className="text-slate-400">—</span>

        const handleNavigate = () => {
          if (row.entityType === 'driver') {
            navigate(`/driver-management/drivers/${val}`)
          } else if (row.entityType === 'rider') {
            navigate(`/riders/${val}`)
          } else if (row.entityType === 'vehicle') {
            navigate(`/driver-management/vehicles`)
          }
        }

        const isLinkable = ['driver', 'rider', 'vehicle'].includes(row.entityType || '')

        return (
          <button
            onClick={isLinkable ? handleNavigate : undefined}
            disabled={!isLinkable}
            className={cn(
              "font-mono text-xs",
              isLinkable 
                ? "text-primary hover:underline font-bold cursor-pointer" 
                : "text-slate-600 dark:text-slate-400 font-semibold"
            )}
          >
            {val}
          </button>
        )
      }
    },
    {
      key: 'notes',
      label: 'Action Remarks / Audit Notes',
      align: 'left',
      render: (val: string) => (
        <span className="text-slate-500 font-medium break-words">
          {val || '—'}
        </span>
      )
    }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Audit Logs Registry"
        description="Append-only log viewer recording sensitive admin actions, configurations changes, and compliance updates."
        actions={
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="gap-2 text-xs font-semibold h-9 rounded-lg border-border"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reload Logs</span>
          </Button>
        }
      />

      <div className="space-y-6">
        
        {/* Filters Panel */}
        <Card className="premium-card">
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Search Logs</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Keyword, Actor, ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
              >
                <option value="all">All Logs</option>
                <option value="driver">Driver Ops</option>
                <option value="rider">Rider Ops</option>
                <option value="vehicle">Vehicle Docs</option>
                <option value="fare_config">Fare Config</option>
                <option value="sos">SOS Events</option>
                <option value="payment">Payments</option>
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
              />
            </div>

            <div className="space-y-1.5 text-left flex gap-2">
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="text-xs h-[34px] rounded-lg border-border self-end"
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log Table */}
        <DataTable
          columns={columns}
          data={logs}
          isLoading={isLoading}
          isError={isError}
          selectable={false}
          searchPlaceholder=""
        />

      </div>
    </PageWrapper>
  )
}

export default AuditLogPage
