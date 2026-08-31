import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { useToast } from '@/shared/context/toast'
import { usePushSettings, useTestPushIntegration, useUpdatePushSettings } from '@/modules/platform/system-settings/hooks'
import type { PushProviderName } from '@/modules/platform/system-settings/types'
import {
  ConfiguredBadge,
  SecretField,
  SettingFieldRow,
  SettingsError,
  SettingsFormActions,
  SettingsLoading,
  secretForUpdate,
} from '@/modules/platform/system-settings/components'

export const PushIntegrationPage: React.FC = () => {
  const { data, isLoading, isError } = usePushSettings()
  const { mutate: save, isPending } = useUpdatePushSettings()
  const { mutate: test, isPending: isTesting } = useTestPushIntegration()
  const { success, error } = useToast()
  const [provider, setProvider] = useState<PushProviderName>('mock')
  const [fcmServerKey, setFcmServerKey] = useState('')

  useEffect(() => {
    if (!data) return
    setProvider(data.provider)
    setFcmServerKey(data.fcm.serverKey)
  }, [data])

  const handleSave = () => {
    save(
      {
        provider,
        fcmServerKey: secretForUpdate(fcmServerKey, data?.fcm.serverKey ?? ''),
        expectedVersion: data?.version,
      },
      {
        onSuccess: () => success('Settings saved', 'Push settings were updated.'),
        onError: (err) =>
          error('Save failed', err instanceof Error ? err.message : 'Could not save settings'),
      },
    )
  }

  const handleTest = () => {
    test(undefined, {
      onSuccess: (result) =>
        result.ok ? success('Test passed', result.message) : error('Test failed', result.message),
      onError: (err) =>
        error('Test failed', err instanceof Error ? err.message : 'Could not test integration'),
    })
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
            onChange={(e) => setProvider(e.target.value as PushProviderName)}
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm dark:bg-slate-900"
          >
            <option value="mock">mock</option>
          </select>
        </SettingFieldRow>
        <SecretField
          label="FCM server key"
          value={fcmServerKey}
          onChange={setFcmServerKey}
          configured={data.fcm.configured}
        />
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

export default PushIntegrationPage
