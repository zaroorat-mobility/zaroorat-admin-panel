import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type {
  CityDetail,
  CityListItem,
  Country,
  ServiceZoneDetail,
  ServiceZoneListItem,
  ServiceZoneType,
  State,
} from '../types'

export const getCountries = async (): Promise<Country[]> => {
  const res = await api.get<{ data: Country[] }>(API_ENDPOINTS.geographic.countries)
  return res.data.data
}

export const getStates = async (params?: {
  countryCode?: string
  activeOnly?: boolean
}): Promise<State[]> => {
  const res = await api.get<{ data: State[] }>(API_ENDPOINTS.geographic.states, { params })
  return res.data.data
}

export const createState = async (payload: {
  countryCode?: string
  code: string
  name: string
  isActive?: boolean
}): Promise<State> => {
  const res = await api.post<{ data: State }>(API_ENDPOINTS.geographic.states, payload)
  return res.data.data
}

export const updateState = async (id: string, payload: { name?: string; isActive?: boolean }): Promise<State> => {
  const res = await api.patch<{ data: State }>(API_ENDPOINTS.geographic.state(id), payload)
  return res.data.data
}

export const getCities = async (params?: {
  activeOnly?: boolean
}): Promise<CityListItem[]> => {
  const res = await api.get<{ data: CityListItem[] }>(API_ENDPOINTS.geographic.cities, { params })
  return res.data.data
}

export const getCity = async (id: string): Promise<CityDetail> => {
  const res = await api.get<{ data: CityDetail }>(API_ENDPOINTS.geographic.city(id))
  return res.data.data
}

export const createCity = async (payload: Record<string, unknown>): Promise<CityDetail> => {
  const res = await api.post<{ data: CityDetail }>(API_ENDPOINTS.geographic.cities, payload)
  return res.data.data
}

export const updateCity = async (id: string, payload: Record<string, unknown>): Promise<CityDetail> => {
  const res = await api.patch<{ data: CityDetail }>(API_ENDPOINTS.geographic.city(id), payload)
  return res.data.data
}

export const getServiceZones = async (params?: {
  cityCode?: string
  zoneType?: ServiceZoneType
  activeOnly?: boolean
}): Promise<ServiceZoneListItem[]> => {
  const res = await api.get<{ data: ServiceZoneListItem[] }>(
    API_ENDPOINTS.geographic.serviceZones,
    { params },
  )
  return res.data.data
}

export const getServiceZone = async (id: string): Promise<ServiceZoneDetail> => {
  const res = await api.get<{ data: ServiceZoneDetail }>(API_ENDPOINTS.geographic.serviceZone(id))
  return res.data.data
}

export const createServiceZone = async (
  payload: Record<string, unknown>,
): Promise<ServiceZoneDetail> => {
  const res = await api.post<{ data: ServiceZoneDetail }>(
    API_ENDPOINTS.geographic.serviceZones,
    payload,
  )
  return res.data.data
}

export const updateServiceZone = async (
  id: string,
  payload: Record<string, unknown>,
): Promise<ServiceZoneDetail> => {
  const res = await api.patch<{ data: ServiceZoneDetail }>(
    API_ENDPOINTS.geographic.serviceZone(id),
    payload,
  )
  return res.data.data
}

export const activateServiceZone = async (id: string): Promise<ServiceZoneDetail> => {
  const res = await api.post<{ data: ServiceZoneDetail }>(
    API_ENDPOINTS.geographic.activateServiceZone(id),
  )
  return res.data.data
}

export const deactivateServiceZone = async (id: string): Promise<ServiceZoneDetail> => {
  const res = await api.post<{ data: ServiceZoneDetail }>(
    API_ENDPOINTS.geographic.deactivateServiceZone(id),
  )
  return res.data.data
}
