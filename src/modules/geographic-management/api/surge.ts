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

function unwrapData<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}

export const listSurgeZones = async (): Promise<SurgeZoneListItem[]> => {
  const res = await api.get<SurgeZoneListItem[] | { data: SurgeZoneListItem[] }>(
    API_ENDPOINTS.surgeZones.list,
  )
  const list = unwrapData(res.data)
  return Array.isArray(list) ? list : []
}

export const getSurgeZone = async (id: string): Promise<SurgeZoneDetail> => {
  const res = await api.get<SurgeZoneDetail | { data: SurgeZoneDetail }>(
    API_ENDPOINTS.surgeZones.detail(id),
  )
  return unwrapData(res.data)
}

export const createSurgeZone = async (payload: {
  cityCode: string
  name: string
  coordinates: number[][][]
}): Promise<SurgeZoneDetail> => {
  const res = await api.post<SurgeZoneDetail | { data: SurgeZoneDetail }>(
    API_ENDPOINTS.surgeZones.create,
    payload,
  )
  return unwrapData(res.data)
}

export const updateSurgeZone = async (
  id: string,
  payload: { name?: string; isActive?: boolean; coordinates?: number[][][] },
): Promise<void> => {
  await api.patch(API_ENDPOINTS.surgeZones.update(id), payload)
}
