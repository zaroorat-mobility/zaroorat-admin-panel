import { api as apiClient, API_ENDPOINTS } from '@/infrastructure/api';

export type MapProviderName = 'ola' | 'google' | 'mappls';

export type MapCapability =
  | 'autocomplete'
  | 'place_details'
  | 'geocode'
  | 'reverse_geocode'
  | 'route'
  | 'route_matrix'
  | 'snap_to_road';

/**
 * Mirrors the backend `MapProviderConfigView`.
 *
 * No credential fields on purpose: GET /admin/settings/maps never returns a
 * secret, only whether one is stored. The previous shape declared
 * `apiKey`/`clientId`/`clientSecret` and the page read them into its inputs —
 * they were always `undefined`.
 */
export interface MapProviderConfigView {
  enabled: boolean;
  configured: boolean;
  baseUrl?: string;
  capabilities: MapCapability[];
  lastHealthOk?: boolean;
  lastHealthAt?: string;
}

/// Exactly one provider is active; there is no fallback chain. The backend used
/// to return a `fallback` policy here, but it could never be populated — the
/// admin validator refused to enable any provider but the primary — so the
/// mechanism it described did not exist. Removed on both sides.
export interface MapSettingsView {
  primaryProvider: MapProviderName;
  version: number;
  providers: {
    ola: MapProviderConfigView;
    google: MapProviderConfigView;
    mappls: MapProviderConfigView;
  };
}

export interface UpdateMapSettingsPayload {
  primaryProvider: MapProviderName;
  expectedVersion?: number;
  providers?: {
    ola?: { apiKey?: string; clientSdkKey?: string; baseUrl?: string };
    google?: { apiKey?: string; clientSdkKey?: string; baseUrl?: string };
    mappls?: {
      restApiKey?: string;
      clientId?: string;
      clientSecret?: string;
      clientSdkKey?: string;
      baseUrl?: string;
    };
  };
}

export interface TestProviderHealthInput {
  providerName: MapProviderName;
  apiKey?: string;
  restApiKey?: string;
  clientId?: string;
  clientSecret?: string;
  baseUrl?: string;
}

export interface TestProviderHealthResult {
  ok: boolean;
  providerName: string;
  message: string;
  responseTimeMs: number;
}

export const mapSettingsService = {
  async getMapSettings(): Promise<MapSettingsView> {
    const response = await apiClient.get<{ data: MapSettingsView }>(API_ENDPOINTS.settings.maps);
    return response.data.data;
  },

  async updateMapSettings(payload: UpdateMapSettingsPayload): Promise<MapSettingsView> {
    // `fallbackProviders: []` used to be forced in here. The backend body schema
    // has no such field, so zod stripped it from every request; the single-active-
    // provider rule is enforced server-side by MapSettingsValidator regardless.
    const response = await apiClient.put<{ data: MapSettingsView }>(
      API_ENDPOINTS.settings.maps,
      payload,
    );
    return response.data.data;
  },

  async testProviderHealth(input: TestProviderHealthInput): Promise<TestProviderHealthResult> {
    const response = await apiClient.post<{ data: TestProviderHealthResult }>(
      API_ENDPOINTS.settings.mapsTest,
      input,
    );
    return response.data.data;
  },
};
