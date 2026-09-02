import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { useToast } from '@/shared/context/toast'
import { useMapSettings, useTestMapProvider, useUpdateMapSettings } from '@/modules/platform/system-settings/hooks'
import type { MapProviderName } from '@/modules/platform/system-settings/types'
import {
  ConfiguredBadge,
  MASKED_SECRET,
  SecretField,
  SettingFieldRow,
  SettingsError,
  SettingsFormActions,
  SettingsLoading,
  secretForUpdate,
} from '@/modules/platform/system-settings/components'

const PROVIDERS: MapProviderName[] = ['ola', 'google', 'mappls']

type ProviderForm = {
  apiKey: string
  restApiKey: string
  clientId: string
  clientSecret: string
  baseUrl: string
}

const emptyProvider = (): ProviderForm => ({
  apiKey: '',
  restApiKey: '',
  clientId: '',
  clientSecret: '',
  baseUrl: '',
})

export const MapSettingsPage: React.FC = () => {
  const { data, isLoading, isError } = useMapSettings()
  const { mutate: save, isPending } = useUpdateMapSettings()
  const { mutate: test, isPending: isTesting } = useTestMapProvider()
  const { success, error } = useToast()
  const [primaryProvider, setPrimaryProvider] = useState<MapProviderName>('ola')
  const [providers, setProviders] = useState<Record<MapProviderName, ProviderForm>>({
    ola: emptyProvider(),
    google: emptyProvider(),
    mappls: emptyProvider(),
  })

  useEffect(() => {
    if (!data) return
    setPrimaryProvider(data.primaryProvider as MapProviderName)
    setProviders({
      ola: {
        apiKey: data.providers.ola.configured ? MASKED_SECRET : '',
        restApiKey: '',
        clientId: '',
        clientSecret: '',
        baseUrl: data.providers.ola.baseUrl ?? '',
      },
      google: {
        apiKey: data.providers.google.configured ? MASKED_SECRET : '',
        restApiKey: '',
        clientId: '',
        clientSecret: '',
        baseUrl: data.providers.google.baseUrl ?? '',
      },
      mappls: {
        apiKey: '',
        restApiKey: data.providers.mappls.configured ? MASKED_SECRET : '',
        clientId: '',
        clientSecret: '',
        baseUrl: data.providers.mappls.baseUrl ?? '',
      },
    })
  }, [data])

  const updateProvider = (name: MapProviderName, patch: Partial<ProviderForm>) => {
    setProviders((prev) => ({ ...prev, [name]: { ...prev[name], ...patch } }))
  }

  const handleSave = () => {
    const active = providers[primaryProvider]
    const providersPayload =
      primaryProvider === 'mappls'
        ? {
            mappls: {
              restApiKey: secretForUpdate(
                active.restApiKey,
                data?.providers.mappls.configured ? MASKED_SECRET : '',
              ),
              clientId: active.clientId || undefined,
              clientSecret: secretForUpdate(
                active.clientSecret,
                data?.providers.mappls.configured ? MASKED_SECRET : '',
              ),
              baseUrl: active.baseUrl || undefined,
            },
          }
        : {
            [primaryProvider]: {
              apiKey: secretForUpdate(
                active.apiKey,
                data?.providers[primaryProvider].configured ? MASKED_SECRET : '',
              ),
              baseUrl: active.baseUrl || undefined,
            },
          }

    save(
      {
        primaryProvider,
        expectedVersion: data?.version,
        providers: providersPayload,
      },
      {
        onSuccess: () => {
          setProviders((prev) => ({
            ...prev,
            [primaryProvider]: {
              ...prev[primaryProvider],
              apiKey:
                primaryProvider !== 'mappls' && data?.providers[primaryProvider].configured
                  ? MASKED_SECRET
                  : '',
              restApiKey:
                primaryProvider === 'mappls' && data?.providers.mappls.configured
                  ? MASKED_SECRET
                  : '',
              clientId: '',
              clientSecret:
                primaryProvider === 'mappls' && data?.providers.mappls.configured
                  ? MASKED_SECRET
                  : '',
            },
          }))
          success('Settings saved', `Active map provider set to ${primaryProvider}.`)
        },
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
        ...(provider.apiKey ? { apiKey: provider.apiKey } : {}),
        ...(provider.restApiKey ? { restApiKey: provider.restApiKey } : {}),
        ...(provider.clientId ? { clientId: provider.clientId } : {}),
        ...(provider.clientSecret ? { clientSecret: provider.clientSecret } : {}),
        ...(provider.baseUrl ? { baseUrl: provider.baseUrl } : {}),
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

  const active = providers[primaryProvider]

  return (
    <div className="space-y-4 max-w-3xl">
      <Card className="premium-card">
        <CardContent className="p-6 space-y-4">
          <SettingFieldRow
            label="Active provider"
            hint="Exactly one map provider is active. There is no fallback — pick Ola, Google, or Mappls."
          >
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
        </CardContent>
      </Card>

      <Card className="premium-card">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold capitalize">{primaryProvider}</p>
            <ConfiguredBadge configured={data.providers[primaryProvider].configured} />
          </div>

          {primaryProvider === 'mappls' ? (
            <>
              <SecretField
                label="REST API key"
                value={active.restApiKey}
                onChange={(v) => updateProvider('mappls', { restApiKey: v })}
                configured={data.providers.mappls.configured}
              />
              <SettingFieldRow label="OAuth Client ID (optional)">
                <Input
                  type="password"
                  value={active.clientId}
                  onChange={(e) => updateProvider('mappls', { clientId: e.target.value })}
                  placeholder="Only if using OAuth instead of REST key"
                  autoComplete="off"
                />
              </SettingFieldRow>
              <SecretField
                label="OAuth Client secret (optional)"
                value={active.clientSecret}
                onChange={(v) => updateProvider('mappls', { clientSecret: v })}
                configured={data.providers.mappls.configured}
              />
              <p className="text-[11px] text-muted-foreground">
                Use either the REST API key alone (from auth.mappls.com/console → Credentials), or OAuth Client ID + secret together.
                Do not fill all three — mixing causes auth failures.
              </p>
            </>
          ) : (
            <SecretField
              label="API key"
              value={active.apiKey}
              onChange={(v) => updateProvider(primaryProvider, { apiKey: v })}
              configured={data.providers[primaryProvider].configured}
            />
          )}

          <SettingFieldRow label="Base URL">
            <Input
              value={active.baseUrl}
              onChange={(e) => updateProvider(primaryProvider, { baseUrl: e.target.value })}
              placeholder="Optional override"
            />
          </SettingFieldRow>
        </CardContent>
      </Card>

      <SettingsFormActions
        onSave={handleSave}
        isSaving={isPending}
        onTest={handleTest}
        isTesting={isTesting}
        testLabel="Test active provider"
      />
    </div>
  )
}

export default MapSettingsPage
