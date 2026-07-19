import React from 'react'
import type { PaymentMethod } from '../types'
import { Smartphone, CreditCard, Wallet, Banknote } from 'lucide-react'

interface Props { method: PaymentMethod }

export const PaymentMethodBadge: React.FC<Props> = ({ method }) => {
  const styles: Record<PaymentMethod, { label: string; cls: string; icon: React.ReactNode }> = {
    upi: { label: 'UPI', cls: 'bg-violet-50 text-violet-700 border-violet-100', icon: <Smartphone className="h-3 w-3" /> },
    card: { label: 'Card', cls: 'bg-blue-50 text-blue-700 border-blue-100', icon: <CreditCard className="h-3 w-3" /> },
    wallet: { label: 'Wallet', cls: 'bg-amber-50 text-amber-700 border-amber-100', icon: <Wallet className="h-3 w-3" /> },
    cash: { label: 'Cash', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <Banknote className="h-3 w-3" /> }
  }

  const match = styles[method] || { label: method, cls: 'bg-slate-50 text-slate-700 border-slate-200', icon: null }

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${match.cls}`}>
      {match.icon}
      {match.label}
    </span>
  )
}

export default PaymentMethodBadge
