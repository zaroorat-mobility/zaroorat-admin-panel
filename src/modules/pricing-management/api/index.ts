import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { QueryParams, PaginatedResponse } from '@/shared/types'
import type { FareRule, CityOption, ServiceZoneOption } from '../fare-rules/types'
import type { SurgeRule, CancellationRule } from '../types'

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
  serviceZoneId?: string | null
  zoneId: string | null
  cityCode?: string | null
  vehicleTypeId: string | null
  vehicleTypeIds?: string[]
  vehicleTypes?: Array<{ id: string; code: string; name: string }>
  multiplier: number | string
  reason: string | null
  peakHourStart?: string | null
  peakHourEnd?: string | null
  isPeakHourOnly?: boolean
  daysOfWeek?: number[]
  startsAt: string
  endsAt: string | null
  isActive: boolean
  supersedesId?: string | null
  createdAt: string
  updatedAt?: string
  zoneName?: string
  vehicleTypeCode?: string | null
  vehicleTypeName?: string | null
}

export interface SurgeZoneDto {
  id: string
  cityCode: string
  name: string
  isActive: boolean
  createdAt: string
  boundary?: number[][][] | null
  center?: { lat: number; lng: number } | null
}

function toNum(value: number | string): number {
  return typeof value === 'number' ? value : Number(value)
}

function normalizeFare(rule: ApiFareRule): FareRule {
  return {
    ...rule,
    // The server's `vehicleType` is a cab/auto/bike guess that calls every cab "cab".
    vehicleType: rule.vehicleTypeCode ?? rule.vehicleType,
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

/// What the server stores for a fare rule. Strips derived/display-only fields so the
/// server's `.strict()` schema never rejects an admin save, and omits unset nullable
/// rates so the server inherits platform defaults cleanly.
export function toFarePayload(rule: Partial<FareRule>): Record<string, unknown> {
  const body: Record<string, unknown> = { ...rule }
  for (const key of [
    'id',
    'version',
    'createdAt',
    'updatedAt',
    'ruleName',
    'ruleFamilyId',
    'supersedesId',
    'effectiveFromIso',
    'effectiveToIso',
    'warnings',
    'serviceZoneName',
    'vehicleTypeName',
    'vehicleTypeCode',
    'vehicleCategory',
    'nightEnabled',
    'nightStartTime',
    'nightEndTime',
    'nightChargePercentage',
  ]) {
    delete body[key]
  }
  for (const key of ['taxRatePct', 'commissionRatePct', 'platformFeeFlat']) {
    if (body[key] == null) delete body[key]
  }
  if (body.effectiveTo === '') delete body.effectiveTo
  return body
}

export function normalizeCancellation(rule: ApiCancellationRule): CancellationRule {
  const freeSec = rule.freeCancelWindowSec ?? rule.freeCancellationWindow ?? 120
  const maxFee = rule.maxFee !== undefined ? rule.maxFee : (rule.maxChargeAmount ?? null)
  const driverCompAmount = rule.driverCompensationAmount ?? rule.driverPayout ?? 0
  const driverPenalty =
    rule.driverPenaltyAmount !== undefined ? rule.driverPenaltyAmount : (rule.driverPenalty ?? null)

  return {
    ...rule,
    version: rule.version ?? 1,
    feeBase: rule.feeBase ?? 'QUOTED_FARE',
    maxFee,
    maxChargeAmount: maxFee,
    freeCancelWindowSec: freeSec,
    freeCancellationWindow: freeSec,
    freeCancellationUnit: 'seconds',
    driverCompensationType: rule.driverCompensationType ?? (driverCompAmount > 0 ? 'FLAT' : 'NONE'),
    driverCompensationAmount: driverCompAmount,
    driverPayout: driverCompAmount,
    driverPenaltyAmount: driverPenalty,
    driverPenalty,
  }
}

/// Maps UI cancellation rule form values into the server's strict M-06 API contract.
export function toCancellationPayload(
  input: Partial<CancellationRule>,
): Record<string, unknown> {
  const body: Record<string, unknown> = {}

  if (input.ruleName !== undefined) body.ruleName = input.ruleName
  if (input.actor !== undefined) body.actor = input.actor
  if (input.scenario !== undefined) body.scenario = input.scenario
  if (input.chargeType !== undefined) body.chargeType = input.chargeType
  if (input.chargeAmount !== undefined) body.chargeAmount = Number(input.chargeAmount)
  if (input.feeBase !== undefined) body.feeBase = input.feeBase
  if (input.status !== undefined) body.status = input.status
  if (input.cityCode !== undefined) body.cityCode = input.cityCode || null
  if (input.vehicleTypeId !== undefined) body.vehicleTypeId = input.vehicleTypeId || null
  if (input.effectiveFrom !== undefined) body.effectiveFrom = input.effectiveFrom
  if (input.effectiveTo !== undefined) body.effectiveTo = input.effectiveTo || null
  if (input.expectedVersion !== undefined) body.expectedVersion = input.expectedVersion

  if (input.freeCancelWindowSec !== undefined) {
    body.freeCancelWindowSec = Math.max(0, Math.round(Number(input.freeCancelWindowSec)))
  } else if (input.freeCancellationWindow !== undefined) {
    const raw = Number(input.freeCancellationWindow)
    body.freeCancelWindowSec =
      input.freeCancellationUnit === 'minutes'
        ? Math.max(0, Math.round(raw * 60))
        : Math.max(0, Math.round(raw))
  }

  const maxFee = input.maxFee !== undefined ? input.maxFee : input.maxChargeAmount
  if (maxFee !== undefined) {
    body.maxFee = maxFee === null ? null : Number(maxFee)
  }

  const compAmount =
    input.driverCompensationAmount !== undefined
      ? Number(input.driverCompensationAmount)
      : input.driverPayout !== undefined
        ? Number(input.driverPayout)
        : undefined
  if (input.driverCompensationType !== undefined) {
    body.driverCompensationType = input.driverCompensationType
    if (compAmount !== undefined) body.driverCompensationAmount = compAmount
  } else if (compAmount !== undefined) {
    body.driverCompensationType = compAmount > 0 ? 'FLAT' : 'NONE'
    body.driverCompensationAmount = compAmount
  }

  const penalty =
    input.driverPenaltyAmount !== undefined ? input.driverPenaltyAmount : input.driverPenalty
  if (penalty !== undefined) {
    body.driverPenaltyAmount = penalty === null ? null : Number(penalty)
  }

  return body
}

function padTime(t: string): string {
  return t.length === 5 ? `${t}:00` : t
}

export function combineDateTime(date: string, time?: string): string {
  const t = time ? padTime(time) : '00:00:00'
  return new Date(`${date}T${t}`).toISOString()
}

export function endOfDayExclusive(date: string): string {
  const next = new Date(`${date}T00:00:00`)
  next.setDate(next.getDate() + 1)
  return next.toISOString()
}

/** The stored start and end for what the form holds. */
export function surgeWindowRange(rule: {
  effectiveFrom: string
  effectiveTo?: string | undefined
  startTime?: string | undefined
  endTime?: string | undefined
}): { startsAt: string; endsAt?: string } {
  const startsAt = combineDateTime(rule.effectiveFrom, rule.startTime)
  if (rule.effectiveTo) {
    return {
      startsAt,
      endsAt: rule.endTime
        ? combineDateTime(rule.effectiveTo, rule.endTime)
        : endOfDayExclusive(rule.effectiveTo),
    }
  }
  if (rule.endTime) return { startsAt, endsAt: combineDateTime(rule.effectiveFrom, rule.endTime) }
  return { startsAt }
}

const pad2 = (n: number) => String(n).padStart(2, '0')
const localDate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const localTime = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
const isLocalMidnight = (d: Date) => d.getHours() === 0 && d.getMinutes() === 0

/** A rule's dates and times as the admin entered them, for the form and the screens. */
function windowToFormTimes(window: SurgeWindowDto) {
  // ponytail: browser-local time, correct while all admins and cities are IST; use City.timezone when a non-IST city launches.
  const starts = new Date(window.startsAt)
  const times: Pick<SurgeRule, 'effectiveFrom' | 'startTime' | 'effectiveTo' | 'endTime'> = {
    effectiveFrom: localDate(starts),
    startTime: isLocalMidnight(starts) ? undefined : localTime(starts),
  }
  if (!window.endsAt) return times
  const ends = new Date(window.endsAt)
  if (isLocalMidnight(ends)) {
    // The stored end is the start of the next day, so the admin's last day is the day before.
    const lastDay = new Date(ends)
    lastDay.setDate(lastDay.getDate() - 1)
    return { ...times, effectiveTo: localDate(lastDay) }
  }
  return { ...times, effectiveTo: localDate(ends), endTime: localTime(ends) }
}

function unwrapData<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}

export function windowToSurgeRule(window: SurgeWindowDto): SurgeRule {
  const code = window.vehicleTypeCode ?? null
  const multiTypes = window.vehicleTypes ?? []
  const vehicleLabel =
    multiTypes.length > 1
      ? multiTypes.map((v) => v.name || v.code).join(', ')
      : multiTypes.length === 1
        ? multiTypes[0]!.name || multiTypes[0]!.code
        : code
          ? (window.vehicleTypeName ?? code)
          : 'All vehicles'

  return {
    id: window.id,
    ruleName: window.reason || window.zoneName || 'Surge Window',
    vehicleTypeIds: window.vehicleTypeIds ?? (window.vehicleTypeId ? [window.vehicleTypeId] : []),
    vehicleTypes: multiTypes,
    vehicleLabel,
    serviceZoneId: window.serviceZoneId ?? null,
    zoneId: window.zoneId ?? undefined,
    zoneName: window.zoneName ?? (window.cityCode ? `${window.cityCode} (Citywide)` : undefined),
    cityCode: window.cityCode ?? undefined,
    supersedesId: window.supersedesId ?? null,
    multiplier: toNum(window.multiplier),
    peakHourStart: window.peakHourStart ?? null,
    peakHourEnd: window.peakHourEnd ?? null,
    isPeakHourOnly: window.isPeakHourOnly ?? false,
    daysOfWeek: window.daysOfWeek ?? [],
    ...windowToFormTimes(window),
    status: window.isActive ? 'active' : 'inactive',
    createdAt: window.createdAt,
    updatedAt: window.updatedAt ?? window.createdAt,
  }
}

export const getSurgeZones = async (cityCode?: string): Promise<SurgeZoneDto[]> => {
  const response = await api.get<SurgeZoneDto[] | { data: SurgeZoneDto[] }>(
    API_ENDPOINTS.surgeZones.list,
    cityCode ? { params: { cityCode } } : undefined,
  )
  return unwrapData(response.data)
}

async function resolveCitywideZoneId(): Promise<string> {
  const zones = await getSurgeZones()
  const citywide =
    zones.find((z) => z.name.toLowerCase().includes('citywide')) ??
    zones[0]
  if (!citywide) {
    throw new Error('No surge zone configured. Select a city or configure a surge zone first.')
  }
  return citywide.id
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
    ...(c.maxSurgeMultiplier != null ? { maxSurgeMultiplier: Number(c.maxSurgeMultiplier) } : {}),
  }))
}

export const getServiceZones = async (cityCode: string): Promise<ServiceZoneOption[]> => {
  const response = await api.get<{ data: ServiceZoneOption[] }>(API_ENDPOINTS.geographic.serviceZones, {
    params: { cityCode, activeOnly: true },
  })
  // A fare can only apply where a ride can start, so a restricted zone is never a choice.
  return response.data.data.filter((z) => z.zoneType === 'SERVICE' || z.zoneType === 'AIRPORT')
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

export const getFareRuleVersions = async (id: string): Promise<FareRule[]> => {
  const response = await api.get<{ data: ApiFareRule[] }>(API_ENDPOINTS.fareRules.versions(id))
  return response.data.data.map(normalizeFare)
}

export interface SimulatePricingInput {
  vehicleTypeId?: string
  vehicleType?: string
  cityCode: string
  serviceType?: 'instant' | null
  serviceZoneId?: string | null
  pickupLat?: number
  pickupLng?: number
  distanceKm: number
  durationMin: number
  waitingMinutes?: number
  surgeMultiplier?: number
  discountAmount?: number
  at?: string
}

export interface SimulatePricingResult {
  simulatedAt: string
  vehicleType: { id: string; code: string; name: string }
  cityCode: string
  resolvedRule: {
    source: 'rule' | 'platform_default'
    id: string | null
    version: number | null
    ruleFamilyId: string | null
    cityCode: string
    serviceZoneId: string | null
    effectiveFrom: string | null
    effectiveTo: string | null
  }
  surge: {
    multiplier: number
    source: 'override' | 'live' | 'default'
  }
  rates: {
    baseFare: number
    minimumFare: number
    perKmRate: number
    perMinuteRate: number
    freeWaitingMinutes: number
    waitingChargePerMinute: number
    bookingFee: number
    platformFeePct: number
    platformFeeFlat: number
    taxRatePct: number
    commissionRatePct: number
  }
  fare: FarePreview['fare']
  commissionAtAcceptance: number
}

export const simulatePricing = async (
  input: SimulatePricingInput,
  signal?: AbortSignal,
): Promise<SimulatePricingResult> => {
  const response = await api.post<{ data: SimulatePricingResult }>(
    API_ENDPOINTS.pricing.simulate,
    input,
    { signal },
  )
  return response.data.data
}

export const createFareRule = async (
  data: Omit<FareRule, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
): Promise<FareRule> => {
  const response = await api.post<{ data: ApiFareRule }>(API_ENDPOINTS.fareRules.create, toFarePayload(data))
  return normalizeFare(response.data.data)
}

export const updateFareRule = async (
  id: string,
  updates: Partial<FareRule>,
): Promise<FareRule> => {
  const response = await api.patch<{ data: ApiFareRule }>(
    API_ENDPOINTS.fareRules.update(id),
    toFarePayload(updates),
  )
  return normalizeFare(response.data.data)
}

/** The rule's rates as the form holds them; a null rate means "platform default". */
export interface FarePreviewInput {
  baseFare: number
  minimumFare: number
  perKmRate: number
  perMinuteRate: number
  freeWaitingMinutes: number
  waitingChargePerMinute: number
  bookingFee: number
  platformFeePct: number
  platformFeeFlat?: number | null
  taxRatePct: number | null
  commissionRatePct: number | null
  distanceKm: number
  durationMin: number
  waitingMinutes: number
  surgeMultiplier: number
  discountAmount: number
  cityCode?: string | null
  serviceZoneId?: string | null
  vehicleType?: string | null
}

/** The server's own itemisation (PricingService) — the preview never prices anything itself. */
export interface FarePreview {
  fare: {
    baseFare: number
    distanceFare: number
    timeFare: number
    waitingCharge: number
    bookingFee: number
    surgeMultiplier: number
    surgeAmount: number
    subtotal: number
    discountAmount: number
    taxAmount: number
    platformFee: number
    totalFare: number
    driverEarning: number
    platformCommission: number
  }
  /** What a COMMISSION-model driver is charged: priced like acceptance, with no discount. */
  commissionAtAcceptance: number
  rates: {
    taxRatePct: number
    taxRateIsDefault: boolean
    commissionRatePct: number
    commissionRateIsDefault: boolean
  }
}

export const previewFareRule = async (input: FarePreviewInput, signal?: AbortSignal): Promise<FarePreview> => {
  const body: Record<string, unknown> = { ...input }
  // Same rule as saving: a blank rate is left out so the server applies its live DB default.
  for (const key of ['taxRatePct', 'commissionRatePct', 'cityCode', 'serviceZoneId', 'vehicleType']) {
    if (body[key] == null || body[key] === '') delete body[key]
  }
  const response = await api.post<{ data: FarePreview }>(API_ENDPOINTS.fareRules.preview, body, { signal })
  return response.data.data
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

// ─── Surge (windows — multi-vehicle, service-zone & citywide) ────────────────

export const getSurgeRules = async (
  params?: QueryParams,
): Promise<PaginatedResponse<SurgeRule>> => {
  const response = await api.get<
    SurgeWindowDto[] | PaginatedResponse<SurgeWindowDto>
  >(API_ENDPOINTS.surgeWindows.list, { params })
  const raw = response.data
  if (Array.isArray(raw)) {
    const rules = raw.map(windowToSurgeRule)
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
  return {
    ...raw,
    data: raw.data.map(windowToSurgeRule),
  }
}

export const getSurgeRuleById = async (id: string): Promise<SurgeRule> => {
  const response = await api.get<SurgeWindowDto | { data: SurgeWindowDto }>(
    API_ENDPOINTS.surgeWindows.detail(id),
  )
  return windowToSurgeRule(unwrapData(response.data))
}

export const getSurgeRuleVersions = async (id: string): Promise<SurgeRule[]> => {
  const response = await api.get<SurgeWindowDto[] | { data: SurgeWindowDto[] }>(
    API_ENDPOINTS.surgeWindows.versions(id),
  )
  return unwrapData(response.data).map(windowToSurgeRule)
}

export const updateCitySurgeCap = async (
  cityCode: string,
  maxSurgeMultiplier: number,
): Promise<{ cityCode: string; maxSurgeMultiplier: number }> => {
  const response = await api.patch<
    { cityCode: string; maxSurgeMultiplier: number } | { data: { cityCode: string; maxSurgeMultiplier: number } }
  >(API_ENDPOINTS.surgeSettings.update(cityCode), { maxSurgeMultiplier })
  return unwrapData(response.data)
}

export const createSurgeRule = async (
  data: Omit<SurgeRule, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<SurgeRule> => {
  const { startsAt, endsAt } = surgeWindowRange(data)
  const vehicleTypeIds = data.vehicleTypeIds?.filter(Boolean) ?? []

  // Scope: explicit serviceZoneId, cityCode (citywide), or fallback surge zone.
  const scope: Record<string, unknown> = data.serviceZoneId
    ? { serviceZoneId: data.serviceZoneId }
    : data.cityCode && !data.zoneId
      ? { cityCode: data.cityCode }
      : { zoneId: data.zoneId ?? (await resolveCitywideZoneId()) }

  // Phase 2.3: single atomic request carrying all target vehicleTypeIds (empty = all vehicles).
  const payload: Record<string, unknown> = {
    ...scope,
    ...(vehicleTypeIds.length > 0 ? { vehicleTypeIds } : {}),
    multiplier: data.multiplier,
    startsAt,
    ...(endsAt ? { endsAt } : {}),
    reason: data.ruleName,
    ...(data.peakHourStart ? { peakHourStart: data.peakHourStart } : {}),
    ...(data.peakHourEnd ? { peakHourEnd: data.peakHourEnd } : {}),
    ...(data.isPeakHourOnly !== undefined ? { isPeakHourOnly: data.isPeakHourOnly } : {}),
    ...(data.daysOfWeek && data.daysOfWeek.length > 0 ? { daysOfWeek: data.daysOfWeek } : {}),
  }

  const response = await api.post<SurgeWindowDto | { data: SurgeWindowDto }>(
    API_ENDPOINTS.surgeWindows.create,
    payload,
  )
  const created = unwrapData(response.data)
  if (data.status === 'inactive' && created.id) {
    const toggled = await api.patch<SurgeWindowDto | { data: SurgeWindowDto }>(
      API_ENDPOINTS.surgeWindows.update(created.id),
      { isActive: false },
    )
    return windowToSurgeRule(unwrapData(toggled.data))
  }
  return windowToSurgeRule(created)
}

export const updateSurgeRule = async (
  id: string,
  updates: Partial<SurgeRule>,
): Promise<SurgeRule> => {
  const existing = await getSurgeRuleById(id)
  const merged = { ...existing, ...updates }
  const before = surgeWindowRange(existing)
  const after = surgeWindowRange(merged)

  const body: Record<string, unknown> = {
    multiplier: merged.multiplier,
    reason: merged.ruleName,
    isActive: merged.status === 'active',
    peakHourStart: merged.peakHourStart ?? null,
    peakHourEnd: merged.peakHourEnd ?? null,
    isPeakHourOnly: merged.isPeakHourOnly ?? false,
    ...(updates.daysOfWeek !== undefined ? { daysOfWeek: updates.daysOfWeek } : {}),
    ...(updates.vehicleTypeIds !== undefined ? { vehicleTypeIds: updates.vehicleTypeIds } : {}),
    ...(updates.cityCode !== undefined ? { cityCode: updates.cityCode } : {}),
    ...(updates.serviceZoneId !== undefined ? { serviceZoneId: updates.serviceZoneId } : {}),
  }
  // The form holds minutes, the database holds more. Send a time only if the admin changed it.
  if (after.startsAt !== before.startsAt) body.startsAt = after.startsAt
  if (after.endsAt && after.endsAt !== before.endsAt) body.endsAt = after.endsAt

  const response = await api.patch<SurgeWindowDto | { data: SurgeWindowDto }>(
    API_ENDPOINTS.surgeWindows.update(id),
    body,
  )
  return windowToSurgeRule(unwrapData(response.data))
}

export const deleteSurgeRule = async (id: string): Promise<void> => {
  await api.delete(API_ENDPOINTS.surgeWindows.delete(id))
}

export const activateSurgeRule = async (id: string): Promise<SurgeRule> => {
  const response = await api.patch<SurgeWindowDto | { data: SurgeWindowDto }>(
    API_ENDPOINTS.surgeWindows.update(id),
    { isActive: true },
  )
  return windowToSurgeRule(unwrapData(response.data))
}

export const deactivateSurgeRule = async (id: string): Promise<SurgeRule> => {
  const response = await api.patch<SurgeWindowDto | { data: SurgeWindowDto }>(
    API_ENDPOINTS.surgeWindows.update(id),
    { isActive: false },
  )
  return windowToSurgeRule(unwrapData(response.data))
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

export const getCancellationRuleVersions = async (id: string): Promise<CancellationRule[]> => {
  const response = await api.get<{ data: ApiCancellationRule[] }>(
    API_ENDPOINTS.cancellationPolicies.versions(id),
  )
  return response.data.data.map(normalizeCancellation)
}

export interface EvaluateCancellationInput {
  actor: 'rider' | 'driver' | 'SYSTEM'
  scenario: 'before_assignment' | 'after_assignment' | 'after_arrival' | 'no_show'
  cityCode?: string | null
  vehicleTypeId?: string | null
  elapsedSec: number
  quotedFare?: number
  baseFare?: number
  minimumFare?: number
  at?: string
}

export interface EvaluateCancellationResult {
  enforcementEnabled: boolean
  matchedPolicy: {
    id: string
    familyId: string
    version: number
    ruleName: string | null
    scopePriority: number
  } | null
  elapsedSec: number
  freeCancelWindowSec: number
  freeWindowRemainingSec: number
  withinGraceWindow: boolean
  rawFee: number
  cancellationFee: number
  driverCompensation: number
  feeStatus: 'WAIVED' | 'ASSESSED' | 'COLLECTED' | 'DISPUTED' | 'REFUNDED'
  reason: string
}

export const evaluateCancellationPolicy = async (
  input: EvaluateCancellationInput,
): Promise<EvaluateCancellationResult> => {
  const response = await api.post<{ data: EvaluateCancellationResult }>(
    API_ENDPOINTS.cancellationPolicies.evaluate,
    input,
  )
  return response.data.data
}

export const createCancellationRule = async (
  data: Omit<CancellationRule, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
): Promise<CancellationRule> => {
  const response = await api.post<{ data: ApiCancellationRule }>(
    API_ENDPOINTS.cancellationPolicies.create,
    toCancellationPayload(data),
  )
  return normalizeCancellation(response.data.data)
}

export const updateCancellationRule = async (
  id: string,
  updates: Partial<CancellationRule>,
): Promise<CancellationRule> => {
  const response = await api.patch<{ data: ApiCancellationRule }>(
    API_ENDPOINTS.cancellationPolicies.update(id),
    toCancellationPayload(updates),
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
