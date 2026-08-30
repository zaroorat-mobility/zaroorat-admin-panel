import { api, API_ENDPOINTS } from '@/infrastructure/api'

export interface SurgeZoneDetail {
  id: string
  cityCode: string
  name: string
  isActive: boolean
  createdAt: string
  boundary: number[][][]
}

export interface SurgeZoneListItem {
  id: string
  cityCode: string
  name: string
  isActive: boolean
  createdAt: string
}

export const listSurgeZones = async (): Promise<SurgeZoneListItem[]> => {
  const res = await api.get<SurgeZoneListItem[]>(API_ENDPOINTS.surgeZones.list)
  return res.data
}

export const getSurgeZone = async (id: string): Promise<SurgeZoneDetail> => {
  const res = await api.get<SurgeZoneDetail>(API_ENDPOINTS.surgeZones.detail(id))
  return res.data
}

export const createSurgeZone = async (payload: {
  cityCode: string
  name: string
  coordinates: number[][][]
}): Promise<SurgeZoneDetail> => {
  const res = await api.post<SurgeZoneDetail>(API_ENDPOINTS.surgeZones.create, payload)
  return res.data
}

export const updateSurgeZone = async (
  id: string,
  payload: { name?: string; isActive?: boolean; coordinates?: number[][][] },
): Promise<void> => {
  await api.patch(API_ENDPOINTS.surgeZones.update(id), payload)
}
