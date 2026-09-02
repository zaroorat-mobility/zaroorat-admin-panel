import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { useToast } from '@/shared/context/toast'
import { useEmailSettings, useTestEmailIntegration, useUpdateEmailSettings } from '@/modules/platform/system-settings/hooks'
import type { EmailProviderName } from '@/modules/platform/system-settings/types'
import {
  ConfiguredBadge,
  SecretField,
  SettingFieldRow,
  SettingsError,
  SettingsFormActions,
  SettingsLoading,
  secretForUpdate,
} from '@/modules/platform/system-settings/components'

export const EmailIntegrationPage: React.FC = () => {
  const { data, isLoading, isError } = useEmailSettings()
  const { mutate: save, isPending } = useUpdateEmailSettings()
  const { mutate: test, isPending: isTesting } = useTestEmailIntegration()
  const { success, error } = useToast()
  const [provider, setProvider] = useState<EmailProviderName>('smtp')
  const [host, setHost] = useState('')
  const [port, setPort] = useState(587)
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [fromAddress, setFromAddress] = useState('')
  const [testEmail, setTestEmail] = useState('')

  useEffect(() => {
    if (!data) return
    setProvider(data.provider)
    setHost(data.smtp.host)
    setPort(data.smtp.port)
    setUser(data.smtp.user)
    setPassword(data.smtp.password)
    setFromAddress(data.smtp.fromAddress)
  }, [data])

  const handleSave = () => {
    save(
      {
        provider,
        smtpHost: host,
        smtpPort: port,
        smtpUser: user,
        smtpPassword: secretForUpdate(password, data?.smtp.password ?? ''),
        fromAddress,
        expectedVersion: data?.version,
      },
      {
        onSuccess: () => success('Settings saved', 'Email settings were updated.'),
        onError: (err) =>
          error('Save failed', err instanceof Error ? err.message : 'Could not save settings'),
      },
    )
  }

  const handleTest = () => {
    test(
      { testEmail: testEmail || undefined },
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
            onChange={(e) => setProvider(e.target.value as EmailProviderName)}
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm dark:bg-slate-900"
          >
            <option value="smtp">smtp</option>
          </select>
        </SettingFieldRow>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingFieldRow label="SMTP host">
            <Input value={host} onChange={(e) => setHost(e.target.value)} />
          </SettingFieldRow>
          <SettingFieldRow label="SMTP port">
            <Input type="number" value={port} onChange={(e) => setPort(Number(e.target.value) || 0)} />
          </SettingFieldRow>
          <SettingFieldRow label="SMTP user">
            <Input value={user} onChange={(e) => setUser(e.target.value)} />
          </SettingFieldRow>
          <SettingFieldRow label="From address">
            <Input type="email" value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} />
          </SettingFieldRow>
        </div>
        <SecretField
          label="SMTP password"
          value={password}
          onChange={setPassword}
          configured={data.smtp.configured}
        />
        <SettingFieldRow label="Test email" hint="Optional — used when testing the integration">
          <Input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
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

export default EmailIntegrationPage
