import React from 'react'
import { History, User, Layers, Calendar, FileText, Hash, ShieldCheck } from 'lucide-react'
import type { AuditLogEntry } from '@/shared/services/auditLogger'
import {
  PricingDetailsModal,
  DetailsKpiCard,
  DetailsSpecList,
  DetailsSpecRow,
} from '../../components/PricingDetailsModal'

interface AuditEventDetailsModalProps {
  log: AuditLogEntry | null
  onClose: () => void
}

export function classifyAuditModule(action: string, notes?: string): string {
  const combined = `${notes ?? ''} ${action}`.toUpperCase()
  if (combined.includes('COMMISSION_COLLECTION_FAILURE') || combined.includes('SETTLEMENT')) {
    return 'Settlement'
  }
  if (combined.includes('GST_RECOVERY')) return 'GST Recovery'
  if (
    combined.includes('LEGAL_ENTITY') ||
    combined.includes('GST_REGISTRATION') ||
    combined.includes('CITY_SUPPLY')
  ) {
    return 'Legal / GSTIN'
  }
  if (combined.includes('TAX_CONFIG') || combined.includes('PASSENGER_RIDE_GST')) {
    return 'Tax / GST'
  }
  if (combined.includes('COMMISSION_CONFIG')) return 'Commission'
  if (combined.includes('SURGE')) return 'Surge Rule'
  if (combined.includes('CANCELLATION')) return 'Cancellation Rule'
  return 'Fare Rule'
}

export function classifyAuditAction(action: string, notes?: string): string {
  const combined = `${notes ?? ''} ${action}`.toUpperCase()
  if (combined.includes('RECOVER')) return 'Recovered'
  if (combined.includes('WAIVE')) return 'Waived'
  if (combined.includes('APPROV')) return 'Approved'
  if (combined.includes('CREAT')) return 'Created'
  if (combined.includes('DEACTIVAT')) return 'Deactivated'
  if (combined.includes('ACTIVAT')) return 'Activated'
  if (combined.includes('DELET')) return 'Deleted'
  return 'Updated'
}

export const AuditEventDetailsModal: React.FC<AuditEventDetailsModalProps> = ({
  log,
  onClose,
}) => {
  if (!log) return null

  const moduleName = classifyAuditModule(log.action, log.notes)
  const actionType = classifyAuditAction(log.action, log.notes)
  const actionTone =
    actionType === 'Created' || actionType === 'Recovered' || actionType === 'Approved'
      ? 'emerald'
      : actionType === 'Deleted'
        ? 'rose'
        : actionType === 'Activated'
          ? 'blue'
          : 'amber'

  const formattedTime = new Date(log.timestamp).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  return (
    <PricingDetailsModal
      isOpen={Boolean(log)}
      onClose={onClose}
      badge={<History className="w-4 h-4" />}
      title="Audit Event Details"
      subtitle="Immutable administrative audit trail record stored in PostgreSQL."
      statusBadges={[
        { label: moduleName, tone: 'blue' },
        { label: actionType, tone: actionTone },
      ]}
    >
      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <DetailsKpiCard
          mono={false}
          icon={<Layers className="w-3.5 h-3.5" />}
          label="Pricing Module"
          value={moduleName}
          sublabel="Affected subsystem"
        />
        <DetailsKpiCard
          mono={false}
          icon={<User className="w-3.5 h-3.5" />}
          label="Operator"
          value={log.actor || 'System Admin'}
          sublabel="Attributed admin"
        />
        <DetailsKpiCard
          highlighted
          mono={false}
          icon={<ShieldCheck className="w-3.5 h-3.5" />}
          label="Action Taken"
          value={actionType}
          sublabel="Recorded in audit ledger"
        />
      </div>

      {/* Detailed Specifications */}
      <DetailsSpecList>
        <DetailsSpecRow
          icon={<Calendar className="w-4 h-4" />}
          label="Event Timestamp"
          value={<span className="font-mono">{formattedTime}</span>}
        />
        <DetailsSpecRow
          icon={<Hash className="w-4 h-4" />}
          label="Audit Log ID"
          value={<span className="font-mono text-xs">{log.id}</span>}
        />
        {log.entityId && (
          <DetailsSpecRow
            icon={<Hash className="w-4 h-4" />}
            label="Target Entity ID"
            value={<span className="font-mono text-xs">{log.entityId}</span>}
          />
        )}
        <DetailsSpecRow
          icon={<FileText className="w-4 h-4" />}
          label="Metadata / Notes"
          value={<span className="font-mono font-semibold text-xs">{log.notes || '—'}</span>}
        />
      </DetailsSpecList>

      {/* Full Untruncated Change Summary */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1F2B6D] dark:text-blue-300">
          <FileText className="w-4 h-4" />
          <span>Full Change Summary</span>
        </div>
        <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed break-words">
          {log.action}
        </p>
      </div>
    </PricingDetailsModal>
  )
}

export default AuditEventDetailsModal
