import React from 'react'
import type { Transaction } from '../types'
import { CheckCircle, Clock, AlertTriangle, ArrowRightLeft } from 'lucide-react'

interface Props { txn: Transaction }

export const TransactionTimeline: React.FC<Props> = ({ txn }) => {
  const events = [
    { label: 'Transaction Initiated', timestamp: txn.createdAt, desc: 'API ledger request registered.', done: true, icon: <Clock className="h-4 w-4 text-blue-500" /> },
    { label: 'Payment Processing', timestamp: txn.createdAt, desc: 'Awaiting PG authorization.', done: txn.status !== 'initiated', icon: <Clock className="h-4 w-4 text-indigo-500" /> }
  ]

  if (txn.status === 'captured') {
    events.push({
      label: 'Payment Captured Successfully',
      timestamp: txn.completedAt || txn.createdAt,
      desc: `Gateway captured amount of ₹${txn.amountCaptured.toFixed(2)}.`,
      done: true,
      icon: <CheckCircle className="h-4 w-4 text-emerald-500" />
    })
  } else if (txn.status === 'failed') {
    events.push({
      label: 'Payment Failed',
      timestamp: txn.completedAt || txn.createdAt,
      desc: `Error ${txn.gatewayErrorCode || 'GATEWAY_ERROR'}: ${txn.gatewayErrorMessage || 'PG declined transaction.'}`,
      done: true,
      icon: <AlertTriangle className="h-4 w-4 text-rose-500" />
    })
  } else if (txn.status === 'fully_refunded' || txn.status === 'partially_refunded') {
    events.push({
      label: 'Payment Captured Successfully',
      timestamp: txn.createdAt,
      desc: `Gateway captured amount of ₹${txn.amountCaptured.toFixed(2)}.`,
      done: true,
      icon: <CheckCircle className="h-4 w-4 text-emerald-500" />
    })
    events.push({
      label: 'Refund Resolved',
      timestamp: txn.completedAt || txn.createdAt,
      desc: `Refund of ₹${txn.refundAmount.toFixed(2)} processed. Status changed to ${txn.status}.`,
      done: true,
      icon: <ArrowRightLeft className="h-4 w-4 text-amber-500" />
    })
  } else if (txn.status === 'reversed') {
    events.push({
      label: 'Payment Reversed',
      timestamp: txn.completedAt || txn.createdAt,
      desc: 'Transaction chargeback reversed to rider balance.',
      done: true,
      icon: <ArrowRightLeft className="h-4 w-4 text-slate-500" />
    })
  }

  return (
    <div className="relative pl-6 space-y-0 text-left text-xs">
      {events.map((ev, i) => (
        <div key={i} className="relative pb-6 last:pb-0">
          {i < events.length - 1 && (
            <span className="absolute left-[-15px] top-5 bottom-0 w-px bg-border" />
          )}
          <div className="absolute left-[-20px] top-0.5">
            {ev.icon}
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 border border-border">
            <div className="flex justify-between items-center">
              <p className="font-black text-slate-800 dark:text-white">{ev.label}</p>
              {ev.timestamp && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(ev.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{ev.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default TransactionTimeline
