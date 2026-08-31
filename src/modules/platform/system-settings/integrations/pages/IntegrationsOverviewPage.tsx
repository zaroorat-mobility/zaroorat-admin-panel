import React from 'react'
import { RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/Table'
import { useIntegrationsStatus } from '@/modules/platform/system-settings/hooks'
import { ConfiguredBadge, HealthStatusBadge, SettingsError, SettingsLoading } from '@/modules/platform/system-settings/components'
import { cn } from '@/shared/utils'

export const IntegrationsOverviewPage: React.FC = () => {
  const { data, isLoading, isError, refetch, isFetching } = useIntegrationsStatus()

  if (isLoading) return <SettingsLoading />
  if (isError || !data) return <SettingsError />

  return (
    <div className="space-y-4">
      <Card className="premium-card">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Overall health</p>
            <div className="mt-2">
              <HealthStatusBadge status={data.overall} />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2 text-xs"
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            Refresh
          </Button>
        </CardContent>
      </Card>

      <Card className="premium-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Integration</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Configured</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.integrations.map((item) => (
                <TableRow key={`${item.integration}-${item.provider}`}>
                  <TableCell className="capitalize font-medium">{item.integration}</TableCell>
                  <TableCell>{item.provider}</TableCell>
                  <TableCell>
                    <HealthStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>
                    <ConfiguredBadge configured={item.configured} />
                  </TableCell>
                  <TableCell className="max-w-xs whitespace-normal text-sm text-muted-foreground">
                    {item.message}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default IntegrationsOverviewPage
