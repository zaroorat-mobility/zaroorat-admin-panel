import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { useToast } from '@/shared/context/toast'
import { useOtpSettings, useUpdateOtpSettings } from '@/modules/platform/system-settings/hooks'
import {
  SettingFieldRow,
  SettingsError,
  SettingsFormActions,
  SettingsLoading,
} from '@/modules/platform/system-settings/components'

export const OtpSettingsPage: React.FC = () => {
  const { data, isLoading, isError } = useOtpSettings()
  const { mutate: save, isPending } = useUpdateOtpSettings()
  const { success, error } = useToast()
  const [form, setForm] = useState({
    enabled: true,
    codeLength: 6,
    ttlSeconds: 300,
    maxVerifyAttempts: 3,
    lockoutSeconds: 300,
    resendIntervalSeconds: 60,
  })

  useEffect(() => {
    if (!data) return
    setForm({
      enabled: data.enabled.value,
      codeLength: data.codeLength.value,
      ttlSeconds: data.ttlSeconds.value,
      maxVerifyAttempts: data.maxVerifyAttempts.value,
      lockoutSeconds: data.lockoutSeconds.value,
      resendIntervalSeconds: data.resendIntervalSeconds.value,
    })
  }, [data])

  const num = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: Number(e.target.value) || 0 })

  const handleSave = () => {
    save(form, {
      onSuccess: () => success('Settings saved', 'OTP settings were updated.'),
      onError: (err) =>
        error('Save failed', err instanceof Error ? err.message : 'Could not save settings'),
    })
  }

  if (isLoading) return <SettingsLoading />
  if (isError || !data) return <SettingsError />

  return (
    <Card className="premium-card max-w-3xl">
      <CardContent className="p-6 space-y-4">
        <SettingFieldRow label="OTP enabled" source={data.enabled.source}>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              className="rounded border-border"
            />
            Enable OTP verification
          </label>
        </SettingFieldRow>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingFieldRow label="Code length" source={data.codeLength.source}>
            <Input type="number" value={form.codeLength} onChange={num('codeLength')} />
          </SettingFieldRow>
          <SettingFieldRow label="TTL (seconds)" source={data.ttlSeconds.source}>
            <Input type="number" value={form.ttlSeconds} onChange={num('ttlSeconds')} />
          </SettingFieldRow>
          <SettingFieldRow label="Max verify attempts" source={data.maxVerifyAttempts.source}>
            <Input type="number" value={form.maxVerifyAttempts} onChange={num('maxVerifyAttempts')} />
          </SettingFieldRow>
          <SettingFieldRow label="Lockout (seconds)" source={data.lockoutSeconds.source}>
            <Input type="number" value={form.lockoutSeconds} onChange={num('lockoutSeconds')} />
          </SettingFieldRow>
          <SettingFieldRow label="Resend interval (seconds)" source={data.resendIntervalSeconds.source}>
            <Input type="number" value={form.resendIntervalSeconds} onChange={num('resendIntervalSeconds')} />
          </SettingFieldRow>
        </div>
        <SettingsFormActions onSave={handleSave} isSaving={isPending} />
      </CardContent>
    </Card>
  )
}

export default OtpSettingsPage
