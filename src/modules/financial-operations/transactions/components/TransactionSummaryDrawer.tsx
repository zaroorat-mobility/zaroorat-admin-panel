import React from 'react'
import type { Transaction } from '../types'
import { Drawer } from '@/shared/components/ui/Drawer'
import { Button } from '@/shared/components/ui/Button'
import { TransactionStatusBadge } from './TransactionStatusBadge'
import { PaymentMethodBadge } from './PaymentMethodBadge'
import { FileText, ArrowRight, DollarSign, Activity } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  txn: Transaction | null
  onViewDetails: (id: string) => void
}

export const TransactionSummaryDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  txn,
  onViewDetails
}) => {
  if (!txn) return null

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Transaction: ${txn.transactionId}`}
      size="sm"
      footer={
        <div className="flex gap-2 w-full justify-end">
          <Button variant="ghost" onClick={onClose} className="text-xs h-8">
            Dismiss
          </Button>
          <Button
            onClick={() => onViewDetails(txn.id)}
            className="bg-primary text-white text-xs h-8 flex items-center gap-1.5"
          >
            Investigate Ledger <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      }
    >
      <div className="space-y-5 text-xs text-left">
        {/* Status Strip */}
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-border">
          <span className="text-slate-455 font-bold uppercase">Status</span>
          <TransactionStatusBadge status={txn.status} />
        </div>

        {/* Ledger Details */}
        <div className="space-y-3">
          <h4 className="font-black text-slate-455 uppercase tracking-wider text-[10px] flex items-center gap-1">
            <FileText className="h-3.5 w-3.5 text-primary" /> Core Meta Details
          </h4>
          <div className="space-y-2.5 border-t border-border pt-2.5 font-medium">
            {[
              { label: 'Transaction Type', value: txn.type.replace(/_/g, ' ').toUpperCase() },
              { label: 'Source Origin', value: txn.source.replace(/_/g, ' ').toUpperCase() },
              { label: 'Linked Document ID', value: txn.entityId },
              { label: 'Gateway Reference', value: txn.gatewayReference || 'None' },
              { label: 'Payment Method', value: <PaymentMethodBadge method={txn.paymentMethod} /> },
              { label: 'Rider ID', value: txn.riderId || 'None' },
              { label: 'Driver ID', value: txn.driverId || 'None' }
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-slate-500">{label}:</span>
                <span className="text-slate-800 dark:text-white font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Reconciliation Summary */}
        <div className="space-y-3">
          <h4 className="font-black text-slate-455 uppercase tracking-wider text-[10px] flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Reconciliation
          </h4>
          <div className="space-y-2.5 border-t border-border pt-2.5 font-medium">
            {[
              { label: 'Ride Fare', value: `₹${txn.rideFare.toFixed(2)}` },
              { label: 'Amount Captured', value: `₹${txn.amountCaptured.toFixed(2)}` },
              { label: 'Refund Impact', value: `-₹${txn.refundAmount.toFixed(2)}` },
              { label: 'Settlement Impact', value: `₹${txn.settlementImpact.toFixed(2)}` }
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-slate-500">{label}:</span>
                <span className="text-slate-800 dark:text-white font-mono">{value}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 border-t border-dashed border-border font-bold">
              <span className="text-slate-800 dark:text-white">Variance Charge Difference:</span>
              <span className={`font-mono ${txn.variance !== 0 ? 'text-rose-600 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                ₹{txn.variance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Audit Stats */}
        {txn.gatewayResponseTimeMs && (
          <div className="space-y-3">
            <h4 className="font-black text-slate-455 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-indigo-500" /> Gateway Stats
            </h4>
            <div className="space-y-2.5 border-t border-border pt-2.5 font-medium">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Gateway Response Time:</span>
                <span className="text-slate-800 dark:text-white font-mono">{(txn.gatewayResponseTimeMs / 1000).toFixed(2)}s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Retry Attempts:</span>
                <span className="text-slate-850 dark:text-white font-mono">{txn.retryAttempts} attempts</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  )
}

export default TransactionSummaryDrawer
