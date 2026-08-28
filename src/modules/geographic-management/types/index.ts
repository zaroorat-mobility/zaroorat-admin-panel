export type ServiceZoneType = 'SERVICE' | 'AIRPORT' | 'RESTRICTED'

export interface Country {
  id: string
  code: string
  name: string
  isActive: boolean
}

export interface State {
  id: string
  countryCode: string
  code: string
  name: string
  isActive: boolean
}

export interface CityListItem {
  id: string
  code: string
  name: string
  state: string | null
  stateId: string | null
  country: string
  isActive: boolean
  hasBoundary: boolean
  zoneCount: number
}

export interface CityDetail extends CityListItem {
  timezone: string
  currency: string
  launchedAt: string | null
  center: { lng: number; lat: number } | null
  boundary: number[][][] | null
}

export interface ServiceZoneListItem {
  id: string
  code: string
  name: string
  zoneType: ServiceZoneType
  cityCode: string
  cityId: string
  isActive: boolean
  allowsPickup: boolean
  allowsDropoff: boolean
  fareRuleCount: number
}

export interface ServiceZoneDetail extends ServiceZoneListItem {
  boundary: number[][][]
  vehicleTypeIds: string[]
  vehicleTypeCodes: string[]
}
