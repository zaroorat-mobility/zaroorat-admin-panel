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
import { MapStudioPreview, MapTestConsole } from '../components'
import { Globe, Cpu } from 'lucide-react'

const PROVIDER_METADATA: Record<MapProviderName, { label: string; badge: string; hint: string }> = {
  ola: {
    label: 'Ola Maps',
    badge: 'Recommended for India',
    hint: 'High-precision routing engine optimized for Indian traffic, auto-rickshaw lanes & highways.',
  },
  google: {
    label: 'Google Maps Platform',
    badge: 'Global Coverage',
    hint: 'Worldwide tile coverage, satellite view imagery, and global place geocoding.',
  },
  mappls: {
    label: 'Mappls (MapmyIndia)',
    badge: 'House-Level GIS',
    hint: 'Advanced Indian house-number level GIS and door-to-door navigation.',
  },
}

/**
 * What the platform routes through each provider. Mirrors the backend
 * DEFAULT_PROVIDER_CAPABILITIES; it is declared support, not a live probe, so it
 * is labelled as such. Use the Health Probe tab to test a provider for real.
 */
const PROVIDER_CAPABILITIES: Record<MapProviderName, string[]> = {
  ola: ['Autocomplete', 'Geocoding', 'Reverse geocoding', 'Routing', 'Distance matrix'],
  google: ['Autocomplete', 'Geocoding', 'Reverse geocoding', 'Routing', 'Distance matrix', 'Snap to road'],
  mappls: ['Autocomplete', 'Geocoding', 'Reverse geocoding', 'Routing', 'Distance matrix', 'Snap to road'],
}

const PROVIDERS: MapProviderName[] = ['ola', 'google', 'mappls']

type ProviderForm = {
  apiKey: string
  restApiKey: string
  clientId: string
  clientSecret: string
  clientSdkKey: string
  baseUrl: string
}

const emptyProvider = (): ProviderForm => ({
  apiKey: '',
  restApiKey: '',
  clientId: '',
  clientSecret: '',
  clientSdkKey: '',
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
        clientSdkKey: '',
        baseUrl: data.providers.ola.baseUrl ?? '',
      },
      google: {
        apiKey: data.providers.google.configured ? MASKED_SECRET : '',
        restApiKey: '',
        clientId: '',
        clientSecret: '',
        clientSdkKey: '',
        baseUrl: data.providers.google.baseUrl ?? '',
      },
      mappls: {
        apiKey: '',
        restApiKey: data.providers.mappls.configured ? MASKED_SECRET : '',
        clientId: '',
        clientSecret: '',
        clientSdkKey: '',
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
              clientSdkKey: active.clientSdkKey || undefined,
              baseUrl: active.baseUrl || undefined,
            },
          }
        : {
            [primaryProvider]: {
              apiKey: secretForUpdate(
                active.apiKey,
                data?.providers[primaryProvider].configured ? MASKED_SECRET : '',
              ),
              clientSdkKey: active.clientSdkKey || undefined,
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
              clientSdkKey: '',
            },
          }))
          success('Settings saved', `Active map provider set to ${PROVIDER_METADATA[primaryProvider].label}.`)
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
    <div className="space-y-6 w-full pb-10">
      {/* TOP CARD: Active Provider Tile Selector */}
      <Card className="premium-card">
        <CardContent className="p-6 space-y-4">
          <SettingFieldRow
            label="Active Map Provider"
            hint="Select the primary engine for route distance, fare calculation, address search, and ETAs. System policy requires exactly ONE active provider."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {PROVIDERS.map((name) => {
                const meta = PROVIDER_METADATA[name]
                const isSelected = primaryProvider === name
                const isConfigured = data.providers[name]?.configured ?? false

                return (
                  <div
                    key={name}
                    onClick={() => setPrimaryProvider(name)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer select-none space-y-2 relative ${
                      isSelected
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm ring-2 ring-primary/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="primaryProvider"
                          value={name}
                          checked={isSelected}
                          onChange={() => setPrimaryProvider(name)}
                          className="accent-primary cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {meta.label}
                        </span>
                      </div>
                      <ConfiguredBadge configured={isConfigured} />
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {meta.hint}
                    </p>

                    <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-primary">
                      {meta.badge}
                    </span>
                  </div>
                )
              })}
            </div>
          </SettingFieldRow>
        </CardContent>
      </Card>

      {/* DYNAMIC 2-COLUMN GRID LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Credentials & Provider Configuration (5 cols) */}
        <div className="xl:col-span-5 space-y-6">
          <Card className="premium-card">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {PROVIDER_METADATA[primaryProvider].label} Credentials & Keys
                  </h3>
                </div>
                <ConfiguredBadge configured={data.providers[primaryProvider].configured} />
              </div>

              {primaryProvider === 'mappls' ? (
                <div className="space-y-4">
                  <SecretField
                    label="REST API Key"
                    value={active.restApiKey}
                    onChange={(v) => updateProvider('mappls', { restApiKey: v })}
                    configured={data.providers.mappls.configured}
                    hint="Obtained from auth.mappls.com/console → Credentials."
                  />

                  <SettingFieldRow
                    label="OAuth Client ID (Optional)"
                    hint="Only required if using OAuth 2.0 authentication instead of REST key."
                  >
                    <Input
                      type="text"
                      value={active.clientId}
                      onChange={(e) => updateProvider('mappls', { clientId: e.target.value })}
                      placeholder="Enter Mappls OAuth Client ID"
                      autoComplete="off"
                    />
                  </SettingFieldRow>

                  <SecretField
                    label="OAuth Client Secret (Optional)"
                    value={active.clientSecret}
                    onChange={(v) => updateProvider('mappls', { clientSecret: v })}
                    configured={data.providers.mappls.configured}
                    hint="Do not combine REST API key with OAuth credentials."
                  />
                </div>
              ) : (
                <SecretField
                  label="Server API Key (Private)"
                  value={active.apiKey}
                  onChange={(v) => updateProvider(primaryProvider, { apiKey: v })}
                  configured={data.providers[primaryProvider].configured}
                  hint="Server-side API key used for backend routing, distance matrix, and geocoding probes."
                />
              )}

              <SettingFieldRow
                label="Client SDK Key — Served to Browsers"
                hint="Publishable SDK key for rendering map tiles in web and mobile apps. Non-secret publishable key."
              >
                <Input
                  type="text"
                  value={active.clientSdkKey}
                  onChange={(e) => updateProvider(primaryProvider, { clientSdkKey: e.target.value })}
                  placeholder="Leave blank to keep stored publishable SDK key"
                  autoComplete="off"
                />
              </SettingFieldRow>

              <SettingFieldRow
                label="Base URL Endpoint Override"
                hint="Custom endpoint Base URL if using a private enterprise proxy or staging environment."
              >
                <Input
                  value={active.baseUrl}
                  onChange={(e) => updateProvider(primaryProvider, { baseUrl: e.target.value })}
                  placeholder="e.g. https://api.olamaps.io (Optional)"
                />
              </SettingFieldRow>

              <SettingsFormActions
                onSave={handleSave}
                isSaving={isPending}
                onTest={handleTest}
                isTesting={isTesting}
                testLabel={`Test ${PROVIDER_METADATA[primaryProvider].label}`}
              />
            </CardContent>
          </Card>

          {/* Provider Capability Overview Card */}
          <Card className="premium-card bg-slate-50/50 dark:bg-slate-900/50">
            <CardContent className="p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {PROVIDER_METADATA[primaryProvider].label} — declared capabilities
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                What the platform routes through this provider. Not a live status check — run the
                Health Probe to test it.
              </p>
              <div className="space-y-2.5 text-xs">
                {PROVIDER_CAPABILITIES[primaryProvider].map((capability) => (
                  <div
                    key={capability}
                    className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-800 last:border-0"
                  >
                    <span className="text-slate-500">{capability}</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Supported</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Fallback policy</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    None — single active provider
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Interactive Live Map Studio & Probe Test Console (7 cols) */}
        <div className="xl:col-span-7 space-y-6">
          {/* Interactive Map Studio Preview */}
          <Card className="premium-card">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> Interactive Map Preview & Tile Studio
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Live tile preview, style switcher, draggable pickup/dropoff pins, and distance calculation simulator.
                </p>
              </div>
              <div className="h-[480px]">
                <MapStudioPreview providerName={primaryProvider} />
              </div>
            </CardContent>
          </Card>

          {/* SDK Probe & Test Console */}
          <MapTestConsole
            primaryProvider={primaryProvider}
            activeCredentials={{
              apiKey: active.apiKey,
              restApiKey: active.restApiKey,
              clientId: active.clientId,
              clientSecret: active.clientSecret,
              baseUrl: active.baseUrl,
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default MapSettingsPage
