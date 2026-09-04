import React, { useEffect, useState } from 'react';
import {
  mapSettingsService,
  type MapProviderName,
  type MapSettingsView,
  type TestProviderHealthInput,
  type TestProviderHealthResult,
  type UpdateMapSettingsPayload,
} from '../services/map-settings.service';

/** Marks a credential the API reports as stored, without revealing it. */
const ConfiguredBadge: React.FC<{ configured: boolean }> = ({ configured }) =>
  configured ? (
    <span className="ml-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
      stored
    </span>
  ) : (
    <span className="ml-2 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
      not set
    </span>
  );

export const MapSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState<MapSettingsView | null>(null);

  // Form State
  //
  // Secret inputs always start blank. The API never returns a stored credential,
  // only `configured`, so there is nothing to prefill — an empty box means
  // "leave whatever is stored alone", not "no key set". The badge next to each
  // label is what tells the admin a key is already there.
  const [selectedProvider, setSelectedProvider] = useState<MapProviderName>('ola');
  const [olaApiKey, setOlaApiKey] = useState('');
  const [olaClientSdkKey, setOlaClientSdkKey] = useState('');
  const [olaBaseUrl, setOlaBaseUrl] = useState('');
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [googleClientSdkKey, setGoogleClientSdkKey] = useState('');
  const [googleBaseUrl, setGoogleBaseUrl] = useState('');
  const [mapplsRestApiKey, setMapplsRestApiKey] = useState('');
  const [mapplsClientId, setMapplsClientId] = useState('');
  const [mapplsClientSecret, setMapplsClientSecret] = useState('');
  const [mapplsClientSdkKey, setMapplsClientSdkKey] = useState('');
  const [mapplsBaseUrl, setMapplsBaseUrl] = useState('');

  // UI Feedback State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestProviderHealthResult | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await mapSettingsService.getMapSettings();
      setSettings(data);
      setSelectedProvider(data.primaryProvider);
      // Only non-secret values are prefilled. The credential inputs stay blank.
      setOlaBaseUrl(data.providers.ola.baseUrl ?? '');
      setGoogleBaseUrl(data.providers.google.baseUrl ?? '');
      setMapplsBaseUrl(data.providers.mappls.baseUrl ?? '');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? err.message ?? 'Failed to load map settings';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setErrorMsg(null);
      setTestResult(null);

      // Anything left blank is omitted, and the backend probes the stored
      // credential instead — so "Test Connection" on an untouched form checks
      // what is actually live, not an empty string.
      const payload: TestProviderHealthInput = { providerName: selectedProvider };
      if (selectedProvider === 'ola') {
        if (olaApiKey) payload.apiKey = olaApiKey;
        if (olaBaseUrl) payload.baseUrl = olaBaseUrl;
      } else if (selectedProvider === 'google') {
        if (googleApiKey) payload.apiKey = googleApiKey;
        if (googleBaseUrl) payload.baseUrl = googleBaseUrl;
      } else if (selectedProvider === 'mappls') {
        if (mapplsRestApiKey) payload.restApiKey = mapplsRestApiKey;
        if (mapplsClientId) payload.clientId = mapplsClientId;
        if (mapplsClientSecret) payload.clientSecret = mapplsClientSecret;
        if (mapplsBaseUrl) payload.baseUrl = mapplsBaseUrl;
      }

      const result = await mapSettingsService.testProviderHealth(payload);
      setTestResult(result);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? err.message ?? 'Health test failed';
      setTestResult({
        ok: false,
        providerName: selectedProvider,
        message: msg,
        responseTimeMs: 0,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      // Only the active provider's block is sent: the backend rejects enabling
      // any provider other than the primary. A blank field is omitted so the
      // stored credential survives a save that only changes the base URL.
      const providers: NonNullable<UpdateMapSettingsPayload['providers']> = {};

      if (selectedProvider === 'ola') {
        const ola: NonNullable<typeof providers.ola> = {};
        if (olaApiKey) ola.apiKey = olaApiKey;
        if (olaClientSdkKey) ola.clientSdkKey = olaClientSdkKey;
        if (olaBaseUrl) ola.baseUrl = olaBaseUrl;
        if (Object.keys(ola).length > 0) providers.ola = ola;
      }
      if (selectedProvider === 'google') {
        const google: NonNullable<typeof providers.google> = {};
        if (googleApiKey) google.apiKey = googleApiKey;
        if (googleClientSdkKey) google.clientSdkKey = googleClientSdkKey;
        if (googleBaseUrl) google.baseUrl = googleBaseUrl;
        if (Object.keys(google).length > 0) providers.google = google;
      }
      if (selectedProvider === 'mappls') {
        const mappls: NonNullable<typeof providers.mappls> = {};
        if (mapplsRestApiKey) mappls.restApiKey = mapplsRestApiKey;
        if (mapplsClientId) mappls.clientId = mapplsClientId;
        if (mapplsClientSecret) mappls.clientSecret = mapplsClientSecret;
        if (mapplsClientSdkKey) mappls.clientSdkKey = mapplsClientSdkKey;
        if (mapplsBaseUrl) mappls.baseUrl = mapplsBaseUrl;
        if (Object.keys(mappls).length > 0) providers.mappls = mappls;
      }

      const payload: UpdateMapSettingsPayload = {
        primaryProvider: selectedProvider,
        ...(settings?.version !== undefined ? { expectedVersion: settings.version } : {}),
        ...(Object.keys(providers).length > 0 ? { providers } : {}),
      };

      const updated = await mapSettingsService.updateMapSettings(payload);
      setSettings(updated);
      // Credentials are stored; clear the inputs so a stale secret cannot be
      // resubmitted by a later save that was only meant to change something else.
      setOlaApiKey('');
      setOlaClientSdkKey('');
      setGoogleApiKey('');
      setGoogleClientSdkKey('');
      setMapplsRestApiKey('');
      setMapplsClientId('');
      setMapplsClientSecret('');
      setMapplsClientSdkKey('');
      setSuccessMsg(`Successfully activated '${selectedProvider}' as the active map provider.`);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? err.message ?? 'Failed to update map settings';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-600">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        Loading Map Provider Settings...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-800">Map Provider Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure the active map provider for route distance calculation, address search, and driver ETAs.
          <span className="font-semibold text-amber-600 ml-1">
            (Policy: Exactly ONE active provider at any time)
          </span>
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm font-medium">
          ⚠️ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-sm font-medium">
          ✅ {successMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Active Provider Selection */}
        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Active Map Provider</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['ola', 'google', 'mappls'] as const).map((prov) => (
              <label
                key={prov}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedProvider === prov
                    ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="activeProvider"
                  value={prov}
                  checked={selectedProvider === prov}
                  onChange={() => setSelectedProvider(prov)}
                  className="mr-3"
                />
                <span className="capitalize">{prov} Maps</span>
              </label>
            ))}
          </div>
        </div>

        {/* Credentials Form per Provider */}
        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-slate-800">Provider Credentials</h2>

          <p className="text-xs text-slate-500 -mt-2">
            Leave a credential field blank to keep the value already stored. Saved secrets are never
            sent back to this page.
          </p>

          {selectedProvider === 'ola' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ola Maps API Key (server)
                  <ConfiguredBadge configured={settings?.providers.ola.configured ?? false} />
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={olaApiKey}
                  onChange={(e) => setOlaApiKey(e.target.value)}
                  placeholder="Enter Ola API Key..."
                  className="w-full p-2.5 border rounded-md font-mono text-sm focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Used by the backend for routing, geocoding and ETAs. Never sent to a browser or
                  mobile app.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ola Client SDK Key (maps &amp; tiles)
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={olaClientSdkKey}
                  onChange={(e) => setOlaClientSdkKey(e.target.value)}
                  placeholder="Enter platform-restricted client SDK key..."
                  className="w-full p-2.5 border rounded-md font-mono text-sm focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Sent to the admin live map and the mobile apps. Use a separate, platform-restricted
                  key — without it, map tiles will not render.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ola Base URL (Optional)</label>
                <input
                  type="text"
                  value={olaBaseUrl}
                  onChange={(e) => setOlaBaseUrl(e.target.value)}
                  placeholder="https://api.olamaps.io"
                  className="w-full p-2.5 border rounded-md font-mono text-sm"
                />
              </div>
            </div>
          )}

          {selectedProvider === 'google' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Google Maps API Key (server)
                  <ConfiguredBadge configured={settings?.providers.google.configured ?? false} />
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={googleApiKey}
                  onChange={(e) => setGoogleApiKey(e.target.value)}
                  placeholder="Enter Google API Key..."
                  className="w-full p-2.5 border rounded-md font-mono text-sm focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Used by the backend for routing, geocoding and ETAs. Never sent to a browser or
                  mobile app.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Google Client SDK Key (maps &amp; tiles)
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={googleClientSdkKey}
                  onChange={(e) => setGoogleClientSdkKey(e.target.value)}
                  placeholder="Enter platform-restricted client SDK key..."
                  className="w-full p-2.5 border rounded-md font-mono text-sm focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Sent to the admin live map and the mobile apps. Restrict it by HTTP referrer,
                  Android package or iOS bundle ID.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Google Base URL (Optional)</label>
                <input
                  type="text"
                  value={googleBaseUrl}
                  onChange={(e) => setGoogleBaseUrl(e.target.value)}
                  placeholder="https://maps.googleapis.com"
                  className="w-full p-2.5 border rounded-md font-mono text-sm"
                />
              </div>
            </div>
          )}

          {selectedProvider === 'mappls' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded p-3">
                Mappls accepts either a <strong>REST API key</strong> or an <strong>OAuth pair</strong>{' '}
                (Client ID + Client Secret). The backend prefers the REST key when both are present.
                Supply one or the other — a Client ID with no Secret is treated as a REST key.
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mappls REST API Key
                  <ConfiguredBadge configured={settings?.providers.mappls.configured ?? false} />
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={mapplsRestApiKey}
                  onChange={(e) => setMapplsRestApiKey(e.target.value)}
                  placeholder="Enter Mappls REST API Key..."
                  className="w-full p-2.5 border rounded-md font-mono text-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mappls Client ID (OAuth)</label>
                <input
                  type="text"
                  value={mapplsClientId}
                  onChange={(e) => setMapplsClientId(e.target.value)}
                  placeholder="Enter Mappls Client ID..."
                  className="w-full p-2.5 border rounded-md font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mappls Client Secret (OAuth)</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={mapplsClientSecret}
                  onChange={(e) => setMapplsClientSecret(e.target.value)}
                  placeholder="Enter Mappls Client Secret..."
                  className="w-full p-2.5 border rounded-md font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mappls Client SDK Key (maps &amp; tiles)
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={mapplsClientSdkKey}
                  onChange={(e) => setMapplsClientSdkKey(e.target.value)}
                  placeholder="Enter tile / SDK license key..."
                  className="w-full p-2.5 border rounded-md font-mono text-sm focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Embedded in raster tile URLs sent to browsers and mobile apps. Use a separate
                  license key — the REST key above is no longer used as a tile key.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mappls Base URL (Optional)</label>
                <input
                  type="text"
                  value={mapplsBaseUrl}
                  onChange={(e) => setMapplsBaseUrl(e.target.value)}
                  placeholder="https://route.mappls.com/route/direction"
                  className="w-full p-2.5 border rounded-md font-mono text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Controls & Health Test Result */}
        <div className="bg-white p-6 rounded-lg border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || saving}
            className="w-full md:w-auto px-5 py-2.5 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium text-sm disabled:opacity-50"
          >
            {testing ? 'Testing Connectivity...' : `Test Connection (${selectedProvider.toUpperCase()})`}
          </button>

          <button
            type="submit"
            disabled={saving || testing}
            className="w-full md:w-auto px-6 py-2.5 bg-primary text-white rounded-md hover:bg-primary/90 font-medium text-sm disabled:opacity-50"
          >
            {saving ? 'Saving & Activating...' : 'Save & Activate Configuration'}
          </button>
        </div>

        {testResult && (
          <div
            className={`p-4 rounded-md border text-sm font-medium ${
              testResult.ok
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {testResult.ok ? '✅' : '❌'} {testResult.message} ({testResult.responseTimeMs}ms)
          </div>
        )}
      </form>
    </div>
  );
};
