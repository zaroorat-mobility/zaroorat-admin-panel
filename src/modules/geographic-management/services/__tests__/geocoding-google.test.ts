import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  cityFromPlaceDetails,
  cityListItemFromSuggestion,
  getInitialCitiesForState,
  isInState,
  placeKind,
} from '../geocodingService'

/// The city wizard lists Google city suggestions and stores the one the admin picks.
describe('Google city suggestions in the city picker', () => {
  it('reads the state from "<state>, India"', () => {
    const row = cityListItemFromSuggestion({ placeId: 'p1', mainText: 'Mysuru', secondaryText: 'Karnataka, India' })
    assert.equal(row.center, undefined, 'coordinates only come with the details fetched on pick')
    assert.deepEqual(row, {
      placeId: 'p1',
      code: 'MYQ',
      name: 'Mysuru',
      district: '',
      stateName: 'Karnataka',
      stateCode: 'KA',
    })
  })

  it('reads the district when the secondary text has one', () => {
    const row = cityListItemFromSuggestion({
      placeId: 'p2',
      mainText: 'Hunsur',
      secondaryText: 'Mysuru district, Karnataka, India',
    })
    assert.equal(row.district, 'Mysuru district')
    assert.equal(row.stateName, 'Karnataka')
    assert.equal(row.code, 'HUN')
  })

  it('matches states loosely and lets unknown states through', () => {
    assert.equal(isInState('Delhi', 'NCT of Delhi'), true)
    assert.equal(isInState('Karnataka', 'Karnataka'), true)
    assert.equal(isInState('Kerala', 'Karnataka'), false)
    assert.equal(isInState('', 'Karnataka'), true)
    assert.equal(isInState('Kerala', undefined), true)
  })
})

describe('a picked Google city', () => {
  const components = [
    { longText: 'Mysuru', shortText: 'Mysuru', types: ['locality', 'political'] },
    { longText: 'Mysuru', shortText: 'Mysuru', types: ['administrative_area_level_3', 'political'] },
    { longText: 'Mysore Division', shortText: 'Mysore Division', types: ['administrative_area_level_2', 'political'] },
    { longText: 'Karnataka', shortText: 'KA', types: ['administrative_area_level_1', 'political'] },
    { longText: 'India', shortText: 'IN', types: ['country', 'political'] },
  ]

  it('takes name, state and centre from the place details, rounded to 6 dp', () => {
    const city = cityFromPlaceDetails({
      name: 'Mysuru',
      location: { lat: 12.29581123456, lng: 76.63938099999 },
      addressComponents: components,
    })
    assert.equal(city.name, 'Mysuru')
    assert.equal(city.code, 'MYQ')
    assert.equal(city.stateName, 'Karnataka')
    assert.equal(city.stateCode, 'KA')
    assert.deepEqual(city.center, { lat: 12.295811, lng: 76.639381 })
  })

  it('uses the lower administrative level as district, never the city itself', () => {
    const city = cityFromPlaceDetails({ name: 'Mysuru', location: { lat: 1, lng: 2 }, addressComponents: components })
    // Level 3 equals the city name here, so the district falls back to the state.
    assert.equal(city.district, 'Karnataka')
    const town = cityFromPlaceDetails({
      name: 'Hunsur',
      location: { lat: 1, lng: 2 },
      addressComponents: [
        { longText: 'Hunsur', shortText: 'Hunsur', types: ['locality'] },
        { longText: 'Mysuru', shortText: 'Mysuru', types: ['administrative_area_level_3'] },
        { longText: 'Karnataka', shortText: 'KA', types: ['administrative_area_level_1'] },
      ],
    })
    assert.equal(town.district, 'Mysuru')
  })

  it('falls back to the display name and the selected state when components are missing', () => {
    const city = cityFromPlaceDetails({ name: 'Leh', location: { lat: 34.15, lng: 77.58 }, addressComponents: [] }, 'Ladakh')
    assert.equal(city.name, 'Leh')
    assert.equal(city.stateName, 'Ladakh')
    assert.equal(city.stateCode, 'LA')
  })
})

describe('zone search labels and state lists', () => {
  it('labels airports and stations from Google place types', () => {
    assert.equal(placeKind(['airport', 'point_of_interest']), 'airport')
    assert.equal(placeKind(['train_station', 'transit_station']), 'station')
    assert.equal(placeKind(['bus_station']), 'station')
    assert.equal(placeKind(['hospital']), 'place')
  })

  it('lists a covered state from the built-in districts and an uncovered one as empty', () => {
    assert.ok(getInitialCitiesForState('KA', 'Karnataka').length > 0)
    assert.deepEqual(getInitialCitiesForState('ZZ', 'Nowhere'), [])
  })
})
