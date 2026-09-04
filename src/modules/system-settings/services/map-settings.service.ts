import { api as apiClient, API_ENDPOINTS } from '@/infrastructure/api';

export type MapProviderName = 'ola' | 'google' | 'mappls';

export interface MapProviderConfigView {
  enabled: boolean;
  configured: boolean;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  baseUrl?: string;
}

export interface MapSettingsView {
  primaryProvider: MapProviderName;
  fallbackProviders: MapProviderName[];
  version: number;
  providers: {
    ola: MapProviderConfigView;
    google: MapProviderConfigView;
    mappls: MapProviderConfigView;
  };
}

export interface UpdateMapSettingsPayload {
  primaryProvider: MapProviderName;
  fallbackProviders?: MapProviderName[];
  expectedVersion?: number;
  providers?: {
    ola?: { apiKey?: string; baseUrl?: string };
    google?: { apiKey?: string; baseUrl?: string };
    mappls?: { clientId?: string; clientSecret?: string; baseUrl?: string };
  };
}

export interface TestProviderHealthInput {
  providerName: MapProviderName;
  apiKey?: string;
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
    const response = await apiClient.get<{ data: MapSettingsView }>(API_ENDPOINTS.systemSettings.maps);
    return response.data.data;
  },

  async updateMapSettings(payload: UpdateMapSettingsPayload): Promise<MapSettingsView> {
    // Ensure strict single-provider rule (fallbackProviders = [])
    const requestBody: UpdateMapSettingsPayload = {
      ...payload,
      fallbackProviders: [],
    };
    const response = await apiClient.put<{ data: MapSettingsView }>(API_ENDPOINTS.systemSettings.maps, requestBody);
    return response.data.data;
  },

  async testProviderHealth(input: TestProviderHealthInput): Promise<TestProviderHealthResult> {
    const response = await apiClient.post<{ data: TestProviderHealthResult }>(API_ENDPOINTS.systemSettings.testMapHealth, input);
    return response.data.data;
  },
};
