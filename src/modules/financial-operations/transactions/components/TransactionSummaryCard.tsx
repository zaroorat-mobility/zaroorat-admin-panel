import React from 'react'
import type { Transaction } from '../types'
import { Card, CardHeader, CardContent } from '@/shared/components/ui/Card'
import { CreditCard, Tag, Globe, ArrowUpRight } from 'lucide-react'

interface Props { txn: Transaction }

export const TransactionSummaryCard: React.FC<Props> = ({ txn }) => {
  const rows = [
    { icon: Tag, label: 'Ledger Reference', value: txn.transactionId },
    { icon: Globe, label: 'Payment Gateway', value: txn.paymentGateway ? txn.paymentGateway.toUpperCase() : 'None' },
    { icon: CreditCard, label: 'Gateway Reference', value: txn.gatewayReference || 'N/A' },
    { icon: ArrowUpRight, label: 'Directional Movement', value: txn.direction ? txn.direction.toUpperCase() : 'N/A' }
  ]

  return (
    <Card className="premium-card text-left text-xs">
      <CardHeader className="pb-3 border-b border-border">
        <h3 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          <span>Gateway Details</span>
        </h3>
      </CardHeader>
      <CardContent className="p-4 space-y-3 font-medium">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 text-slate-455" />
              {label}:
            </span>
            <strong className="text-slate-800 dark:text-white font-mono text-[11px]">{value}</strong>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default TransactionSummaryCard
