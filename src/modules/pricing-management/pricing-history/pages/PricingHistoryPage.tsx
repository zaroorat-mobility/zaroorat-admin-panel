import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePricingHistory } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { Button } from '@/shared/components/ui/Button'
import { RefreshCw } from 'lucide-react'
import type { AuditLogEntry } from '@/shared/services/auditLogger'

export const PricingHistoryPage: React.FC = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data, isLoading, isError, refetch } = usePricingHistory({ search })
  const logs = data?.data || []

  const handleClearFilters = () => {
    setSearch('')
  }

  // Parse audit log action into structured columns
  const getModule = (action: string) => {
    if (action.includes('Surge')) return 'Surge Rule'
    if (action.includes('Cancellation')) return 'Cancellation Rule'
    return 'Fare Rule'
  }

  const getActionType = (action: string) => {
    if (action.includes('Created')) return 'Created'
    if (action.includes('Activated')) return 'Activated'
    if (action.includes('Deactivated')) return 'Deactivated'
    if (action.includes('Deleted')) return 'Deleted'
    return 'Updated'
  }

  const getEntityName = (action: string) => {
    const parts = action.split(': ')
    if (parts.length > 1) {
      return parts[1].split(' (')[0]
    }
    const toParts = action.split(' to ')
    if (toParts.length > 1) {
      return toParts[1].split(' (')[0]
    }
    return action
  }

  const columns: DataTableColumn<AuditLogEntry>[] = [
    {
      key: 'timestamp',
      label: 'Date',
      align: 'center',
      render: (val: string) => (
        <span className="font-mono text-[10px] text-slate-500">
          {new Date(val).toLocaleString('en-IN')}
        </span>
      )
    },
    {
      key: 'actor',
      label: 'Actor / Operator',
      align: 'left',
      render: (val: string) => <span className="font-semibold text-slate-800 dark:text-slate-200">{val}</span>
    },
    {
      key: 'module',
      label: 'Module',
      align: 'center',
      render: (_, row) => {
        const mod = getModule(row.action)
        return (
          <span className={`px-2 py-0.5 rounded font-black text-[9px] border tracking-wider ${
            mod === 'Fare Rule'
              ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-450'
              : mod === 'Surge Rule'
              ? 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
              : 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450'
          }`}>
            {mod.toUpperCase()}
          </span>
        )
      }
    },
    {
      key: 'action',
      label: 'Action',
      align: 'center',
      render: (_, row) => {
        const act = getActionType(row.action)
        return (
          <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
            act === 'Created'
              ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20'
              : act === 'Deleted'
              ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/20'
              : act === 'Activated'
              ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20'
              : 'text-amber-600 bg-amber-50 dark:bg-amber-950/20'
          }`}>
            {act}
          </span>
        )
      }
    },
    {
      key: 'entityName',
      label: 'Entity Name',
      align: 'left',
      render: (_, row) => (
        <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
          {getEntityName(row.action)}
        </span>
      )
    },
    {
      key: 'notes',
      label: 'Notes',
      align: 'left',
      render: (val?: string) => (
        <span className="text-slate-500 font-medium font-mono text-[10px] break-all max-w-[250px] line-clamp-2">
          {val || '—'}
        </span>
      )
    }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Pricing Audit History"
        description="Chronological audit records tracking tariff formula creations, active surge shifts, and cancel penalties."
        onBack={() => navigate('/pricing-management')}
        actions={
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="gap-2 text-xs font-semibold h-9 rounded-lg border-border"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh list</span>
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Search Panel */}
        <Card className="premium-card text-left">
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div className="sm:col-span-3 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Search pricing logs</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Keyword, Actor, vehicle..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="text-xs h-[34px] rounded-lg border-border self-end w-full sm:w-auto"
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>

        {/* List table */}
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

export default PricingHistoryPage
