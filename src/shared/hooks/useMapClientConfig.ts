import { useQuery } from '@tanstack/react-query'
import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { MapClientConfig } from '@/shared/utils/map-tiles'

export const useMapClientConfig = () =>
  useQuery({
    queryKey: ['settings', 'maps', 'client-config'],
    queryFn: async (): Promise<MapClientConfig> => {
      const response = await api.get<{ data: MapClientConfig }>(
        API_ENDPOINTS.settings.mapsClientConfig,
      )
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
