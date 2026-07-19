import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGenerateSettlement, useSearchDrivers, useDriverBreakdown } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardHeader, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import {
  ArrowLeft, Calculator, Users, TrendingDown, TrendingUp,
  DollarSign, CheckCircle2, Search, Trash2
} from 'lucide-react'
import type { DriverSettlement } from '../types'

const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const SettlementRunPage: React.FC = () => {
  const navigate = useNavigate()
  const generate = useGenerateSettlement()

  const today = new Date().toISOString().split('T')[0]
  const fifteenDaysAgo = new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0]

  const [periodStart, setPeriodStart] = useState(fifteenDaysAgo)
  const [periodEnd, setPeriodEnd] = useState(today)

  // Driver search states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([])
  const [driverMap, setDriverMap] = useState<Record<string, DriverSettlement>>({})
  const [success, setSuccess] = useState(false)

  // Search hook
  const { data: searchResults = [] } = useSearchDrivers(searchQuery)

  const handleSelectDriver = (driverId: string) => {
    if (!selectedDriverIds.includes(driverId)) {
      setSelectedDriverIds(prev => [...prev, driverId])
    }
    setSearchQuery('')
  }

  const handleRemoveDriver = (driverId: string) => {
    setSelectedDriverIds(prev => prev.filter(id => id !== driverId))
    setDriverMap(prev => {
      const updated = { ...prev }
      delete updated[driverId]
      return updated
    })
  }

  const handleCalculated = (driverId: string, breakdown: DriverSettlement) => {
    setDriverMap(prev => {
      if (prev[driverId]?.netPayable === breakdown.netPayable) return prev
      return { ...prev, [driverId]: breakdown }
    })
  }

  const selectedDriversData = selectedDriverIds.map(id => driverMap[id]).filter(Boolean)

  const totals = selectedDriversData.reduce(
    (acc, d) => ({
      gross: acc.gross + d.grossEarnings,
      commission: acc.commission + d.commissionAmount,
      refund: acc.refund + d.refundAdjustments,
      penalties: acc.penalties + d.penalties,
      bonuses: acc.bonuses + d.bonuses + d.incentives,
      net: acc.net + d.netPayable
    }),
    { gross: 0, commission: 0, refund: 0, penalties: 0, bonuses: 0, net: 0 }
  )

  const handleGenerate = async () => {
    if (selectedDriversData.length === 0) return
    await generate.mutateAsync({
      periodStart,
      periodEnd,
      generatedBy: 'Finance Manager',
      drivers: selectedDriversData
    })
    setSuccess(true)
  }

  if (success) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-emerald-500" />
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">Settlement Run Successful!</h2>
          <p className="text-slate-500 text-sm">
            The batch with <strong>{selectedDriversData.length} drivers</strong> has been created with <strong>Draft</strong> status.
          </p>
          <Button onClick={() => navigate('/financial-operations/settlements')} className="mt-4 bg-primary text-white">
            View Settlements Batch List
          </Button>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Generate Settlement Run"
        description="Calculate driver earnings, view custom breakdown previews, and finalize the settlement batch."
        actions={
          <Button
            onClick={() => navigate('/financial-operations/settlements')}
            className="btn-secondary flex items-center gap-2 text-xs font-semibold"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Step 1: Period Selection */}
        <Card className="premium-card text-left">
          <CardHeader className="pb-3 border-b border-border">
            <h3 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              <span>1. Settlement Period</span>
            </h3>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Period Start</label>
              <input
                type="date"
                value={periodStart}
                onChange={e => setPeriodStart(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-slate-50 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Period End</label>
              <input
                type="date"
                value={periodEnd}
                onChange={e => setPeriodEnd(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-slate-50 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Driver Search and Selection */}
        <Card className="premium-card text-left">
          <CardHeader className="pb-3 border-b border-border">
            <h3 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>2. Search & Select Drivers</span>
            </h3>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Search driver by name or ID (e.g. drv-driver-1)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-1 focus:ring-primary focus:outline-none"
              />
              {searchQuery && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-950 border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map(result => (
                    <button
                      key={result.driverId}
                      onClick={() => handleSelectDriver(result.driverId)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium border-b border-border last:border-0 flex justify-between"
                    >
                      <span className="font-bold text-slate-800 dark:text-slate-100">{result.driverName}</span>
                      <span className="font-mono text-slate-500">{result.driverId}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Driver Badges */}
            {selectedDriverIds.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedDriverIds.map(id => {
                  const name = driverMap[id]?.driverName || id
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/25 text-xs font-bold font-mono"
                    >
                      {name} ({id})
                      <button
                        onClick={() => handleRemoveDriver(id)}
                        className="text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Breakdown preview of each selected driver */}
        {selectedDriverIds.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Gross Preview', value: fmt(totals.gross), icon: <DollarSign className="h-4.5 w-4.5" />, color: 'text-slate-700 bg-slate-50' },
                { label: 'Commission Deducted', value: fmt(totals.commission), icon: <TrendingDown className="h-4.5 w-4.5" />, color: 'text-rose-600 bg-rose-50' },
                { label: 'Bonuses & Incentives', value: fmt(totals.bonuses), icon: <TrendingUp className="h-4.5 w-4.5" />, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Net Batch Payable', value: fmt(totals.net), icon: <CheckCircle2 className="h-4.5 w-4.5" />, color: 'text-primary bg-primary/10' },
              ].map(({ label, value, icon: Icon, color }) => (
                <Card key={label} className="premium-card">
                  <CardContent className="p-4 flex items-center gap-3">
                    <span className={`p-1.5 rounded-lg ${color}`}>{Icon}</span>
                    <div className="text-left">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
                      <p className="font-mono font-black text-slate-850 dark:text-white text-sm">{value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Individual Breakdown Preview Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2 text-left">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> Driver breakdown calculations
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {selectedDriverIds.map(driverId => (
                  <DriverBreakdownCard
                    key={driverId}
                    driverId={driverId}
                    periodStart={periodStart}
                    periodEnd={periodEnd}
                    onRemove={() => handleRemoveDriver(driverId)}
                    onCalculated={breakdown => handleCalculated(driverId, breakdown)}
                  />
                ))}
              </div>
            </div>

            {/* Confirm Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                onClick={() => navigate('/financial-operations/settlements')}
                className="btn-secondary text-xs font-semibold px-4 h-9 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generate.isPending || selectedDriversData.length === 0}
                className="gap-2 text-xs font-semibold h-9 rounded-lg bg-primary hover:bg-primary/95 text-white"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{generate.isPending ? 'Generating...' : 'Confirm & Generate Batch'}</span>
              </Button>
            </div>
          </>
        )}
      </div>
    </PageWrapper>
  )
}

// Sub-component to dynamically load and display breakdown cards for a selected driver
const DriverBreakdownCard: React.FC<{
  driverId: string
  periodStart: string
  periodEnd: string
  onRemove: () => void
  onCalculated: (data: DriverSettlement) => void
}> = ({ driverId, periodStart, periodEnd, onRemove, onCalculated }) => {
  const { data: breakdown, isLoading } = useDriverBreakdown(driverId, periodStart, periodEnd)

  useEffect(() => {
    if (breakdown) {
      onCalculated(breakdown)
    }
  }, [breakdown, onCalculated])

  if (isLoading) {
    return (
      <Card className="premium-card text-left p-6 flex flex-col items-center justify-center min-h-[180px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-[10px] text-slate-450 mt-3 font-semibold font-mono">Reconciling ledger for {driverId}...</p>
      </Card>
    )
  }

  if (!breakdown) return null

  const rows = [
    { label: 'Gross Earnings', amount: breakdown.grossEarnings, positive: true },
    { label: `Platform Commission (${breakdown.commissionPercent}%)`, amount: -breakdown.commissionAmount, positive: false },
    { label: 'Refund Adjustments', amount: -breakdown.refundAdjustments, positive: false },
    { label: 'Penalties', amount: -breakdown.penalties, positive: false },
    { label: 'Bonuses & Incentives', amount: breakdown.bonuses + breakdown.incentives, positive: true },
  ]

  return (
    <Card className="premium-card text-left text-xs hover:shadow-md transition-shadow relative">
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        title="Remove from settlement run"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <CardContent className="p-4 space-y-3">
        <div>
          <h4 className="font-black text-slate-800 dark:text-white text-sm">{breakdown.driverName}</h4>
          <p className="text-[10px] text-slate-450 font-mono mt-0.5">{breakdown.totalTrips} trips · ID: {breakdown.driverId}</p>
        </div>

        <div className="space-y-1.5 border-t border-border pt-3">
          {rows.map((row, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">{row.label}</span>
              <span className={`font-mono font-bold ${row.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {row.positive ? '+' : '-'}₹{Math.abs(row.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t-2 border-border pt-2 flex justify-between items-center">
          <span className="font-black text-slate-800 dark:text-white flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-primary" />
            Net Payable
          </span>
          <strong className="font-mono text-primary text-sm font-black">₹{breakdown.netPayable.toFixed(2)}</strong>
        </div>
      </CardContent>
    </Card>
  )
}

export default SettlementRunPage
