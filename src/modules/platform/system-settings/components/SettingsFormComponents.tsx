import React, { useState } from 'react'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Save, FlaskConical, Eye, EyeOff, Lock } from 'lucide-react'
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
  <Badge variant={source === 'database' ? 'info' : 'neutral'} outline className="text-[10px] uppercase tracking-wider font-semibold">
    source: {source}
  </Badge>
)

export const ConfiguredBadge: React.FC<{ configured: boolean }> = ({ configured }) => (
  <Badge variant={configured ? 'success' : 'warning'} outline className="text-[10px] uppercase tracking-wider font-bold">
    {configured ? 'Configured' : 'Not configured'}
  </Badge>
)

interface SettingFieldRowProps {
  label: string
  source?: SettingSource
  children: React.ReactNode
  hint?: string
  rightElement?: React.ReactNode
}

export const SettingFieldRow: React.FC<SettingFieldRowProps> = ({
  label,
  source,
  children,
  hint,
  rightElement,
}) => (
  <div className="space-y-1.5 text-left">
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <div className="flex items-center gap-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {label}
        </label>
        {source ? <SettingSourceBadge source={source} /> : null}
      </div>
      {rightElement ? <div>{rightElement}</div> : null}
    </div>
    {children}
    {hint ? <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{hint}</p> : null}
  </div>
)

interface SecretFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  configured?: boolean
  placeholder?: string
  hint?: string
}

export const SecretField: React.FC<SecretFieldProps> = ({
  label,
  value,
  onChange,
  configured,
  placeholder = 'Enter new secret key to update',
  hint,
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const isMasked = isMaskedSecret(value)

  return (
    <SettingFieldRow
      label={label}
      hint={hint}
      rightElement={configured !== undefined ? <ConfiguredBadge configured={configured} /> : null}
    >
      <div className="relative flex items-center w-full">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 dark:text-slate-500">
          <Lock className="w-3.5 h-3.5" />
        </span>

        <input
          type={showPassword ? 'text' : 'password'}
          value={isMasked ? '' : value}
          placeholder={configured ? '•••••••••••••••• (Stored securely — leave blank to keep)' : placeholder}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          className="flex h-9 w-full rounded-lg border border-input bg-white dark:bg-slate-900 pl-9 pr-10 text-xs font-mono text-foreground shadow-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
        />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          title={showPassword ? 'Hide Secret' : 'Show Secret'}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </SettingFieldRow>
  )
}

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
  testLabel = 'Test active provider',
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
        variant="primary"
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
  <div className="flex items-center justify-center py-12 text-xs font-medium text-muted-foreground gap-2">
    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
    Loading map settings...
  </div>
)

export const SettingsError: React.FC = () => (
  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-600 dark:text-red-400 py-6 text-center">
    Failed to load map settings. Please refresh or verify your administrative permissions.
  </div>
)

interface HealthStatusBadgeProps {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'DOWN'
}

export const HealthStatusBadge: React.FC<HealthStatusBadgeProps> = ({ status }) => {
  const variant =
    status === 'HEALTHY' ? 'success' : status === 'WARNING' ? 'warning' : 'danger'
  return <Badge variant={variant} className="text-[10px] uppercase font-extrabold">{status}</Badge>
}
