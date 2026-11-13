import { useQuery } from '@tanstack/react-query'
import { api, API_ENDPOINTS } from '@/infrastructure/api'

export interface VehicleTypeDto {
  id: string
  code: string
  name: string
  icon?: string | null
  displayOrder?: number
  passengerCapacity?: number | null
  luggageCapacity?: number | null
  baseFare?: number | null
  perKmRate?: number | null
  perMinuteRate?: number | null
  minimumFare?: number | null
  hasAc?: boolean
  isActive: boolean
}

/** AC and Non-AC variants share a name (two "Cab Economy" rows), so say which one this is. */
export const vehicleTypeLabel = (v: Pick<VehicleTypeDto, 'name' | 'hasAc'>): string =>
  v.hasAc ? `${v.name} (AC)` : v.name

export const useVehicleTypes = () => {
  return useQuery<VehicleTypeDto[]>({
    queryKey: ['vehicle-types'],
    queryFn: async () => {
      const res = await api.get<{ data: VehicleTypeDto[] }>(API_ENDPOINTS.vehicleTypes.list)
      const list = res.data?.data ?? ((res.data as unknown) as VehicleTypeDto[])
      return Array.isArray(list) ? list : []
    },
  })
}
