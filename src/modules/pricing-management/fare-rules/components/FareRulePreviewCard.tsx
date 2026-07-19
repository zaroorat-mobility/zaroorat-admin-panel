import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card'
import { Calculator, Info } from 'lucide-react'

interface FareRulePreviewCardProps {
  baseFare: number
  minimumFare: number
  perKmRate: number
  perMinuteRate: number
  nightEnabled: boolean
  nightChargePercentage: number
}

export const FareRulePreviewCard: React.FC<FareRulePreviewCardProps> = ({
  baseFare,
  minimumFare,
  perKmRate,
  perMinuteRate,
  nightEnabled,
  nightChargePercentage
}) => {
  const [distance, setDistance] = useState<number>(5)
  const [duration, setDuration] = useState<number>(15)
  const [isNightTrip, setIsNightTrip] = useState<boolean>(false)
  const [surge, setSurge] = useState<number>(1.0)

  // Calculations
  const calculatedFare = baseFare + (distance * perKmRate) + (duration * perMinuteRate)
  
  const withNightSurcharge = nightEnabled && isNightTrip
    ? calculatedFare * (1 + nightChargePercentage / 100)
    : calculatedFare

  const finalFareBeforeMin = withNightSurcharge * surge
  const finalFare = Math.max(finalFareBeforeMin, minimumFare * surge)
  const isMinFareApplied = finalFareBeforeMin < (minimumFare * surge)

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
        
        {/* Simulator controls */}
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Surge Multiplier</label>
            <input
              type="number"
              min="1.0"
              max="5.0"
              step="0.1"
              value={surge}
              onChange={(e) => setSurge(parseFloat(e.target.value) || 1.0)}
              className="w-full p-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
            />
          </div>

          <div className="flex flex-col justify-end space-y-1.5 pb-0.5 text-left">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Night Pricing</span>
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isNightTrip}
                disabled={!nightEnabled}
                onChange={(e) => setIsNightTrip(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-slate-50 dark:bg-slate-950 cursor-pointer"
              />
              <span className="text-xs text-slate-650 font-medium">Night trip hours</span>
            </label>
          </div>
        </div>

        {/* Estimate Output display */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-border mt-3 text-center space-y-3">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Estimated Ride Fare</span>
          <p className="text-3xl font-black text-slate-800 dark:text-white">
            ₹{finalFare.toFixed(2)}
          </p>

          <div className="border-t border-border pt-3 space-y-1.5 text-[10px] text-slate-550 dark:text-slate-400 text-left font-medium">
            <div className="flex justify-between">
              <span>Base Tariff:</span>
              <span>₹{baseFare.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Distance Charge ({distance} km × ₹{perKmRate}):</span>
              <span>₹{(distance * perKmRate).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Duration Charge ({duration} mins × ₹{perMinuteRate}):</span>
              <span>₹{(duration * perMinuteRate).toFixed(2)}</span>
            </div>
            {nightEnabled && isNightTrip && (
              <div className="flex justify-between text-amber-600 dark:text-amber-400 font-semibold">
                <span>Night Surcharge (+{nightChargePercentage}%):</span>
                <span>+₹{(calculatedFare * (nightChargePercentage / 100)).toFixed(2)}</span>
              </div>
            )}
            {surge > 1.0 && (
              <div className="flex justify-between text-rose-600 dark:text-rose-400 font-semibold">
                <span>Surge Multiplier ({surge}x):</span>
                <span>+₹{(finalFare - (finalFare / surge)).toFixed(2)}</span>
              </div>
            )}
            {isMinFareApplied && (
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-blue-950/20 p-1.5 rounded mt-2 border border-blue-100/30">
                <Info className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Base + km + duration estimate falls below Minimum Fare: ₹{(minimumFare * surge).toFixed(2)} applied.</span>
              </div>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
