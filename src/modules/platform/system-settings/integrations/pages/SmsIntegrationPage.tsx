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
  const [apiKey, setApiKey] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [senderId, setSenderId] = useState('')
  const [entityId, setEntityId] = useState('')
  const [otpTemplateId, setOtpTemplateId] = useState('')
  const [timeoutMs, setTimeoutMs] = useState(5000)
  const [testPhone, setTestPhone] = useState('')

  useEffect(() => {
    if (!data) return
    setProvider(data.provider)
    setApiKey(data.airtel?.apiKey ?? '')
    setUsername(data.airtel?.username ?? '')
    setPassword(data.airtel?.password ?? '')
    setCustomerId(data.airtel?.customerId ?? '')
    setSenderId(data.airtel?.senderId ?? '')
    setEntityId(data.airtel?.entityId ?? '')
    setOtpTemplateId(data.airtel?.otpTemplateId ?? '')
    setTimeoutMs(data.airtel?.timeoutMs ?? 5000)
  }, [data])

  const handleSave = () => {
    save(
      {
        provider,
        airtelApiKey: secretForUpdate(apiKey, data?.airtel?.apiKey ?? ''),
        airtelUsername: username,
        airtelPassword: secretForUpdate(password, data?.airtel?.password ?? ''),
        airtelCustomerId: customerId,
        airtelSenderId: senderId,
        airtelEntityId: entityId,
        airtelOtpTemplateId: otpTemplateId,
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
            <option value="airtel">airtel</option>
          </select>
        </SettingFieldRow>
        <SettingFieldRow label="Airtel Username (Basic Auth)">
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username for Airtel IQ Basic Auth" />
        </SettingFieldRow>
        <SecretField
          label="Airtel Password (Basic Auth)"
          value={password}
          onChange={setPassword}
          configured={data.airtel?.configured}
        />
        <SecretField
          label="Airtel API Key (Bearer / Token Auth - Alternative)"
          value={apiKey}
          onChange={setApiKey}
          configured={data.airtel?.configured}
        />
        <SettingFieldRow label="Customer / Account ID">
          <Input value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="Optional customer ID" />
        </SettingFieldRow>
        <SettingFieldRow label="Sender / Header">
          <Input value={senderId} onChange={(e) => setSenderId(e.target.value)} maxLength={12} placeholder="DLT Header (e.g. ZARORT)" />
        </SettingFieldRow>
        <SettingFieldRow label="DLT Entity ID">
          <Input value={entityId} onChange={(e) => setEntityId(e.target.value)} placeholder="DLT PE Entity ID" />
        </SettingFieldRow>
        <SettingFieldRow label="OTP Template ID">
          <Input value={otpTemplateId} onChange={(e) => setOtpTemplateId(e.target.value)} placeholder="DLT Content Template ID" />
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
