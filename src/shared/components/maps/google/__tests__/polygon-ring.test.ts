import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { appendVertex, closeRing, latLngsToRing, openRing, ringToLatLngs } from '../polygon-ring'

/// The zone and city boundary editors build polygons one map click at a time.
describe('polygon ring helpers', () => {
  it('keeps the first two vertices open and closes the ring at the third', () => {
    const one = appendVertex(null, { lat: 12.9, lng: 77.5 })
    assert.deepEqual(one, [[77.5, 12.9]])
    const two = appendVertex(one, { lat: 12.91, lng: 77.6 })
    assert.deepEqual(two, [[77.5, 12.9], [77.6, 12.91]])
    const three = appendVertex(two, { lat: 12.8, lng: 77.55 })
    assert.deepEqual(three, [[77.5, 12.9], [77.6, 12.91], [77.55, 12.8], [77.5, 12.9]])
  })

  it('inserts a new vertex before the closing point of a closed ring', () => {
    const closed = [[77.5, 12.9], [77.6, 12.91], [77.55, 12.8], [77.5, 12.9]]
    assert.deepEqual(appendVertex(closed, { lat: 12.85, lng: 77.45 }), [
      [77.5, 12.9], [77.6, 12.91], [77.55, 12.8], [77.45, 12.85], [77.5, 12.9],
    ])
  })

  it('rounds clicked coordinates to 6 decimal places', () => {
    assert.deepEqual(appendVertex([], { lat: 12.123456789, lng: 77.987654321 }), [[77.987654, 12.123457]])
  })

  it('openRing drops only the closing repeat', () => {
    assert.deepEqual(openRing([[1, 1], [2, 2], [3, 1], [1, 1]]), [[1, 1], [2, 2], [3, 1]])
    assert.deepEqual(openRing([[1, 1], [2, 2]]), [[1, 1], [2, 2]])
    assert.deepEqual(openRing([[1, 1]]), [[1, 1]])
    assert.deepEqual(openRing(undefined), [])
  })

  it('closeRing leaves fewer than 3 vertices open', () => {
    assert.deepEqual(closeRing([[1, 1], [2, 2]]), [[1, 1], [2, 2]])
    assert.deepEqual(closeRing([[1, 1], [2, 2], [3, 1]]), [[1, 1], [2, 2], [3, 1], [1, 1]])
  })

  it('converts between map points and [lng, lat] rings', () => {
    const ring = latLngsToRing([{ lat: 1.0000004, lng: 2 }, { lat: 3, lng: 4 }, { lat: 5, lng: 6 }])
    assert.deepEqual(ring, [[2, 1], [4, 3], [6, 5], [2, 1]])
    assert.deepEqual(ringToLatLngs([[2, 1], [4, 3]]), [{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }])
  })
})
