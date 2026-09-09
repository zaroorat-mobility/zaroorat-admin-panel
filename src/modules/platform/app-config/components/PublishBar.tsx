import React from 'react'
import { RefreshCw, Rocket } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import { useToast } from '@/shared/context/toast'
import {
  usePublishAppConfig,
  usePublicAppConfig,
  useResetAppConfig,
} from '../hooks'
import { buildResetThemeBody } from '../services'
import type { AppClient, AppColorScheme } from '../types'

interface PublishBarProps {
  app?: AppClient
  colorScheme?: AppColorScheme
  className?: string
}

export const PublishBar: React.FC<PublishBarProps> = ({
  app = 'admin',
  colorScheme = 'light',
  className = '',
}) => {
  const { user } = useAuthStore()
  const canWrite = hasPermission(user, 'settings:write')
  const { data } = usePublicAppConfig(app, 'en')
  const publish = usePublishAppConfig()
  const reset = useResetAppConfig()
  const { success, error } = useToast()

  const handlePublish = () => {
    publish.mutate(undefined, {
      onSuccess: (result) =>
        success('Published', `App config is now at version ${result.version}.`),
      onError: (err) =>
        error('Publish failed', err instanceof Error ? err.message : 'Could not publish'),
    })
  }

  const handleReset = () => {
    reset.mutate(buildResetThemeBody(app, colorScheme), {
      onSuccess: () =>
        success('Reset complete', `${app} ${colorScheme} theme restored to bundled defaults.`),
      onError: (err) =>
        error('Reset failed', err instanceof Error ? err.message : 'Could not reset theme'),
    })
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60 ${className}`}
    >
      <div>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          Config version {data?.version ?? '—'}
        </p>
        <p className="text-[11px] text-slate-500">
          Publish bumps the public ETag. Reset restores the selected app/scheme to bundled tokens.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          disabled={!canWrite || reset.isPending}
          loading={reset.isPending}
          onClick={handleReset}
          icon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Reset theme
        </Button>
        <Button
          type="button"
          size="sm"
          className="gap-1.5 text-xs"
          disabled={!canWrite || publish.isPending}
          loading={publish.isPending}
          onClick={handlePublish}
          icon={<Rocket className="h-3.5 w-3.5" />}
        >
          Publish
        </Button>
      </div>
    </div>
  )
}
