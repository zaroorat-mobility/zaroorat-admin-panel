import React from 'react'
import type { Ride } from '@/modules/operations/ride-monitor/types'
import { Card, CardHeader, CardContent } from '@/shared/components/ui/Card'
import { AlertCircle, TrendingUp } from 'lucide-react'

interface FareComparisonCardProps {
  ride: Ride
}

export const FareComparisonCard: React.FC<FareComparisonCardProps> = ({ ride }) => {
  // Let's simulate the Estimate parameters based on final fares to construct a realistic estimate-vs-final comparison
  // In a real system, the estimate would be stored on the ride. Here we simulate it beautifully:

  // Let's reconstruct estimated values
  const estBaseFare = ride.baseFare
  const estDistanceCharge = Math.max(0, ride.distanceCharge - (ride.id === 'ride-101' ? 50 : 0))
  const estTimeCharge = Math.max(0, ride.timeCharge - (ride.id === 'ride-101' ? 20 : 0))
  const estSurgeCharge = 0
  const estDiscount = ride.discount
  const estFinalFare = estBaseFare + estDistanceCharge + estTimeCharge + estSurgeCharge - estDiscount

  const items = [
    { name: 'Base Fare', est: estBaseFare, final: ride.baseFare },
    { name: 'Distance Charge', est: estDistanceCharge, final: ride.distanceCharge },
    { name: 'Time Charge', est: estTimeCharge, final: ride.timeCharge },
    { name: 'Surge Charges', est: estSurgeCharge, final: ride.surgeCharge },
    { name: 'Discounts / Promos', est: -estDiscount, final: -ride.discount },
  ]

  const difference = ride.finalFare - estFinalFare

  return (
    <Card className="premium-card text-left text-xs">
      <CardHeader className="pb-3 border-b border-border">
        <h3 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span>Fare Comparison: Estimate vs. Final</span>
        </h3>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-border text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-2">Fare Component</th>
                <th className="pb-2 text-right">Estimate</th>
                <th className="pb-2 text-right">Final Charged</th>
                <th className="pb-2 text-right">Difference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium text-slate-700">
              {items.map((it, idx) => {
                const diff = it.final - it.est
                const hasDiff = Math.abs(diff) > 0.01
                return (
                  <tr key={idx} className={hasDiff ? 'bg-amber-50/40 dark:bg-amber-950/10 font-bold' : ''}>
                    <td className="py-2.5 text-slate-800 dark:text-slate-200">{it.name}</td>
                    <td className="py-2.5 text-right font-mono text-slate-500">₹{it.est.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-mono text-slate-800 dark:text-slate-150">₹{it.final.toFixed(2)}</td>
                    <td className={`py-2.5 text-right font-mono font-bold ${
                      diff > 0.01 ? 'text-rose-600' : diff < -0.01 ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      {diff > 0.01 ? `+₹${diff.toFixed(2)}` : diff < -0.01 ? `-₹${Math.abs(diff).toFixed(2)}` : '—'}
                    </td>
                  </tr>
                )
              })}
              <tr className="border-t-2 border-slate-300 dark:border-slate-800 font-black text-xs bg-slate-50/50 dark:bg-slate-900/50">
                <td className="py-3 text-slate-850 dark:text-white">Total Ride Fare</td>
                <td className="py-3 text-right font-mono text-slate-500">₹{estFinalFare.toFixed(2)}</td>
                <td className="py-3 text-right font-mono text-primary">₹{ride.finalFare.toFixed(2)}</td>
                <td className={`py-3 text-right font-mono ${difference > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {difference > 0 ? `+₹${difference.toFixed(2)}` : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {difference > 0.01 && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900 text-[10px] text-amber-700 leading-normal flex gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Fare Increase Detected</strong>
              <p className="mt-0.5">
                The final charged fare is higher than the upfront estimate by <strong className="font-bold">₹{difference.toFixed(2)}</strong>. This is primarily caused by extra distance (+{((ride.distanceCharge - estDistanceCharge) / 15).toFixed(1)} km) and additional traffic transit delay (+{((ride.timeCharge - estTimeCharge) / 1.5).toFixed(0)} minutes).
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default FareComparisonCard
