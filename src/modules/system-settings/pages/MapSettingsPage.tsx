import React, { useEffect, useState } from 'react';
import {
  mapSettingsService,
  MapProviderName,
  MapSettingsView,
  TestProviderHealthResult,
} from '../services/map-settings.service';

export const MapSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState<MapSettingsView | null>(null);

  // Form State
  const [selectedProvider, setSelectedProvider] = useState<MapProviderName>('ola');
  const [olaApiKey, setOlaApiKey] = useState('');
  const [olaBaseUrl, setOlaBaseUrl] = useState('');
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [googleBaseUrl, setGoogleBaseUrl] = useState('');
  const [mapplsClientId, setMapplsClientId] = useState('');
  const [mapplsClientSecret, setMapplsClientSecret] = useState('');
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
      setOlaApiKey(data.providers.ola.apiKey ?? '');
      setOlaBaseUrl(data.providers.ola.baseUrl ?? '');
      setGoogleApiKey(data.providers.google.apiKey ?? '');
      setGoogleBaseUrl(data.providers.google.baseUrl ?? '');
      setMapplsClientId(data.providers.mappls.clientId ?? '');
      setMapplsClientSecret(data.providers.mappls.clientSecret ?? '');
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

      const payload: any = { providerName: selectedProvider };
      if (selectedProvider === 'ola') {
        if (olaApiKey && !olaApiKey.startsWith('***')) payload.apiKey = olaApiKey;
        if (olaBaseUrl) payload.baseUrl = olaBaseUrl;
      } else if (selectedProvider === 'google') {
        if (googleApiKey && !googleApiKey.startsWith('***')) payload.apiKey = googleApiKey;
        if (googleBaseUrl) payload.baseUrl = googleBaseUrl;
      } else if (selectedProvider === 'mappls') {
        if (mapplsClientId && !mapplsClientId.startsWith('***')) payload.clientId = mapplsClientId;
        if (mapplsClientSecret && !mapplsClientSecret.startsWith('***')) payload.clientSecret = mapplsClientSecret;
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

      const payload: any = {
        primaryProvider: selectedProvider,
        fallbackProviders: [], // Strict single active provider rule
        expectedVersion: settings?.version,
        providers: {},
      };

      if (selectedProvider === 'ola' && olaApiKey && !olaApiKey.startsWith('***')) {
        payload.providers.ola = { apiKey: olaApiKey, ...(olaBaseUrl ? { baseUrl: olaBaseUrl } : {}) };
      }
      if (selectedProvider === 'google' && googleApiKey && !googleApiKey.startsWith('***')) {
        payload.providers.google = { apiKey: googleApiKey, ...(googleBaseUrl ? { baseUrl: googleBaseUrl } : {}) };
      }
      if (selectedProvider === 'mappls') {
        const mapplsPayload: any = {};
        if (mapplsClientId && !mapplsClientId.startsWith('***')) mapplsPayload.clientId = mapplsClientId;
        if (mapplsClientSecret && !mapplsClientSecret.startsWith('***')) mapplsPayload.clientSecret = mapplsClientSecret;
        if (mapplsBaseUrl) mapplsPayload.baseUrl = mapplsBaseUrl;
        if (Object.keys(mapplsPayload).length > 0) payload.providers.mappls = mapplsPayload;
      }

      const updated = await mapSettingsService.updateMapSettings(payload);
      setSettings(updated);
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

          {selectedProvider === 'ola' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ola Maps API Key</label>
                <input
                  type="password"
                  value={olaApiKey}
                  onChange={(e) => setOlaApiKey(e.target.value)}
                  placeholder="Enter Ola API Key..."
                  className="w-full p-2.5 border rounded-md font-mono text-sm focus:ring-2 focus:ring-primary/20"
                />
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Google Maps API Key</label>
                <input
                  type="password"
                  value={googleApiKey}
                  onChange={(e) => setGoogleApiKey(e.target.value)}
                  placeholder="Enter Google API Key..."
                  className="w-full p-2.5 border rounded-md font-mono text-sm focus:ring-2 focus:ring-primary/20"
                />
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mappls Client ID</label>
                <input
                  type="text"
                  value={mapplsClientId}
                  onChange={(e) => setMapplsClientId(e.target.value)}
                  placeholder="Enter Mappls Client ID..."
                  className="w-full p-2.5 border rounded-md font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mappls Client Secret</label>
                <input
                  type="password"
                  value={mapplsClientSecret}
                  onChange={(e) => setMapplsClientSecret(e.target.value)}
                  placeholder="Enter Mappls Client Secret..."
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
