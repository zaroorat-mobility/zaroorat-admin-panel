import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePricingHistory } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import type { AuditLogEntry } from '@/shared/services/auditLogger'
import { ArrowLeft, RefreshCw, Search, History, Eye } from 'lucide-react'
import {
  AuditEventDetailsModal,
  classifyAuditModule,
  classifyAuditAction,
} from '../components/AuditEventDetailsModal'

export const PricingHistoryPage: React.FC = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)

  const { data, isLoading, refetch } = usePricingHistory({ search })
  const logs = useMemo(() => data?.data ?? [], [data?.data])

  const getModule = classifyAuditModule
  const getActionType = classifyAuditAction

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
      label: 'Date & Time',
      sortable: true,
      align: 'left',
      render: (_: unknown, log: AuditLogEntry) => (
        <span className="font-mono text-[11px] text-slate-500 whitespace-nowrap">
          {new Date(log.timestamp).toLocaleString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}
        </span>
      ),
    },
    {
      key: 'actor',
      label: 'Actor / Operator',
      sortable: true,
      align: 'left',
      render: (_: unknown, log: AuditLogEntry) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs whitespace-nowrap">
          {log.actor}
        </span>
      ),
    },
    {
      key: 'entityType',
      label: 'Module',
      align: 'center',
      render: (_: unknown, log: AuditLogEntry) => {
        const mod = getModule(log.action, log.notes)
        return (
          <span
            className={`px-2 py-0.5 rounded-full font-bold text-[10px] border whitespace-nowrap ${
              mod === 'Fare Rule'
                ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                : mod === 'Surge Rule'
                  ? 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                  : 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
            }`}
          >
            {mod}
          </span>
        )
      },
    },
    {
      key: 'action',
      label: 'Action',
      align: 'center',
      render: (_: unknown, log: AuditLogEntry) => {
        const act = getActionType(log.action, log.notes)
        return (
          <span
            className={`px-2 py-0.5 rounded-full font-bold text-[10.5px] whitespace-nowrap ${
              act === 'Created'
                ? 'text-emerald-700 bg-[#E8FAF0] dark:bg-emerald-950/20'
                : act === 'Deleted'
                  ? 'text-rose-700 bg-rose-50 dark:bg-rose-950/20'
                  : act === 'Activated'
                    ? 'text-[#1F2B6D] bg-indigo-50 dark:bg-indigo-950/20'
                    : 'text-amber-700 bg-amber-50 dark:bg-amber-950/20'
            }`}
          >
            {act}
          </span>
        )
      },
    },
    {
      key: 'entityId',
      label: 'Target Entity',
      align: 'left',
      render: (_: unknown, log: AuditLogEntry) => (
        <span className="font-bold text-slate-800 dark:text-white text-xs">
          {getEntityName(log.action)}
        </span>
      ),
    },
    {
      key: 'notes',
      label: 'Change Details / Notes',
      align: 'left',
      render: (_: unknown, log: AuditLogEntry) => (
        <span className="text-slate-600 dark:text-slate-400 text-xs">
          {log.notes || '—'}
        </span>
      ),
    },
    {
      key: 'inspect',
      label: 'Details',
      align: 'center',
      render: (_: unknown, log: AuditLogEntry) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedLog(log)
          }}
          title="View Full Audit Details"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-[#1F2B6D] hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View</span>
        </button>
      ),
    },
  ]

  return (
    <PageWrapper className="space-y-4 pt-1 pb-6 px-3 sm:px-5 w-full max-w-full overflow-x-hidden">
      {/* ─── 1. Header (Geographic Management Tokens) ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/pricing-management')}
            title="Back to Pricing Control Center"
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#1F2B6D] dark:text-white" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2B6D] dark:text-white">
              Pricing Audit History
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Chronological audit trail tracking tariff formulas, surge shifts, and cancellation penalties.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            title="Refresh logs"
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#1F2B6D]' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* ─── 2. Consistent DataTable Container ─────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col w-full min-w-0">
        {/* Table Header & Search Filter */}
        <div className="p-4 sm:px-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <History className="w-[18px] h-[18px] text-[#1F2B6D] dark:text-blue-400" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-[#1F2B6D] dark:text-white leading-tight truncate">
                AUDIT TRAIL EVENTS ({logs.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Every rate revision, surge activation, and cancellation modification with administrative attribution.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search keyword, actor, vehicle..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1F2B6D]/20 focus:border-[#1F2B6D] shadow-2xs"
            />
          </div>
        </div>

        <DataTable
          data={logs}
          columns={columns}
          compact={true}
          isLoading={isLoading}
          selectable={false}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          hideToolbar={true}
          className="border-0 shadow-none rounded-none bg-transparent"
          onRowClick={(log) => setSelectedLog(log)}
          resultLabel="audit records"
          pageSizeOptions={[5, 10, 25, 50]}
        />
      </div>

      <AuditEventDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </PageWrapper>
  )
}

export default PricingHistoryPage
