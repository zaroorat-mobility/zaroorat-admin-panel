import React from 'react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Save, FlaskConical } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import type { SettingSource } from '../types'

export const MASKED_SECRET = '********'

export const isMaskedSecret = (value: string | undefined): boolean =>
  !value || value === MASKED_SECRET

export const secretForUpdate = (current: string, original: string): string | undefined => {
  if (isMaskedSecret(current) || current === original) return undefined
  return current
}

export const SettingSourceBadge: React.FC<{ source: SettingSource }> = ({ source }) => (
  <Badge variant={source === 'database' ? 'info' : 'neutral'} outline>
    source: {source}
  </Badge>
)

export const ConfiguredBadge: React.FC<{ configured: boolean }> = ({ configured }) => (
  <Badge variant={configured ? 'success' : 'warning'} outline>
    {configured ? 'Configured' : 'Not configured'}
  </Badge>
)

interface SettingFieldRowProps {
  label: string
  source?: SettingSource
  children: React.ReactNode
  hint?: string
}

export const SettingFieldRow: React.FC<SettingFieldRowProps> = ({ label, source, children, hint }) => (
  <div className="space-y-1.5">
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      {source ? <SettingSourceBadge source={source} /> : null}
    </div>
    {children}
    {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
  </div>
)

interface SecretFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  configured?: boolean
  placeholder?: string
}

export const SecretField: React.FC<SecretFieldProps> = ({
  label,
  value,
  onChange,
  configured,
  placeholder = 'Enter new secret to update',
}) => (
  <SettingFieldRow label={label}>
    <div className="flex flex-wrap items-center gap-2">
      {configured !== undefined ? <ConfiguredBadge configured={configured} /> : null}
      <Input
        type="password"
        value={isMaskedSecret(value) ? '' : value}
        placeholder={configured ? '•••••••• (leave blank to keep)' : placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
      {configured && isMaskedSecret(value) ? (
        <span className="text-xs text-muted-foreground font-mono">{MASKED_SECRET}</span>
      ) : null}
    </div>
  </SettingFieldRow>
)

interface SettingsFormActionsProps {
  onSave: () => void
  isSaving?: boolean
  onTest?: () => void
  isTesting?: boolean
  testLabel?: string
}

export const SettingsFormActions: React.FC<SettingsFormActionsProps> = ({
  onSave,
  isSaving,
  onTest,
  isTesting,
  testLabel = 'Test connection',
}) => {
  const { user } = useAuthStore()
  const canWrite = hasPermission(user, 'settings:write')

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 pt-4 border-t border-border">
      {onTest ? (
        <Button
          type="button"
          variant="outline"
          className="gap-2 text-xs"
          onClick={onTest}
          disabled={!canWrite || isTesting}
          loading={isTesting}
        >
          <FlaskConical className="h-4 w-4" />
          {testLabel}
        </Button>
      ) : null}
      <Button
        type="button"
        className="gap-2 text-xs"
        onClick={onSave}
        disabled={!canWrite || isSaving}
        loading={isSaving}
      >
        <Save className="h-4 w-4" />
        Save changes
      </Button>
    </div>
  )
}

export const SettingsLoading: React.FC = () => (
  <p className="text-sm text-muted-foreground py-8">Loading settings...</p>
)

export const SettingsError: React.FC = () => (
  <p className="text-sm text-destructive py-8">Failed to load settings. Please try again.</p>
)

interface HealthStatusBadgeProps {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'DOWN'
}

export const HealthStatusBadge: React.FC<HealthStatusBadgeProps> = ({ status }) => {
  const variant =
    status === 'HEALTHY' ? 'success' : status === 'WARNING' ? 'warning' : 'danger'
  return <Badge variant={variant}>{status}</Badge>
}
