import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { haversineDistanceKm, seedRingFor } from './geoUtils'

const AMRITSAR = { lat: 31.634, lng: 74.8723 }
const BARAMULLA = { lat: 34.209, lng: 74.3436 }

describe('seedRingFor', () => {
  it('gives no ring while the selected city is still loading', () => {
    const ring = seedRingFor({
      cityCode: 'BRM',
      loadedCityCode: 'ATQ',
      center: AMRITSAR,
      radiusKm: 2,
    })
    assert.equal(ring, null)
  })

  it('gives no ring when the city has no centre', () => {
    const ring = seedRingFor({ cityCode: 'BRM', loadedCityCode: 'BRM', center: null, radiusKm: 2 })
    assert.equal(ring, null)
  })

  it('gives a closed 8-point ring around the selected city', () => {
    const ring = seedRingFor({
      cityCode: 'BRM',
      loadedCityCode: 'BRM',
      center: BARAMULLA,
      radiusKm: 2,
    })
    assert.ok(ring)
    assert.equal(ring[0].length, 9)
    assert.deepEqual(ring[0][0], ring[0][8])
    for (const [lng, lat] of ring[0]) {
      assert.ok(haversineDistanceKm(BARAMULLA, { lat, lng }) < 2.1)
    }
  })
})
