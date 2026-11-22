import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import type { InternalAxiosRequestConfig } from 'axios'
import { api } from '@/infrastructure/api'
import { previewFareRule } from './index'
import { toDisplayFareRule } from '../fare-rules/pages/FareRulesListPage'
import type { FareRule } from '../fare-rules/types'

const originalAdapter = api.defaults.adapter
afterEach(() => {
  api.defaults.adapter = originalAdapter
})

function capture(response: unknown = { data: {} }) {
  const calls: Array<{ method?: string; url?: string; params?: unknown; body?: Record<string, unknown> }> = []
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    calls.push({
      method: config.method,
      url: config.url,
      params: config.params,
      body: config.data ? (JSON.parse(String(config.data)) as Record<string, unknown>) : undefined,
    })
    return { data: response, status: 200, statusText: 'OK', headers: {}, config }
  }
  return calls
}

const rule = (over: Partial<FareRule>): FareRule =>
  ({
    id: 'r1', ruleName: 'x', version: 3, vehicleType: 'CAB_MINI_AC', vehicleTypeName: 'Cab Mini (AC)',
    cityCode: 'SGR', serviceType: null, serviceZoneId: null, serviceZoneName: null, baseFare: 40,
    minimumFare: 50, perKmRate: 10, perMinuteRate: 1, freeWaitingMinutes: 3, waitingChargePerMinute: 2,
    bookingFee: 0, platformFeePct: 0, taxRatePct: null, commissionRatePct: null, nightEnabled: false,
    nightStartTime: '', nightEndTime: '', nightChargePercentage: 0, status: 'active',
    effectiveFrom: '2027-01-01', createdAt: '', updatedAt: '', ...over,
  }) as FareRule

describe('fare rules list', () => {
  it('labels each row with the exact vehicle type the server named, never a guess', () => {
    const mini = toDisplayFareRule(rule({}))
    assert.equal(mini.vehicleCategory, 'Cab Mini (AC) · CAB_MINI_AC')
    // A Non-AC variant of the same family stays distinct (the old guess called both "Cab Mini (AC)").
    const nonAc = toDisplayFareRule(rule({ vehicleType: 'CAB_MINI_NON_AC', vehicleTypeName: 'Cab Mini' }))
    assert.equal(nonAc.vehicleCategory, 'Cab Mini · CAB_MINI_NON_AC')
    assert.equal(nonAc.version, 'v3')
  })

  it('shows the zone or the city code, not a hard-coded city name', () => {
    assert.equal(toDisplayFareRule(rule({ cityCode: 'SGR' })).cityZone, 'SGR')
    assert.equal(toDisplayFareRule(rule({ cityCode: 'GLOBAL' })).cityZone, 'All cities (GLOBAL)')
    assert.equal(toDisplayFareRule(rule({ serviceZoneName: 'Airport' })).cityZone, 'Airport (SGR)')
  })
})

describe('fare preview', () => {
  it('asks the server to price the rule and leaves a blank rate to the platform default', async () => {
    const calls = capture({ data: { fare: {}, commissionAtAcceptance: 0, rates: {} } })
    await previewFareRule({
      baseFare: 40, minimumFare: 50, perKmRate: 10, perMinuteRate: 1, freeWaitingMinutes: 3,
      waitingChargePerMinute: 2, bookingFee: 0, platformFeePct: 0, taxRatePct: null, commissionRatePct: 12,
      distanceKm: 5, durationMin: 15, waitingMinutes: 0, surgeMultiplier: 1, discountAmount: 0,
    })
    assert.equal(calls[0]?.method, 'post')
    assert.equal(calls[0]?.url, '/admin/fare-rules/preview')
    assert.equal(calls[0]?.body?.commissionRatePct, 12)
    assert.equal('taxRatePct' in (calls[0]?.body ?? {}), false)
  })
})
