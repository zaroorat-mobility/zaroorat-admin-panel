import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import type { InternalAxiosRequestConfig } from 'axios'
import { api } from '@/infrastructure/api'
import { getFareRuleById, updateFareRule } from './index'

const originalAdapter = api.defaults.adapter

afterEach(() => {
  api.defaults.adapter = originalAdapter
})

describe('fare rule vehicle', () => {
  it('edits a Cab Mini (AC) fare without turning it into the retired "cab" type', async () => {
    const patches: Array<Record<string, unknown>> = []
    // The server's `vehicleType` calls every cab "cab"; only `vehicleTypeCode` is exact.
    const rule = { id: 'r1', vehicleType: 'cab', vehicleTypeCode: 'CAB_MINI_AC', baseFare: 60, cityCode: 'SGR' }
    api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      if (config.method === 'patch') patches.push(JSON.parse(String(config.data)) as Record<string, unknown>)
      return { data: { data: rule }, status: 200, statusText: 'OK', headers: {}, config }
    }

    const loaded = await getFareRuleById('r1')
    assert.equal(loaded.vehicleType, 'CAB_MINI_AC')

    // The edit page sends the whole form back, vehicle included.
    await updateFareRule('r1', { ...loaded, baseFare: 75 })
    assert.equal(patches[0]?.vehicleType, 'CAB_MINI_AC')
  })
})
