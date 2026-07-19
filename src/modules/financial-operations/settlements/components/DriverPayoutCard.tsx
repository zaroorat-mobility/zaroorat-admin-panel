import React from 'react'
import type { DriverSettlement } from '../types'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { User, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

interface Props {
  driver: DriverSettlement
  onViewLedger?: (driverId: string) => void
}

export const DriverPayoutCard: React.FC<Props> = ({ driver, onViewLedger }) => {
  const rows = [
    { label: 'Gross Earnings', amount: driver.grossEarnings, positive: true },
    { label: `Platform Commission (${driver.commissionPercent}%)`, amount: -driver.commissionAmount, positive: false },
    { label: 'Refund Adjustments', amount: -driver.refundAdjustments, positive: false },
    { label: 'Penalties', amount: -driver.penalties, positive: false },
    { label: 'Bonuses', amount: driver.bonuses, positive: true },
    { label: 'Incentives', amount: driver.incentives, positive: true },
  ]

  return (
    <Card className="premium-card text-left text-xs hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Driver Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-black text-slate-800 dark:text-white text-sm">{driver.driverName}</p>
              <p className="text-[10px] text-slate-450 font-mono">{driver.totalTrips} trips · ID: {driver.driverId}</p>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
            driver.status === 'paid'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : 'bg-amber-50 text-amber-700 border-amber-100'
          }`}>{driver.status}</span>
        </div>

        {/* Earnings Breakdown */}
        <div className="space-y-1.5 border-t border-border pt-3">
          {rows.map(row => (
            <div key={row.label} className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1">
                {row.positive
                  ? <TrendingUp className="h-3 w-3 text-emerald-400" />
                  : <TrendingDown className="h-3 w-3 text-rose-400" />
                }
                {row.label}
              </span>
              <span className={`font-mono font-bold ${row.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {row.positive ? '+' : '-'}₹{Math.abs(row.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Net Payable */}
        <div className="border-t-2 border-border pt-2 flex justify-between items-center">
          <span className="font-black text-slate-800 dark:text-white flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-primary" />
            Net Payable
          </span>
          <strong className="font-mono text-primary text-sm font-black">₹{driver.netPayable.toFixed(2)}</strong>
        </div>

        {onViewLedger && (
          <button
            onClick={() => onViewLedger(driver.driverId)}
            className="w-full text-center text-[10px] font-bold text-primary hover:underline pt-1"
          >
            View Full Ledger →
          </button>
        )}
      </CardContent>
    </Card>
  )
}

export default DriverPayoutCard
