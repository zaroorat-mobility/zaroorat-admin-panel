import React, { useEffect, useMemo, useState } from 'react'
import { Save, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { useSecurityPolicy, useUpdateSecurityPolicy } from '../hooks'
import type { SecurityPolicy } from '../types'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import { usePlatformPageActions } from '../../layout/platform-page-context'

export const SecurityPolicyPage: React.FC = () => {
  const { user } = useAuthStore()
  const canWrite = hasPermission(user, 'security:write')
  const { data, isLoading, isError, refetch, isFetching } = useSecurityPolicy()
  const updateMutation = useUpdateSecurityPolicy()
  const [form, setForm] = useState<SecurityPolicy | null>(null)

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const handleChange = <K extends keyof SecurityPolicy>(key: K, value: SecurityPolicy[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const handleSave = () => {
    if (!form || !data) return
    updateMutation.mutate({
      ...(form.sessionMaxConcurrent !== data.sessionMaxConcurrent
        ? { sessionMaxConcurrent: form.sessionMaxConcurrent }
        : {}),
      ...(form.sessionTtlHours !== data.sessionTtlHours ? { sessionTtlHours: form.sessionTtlHours } : {}),
      ...(form.passwordMinLength !== data.passwordMinLength
        ? { passwordMinLength: form.passwordMinLength }
        : {}),
      ...(form.requireMfa !== data.requireMfa ? { requireMfa: form.requireMfa } : {}),
      ...(form.ipAllowlistEnabled !== data.ipAllowlistEnabled
        ? { ipAllowlistEnabled: form.ipAllowlistEnabled }
        : {}),
    })
  }

  const fields: Array<{
    key: keyof SecurityPolicy
    label: string
    type: 'number' | 'boolean'
    min?: number
    max?: number
  }> = [
    { key: 'sessionMaxConcurrent', label: 'Max concurrent sessions', type: 'number', min: 1, max: 20 },
    { key: 'sessionTtlHours', label: 'Session TTL (hours)', type: 'number', min: 1, max: 720 },
    { key: 'passwordMinLength', label: 'Minimum password length', type: 'number', min: 8, max: 128 },
    { key: 'requireMfa', label: 'Require MFA for admin login', type: 'boolean' },
    { key: 'ipAllowlistEnabled', label: 'Enable IP allowlist', type: 'boolean' },
  ]

  usePlatformPageActions(
    useMemo(
      () => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2 text-xs font-semibold h-9 rounded-lg border-border"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canWrite && (
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending || !form}
              className="gap-2 text-xs font-semibold h-9"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          )}
        </div>
      ),
      [canWrite, form, isFetching, refetch, updateMutation.isPending],
    ),
  )

  return (
    <Card className="premium-card max-w-2xl">
      <CardContent className="p-6 space-y-5">
        {isLoading && <p className="text-sm text-slate-500 text-left">Loading policy…</p>}
        {isError && <p className="text-sm text-red-600 text-left">Failed to load security policy.</p>}
        {form &&
          fields.map(({ key, label, type, min, max }) => (
            <div key={key} className="flex items-center justify-between gap-4 text-left">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
              {type === 'boolean' ? (
                <input
                  type="checkbox"
                  checked={form[key] as boolean}
                  disabled={!canWrite}
                  onChange={(e) => handleChange(key, e.target.checked as SecurityPolicy[typeof key])}
                  className="rounded border-border h-4 w-4"
                />
              ) : (
                <input
                  type="number"
                  min={min}
                  max={max}
                  value={form[key] as number}
                  disabled={!canWrite}
                  onChange={(e) =>
                    handleChange(key, Number(e.target.value) as SecurityPolicy[typeof key])
                  }
                  className="w-24 text-xs border border-border rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-950 text-right"
                />
              )}
            </div>
          ))}
      </CardContent>
    </Card>
  )
}

export default SecurityPolicyPage
