import React, { useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { useToast } from '@/shared/context/toast'
import { api, API_ENDPOINTS } from '@/infrastructure/api'
import { useMapClientConfig } from '@/shared/hooks/useMapClientConfig'
import { useTestMapProvider } from '../../hooks'
import type { MapProviderName, TestProviderHealthResult } from '../../types'
import { Activity, CheckCircle2, XCircle, Clock, Copy, Code2 } from 'lucide-react'

/** Mirrors the backend `ForwardGeocodeResult`. There is no confidence score. */
interface ForwardGeocodeResult {
  formattedAddress: string
  latitude: number
  longitude: number
  city: string
  state: string
  pincode: string
  providerName: string
}

interface MapTestConsoleProps {
  primaryProvider: MapProviderName
  activeCredentials: {
    apiKey?: string
    restApiKey?: string
    clientId?: string
    clientSecret?: string
    baseUrl?: string
  }
}

export const MapTestConsole: React.FC<MapTestConsoleProps> = ({ primaryProvider, activeCredentials }) => {
  const { mutate: testProvider, isPending: isTesting } = useTestMapProvider()
  const { data: clientConfig, refetch: refetchClientConfig, isFetching: isFetchingConfig } = useMapClientConfig()
  const { success, error } = useToast()

  const [activeTab, setActiveTab] = useState<'health' | 'config' | 'geocoding'>('health')
  const [testResult, setTestResult] = useState<TestProviderHealthResult | null>(null)
  const [testAddress, setTestAddress] = useState<string>('Lal Chowk, Srinagar, Jammu & Kashmir 190001')
  const [geocodingResult, setGeocodingResult] = useState<ForwardGeocodeResult | null>(null)
  const [geocodingError, setGeocodingError] = useState<string | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)

  const handleProbeHealth = () => {
    testProvider(
      {
        providerName: primaryProvider,
        ...(activeCredentials.apiKey ? { apiKey: activeCredentials.apiKey } : {}),
        ...(activeCredentials.restApiKey ? { restApiKey: activeCredentials.restApiKey } : {}),
        ...(activeCredentials.clientId ? { clientId: activeCredentials.clientId } : {}),
        ...(activeCredentials.clientSecret ? { clientSecret: activeCredentials.clientSecret } : {}),
        ...(activeCredentials.baseUrl ? { baseUrl: activeCredentials.baseUrl } : {}),
      },
      {
        onSuccess: (res) => {
          setTestResult(res)
          if (res.ok) {
            success('Provider Probe Healthy', `${primaryProvider.toUpperCase()} maps responded in ${res.responseTimeMs}ms`)
          } else {
            error('Probe Failed', res.message)
          }
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : 'Probe execution failed'
          setTestResult({
            ok: false,
            providerName: primaryProvider,
            message: msg,
            responseTimeMs: 0,
          })
          error('Probe Error', msg)
        },
      },
    )
  }

  // Real forward geocode through the backend, resolved by the configured provider.
  const handleTestGeocoding = async () => {
    const address = testAddress.trim()
    if (!address) return

    setIsGeocoding(true)
    setGeocodingError(null)
    try {
      const res = await api.post<{ data: ForwardGeocodeResult }>(API_ENDPOINTS.maps.geocode, {
        address,
      })
      setGeocodingResult(res.data.data)
      success('Geocoding Succeeded', `${res.data.data.providerName} resolved the address.`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Geocoding request failed'
      setGeocodingResult(null)
      setGeocodingError(msg)
      error('Geocoding Failed', msg)
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleCopyJson = () => {
    if (!clientConfig) return
    navigator.clipboard.writeText(JSON.stringify(clientConfig, null, 2))
    success('Copied to Clipboard', 'Client SDK config JSON copied.')
  }

  return (
    <Card className="premium-card rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
      <CardContent className="p-5 space-y-4">
        {/* Studio Console Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              SDK Probe & Test Studio
            </h3>
          </div>

          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('health')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === 'health'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Health Probe
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('geocoding')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === 'geocoding'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Geocode Test
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === 'config'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Client SDK Config
            </button>
          </div>
        </div>

        {/* TAB 1: HEALTH PROBE */}
        {activeTab === 'health' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  Provider Health & API Ping
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Executes a live network probe against <span className="font-semibold capitalize text-primary">{primaryProvider}</span> APIs.
                </p>
              </div>

              <Button
                type="button"
                variant="primary"
                onClick={handleProbeHealth}
                loading={isTesting}
                className="text-xs"
              >
                Run Health Probe
              </Button>
            </div>

            {testResult && (
              <div
                className={`p-4 rounded-xl border transition-all ${
                  testResult.ok
                    ? 'bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/50'
                    : 'bg-red-50/80 border-red-200 dark:bg-red-950/20 dark:border-red-800/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    {testResult.ok ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                    )}
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                        {testResult.ok ? 'Probe Passed — Provider Reachable' : 'Probe Failed'}
                      </span>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">
                        {testResult.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border text-xs font-bold text-foreground shrink-0">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{testResult.responseTimeMs} ms</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GEOCODING TEST */}
        {activeTab === 'geocoding' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Test Destination / Search Address
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={testAddress}
                  onChange={(e) => setTestAddress(e.target.value)}
                  placeholder="Enter test location or city..."
                  className="flex-1 h-9 rounded-xl border border-input bg-card px-3.5 text-xs text-foreground focus:border-primary focus:outline-none dark:bg-slate-900"
                />
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleTestGeocoding}
                  loading={isGeocoding}
                  disabled={isGeocoding || !testAddress.trim()}
                  className="text-xs"
                >
                  Resolve Address
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Sends a real forward-geocode request to the configured provider via the backend.
              </p>
            </div>

            {geocodingError ? (
              <div className="p-4 rounded-xl bg-red-50/80 border border-red-200 dark:bg-red-950/20 dark:border-red-800/50 text-xs">
                <div className="flex items-center gap-2.5">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                      Geocoding failed
                    </span>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">
                      {geocodingError}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {geocodingResult && (
              <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs space-y-2">
                <div className="flex items-center justify-between text-muted-foreground font-medium">
                  <span>Resolved by:</span>
                  <span className="font-bold text-primary capitalize">
                    {geocodingResult.providerName}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 text-muted-foreground font-medium">
                  <span className="shrink-0">Matched address:</span>
                  <span className="font-bold text-foreground text-right">
                    {geocodingResult.formattedAddress || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground font-medium">
                  <span>Coordinates:</span>
                  <span className="font-bold text-primary font-mono">
                    {geocodingResult.latitude}°, {geocodingResult.longitude}°
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground font-medium">
                  <span>City / State / PIN:</span>
                  <span className="font-bold text-foreground">
                    {[geocodingResult.city, geocodingResult.state, geocodingResult.pincode]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CLIENT SDK CONFIG INSPECTOR */}
        {activeTab === 'config' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Code2 className="w-4 h-4 text-primary" />
                <span>Live Client Config Payload (served to web and mobile apps)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => refetchClientConfig()}
                  disabled={isFetchingConfig}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {isFetchingConfig ? 'Refreshing...' : 'Refresh JSON'}
                </button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyJson}
                  className="gap-1 text-xs"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </Button>
              </div>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto border border-slate-800 max-h-48 leading-relaxed">
              {clientConfig
                ? JSON.stringify(clientConfig, null, 2)
                : '// Click Refresh to load active client SDK payload'}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default MapTestConsole
