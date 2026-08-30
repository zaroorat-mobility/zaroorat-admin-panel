import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card'
import { Calculator, Info } from 'lucide-react'

interface FareRulePreviewCardProps {
  baseFare: number
  minimumFare: number
  perKmRate: number
  perMinuteRate: number
  freeWaitingMinutes: number
  waitingChargePerMinute: number
  bookingFee: number
  platformFeePct: number
  taxRatePct: number
  commissionRatePct: number
  nightEnabled: boolean
  nightChargePercentage: number
}

function money(value: number): number {
  return Math.round(value * 100) / 100
}

export const FareRulePreviewCard: React.FC<FareRulePreviewCardProps> = ({
  baseFare,
  minimumFare,
  perKmRate,
  perMinuteRate,
  freeWaitingMinutes,
  waitingChargePerMinute,
  bookingFee,
  platformFeePct,
  taxRatePct,
  commissionRatePct,
  nightEnabled,
  nightChargePercentage,
}) => {
  const [distance, setDistance] = useState<number>(5)
  const [duration, setDuration] = useState<number>(15)
  const [waitingMinutes, setWaitingMinutes] = useState<number>(0)
  const [isNightTrip, setIsNightTrip] = useState<boolean>(false)
  const [surge, setSurge] = useState<number>(1.0)

  const distanceFare = money(distance * perKmRate)
  const timeFare = money(duration * perMinuteRate)
  const billableWaiting = Math.max(0, waitingMinutes - freeWaitingMinutes)
  const waitingCharge = money(billableWaiting * waitingChargePerMinute)
  const rawSubtotal = baseFare + distanceFare + timeFare + waitingCharge + bookingFee

  const nightMultiplier = nightEnabled && isNightTrip ? 1 + nightChargePercentage / 100 : 1
  const nightAdjustment = money(rawSubtotal * (nightMultiplier - 1))
  const subtotalBeforeSurge = money(rawSubtotal + nightAdjustment)
  const surgeAmount = money(subtotalBeforeSurge * (surge - 1))
  const subtotal = money(subtotalBeforeSurge + surgeAmount)
  const taxAmount = money(subtotal * (taxRatePct / 100))
  const platformFee = money(subtotal * (platformFeePct / 100))
  const totalBeforeMin = money(subtotal + taxAmount + platformFee)
  const totalFare = Math.max(totalBeforeMin, minimumFare * surge)
  const platformCommission = money(totalFare * (commissionRatePct / 100))
  const driverEarning = money(totalFare - platformCommission)
  const isMinFareApplied = totalBeforeMin < minimumFare * surge

  return (
    <Card className="premium-card text-left border border-slate-200 dark:border-slate-800 shadow-lg">
      <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-200">
              Live Price Simulator
            </CardTitle>
            <CardDescription className="text-[10px] text-muted-foreground mt-0.5">
              Enter operational params to preview passenger billing estimates.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Distance (KM)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={distance}
              onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
              className="w-full p-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Duration (Mins)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              className="w-full p-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Waiting (Mins)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={waitingMinutes}
              onChange={(e) => setWaitingMinutes(parseInt(e.target.value) || 0)}
              className="w-full p-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Surge Multiplier</label>
            <input
              type="number"
              min="1"
              max="3"
              step="0.1"
              value={surge}
              onChange={(e) => setSurge(parseFloat(e.target.value) || 1)}
              className="w-full p-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isNightTrip}
            onChange={(e) => setIsNightTrip(e.target.checked)}
            disabled={!nightEnabled}
            className="rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-[10px] font-semibold text-slate-650 uppercase tracking-wider">Simulate Night Trip</span>
        </label>

        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 space-y-2 border border-border">
          <div className="flex justify-between"><span>Base Fare</span><span className="font-bold">₹{baseFare.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Distance ({distance} km)</span><span className="font-bold">₹{distanceFare.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Time ({duration} min)</span><span className="font-bold">₹{timeFare.toFixed(2)}</span></div>
          {waitingCharge > 0 && (
            <div className="flex justify-between"><span>Waiting ({billableWaiting} min billable)</span><span className="font-bold">₹{waitingCharge.toFixed(2)}</span></div>
          )}
          {bookingFee > 0 && (
            <div className="flex justify-between"><span>Booking Fee</span><span className="font-bold">₹{bookingFee.toFixed(2)}</span></div>
          )}
          {nightAdjustment > 0 && (
            <div className="flex justify-between text-amber-600"><span>Night Surcharge</span><span className="font-bold">+₹{nightAdjustment.toFixed(2)}</span></div>
          )}
          {surgeAmount > 0 && (
            <div className="flex justify-between text-rose-600"><span>Surge ({surge}x)</span><span className="font-bold">+₹{surgeAmount.toFixed(2)}</span></div>
          )}
          <div className="flex justify-between border-t border-border pt-2"><span>Subtotal</span><span className="font-bold">₹{subtotal.toFixed(2)}</span></div>
          {taxAmount > 0 && (
            <div className="flex justify-between"><span>Tax ({taxRatePct}%)</span><span className="font-bold">₹{taxAmount.toFixed(2)}</span></div>
          )}
          {platformFee > 0 && (
            <div className="flex justify-between"><span>Platform Fee ({platformFeePct}%)</span><span className="font-bold">₹{platformFee.toFixed(2)}</span></div>
          )}
          <div className="flex justify-between text-base font-black text-primary border-t border-border pt-2 mt-1">
            <span>Total Fare</span>
            <span>₹{totalFare.toFixed(2)}</span>
          </div>
          {isMinFareApplied && (
            <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
              <Info className="h-3 w-3" /> Minimum fare ₹{(minimumFare * surge).toFixed(2)} applied
            </p>
          )}
          <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
            <span>Driver earning ({commissionRatePct}% commission)</span>
            <span className="font-semibold">₹{driverEarning.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
