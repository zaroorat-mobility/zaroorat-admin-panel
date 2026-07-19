import React from 'react'
import type { TransactionStatus } from '../types'

interface Props { status: TransactionStatus }

export const TransactionStatusBadge: React.FC<Props> = ({ status }) => {
  const styles: Record<TransactionStatus, string> = {
    initiated: 'bg-slate-50 text-slate-600 border-slate-200',
    processing: 'bg-indigo-50 text-indigo-700 border-indigo-100 animate-pulse',
    captured: 'bg-emerald-50 text-emerald-700 border-emerald-100 font-bold',
    failed: 'bg-rose-50 text-rose-700 border-rose-100 font-bold',
    partially_refunded: 'bg-amber-50 text-amber-700 border-amber-100',
    fully_refunded: 'bg-amber-100 text-amber-800 border-amber-200',
    reversed: 'bg-slate-100 text-slate-700 border-slate-300 font-semibold'
  }
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${styles[status]}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export default TransactionStatusBadge
