process.env.TZ = 'Asia/Kolkata'

import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import type { InternalAxiosRequestConfig } from 'axios'
import { api } from '@/infrastructure/api'
import {
  combineDateTime,
  createSurgeRule,
  endOfDayExclusive,
  surgeWindowRange,
  updateSurgeRule,
  windowToSurgeRule,
  type SurgeWindowDto,
} from './index'

const originalAdapter = api.defaults.adapter

afterEach(() => {
  api.defaults.adapter = originalAdapter
})

function dto(overrides: Partial<SurgeWindowDto> = {}): SurgeWindowDto {
  return {
    id: 'w1',
    zoneId: 'z1',
    vehicleTypeId: null,
    multiplier: '1.50',
    reason: 'Evening',
    peakHourStart: null,
    peakHourEnd: null,
    isPeakHourOnly: false,
    startsAt: combineDateTime('2026-11-10', '17:00'),
    endsAt: null,
    isActive: true,
    createdAt: '2026-11-01T00:00:00.000Z',
    ...overrides,
  }
}

function fakeServer(window: SurgeWindowDto) {
  const patches: Array<Record<string, unknown>> = []
  const posts: Array<Record<string, unknown>> = []
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const ok = (data: unknown) => ({ data, status: 200, statusText: 'OK', headers: {}, config })
    if (config.method === 'patch') {
      patches.push(JSON.parse(String(config.data)) as Record<string, unknown>)
      return ok(window)
    }
    if (config.method === 'post') {
      posts.push(JSON.parse(String(config.data)) as Record<string, unknown>)
      return ok(window)
    }
    if (String(config.url).includes('vehicle')) {
      return ok({ data: [{ id: 'v-cab', code: 'CAB_ECONOMY', name: 'Economy Cab' }] })
    }
    return ok(window)
  }
  return { patches, posts }
}

describe('surge rule times', () => {
  it('shows the same local time the admin entered', () => {
    const rule = windowToSurgeRule(dto())
    assert.equal(rule.effectiveFrom, '2026-11-10')
    assert.equal(rule.startTime, '17:00')
  })

  it('keeps 17:00 at 17:00 through three open-and-save rounds', () => {
    let startsAt = combineDateTime('2026-11-10', '17:00')
    const original = startsAt
    for (let round = 0; round < 3; round++) {
      startsAt = surgeWindowRange(windowToSurgeRule(dto({ startsAt }))).startsAt
    }
    assert.equal(startsAt, original)
  })

  it('includes the whole last day when an end date has no end time', () => {
    assert.equal(endOfDayExclusive('2026-11-10'), new Date('2026-11-11T00:00:00+05:30').toISOString())
    const range = surgeWindowRange({ effectiveFrom: '2026-11-10', effectiveTo: '2026-11-10' })
    assert.equal(range.endsAt, new Date('2026-11-11T00:00:00+05:30').toISOString())
  })

  it('shows that end date back as the last day, and keeps it when saved again', () => {
    const endsAt = endOfDayExclusive('2026-11-10')
    const rule = windowToSurgeRule(dto({ endsAt }))
    assert.equal(rule.effectiveTo, '2026-11-10')
    assert.equal(rule.endTime, undefined)
    assert.equal(surgeWindowRange(rule).endsAt, endsAt)
  })

  it('keeps an exact end time', () => {
    const endsAt = combineDateTime('2026-11-12', '21:00')
    const rule = windowToSurgeRule(dto({ endsAt }))
    assert.equal(rule.effectiveTo, '2026-11-12')
    assert.equal(rule.endTime, '21:00')
    assert.equal(surgeWindowRange(rule).endsAt, endsAt)
  })

  it('shows a midnight start as no start time', () => {
    const rule = windowToSurgeRule(dto({ startsAt: combineDateTime('2026-11-10') }))
    assert.equal(rule.startTime, undefined)
  })
})

describe('surge rule vehicles', () => {
  it('reports a rule with no vehicle as all vehicles, not cab', () => {
    assert.equal(windowToSurgeRule(dto({ vehicleTypeCode: null })).vehicleLabel, 'All vehicles')
  })

  it('names a rule with one vehicle', () => {
    assert.equal(
      windowToSurgeRule(dto({ vehicleTypeCode: 'CAB_PREMIUM' })).vehicleLabel,
      'Premium Cab',
    )
  })
})

describe('saving a surge rule', () => {
  it('leaves stored times alone when saved with no change, even with seconds in them', async () => {
    const window = dto({
      startsAt: '2026-10-02T05:53:45.123Z',
      endsAt: '2026-10-09T05:53:45.123Z',
    })
    const { patches } = fakeServer(window)

    await updateSurgeRule('w1', windowToSurgeRule(window))

    assert.equal(patches.length, 1)
    assert.equal('startsAt' in patches[0], false)
    assert.equal('endsAt' in patches[0], false)
  })

  it('sends the new start when the admin changes it', async () => {
    const window = dto()
    const { patches } = fakeServer(window)

    await updateSurgeRule('w1', { ...windowToSurgeRule(window), startTime: '18:00' })

    assert.equal(patches[0].startsAt, combineDateTime('2026-11-10', '18:00'))
  })

  it('sends no demand or supply thresholds when updating', async () => {
    const window = dto()
    const { patches } = fakeServer(window)

    await updateSurgeRule('w1', windowToSurgeRule(window))

    assert.equal('demandThresholdPct' in patches[0], false)
    assert.equal('supplyThresholdPct' in patches[0], false)
  })

  it('sends the multiplier as entered and no thresholds when creating', async () => {
    const window = dto()
    const { posts } = fakeServer(window)

    await createSurgeRule({
      ruleName: 'Evening',
      vehicleType: ['cab'],
      zoneId: 'z1',
      multiplier: 1.3,
      effectiveFrom: '2026-11-10',
      startTime: '17:00',
      status: 'active',
    })

    assert.equal(posts[0].multiplier, 1.3)
    assert.equal('demandThresholdPct' in posts[0], false)
    assert.equal(posts[0].startsAt, combineDateTime('2026-11-10', '17:00'))
  })
})
