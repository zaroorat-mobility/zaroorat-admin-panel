import React from 'react'
import {
  AlertTriangle,
  Coins,
  Wallet,
  Car,
  User,
  Calendar,
  Hash,
  FileText,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react'
import type { SettlementFailureDto } from '../../api/governance.api'
import {
  PricingDetailsModal,
  DetailsKpiCard,
  DetailsSpecList,
  DetailsSpecRow,
} from '../../components/PricingDetailsModal'

interface SettlementFailureDetailsModalProps {
  failure: SettlementFailureDto | null
  recoverPending?: boolean
  onClose: () => void
  onRecover?: (failure: SettlementFailureDto) => void
  onWaive?: (failure: SettlementFailureDto) => void
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const SettlementFailureDetailsModal: React.FC<SettlementFailureDetailsModalProps> = ({
  failure,
  recoverPending = false,
  onClose,
  onRecover,
  onWaive,
}) => {
  if (!failure) return null

  const statusTone =
    failure.status === 'RECOVERED' ? 'emerald' : failure.status === 'WAIVED' ? 'amber' : 'rose'
  const shortfall = Math.max(0, failure.amount - failure.balanceAtAttempt)

  return (
    <PricingDetailsModal
      isOpen={Boolean(failure)}
      onClose={onClose}
      badge={<AlertTriangle className="w-4 h-4" />}
      title={`Settlement Failure · ${failure.kind.replace(/_/g, ' ')}`}
      subtitle="Atomic wallet debit failure and ledger reconciliation details stored in PostgreSQL."
      statusBadges={[{ label: failure.status, tone: statusTone }]}
      footerActions={
        failure.status === 'OPEN' ? (
          <>
            {onRecover && (
              <button
                type="button"
                disabled={recoverPending}
                onClick={() => {
                  onClose()
                  onRecover(failure)
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recover Atomically</span>
              </button>
            )}
            {onWaive && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onWaive(failure)
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Waive Failure</span>
              </button>
            )}
          </>
        ) : undefined
      }
    >
      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <DetailsKpiCard
          highlighted
          icon={<Coins className="w-3.5 h-3.5" />}
          label="Uncollected Amount"
          value={`₹${failure.amount.toFixed(2)}`}
          sublabel={failure.kind.replace(/_/g, ' ')}
        />
        <DetailsKpiCard
          icon={<Wallet className="w-3.5 h-3.5" />}
          label="Balance at Attempt"
          value={`₹${failure.balanceAtAttempt.toFixed(2)}`}
          sublabel="Driver wallet snapshot"
        />
        <DetailsKpiCard
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          label="Shortfall"
          value={`₹${shortfall.toFixed(2)}`}
          sublabel="Amount missing at debit"
        />
      </div>

      {/* Specifications */}
      <DetailsSpecList>
        <DetailsSpecRow
          icon={<Hash className="w-4 h-4" />}
          label="Failure Record ID"
          value={<span className="font-mono text-xs">{failure.id}</span>}
        />
        <DetailsSpecRow
          icon={<Car className="w-4 h-4" />}
          label="Ride ID"
          value={<span className="font-mono text-xs">{failure.rideId}</span>}
        />
        <DetailsSpecRow
          icon={<User className="w-4 h-4" />}
          label="Driver ID"
          value={<span className="font-mono text-xs">{failure.driverId}</span>}
        />
        <DetailsSpecRow
          icon={<Calendar className="w-4 h-4" />}
          label="Recorded At"
          value={<span className="font-mono">{formatDateTime(failure.createdAt)}</span>}
        />
        {failure.recoveryWalletTxnId && (
          <DetailsSpecRow
            icon={<Hash className="w-4 h-4" />}
            label="Recovery Wallet Txn ID"
            value={<span className="font-mono text-xs">{failure.recoveryWalletTxnId}</span>}
          />
        )}
        {failure.recoveryLedgerGroupId && (
          <DetailsSpecRow
            icon={<Hash className="w-4 h-4" />}
            label="Recovery Ledger Group ID"
            value={<span className="font-mono text-xs">{failure.recoveryLedgerGroupId}</span>}
          />
        )}
        {failure.waiverReason && (
          <DetailsSpecRow
            icon={<FileText className="w-4 h-4" />}
            label="Waiver Justification"
            value={failure.waiverReason}
          />
        )}
        {failure.resolvedAt && (
          <DetailsSpecRow
            icon={<Calendar className="w-4 h-4" />}
            label="Resolved At"
            value={
              <span className="font-mono">
                {formatDateTime(failure.resolvedAt)}
                {failure.resolvedBy ? ` (${failure.resolvedBy})` : ''}
              </span>
            }
          />
        )}
      </DetailsSpecList>
    </PricingDetailsModal>
  )
}

export default SettlementFailureDetailsModal
