import React, { useState } from 'react'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { Navigation, Save, ShieldCheck, MapPin } from 'lucide-react'

export const RouteOptimizationPage: React.FC = () => {
  const [maxRiders, setMaxRiders] = useState<number>(12)
  const [bufferTime, setBufferTime] = useState<number>(10)
  const [optimizeBy, setOptimizeBy] = useState<'distance' | 'time' | 'safety_zones'>('time')
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Route Optimization Settings"
        description="Configure route planning heuristics, pick/drop grouping constraints, and safety zone paths."
      />

      <div className="max-w-2xl text-left space-y-6">
        <form onSubmit={handleSave}>
          <Card className="premium-card">
            <CardContent className="p-6 space-y-4 text-xs">
              <div className="border-b pb-3 mb-2 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Optimization Heuristics</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Determine algorithmic parameters for school-trip dispatch grouping.</p>
                </div>
                <Navigation className="h-5 w-5 text-primary" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Max Students Per Cab / Vehicle</label>
                  <input
                    type="number"
                    value={maxRiders}
                    onChange={(e) => setMaxRiders(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Delay Buffer Window (Mins)</label>
                  <input
                    type="number"
                    value={bufferTime}
                    onChange={(e) => setBufferTime(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Primary Optimization Objective</label>
                <select
                  value={optimizeBy}
                  onChange={(e) => setOptimizeBy(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-primary focus:outline-none h-[34px]"
                >
                  <option value="time">Minimize Transit Duration</option>
                  <option value="distance">Shortest Route Distance</option>
                  <option value="safety_zones">Safety Corridors & Speed Zones (High Priority)</option>
                </select>
              </div>

              <div className="p-3.5 border border-indigo-100 bg-indigo-50/20 dark:bg-indigo-950/15 rounded-xl flex items-start gap-2.5 text-[10px] text-indigo-700 leading-relaxed font-semibold">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Geofencing is enabled. Routes will auto-alert control operators if a school cab diverges more than 150 meters from its optimized corridor paths.</span>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border">
                {isSaved ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                    <ShieldCheck className="h-4 w-4" /> Optimization params saved!
                  </span>
                ) : (
                  <span />
                )}
                <Button type="submit" className="gap-2 bg-primary text-white hover:bg-primary/95 text-xs font-semibold h-9 rounded-lg">
                  <Save className="h-4 w-4" /> Save Route Parameters
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </PageWrapper>
  )
}

export default RouteOptimizationPage
