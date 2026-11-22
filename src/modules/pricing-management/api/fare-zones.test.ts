import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import type { InternalAxiosRequestConfig } from 'axios'
import { api } from '@/infrastructure/api'
import { getServiceZones } from './index'

const originalAdapter = api.defaults.adapter

afterEach(() => {
  api.defaults.adapter = originalAdapter
})

describe('fare rule zone choices', () => {
  it('offers service and airport zones, never a restricted zone where no fare can apply', async () => {
    const zone = (id: string, zoneType: string) => ({
      id,
      code: id,
      name: id,
      zoneType,
      cityCode: 'SGR',
      isActive: true,
    })
    api.defaults.adapter = async (config: InternalAxiosRequestConfig) => ({
      data: { data: [zone('s', 'SERVICE'), zone('a', 'AIRPORT'), zone('r', 'RESTRICTED')] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    })

    const zones = await getServiceZones('SGR')

    assert.deepEqual(
      zones.map((z) => z.id),
      ['s', 'a'],
    )
  })
})
