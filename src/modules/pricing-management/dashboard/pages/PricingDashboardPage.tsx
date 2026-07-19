import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useFareRules,
  useSurgeRules,
  useCancellationRules,
  usePricingHistory
} from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { InfoCardGrid, InfoCard } from '@/shared/components/InfoCard'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/shared/components/ui/Card'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Button } from '@/shared/components/ui/Button'
import {
  DollarSign,
  ShieldCheck,
  History,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  Car,
  Bike,
  User,
  Zap
} from 'lucide-react'

export const PricingDashboardPage: React.FC = () => {
  const navigate = useNavigate()

  // Queries
  const { data: fareData, isLoading: fareLoading } = useFareRules()
  const { data: surgeData, isLoading: surgeLoading } = useSurgeRules()
  const { data: cancelData, isLoading: cancelLoading } = useCancellationRules()
  const { data: historyData, isLoading: historyLoading } = usePricingHistory()

  const fareRules = fareData?.data || []
  const surgeRules = surgeData?.data || []
  const cancellationRules = cancelData?.data || []
  const historyLogs = historyData?.data || []

  // Computed states
  const activeFareCount = fareRules.filter(r => r.status === 'active').length
  const activeSurgeCount = surgeRules.filter(r => r.status === 'active').length
  const activeCancelCount = cancellationRules.filter(r => r.status === 'active').length

  const activeFares = fareRules.filter(r => r.status === 'active')
  const activeSurges = surgeRules.filter(r => r.status === 'active')
  const activeCancellations = cancellationRules.filter(r => r.status === 'active')

  // Find upcoming expiring rules (effectiveTo date exists and is in the future)
  const expiringRules = [
    ...fareRules.map(r => ({ ...r, type: 'Fare Rule' })),
    ...surgeRules.map(s => ({ ...s, type: 'Surge Rule' }))
  ].filter(r => {
    if (!r.effectiveTo) return false
    const expDate = new Date(r.effectiveTo)
    const now = new Date()
    return expDate > now
  }).sort((a, b) => new Date(a.effectiveTo!).getTime() - new Date(b.effectiveTo!).getTime())

  const recentLogs = historyLogs.slice(0, 5)

  return (
    <PageWrapper>
      <PageHeader
        title="Pricing Control Center"
        description="Unified hub for fare tariffs, real-time surge adjustments, cancellation penalty configuration, and audit logs."
      />

      <div className="space-y-6 text-left">
        {/* Metric Overview Grid */}
        <InfoCardGrid cols={4}>
          <InfoCard
            label="Active Fare Rules"
            value={activeFareCount}
            icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
            variant="green"
            loading={fareLoading}
          />
          <InfoCard
            label="Active Surge Rules"
            value={activeSurgeCount}
            icon={<Zap className="h-5 w-5 text-amber-500" />}
            variant="amber"
            loading={surgeLoading}
          />
          <InfoCard
            label="Active Cancel Rules"
            value={activeCancelCount}
            icon={<ShieldCheck className="h-5 w-5 text-primary" />}
            variant="blue"
            loading={cancelLoading}
          />
          <InfoCard
            label="Recent Actions (30d)"
            value={historyLogs.length}
            icon={<History className="h-5 w-5 text-slate-500" />}
            variant="blue"
            loading={historyLoading}
          />
        </InfoCardGrid>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Active Configs Panel */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Active Fare Tariffs */}
            <Card className="premium-card">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Car className="h-4.5 w-4.5 text-primary" />
                    <span>Active Base Tariffs</span>
                  </CardTitle>
                  <CardDescription className="text-[10px] text-muted-foreground mt-0.5">
                    Currently active fare rules applied to passenger billing categories.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('fare-rules')}
                  className="h-8 px-2.5 text-[10px] font-bold border-border flex items-center gap-1"
                >
                  <span>Manage</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {fareLoading ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">Loading active fare rules...</div>
                ) : activeFares.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">No active fare rules found.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {activeFares.map((rule) => (
                      <div key={rule.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50 transition-all">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{rule.ruleName}</span>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border">V{rule.version}</span>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-slate-550 dark:text-slate-400">
                            <span className="uppercase font-bold text-primary flex items-center gap-1">
                              {rule.vehicleType === 'bike' ? <Bike className="h-3.5 w-3.5" /> : <Car className="h-3.5 w-3.5" />}
                              {rule.vehicleType}
                            </span>
                            <span>Base: ₹{rule.baseFare.toFixed(0)}</span>
                            <span>Min: ₹{rule.minimumFare.toFixed(0)}</span>
                            <span>Per KM: ₹{rule.perKmRate}</span>
                            <span>Per Min: ₹{rule.perMinuteRate}</span>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <StatusBadge status={rule.status} />
                          <p className="text-[9px] font-mono text-slate-400">Eff: {rule.effectiveFrom}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Surge Configurations */}
            <Card className="premium-card">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Zap className="h-4.5 w-4.5 text-amber-500" />
                    <span>Active Surge Multipliers</span>
                  </CardTitle>
                  <CardDescription className="text-[10px] text-muted-foreground mt-0.5">
                    Real-time pricing multiplier surcharges currently active on vehicle classes.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('surge-rules')}
                  className="h-8 px-2.5 text-[10px] font-bold border-border flex items-center gap-1"
                >
                  <span>Manage</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {surgeLoading ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">Loading active surge rules...</div>
                ) : activeSurges.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">No active surge rules found.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {activeSurges.map((rule) => (
                      <div key={rule.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50 transition-all">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{rule.ruleName}</span>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border">V{rule.version}</span>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-slate-550 dark:text-slate-400">
                            <span className="uppercase font-bold text-amber-600 flex items-center gap-1">
                              <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                              {rule.vehicleType}
                            </span>
                            <span className="bg-rose-50 border border-rose-100 px-2 py-0.5 rounded font-black text-rose-700 text-[11px]">{rule.multiplier}x Multiplier</span>
                            {rule.startTime && (
                              <span className="flex items-center gap-1 font-mono text-[9px] text-slate-450">
                                <Clock className="h-3 w-3" />
                                {rule.startTime} - {rule.endTime}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <StatusBadge status={rule.status} />
                          <p className="text-[9px] font-mono text-slate-400">Eff: {rule.effectiveFrom}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Cancellation Penalties */}
            <Card className="premium-card">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                    <span>Active Cancellation Rules</span>
                  </CardTitle>
                  <CardDescription className="text-[10px] text-muted-foreground mt-0.5">
                    Operational fees and penalties applied to riders and drivers for cancellation events.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('cancellation-rules')}
                  className="h-8 px-2.5 text-[10px] font-bold border-border flex items-center gap-1"
                >
                  <span>Manage</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {cancelLoading ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">Loading active cancel rules...</div>
                ) : activeCancellations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">No active cancel rules found.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {activeCancellations.map((rule) => (
                      <div key={rule.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50 transition-all">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{rule.ruleName}</span>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border">V{rule.version}</span>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-slate-550 dark:text-slate-400">
                            <span className="capitalize font-bold text-slate-700 bg-slate-100 border px-1.5 py-0.5 rounded flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {rule.actor}
                            </span>
                            <span className="font-mono font-semibold text-rose-500">Scenario: {rule.scenario.replace('_', ' ')}</span>
                            <span className="font-bold text-slate-850 dark:text-white">Fee: {rule.chargeType === 'fixed' ? '₹' : ''}{rule.chargeAmount}{rule.chargeType === 'percentage' ? '%' : ''}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={rule.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Right Sidebar Column */}
          <div className="space-y-6">
            
            {/* Expiring Rules Widget */}
            <Card className="premium-card text-left">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>Expiring Rules Schedule</span>
                </CardTitle>
                <CardDescription className="text-[10px] text-muted-foreground mt-0.5">
                  Rules scheduled to automatically expire.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-3">
                {expiringRules.length === 0 ? (
                  <p className="text-[11px] text-slate-450 p-2 text-center border border-dashed rounded-lg">No rules with active expiration dates configured.</p>
                ) : (
                  expiringRules.map((rule) => (
                    <div key={rule.id} className="p-3 border border-border rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold truncate max-w-[120px]">{rule.ruleName}</span>
                        <span className="text-[9px] bg-amber-50 border border-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-black">{rule.type}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Vehicle: <strong className="uppercase">{rule.vehicleType}</strong></span>
                        <span className="flex items-center gap-0.5 font-mono text-[9px] text-rose-500">
                          <AlertTriangle className="h-3 w-3" />
                          Exp: {rule.effectiveTo}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Audit Logs Widget */}
            <Card className="premium-card text-left">
              <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span>Pricing Changes Log</span>
                  </CardTitle>
                  <CardDescription className="text-[10px] text-muted-foreground mt-0.5">
                    Latest change-events from the pricing audit trail.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('history')}
                  className="h-7 px-2 text-[9px] font-bold border-border"
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-4">
                {historyLoading ? (
                  <p className="text-xs text-muted-foreground text-center">Loading audit log...</p>
                ) : recentLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center border border-dashed p-3 rounded-lg">No audit events recorded.</p>
                ) : (
                  <div className="relative border-l border-slate-200 pl-4 space-y-4 ml-1.5 text-xs text-slate-700">
                    {recentLogs.map((log) => (
                      <div key={log.id} className="relative space-y-1">
                        <div className="absolute -left-[21.5px] top-1 h-2.5 w-2.5 rounded-full bg-slate-300 border border-white" />
                        <div className="flex items-center justify-between">
                          <strong className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{log.action}</strong>
                          <span className="text-[9px] font-mono text-slate-400">{new Date(log.timestamp).toLocaleDateString('en-IN')}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">{log.notes}</p>
                        <p className="text-[9px] font-medium text-slate-400">By: {log.actor}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

        </div>

      </div>
    </PageWrapper>
  )
}

export default PricingDashboardPage
