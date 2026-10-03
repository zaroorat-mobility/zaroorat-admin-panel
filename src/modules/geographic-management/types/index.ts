export type ServiceZoneType = 'SERVICE' | 'AIRPORT' | 'RESTRICTED'
export type StateDivisionType = 'STATE' | 'UNION_TERRITORY'

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
  nativeName?: string | null
  divisionType: StateDivisionType
  lgdCode: number | null
  isoCode: string | null
  censusCode?: string | null
  isActive: boolean
}

export interface ReconcileDiffItem {
  code: string
  name: string
  action: 'CREATE' | 'UPDATE' | 'NO_OP' | 'EXTRA_IN_DB'
  reason?: string
  stateId?: string
  changes?: Record<string, { before: unknown; after: unknown }>
  affectedCities?: number
}

export interface ReconcileResult {
  countryCode: string
  canonicalSource: {
    authority: string
    version: string
    publishedDate: string
    totalStates: number
    totalUnionTerritories: number
    totalRecords: number
  }
  mode: 'PREVIEW' | 'APPLY'
  applied: boolean
  summary: {
    canonicalTotal: number
    dbTotal: number
    toCreate: number
    toUpdate: number
    unchanged: number
    extraInDb: number
    affectedCities: number
  }
  details: ReconcileDiffItem[]
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
