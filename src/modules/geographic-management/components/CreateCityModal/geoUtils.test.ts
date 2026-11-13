import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  boundaryCenter,
  generateCirclePolygon,
  haversineDistanceKm,
  seedRingFor,
  zoneAccessDefaults,
  zoneChecks,
} from './geoUtils'

const AMRITSAR = { lat: 31.634, lng: 74.8723 }
const BARAMULLA = { lat: 34.209, lng: 74.3436 }

describe('zoneAccessDefaults', () => {
  it('blocks pickup and drop on a restricted zone', () => {
    assert.deepEqual(zoneAccessDefaults('RESTRICTED'), { allowsPickup: false, allowsDropoff: false })
  })

  it('allows pickup and drop on service and airport zones', () => {
    assert.deepEqual(zoneAccessDefaults('SERVICE'), { allowsPickup: true, allowsDropoff: true })
    assert.deepEqual(zoneAccessDefaults('AIRPORT'), { allowsPickup: true, allowsDropoff: true })
  })
})

describe('zoneChecks', () => {
  const cityBoundary = generateCirclePolygon(BARAMULLA, 8, 32)
  const labels = (result: ReturnType<typeof zoneChecks>) => result.checks.map((c) => c.label)

  it('passes a zone inside the city and says so in plain words', () => {
    const result = zoneChecks({
      cityName: 'Baramulla',
      coordinates: generateCirclePolygon(BARAMULLA, 2, 8),
      cityBoundary,
    })
    assert.equal(result.ok, true)
    assert.equal(result.insideCity, true)
    assert.ok(labels(result).includes('Inside Baramulla'))
  })

  it('fails a zone in another city without calling it inside', () => {
    const result = zoneChecks({
      cityName: 'Baramulla',
      coordinates: generateCirclePolygon(AMRITSAR, 2, 8),
      cityBoundary,
    })
    assert.equal(result.ok, false)
    assert.equal(result.insideCity, false)
    assert.ok(labels(result).includes('Part of this zone is outside Baramulla'))
    assert.ok(!labels(result).includes('Inside Baramulla'))
  })

  it('fails a zone whose first point is inside but the rest are not', () => {
    const coordinates = [
      [
        [BARAMULLA.lng, BARAMULLA.lat],
        [AMRITSAR.lng, AMRITSAR.lat],
        [AMRITSAR.lng + 0.1, AMRITSAR.lat],
        [BARAMULLA.lng, BARAMULLA.lat],
      ],
    ]
    assert.equal(zoneChecks({ cityName: 'Baramulla', coordinates, cityBoundary }).insideCity, false)
  })

  it('fails when the city boundary is missing, rather than assuming it fits', () => {
    const result = zoneChecks({
      cityName: 'Baramulla',
      coordinates: generateCirclePolygon(BARAMULLA, 2, 8),
      cityBoundary: null,
    })
    assert.equal(result.ok, false)
  })

  it('names a self-crossing shape and a shape that is too small', () => {
    const crossing = [
      [
        [74.3, 34.2],
        [74.4, 34.3],
        [74.4, 34.2],
        [74.3, 34.3],
        [74.3, 34.2],
      ],
    ]
    const crossed = zoneChecks({
      cityName: 'Baramulla',
      coordinates: crossing,
      cityBoundary: generateCirclePolygon(BARAMULLA, 30, 32),
    })
    assert.ok(labels(crossed).includes('The lines of this zone cross each other'))

    const tiny = zoneChecks({
      cityName: 'Baramulla',
      coordinates: generateCirclePolygon(BARAMULLA, 0.05, 8),
      cityBoundary,
    })
    assert.equal(tiny.ok, false)
    assert.ok(labels(tiny).some((l) => l.startsWith('This zone is too small')))
  })

  it('asks for more points when nothing has been drawn', () => {
    const result = zoneChecks({ cityName: 'Baramulla', coordinates: null, cityBoundary })
    assert.equal(result.ok, false)
    assert.ok(labels(result).includes('Add at least 3 points'))
  })
})

describe('boundaryCenter', () => {
  it('takes the middle of the real shape, ignoring the repeated closing point', () => {
    const square = [
      [
        [74, 34],
        [76, 34],
        [76, 36],
        [74, 36],
        [74, 34],
      ],
    ]
    assert.deepEqual(boundaryCenter(square), { lat: 35, lng: 75 })
  })

  it('gives nothing for a missing shape', () => {
    assert.equal(boundaryCenter(null), null)
  })
})

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
