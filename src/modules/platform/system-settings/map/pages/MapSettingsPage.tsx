import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { useToast } from '@/shared/context/toast'
import { useMapSettings, useTestMapProvider, useUpdateMapSettings } from '@/modules/platform/system-settings/hooks'
import type { MapProviderName } from '@/modules/platform/system-settings/types'
import {
  ConfiguredBadge,
  SecretField,
  SettingFieldRow,
  SettingsError,
  SettingsFormActions,
  SettingsLoading,
  secretForUpdate,
} from '@/modules/platform/system-settings/components'

const PROVIDERS: MapProviderName[] = ['ola', 'google', 'mappls']

type ProviderForm = {
  enabled: boolean
  apiKey: string
  clientId: string
  clientSecret: string
  baseUrl: string
}

export const MapSettingsPage: React.FC = () => {
  const { data, isLoading, isError } = useMapSettings()
  const { mutate: save, isPending } = useUpdateMapSettings()
  const { mutate: test, isPending: isTesting } = useTestMapProvider()
  const { success, error } = useToast()
  const [primaryProvider, setPrimaryProvider] = useState<MapProviderName>('ola')
  const [fallbackProviders, setFallbackProviders] = useState<MapProviderName[]>([])
  const [providers, setProviders] = useState<Record<MapProviderName, ProviderForm>>({
    ola: { enabled: false, apiKey: '', clientId: '', clientSecret: '', baseUrl: '' },
    google: { enabled: false, apiKey: '', clientId: '', clientSecret: '', baseUrl: '' },
    mappls: { enabled: false, apiKey: '', clientId: '', clientSecret: '', baseUrl: '' },
  })

  useEffect(() => {
    if (!data) return
    setPrimaryProvider(data.primaryProvider as MapProviderName)
    setFallbackProviders(data.fallbackProviders as MapProviderName[])
    setProviders({
      ola: {
        enabled: data.providers.ola.enabled,
        apiKey: data.providers.ola.apiKey ?? '',
        clientId: '',
        clientSecret: '',
        baseUrl: data.providers.ola.baseUrl ?? '',
      },
      google: {
        enabled: data.providers.google.enabled,
        apiKey: data.providers.google.apiKey ?? '',
        clientId: '',
        clientSecret: '',
        baseUrl: data.providers.google.baseUrl ?? '',
      },
      mappls: {
        enabled: data.providers.mappls.enabled,
        apiKey: '',
        clientId: data.providers.mappls.clientId ?? '',
        clientSecret: data.providers.mappls.clientSecret ?? '',
        baseUrl: data.providers.mappls.baseUrl ?? '',
      },
    })
  }, [data])

  const toggleFallback = (name: MapProviderName) => {
    setFallbackProviders((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name],
    )
  }

  const updateProvider = (name: MapProviderName, patch: Partial<ProviderForm>) => {
    setProviders((prev) => ({ ...prev, [name]: { ...prev[name], ...patch } }))
  }

  const handleSave = () => {
    save(
      {
        primaryProvider,
        fallbackProviders,
        expectedVersion: data?.version,
        providers: {
          ola: {
            enabled: providers.ola.enabled,
            apiKey: secretForUpdate(providers.ola.apiKey, data?.providers.ola.apiKey ?? ''),
            baseUrl: providers.ola.baseUrl || undefined,
          },
          google: {
            enabled: providers.google.enabled,
            apiKey: secretForUpdate(providers.google.apiKey, data?.providers.google.apiKey ?? ''),
            baseUrl: providers.google.baseUrl || undefined,
          },
          mappls: {
            enabled: providers.mappls.enabled,
            clientId: providers.mappls.clientId || undefined,
            clientSecret: secretForUpdate(
              providers.mappls.clientSecret,
              data?.providers.mappls.clientSecret ?? '',
            ),
            baseUrl: providers.mappls.baseUrl || undefined,
          },
        },
      },
      {
        onSuccess: () => success('Settings saved', 'Map settings were updated.'),
        onError: (err) =>
          error('Save failed', err instanceof Error ? err.message : 'Could not save settings'),
      },
    )
  }

  const handleTest = () => {
    const provider = providers[primaryProvider]
    test(
      {
        providerName: primaryProvider,
        apiKey: provider.apiKey || undefined,
        clientId: provider.clientId || undefined,
        clientSecret: provider.clientSecret || undefined,
        baseUrl: provider.baseUrl || undefined,
      },
      {
        onSuccess: (result) =>
          result.ok
            ? success('Test passed', result.message)
            : error('Test failed', result.message),
        onError: (err) =>
          error('Test failed', err instanceof Error ? err.message : 'Could not test provider'),
      },
    )
  }

  if (isLoading) return <SettingsLoading />
  if (isError || !data) return <SettingsError />

  return (
    <div className="space-y-4 max-w-3xl">
      <Card className="premium-card">
        <CardContent className="p-6 space-y-4">
          <SettingFieldRow label="Primary provider">
            <select
              value={primaryProvider}
              onChange={(e) => setPrimaryProvider(e.target.value as MapProviderName)}
              className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm dark:bg-slate-900"
            >
              {PROVIDERS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </SettingFieldRow>
          <SettingFieldRow label="Fallback providers" hint="Select providers used when primary fails">
            <div className="flex flex-wrap gap-3">
              {PROVIDERS.filter((p) => p !== primaryProvider).map((name) => (
                <label key={name} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={fallbackProviders.includes(name)}
                    onChange={() => toggleFallback(name)}
                    className="rounded border-border"
                  />
                  {name}
                </label>
              ))}
            </div>
          </SettingFieldRow>
        </CardContent>
      </Card>

      {PROVIDERS.map((name) => (
        <Card key={name} className="premium-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold capitalize">{name}</p>
              <ConfiguredBadge configured={data.providers[name].configured} />
            </div>
            <SettingFieldRow label="Enabled">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={providers[name].enabled}
                  onChange={(e) => updateProvider(name, { enabled: e.target.checked })}
                  className="rounded border-border"
                />
                Enable {name} provider
              </label>
            </SettingFieldRow>
            {name === 'mappls' ? (
              <>
                <SettingFieldRow label="Client ID">
                  <Input
                    value={providers[name].clientId}
                    onChange={(e) => updateProvider(name, { clientId: e.target.value })}
                  />
                </SettingFieldRow>
                <SecretField
                  label="Client secret"
                  value={providers[name].clientSecret}
                  onChange={(v) => updateProvider(name, { clientSecret: v })}
                  configured={data.providers.mappls.configured}
                />
              </>
            ) : (
              <SecretField
                label="API key"
                value={providers[name].apiKey}
                onChange={(v) => updateProvider(name, { apiKey: v })}
                configured={data.providers[name].configured}
              />
            )}
            <SettingFieldRow label="Base URL">
              <Input
                value={providers[name].baseUrl}
                onChange={(e) => updateProvider(name, { baseUrl: e.target.value })}
                placeholder="Optional override"
              />
            </SettingFieldRow>
          </CardContent>
        </Card>
      ))}

      <SettingsFormActions
        onSave={handleSave}
        isSaving={isPending}
        onTest={handleTest}
        isTesting={isTesting}
        testLabel="Test primary provider"
      />
    </div>
  )
}

export default MapSettingsPage
