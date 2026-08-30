import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type { FareRule, CityOption, ServiceZoneOption } from '../fare-rules/types'
import type { SurgeRule, CancellationRule } from '../types'
import type { VehicleType } from '@/modules/driver-management/types'

const CODE_TO_UI: Record<string, VehicleType> = {
  CAB_ECONOMY: 'cab',
  CAB_PREMIUM: 'cab',
  AUTO: 'auto',
  BIKE: 'bike',
}

const UI_TO_CODE: Record<string, string> = {
  cab: 'CAB_ECONOMY',
  auto: 'AUTO',
  bike: 'BIKE',
  carpool: 'CAB_ECONOMY',
}

type ApiFareRule = Omit<FareRule, 'nightStartTime' | 'nightEndTime'> & {
  nightStartTime?: string
  nightEndTime?: string
  vehicleTypeCode?: string
  cityCode?: string
}

type ApiCancellationRule = Omit<CancellationRule, 'version'> & {
  version?: number
  freeCancelWindowSec?: number
}

export interface SurgeWindowDto {
  id: string
  zoneId: string
  vehicleTypeId: string | null
  multiplier: number | string
  reason: string | null
  demandThresholdPct?: number | string | null
  supplyThresholdPct?: number | string | null
  peakHourStart?: string | null
  peakHourEnd?: string | null
  isPeakHourOnly?: boolean
  startsAt: string
  endsAt: string | null
  isActive: boolean
  createdAt: string
  zoneName?: string
  vehicleTypeCode?: string | null
}

export interface SurgeZoneDto {
  id: string
  cityCode: string
  name: string
  isActive: boolean
  createdAt: string
}

interface VehicleTypeDto {
  id: string
  code: string
  name: string
}

function toNum(value: number | string): number {
  return typeof value === 'number' ? value : Number(value)
}

function normalizeFare(rule: ApiFareRule): FareRule {
  return {
    ...rule,
    cityCode: rule.cityCode ?? 'GLOBAL',
    serviceType: rule.serviceType ?? null,
    serviceZoneId: rule.serviceZoneId ?? null,
    serviceZoneName: rule.serviceZoneName ?? null,
    bookingFee: rule.bookingFee ?? 0,
    platformFeePct: rule.platformFeePct ?? 0,
    taxRatePct: rule.taxRatePct ?? null,
    commissionRatePct: rule.commissionRatePct ?? null,
    nightStartTime: rule.nightStartTime ?? '22:00',
    nightEndTime: rule.nightEndTime ?? '05:00',
  }
}

function normalizeCancellation(rule: ApiCancellationRule): CancellationRule {
  return {
    ...rule,
    version: rule.version ?? 1,
  }
}

function padTime(t: string): string {
  return t.length === 5 ? `${t}:00` : t
}

function combineDateTime(date: string, time?: string): string {
  const t = time ? padTime(time) : '00:00:00'
  return new Date(`${date}T${t}`).toISOString()
}

function windowToSurgeRule(window: SurgeWindowDto): SurgeRule {
  const starts = new Date(window.startsAt)
  const ends = window.endsAt ? new Date(window.endsAt) : null
  const code = window.vehicleTypeCode ?? null
  return {
    id: window.id,
    ruleName: window.reason || window.zoneName || 'Surge Window',
    version: 1,
    vehicleType: code ? (CODE_TO_UI[code] ?? 'cab') : 'cab',
    zoneId: window.zoneId,
    zoneName: window.zoneName,
    multiplier: toNum(window.multiplier),
    demandThresholdPct:
      window.demandThresholdPct != null ? toNum(window.demandThresholdPct) : null,
    supplyThresholdPct:
      window.supplyThresholdPct != null ? toNum(window.supplyThresholdPct) : null,
    peakHourStart: window.peakHourStart ?? null,
    peakHourEnd: window.peakHourEnd ?? null,
    isPeakHourOnly: window.isPeakHourOnly ?? false,
    startTime: starts.toISOString().slice(11, 16),
    endTime: ends ? ends.toISOString().slice(11, 16) : undefined,
    effectiveFrom: starts.toISOString().slice(0, 10),
    effectiveTo: ends ? ends.toISOString().slice(0, 10) : undefined,
    status: window.isActive ? 'active' : 'inactive',
    createdAt: window.createdAt,
    updatedAt: window.createdAt,
  }
}

export const getSurgeZones = async (cityCode?: string): Promise<SurgeZoneDto[]> => {
  const response = await api.get<SurgeZoneDto[] | { data: SurgeZoneDto[] }>(
    API_ENDPOINTS.surgeZones.list,
    cityCode ? { params: { cityCode } } : undefined,
  )
  const payload = response.data
  return Array.isArray(payload) ? payload : payload.data
}

async function resolveCitywideZoneId(): Promise<string> {
  const response = await api.get<SurgeZoneDto[]>(API_ENDPOINTS.surgeZones.list)
  const zones = response.data
  const citywide =
    zones.find((z) => z.name.toLowerCase().includes('citywide')) ??
    zones.find((z) => z.cityCode === 'SGR') ??
    zones[0]
  if (!citywide) {
    throw new Error('No surge zone configured. Seed development pricing fixtures first.')
  }
  return citywide.id
}

async function resolveVehicleTypeIds(types: VehicleType[]): Promise<string[]> {
  const response = await api.get<{ data: VehicleTypeDto[] }>(API_ENDPOINTS.vehicleTypes.list)
  const catalog = response.data.data
  const ids: string[] = []
  for (const ui of types) {
    const code = UI_TO_CODE[ui]
    const match = catalog.find((row) => row.code === code)
    if (!match) {
      throw new Error(`Vehicle type ${code} is not configured`)
    }
    ids.push(match.id)
  }
  return ids
}

// ─── Fare rules ───────────────────────────────────────────────────────────────

export const getCities = async (): Promise<CityOption[]> => {
  const response = await api.get<{ data: CityOption[] }>(API_ENDPOINTS.geographic.cities, {
    params: { activeOnly: true },
  })
  return response.data.data.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    state: c.state ?? null,
    isActive: c.isActive,
  }))
}

export const getServiceZones = async (cityCode: string): Promise<ServiceZoneOption[]> => {
  const response = await api.get<{ data: ServiceZoneOption[] }>(API_ENDPOINTS.geographic.serviceZones, {
    params: { cityCode, activeOnly: true },
  })
  return response.data.data
}

export const getFareRules = async (
  params?: QueryParams,
): Promise<PaginatedResponse<FareRule>> => {
  const response = await api.get<PaginatedResponse<ApiFareRule>>(API_ENDPOINTS.fareRules.list, {
    params,
  })
  return {
    ...response.data,
    data: response.data.data.map(normalizeFare),
  }
}

export const getFareRuleById = async (id: string): Promise<FareRule> => {
  const response = await api.get<{ data: ApiFareRule }>(API_ENDPOINTS.fareRules.detail(id))
  return normalizeFare(response.data.data)
}

export const createFareRule = async (
  data: Omit<FareRule, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
): Promise<FareRule> => {
  const response = await api.post<{ data: ApiFareRule }>(API_ENDPOINTS.fareRules.create, data)
  return normalizeFare(response.data.data)
}

export const updateFareRule = async (
  id: string,
  updates: Partial<FareRule>,
): Promise<FareRule> => {
  const response = await api.patch<{ data: ApiFareRule }>(
    API_ENDPOINTS.fareRules.update(id),
    updates,
  )
  return normalizeFare(response.data.data)
}

export const deleteFareRule = async (id: string): Promise<void> => {
  await api.delete(API_ENDPOINTS.fareRules.delete(id))
}

export const activateFareRule = async (id: string): Promise<FareRule> => {
  const response = await api.post<{ data: ApiFareRule }>(API_ENDPOINTS.fareRules.activate(id))
  return normalizeFare(response.data.data)
}

export const deactivateFareRule = async (id: string): Promise<FareRule> => {
  const response = await api.post<{ data: ApiFareRule }>(API_ENDPOINTS.fareRules.deactivate(id))
  return normalizeFare(response.data.data)
}

// ─── Surge (windows on citywide zone) ─────────────────────────────────────────

export const getSurgeRules = async (
  params?: QueryParams,
): Promise<PaginatedResponse<SurgeRule>> => {
  const response = await api.get<SurgeWindowDto[]>(API_ENDPOINTS.surgeWindows.list)
  let rules = response.data.map(windowToSurgeRule)
  const search = ((params?.search as string) || '').toLowerCase()
  if (search) {
    rules = rules.filter((r) => {
      const vt = Array.isArray(r.vehicleType) ? r.vehicleType.join(', ') : r.vehicleType
      return r.ruleName.toLowerCase().includes(search) || vt.toLowerCase().includes(search)
    })
  }
  return {
    data: rules,
    meta: {
      currentPage: 1,
      totalPages: Math.max(1, Math.ceil(rules.length / 50)),
      pageSize: 50,
      totalCount: rules.length,
    },
  }
}

export const getSurgeRuleById = async (id: string): Promise<SurgeRule> => {
  const response = await api.get<SurgeWindowDto>(API_ENDPOINTS.surgeWindows.detail(id))
  return windowToSurgeRule(response.data)
}

export const createSurgeRule = async (
  data: Omit<SurgeRule, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
): Promise<SurgeRule> => {
  const zoneId = data.zoneId ?? (await resolveCitywideZoneId())
  const types = Array.isArray(data.vehicleType)
    ? data.vehicleType
    : [data.vehicleType as VehicleType]
  const vehicleTypeIds = await resolveVehicleTypeIds(types)
  const startsAt = combineDateTime(data.effectiveFrom, data.startTime)
  const endsAt = data.effectiveTo
    ? combineDateTime(data.effectiveTo, data.endTime)
    : data.endTime
      ? combineDateTime(data.effectiveFrom, data.endTime)
      : undefined

  let createdId: string | null = null
  const surgePayload = {
    zoneId,
    multiplier: Math.min(2, Math.max(1, data.multiplier)),
    startsAt,
    ...(endsAt ? { endsAt } : {}),
    reason: data.ruleName,
    ...(data.demandThresholdPct != null ? { demandThresholdPct: data.demandThresholdPct } : {}),
    ...(data.supplyThresholdPct != null ? { supplyThresholdPct: data.supplyThresholdPct } : {}),
    ...(data.peakHourStart ? { peakHourStart: data.peakHourStart } : {}),
    ...(data.peakHourEnd ? { peakHourEnd: data.peakHourEnd } : {}),
    ...(data.isPeakHourOnly !== undefined ? { isPeakHourOnly: data.isPeakHourOnly } : {}),
  }
  for (const vehicleTypeId of vehicleTypeIds) {
    const response = await api.post<SurgeWindowDto>(API_ENDPOINTS.surgeWindows.create, {
      ...surgePayload,
      vehicleTypeId,
    })
    createdId = response.data.id
    if (data.status === 'inactive' && createdId) {
      await api.patch(API_ENDPOINTS.surgeWindows.update(createdId), { isActive: false })
    }
  }
  if (!createdId) throw new Error('Failed to create surge window')
  return getSurgeRuleById(createdId)
}

export const updateSurgeRule = async (
  id: string,
  updates: Partial<SurgeRule>,
): Promise<SurgeRule> => {
  const existing = await getSurgeRuleById(id)
  const merged = { ...existing, ...updates }
  const startsAt = combineDateTime(
    merged.effectiveFrom,
    merged.startTime,
  )
  const endsAt = merged.effectiveTo
    ? combineDateTime(merged.effectiveTo, merged.endTime)
    : merged.endTime
      ? combineDateTime(merged.effectiveFrom, merged.endTime)
      : undefined

  const body: Record<string, unknown> = {
    multiplier: Math.min(2, Math.max(1, merged.multiplier)),
    startsAt,
    reason: merged.ruleName,
    isActive: merged.status === 'active',
    demandThresholdPct: merged.demandThresholdPct ?? null,
    supplyThresholdPct: merged.supplyThresholdPct ?? null,
    peakHourStart: merged.peakHourStart ?? null,
    peakHourEnd: merged.peakHourEnd ?? null,
    isPeakHourOnly: merged.isPeakHourOnly ?? false,
  }
  if (endsAt) body.endsAt = endsAt

  await api.patch(API_ENDPOINTS.surgeWindows.update(id), body)
  return getSurgeRuleById(id)
}

export const deleteSurgeRule = async (id: string): Promise<void> => {
  await api.delete(API_ENDPOINTS.surgeWindows.delete(id))
}

export const activateSurgeRule = async (id: string): Promise<SurgeRule> => {
  await api.patch(API_ENDPOINTS.surgeWindows.update(id), { isActive: true })
  return getSurgeRuleById(id)
}

export const deactivateSurgeRule = async (id: string): Promise<SurgeRule> => {
  await api.patch(API_ENDPOINTS.surgeWindows.update(id), { isActive: false })
  return getSurgeRuleById(id)
}

// ─── Cancellation policies ────────────────────────────────────────────────────

export const getCancellationRules = async (
  params?: QueryParams,
): Promise<PaginatedResponse<CancellationRule>> => {
  const response = await api.get<PaginatedResponse<ApiCancellationRule>>(
    API_ENDPOINTS.cancellationPolicies.list,
    { params },
  )
  return {
    ...response.data,
    data: response.data.data.map(normalizeCancellation),
  }
}

export const getCancellationRuleById = async (id: string): Promise<CancellationRule> => {
  const response = await api.get<{ data: ApiCancellationRule }>(
    API_ENDPOINTS.cancellationPolicies.detail(id),
  )
  return normalizeCancellation(response.data.data)
}

export const createCancellationRule = async (
  data: Omit<CancellationRule, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
): Promise<CancellationRule> => {
  const response = await api.post<{ data: ApiCancellationRule }>(
    API_ENDPOINTS.cancellationPolicies.create,
    data,
  )
  return normalizeCancellation(response.data.data)
}

export const updateCancellationRule = async (
  id: string,
  updates: Partial<CancellationRule>,
): Promise<CancellationRule> => {
  const response = await api.patch<{ data: ApiCancellationRule }>(
    API_ENDPOINTS.cancellationPolicies.update(id),
    updates,
  )
  return normalizeCancellation(response.data.data)
}

export const deleteCancellationRule = async (id: string): Promise<void> => {
  await api.delete(API_ENDPOINTS.cancellationPolicies.delete(id))
}

export const activateCancellationRule = async (id: string): Promise<CancellationRule> => {
  const response = await api.post<{ data: ApiCancellationRule }>(
    API_ENDPOINTS.cancellationPolicies.activate(id),
  )
  return normalizeCancellation(response.data.data)
}

export const deactivateCancellationRule = async (id: string): Promise<CancellationRule> => {
  const response = await api.post<{ data: ApiCancellationRule }>(
    API_ENDPOINTS.cancellationPolicies.deactivate(id),
  )
  return normalizeCancellation(response.data.data)
}
