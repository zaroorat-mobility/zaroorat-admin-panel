import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  activateServiceZone,
  createCity,
  createServiceZone,
  createState,
  deactivateServiceZone,
  getCities,
  getCity,
  getCountries,
  getServiceZone,
  getServiceZones,
  getStates,
  updateState,
  updateCity,
  updateServiceZone,
} from '../api'
import type { ServiceZoneType } from '../types'

export const useCountries = () =>
  useQuery({ queryKey: ['geographic', 'countries'], queryFn: getCountries })

export const useStates = (params?: { countryCode?: string; activeOnly?: boolean }) =>
  useQuery({
    queryKey: ['geographic', 'states', params],
    queryFn: () => getStates(params),
  })

export const useCreateState = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createState,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['geographic', 'states'] }),
  })
}

export const useUpdateState = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name?: string; isActive?: boolean } }) =>
      updateState(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['geographic', 'states'] }),
  })
}

export const useCities = (activeOnly = false) =>
  useQuery({ queryKey: ['geographic', 'cities', activeOnly], queryFn: () => getCities({ activeOnly }) })

export const useCity = (id: string) =>
  useQuery({ queryKey: ['geographic', 'city', id], queryFn: () => getCity(id), enabled: !!id })

export const useServiceZones = (params?: {
  cityCode?: string
  zoneType?: ServiceZoneType
  activeOnly?: boolean
}) =>
  useQuery({
    queryKey: ['geographic', 'service-zones', params],
    queryFn: () => getServiceZones(params),
  })

export const useServiceZone = (id: string) =>
  useQuery({
    queryKey: ['geographic', 'service-zone', id],
    queryFn: () => getServiceZone(id),
    enabled: !!id,
  })

export const useCreateCity = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCity,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['geographic', 'cities'] }),
  })
}

export const useUpdateCity = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      updateCity(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['geographic', 'cities'] })
      qc.invalidateQueries({ queryKey: ['geographic', 'city', id] })
    },
  })
}

export const useCreateServiceZone = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createServiceZone,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['geographic', 'service-zones'] }),
  })
}

export const useUpdateServiceZone = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      updateServiceZone(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['geographic', 'service-zones'] })
      qc.invalidateQueries({ queryKey: ['geographic', 'service-zone', id] })
    },
  })
}

export const useActivateServiceZone = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: activateServiceZone,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['geographic', 'service-zones'] }),
  })
}

export const useDeactivateServiceZone = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deactivateServiceZone,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['geographic', 'service-zones'] }),
  })
}
