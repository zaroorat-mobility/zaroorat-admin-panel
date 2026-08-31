import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { useToast } from '@/shared/context/toast'
import { useSmsSettings, useTestSmsIntegration, useUpdateSmsSettings } from '@/modules/platform/system-settings/hooks'
import type { SmsProviderName } from '@/modules/platform/system-settings/types'
import {
  ConfiguredBadge,
  SecretField,
  SettingFieldRow,
  SettingsError,
  SettingsFormActions,
  SettingsLoading,
  secretForUpdate,
} from '@/modules/platform/system-settings/components'

export const SmsIntegrationPage: React.FC = () => {
  const { data, isLoading, isError } = useSmsSettings()
  const { mutate: save, isPending } = useUpdateSmsSettings()
  const { mutate: test, isPending: isTesting } = useTestSmsIntegration()
  const { success, error } = useToast()
  const [provider, setProvider] = useState<SmsProviderName>('mock')
  const [authKey, setAuthKey] = useState('')
  const [senderId, setSenderId] = useState('')
  const [otpTemplateId, setOtpTemplateId] = useState('')
  const [timeoutMs, setTimeoutMs] = useState(5000)
  const [testPhone, setTestPhone] = useState('')

  useEffect(() => {
    if (!data) return
    setProvider(data.provider)
    setAuthKey(data.msg91.authKey)
    setSenderId(data.msg91.senderId)
    setOtpTemplateId(data.msg91.otpTemplateId)
    setTimeoutMs(data.msg91.timeoutMs)
  }, [data])

  const handleSave = () => {
    save(
      {
        provider,
        msg91AuthKey: secretForUpdate(authKey, data?.msg91.authKey ?? ''),
        msg91SenderId: senderId,
        msg91OtpTemplateId: otpTemplateId,
        timeoutMs,
        expectedVersion: data?.version,
      },
      {
        onSuccess: () => success('Settings saved', 'SMS settings were updated.'),
        onError: (err) =>
          error('Save failed', err instanceof Error ? err.message : 'Could not save settings'),
      },
    )
  }

  const handleTest = () => {
    test(
      { testPhone: testPhone || undefined },
      {
        onSuccess: (result) =>
          result.ok ? success('Test passed', result.message) : error('Test failed', result.message),
        onError: (err) =>
          error('Test failed', err instanceof Error ? err.message : 'Could not test integration'),
      },
    )
  }

  if (isLoading) return <SettingsLoading />
  if (isError || !data) return <SettingsError />

  return (
    <Card className="premium-card max-w-3xl">
      <CardContent className="p-6 space-y-4">
        <ConfiguredBadge configured={data.configured} />
        <SettingFieldRow label="Provider">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as SmsProviderName)}
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm dark:bg-slate-900"
          >
            <option value="mock">mock</option>
            <option value="msg91">msg91</option>
          </select>
        </SettingFieldRow>
        <SecretField
          label="MSG91 auth key"
          value={authKey}
          onChange={setAuthKey}
          configured={data.msg91.configured}
        />
        <SettingFieldRow label="Sender ID">
          <Input value={senderId} onChange={(e) => setSenderId(e.target.value)} maxLength={12} />
        </SettingFieldRow>
        <SettingFieldRow label="OTP template ID">
          <Input value={otpTemplateId} onChange={(e) => setOtpTemplateId(e.target.value)} />
        </SettingFieldRow>
        <SettingFieldRow label="Timeout (ms)">
          <Input type="number" value={timeoutMs} onChange={(e) => setTimeoutMs(Number(e.target.value) || 0)} />
        </SettingFieldRow>
        <SettingFieldRow label="Test phone" hint="Optional — used when testing the integration">
          <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="+91..." />
        </SettingFieldRow>
        <SettingsFormActions
          onSave={handleSave}
          isSaving={isPending}
          onTest={handleTest}
          isTesting={isTesting}
        />
      </CardContent>
    </Card>
  )
}

export default SmsIntegrationPage
