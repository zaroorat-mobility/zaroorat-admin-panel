import React, { useState, useEffect } from 'react'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { DataTable } from '@/shared/components/DataTable'
import { Users, ToggleLeft, ToggleRight, Sparkles, MapPin, DollarSign, Activity } from 'lucide-react'

interface CarpoolMatch {
  id: string
  route: string
  driverName: string
  rider1: string
  rider2: string
  savingsGained: string
  status: 'routing' | 'matched' | 'completed' | 'abandoned'
  lastUpdate: string
}

export const CarpoolingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'matching' | 'gender' | 'pricing' | 'monitoring'>('matching')
  
  // Matching Config State
  const [detourLimit, setDetourLimit] = useState<number>(20) // Detour detour percentage
  const [matchingRadius, setMatchingRadius] = useState<number>(2.5) // Distance in km
  const [delayThreshold, setDelayThreshold] = useState<number>(10) // Delay in mins
  const [autoMatch, setAutoMatch] = useState(true)

  // Gender Settings State
  const [restrictSameGender, setRestrictSameGender] = useState(false)
  const [preferSameGender, setPreferSameGender] = useState(true)
  const [strictFemaleOnly, setStrictFemaleOnly] = useState(true)

  // Pricing Modifiers State
  const [secondaryRiderDiscount, setSecondaryRiderDiscount] = useState<number>(30) // percentage
  const [baseChargeMultiplier, setBaseChargeMultiplier] = useState<number>(1.2) // multiplier
  const [surgeActive, setSurgeActive] = useState(true)

  // Live monitor state
  const [livePools, setLivePools] = useState<CarpoolMatch[]>([
    { id: 'POOL-901', route: 'Koramangala 4th Block to Tech Park, Whitefield', driverName: 'Rajesh Kumar', rider1: 'Alok Singh (M)', rider2: 'Rohan Shah (M)', savingsGained: '28% GTV saved', status: 'matched', lastUpdate: 'Just now' },
    { id: 'POOL-902', route: 'Indiranagar Metro to HSR Layout Ring Road', driverName: 'Shreya Iyer', rider1: 'Meera Rao (F)', rider2: 'Pooja Hegde (F)', savingsGained: '32% GTV saved', status: 'routing', lastUpdate: '2 mins ago' },
    { id: 'POOL-903', route: 'MG Road Hangar to Electronic City Ph 1', driverName: 'Sunil Verma', rider1: 'Vikram Pal (M)', rider2: 'Sanjay Dutt (M)', savingsGained: '25% GTV saved', status: 'completed', lastUpdate: '10 mins ago' }
  ])

  // Periodic Telemetry Simulator
  useEffect(() => {
    const timer = setInterval(() => {
      setLivePools(prev => {
        // randomly update status
        return prev.map(p => {
          if (p.id === 'POOL-902' && Math.random() > 0.6) {
            return {
              ...p,
              status: 'matched',
              lastUpdate: 'Just now'
            }
          }
          if (p.id === 'POOL-901' && Math.random() > 0.7) {
            return {
              ...p,
              status: 'completed',
              lastUpdate: 'Just now'
            }
          }
          return p
        })
      })
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  const columns = [
    {
      key: 'id',
      label: 'Pool ID',
      render: (val: string) => <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{val}</span>
    },
    {
      key: 'route',
      label: 'Ride Detour Route Path',
      render: (val: string) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-850 dark:text-slate-200">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate max-w-[280px] font-semibold">{val}</span>
        </div>
      )
    },
    {
      key: 'driverName',
      label: 'Assigned Driver',
      render: (val: string) => (
        <span className="font-semibold text-slate-700 dark:text-slate-350">{val}</span>
      )
    },
    {
      key: 'rider1',
      label: 'Matched Riders',
      render: (_, row: CarpoolMatch) => (
        <div className="text-[10px] space-y-0.5 text-slate-650 leading-relaxed font-semibold">
          <p className="flex items-center gap-1"><Users className="h-3 w-3 text-slate-400" /> Rider A: {row.rider1}</p>
          <p className="flex items-center gap-1"><Users className="h-3 w-3 text-slate-400" /> Rider B: {row.rider2}</p>
        </div>
      )
    },
    {
      key: 'savingsGained',
      label: 'Eff. Pool Discount',
      render: (val: string) => <span className="font-mono text-emerald-600 font-bold">{val}</span>
    },
    {
      key: 'status',
      label: 'Pool Match Status',
      render: (val: string) => {
        let style = 'bg-slate-50 text-slate-500 border-slate-100'
        if (val === 'matched') style = 'bg-emerald-50 text-emerald-700 border-emerald-100 animate-pulse'
        if (val === 'routing') style = 'bg-indigo-50 text-indigo-700 border-indigo-100'
        if (val === 'completed') style = 'bg-blue-50 text-blue-700 border-blue-100'
        return (
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] border font-black uppercase tracking-wider ${style}`}>
            {val}
          </span>
        )
      }
    },
    {
      key: 'lastUpdate',
      label: 'Last Ping',
      render: (val: string) => <span className="text-[9px] text-slate-400 font-mono">{val}</span>
    }
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Carpooling Configuration panel"
        description="Configure ride detour guidelines, gender matching preferences, pool discount multipliers, and monitor real-time carpools."
      />

      <div className="space-y-6 text-left">
        {/* Tab Selection */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('matching')}
            className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeTab === 'matching'
                ? 'border-[#2B317A] text-[#2B317A] dark:border-[#4F5FBF] dark:text-[#4F5FBF]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Matching Rules
          </button>
          <button
            onClick={() => setActiveTab('gender')}
            className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeTab === 'gender'
                ? 'border-[#2B317A] text-[#2B317A] dark:border-[#4F5FBF] dark:text-[#4F5FBF]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Gender Matching
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeTab === 'pricing'
                ? 'border-[#2B317A] text-[#2B317A] dark:border-[#4F5FBF] dark:text-[#4F5FBF]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Pricing Modifiers
          </button>
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeTab === 'monitoring'
                ? 'border-[#2B317A] text-[#2B317A] dark:border-[#4F5FBF] dark:text-[#4F5FBF]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Live Monitor Feed
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'matching' && (
          <div className="max-w-md space-y-6 animate-fade-in">
            <Card className="premium-card">
              <CardContent className="p-6 space-y-5 text-xs">
                <div className="border-b pb-3 mb-2 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Matching Algorithmic Parameters</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Control distance windows, detour ratios, and matchmaking intervals.</p>
                  </div>
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold text-[10px] uppercase text-slate-450 tracking-wider">
                      <span>Max Detour Percentage Limit</span>
                      <span className="text-primary">{detourLimit}% extra distance</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={50}
                      step={5}
                      value={detourLimit}
                      onChange={e => setDetourLimit(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#2B317A]"
                    />
                    <p className="text-[9px] text-slate-400 leading-normal">Detour path distance added for matching rider B cannot exceed B's direct route by this ratio.</p>
                  </div>

                  <div className="space-y-1.5 border-t border-border pt-3">
                    <div className="flex justify-between font-bold text-[10px] uppercase text-slate-450 tracking-wider">
                      <span>Matching Pickup Radius</span>
                      <span className="text-primary">{matchingRadius} km</span>
                    </div>
                    <input
                      type="range"
                      min={1.0}
                      max={5.0}
                      step={0.5}
                      value={matchingRadius}
                      onChange={e => setMatchingRadius(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#2B317A]"
                    />
                    <p className="text-[9px] text-slate-400 leading-normal">Scanning boundary for compatible riders near the route path of driver.</p>
                  </div>

                  <div className="space-y-1.5 border-t border-border pt-3">
                    <div className="flex justify-between font-bold text-[10px] uppercase text-slate-450 tracking-wider">
                      <span>Max Delay Threshold</span>
                      <span className="text-primary">{delayThreshold} minutes</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={20}
                      step={1}
                      value={delayThreshold}
                      onChange={e => setDelayThreshold(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#2B317A]"
                    />
                    <p className="text-[9px] text-slate-400 leading-normal">Permitted added travel time for rider A due to rider B's pickup detour stop.</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">Auto-match Active</span>
                      <span className="text-[9px] text-slate-400">Match compatible requests automatically without dispatch manual prompts.</span>
                    </div>
                    <button 
                      onClick={() => setAutoMatch(!autoMatch)}
                      className="text-primary cursor-pointer"
                    >
                      {autoMatch ? <ToggleRight className="h-9 w-9" /> : <ToggleLeft className="h-9 w-9 text-slate-300" />}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'gender' && (
          <div className="max-w-md space-y-6 animate-fade-in">
            <Card className="premium-card">
              <CardContent className="p-6 space-y-5 text-xs">
                <div className="border-b pb-3 mb-2 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Gender-based Pool Allocations</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Restrict or prefer matching parameters based on rider profile gender.</p>
                  </div>
                  <Users className="h-5 w-5 text-primary" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">Restrict to Same Gender Only</span>
                      <span className="text-[9px] text-slate-400">Pool riders MUST have the same gender. Hard restriction logic.</span>
                    </div>
                    <button 
                      onClick={() => {
                        setRestrictSameGender(!restrictSameGender)
                        if(!restrictSameGender) setPreferSameGender(true)
                      }}
                      className="text-primary cursor-pointer"
                    >
                      {restrictSameGender ? <ToggleRight className="h-9 w-9" /> : <ToggleLeft className="h-9 w-9 text-slate-300" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">Prefer Same Gender Matches</span>
                      <span className="text-[9px] text-slate-400">Prioritize matching same-gender riders, fallback to mixed pools if timeout.</span>
                    </div>
                    <button 
                      disabled={restrictSameGender}
                      onClick={() => setPreferSameGender(!preferSameGender)}
                      className={`cursor-pointer ${restrictSameGender ? 'opacity-50 cursor-not-allowed' : 'text-primary'}`}
                    >
                      {preferSameGender || restrictSameGender ? <ToggleRight className="h-9 w-9" /> : <ToggleLeft className="h-9 w-9 text-slate-300" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">Strict Female-Only Pool Switch</span>
                      <span className="text-[9px] text-slate-400">Enable female passengers to opt-in for pools containing ONLY female riders and drivers.</span>
                    </div>
                    <button 
                      onClick={() => setStrictFemaleOnly(!strictFemaleOnly)}
                      className="text-primary cursor-pointer"
                    >
                      {strictFemaleOnly ? <ToggleRight className="h-9 w-9" /> : <ToggleLeft className="h-9 w-9 text-slate-300" />}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="max-w-md space-y-6 animate-fade-in">
            <Card className="premium-card">
              <CardContent className="p-6 space-y-5 text-xs">
                <div className="border-b pb-3 mb-2 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Pricing Modifier Rules</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Define discounts and fare modifiers to encourage pool bookings.</p>
                  </div>
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold text-[10px] uppercase text-slate-450 tracking-wider">
                      <span>Secondary Rider Discount Ratio</span>
                      <span className="text-primary">{secondaryRiderDiscount}% discount</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={50}
                      step={5}
                      value={secondaryRiderDiscount}
                      onChange={e => setSecondaryRiderDiscount(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#2B317A]"
                    />
                    <p className="text-[9px] text-slate-400 leading-normal">Fare reduction rate applied to the second customer matched in the pool route.</p>
                  </div>

                  <div className="space-y-1.5 border-t border-border pt-3">
                    <div className="flex justify-between font-bold text-[10px] uppercase text-slate-450 tracking-wider">
                      <span>Driver Payout Multiplier</span>
                      <span className="text-primary">{baseChargeMultiplier}x base rate</span>
                    </div>
                    <input
                      type="range"
                      min={1.0}
                      max={2.0}
                      step={0.1}
                      value={baseChargeMultiplier}
                      onChange={e => setBaseChargeMultiplier(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#2B317A]"
                    />
                    <p className="text-[9px] text-slate-400 leading-normal">Multiplier applied to standard driver payout to reward multi-passenger pool fulfillment.</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">Surge Discount Optimization</span>
                      <span className="text-[9px] text-slate-400">Dynamically adjust discounts during high peak-load hours automatically.</span>
                    </div>
                    <button 
                      onClick={() => setSurgeActive(!surgeActive)}
                      className="text-primary cursor-pointer"
                    >
                      {surgeActive ? <ToggleRight className="h-9 w-9" /> : <ToggleLeft className="h-9 w-9 text-slate-300" />}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Live Active Carpools Feed</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Real-time status updates from live matched pool vehicles on-trip.</p>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" /> Live Telemetry Simulator Active
              </span>
            </div>

            <DataTable
              columns={columns}
              data={livePools}
              selectable={false}
              resultLabel="carpools"
            />
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
