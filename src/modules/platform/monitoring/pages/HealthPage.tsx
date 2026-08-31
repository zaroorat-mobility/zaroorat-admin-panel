import React, { useMemo } from 'react'
import { RefreshCw, Server, Activity } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { useMonitoringHealth } from '../hooks'
import type { HealthStatus } from '../types'
import { cn } from '@/shared/utils'
import { usePlatformPageActions } from '../../layout/platform-page-context'

const statusVariant = (status: HealthStatus): 'success' | 'warning' | 'danger' => {
  if (status === 'healthy') return 'success'
  if (status === 'degraded') return 'warning'
  return 'danger'
}

export const HealthPage: React.FC = () => {
  const { data, isLoading, isError, refetch, isFetching } = useMonitoringHealth()

  usePlatformPageActions(
    useMemo(
      () => (
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2 text-xs font-semibold h-9 rounded-lg border-border"
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          Refresh
        </Button>
      ),
      [isFetching, refetch],
    ),
  )

  return (
    <div className="space-y-6">
      <Card className="premium-card">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Overall Status</p>
              {isLoading ? (
                <p className="text-sm text-slate-500">Checking components…</p>
              ) : isError ? (
                <p className="text-sm text-red-600">Failed to load health data</p>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={statusVariant(data!.overall)}>{data!.overall}</Badge>
                  <span className="text-xs text-slate-500">
                    Checked {new Date(data!.checkedAt).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data?.components ?? []).map((component) => (
          <Card key={component.name} className="premium-card">
            <CardContent className="p-4 text-left">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold text-sm capitalize">{component.name}</span>
                </div>
                <Badge variant={statusVariant(component.status)}>{component.status}</Badge>
              </div>
              {component.message && (
                <p className="text-xs text-slate-500 mt-2">{component.message}</p>
              )}
              {component.latencyMs !== undefined && (
                <p className="text-[10px] font-mono text-slate-400 mt-2">
                  {component.latencyMs}ms latency
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default HealthPage
