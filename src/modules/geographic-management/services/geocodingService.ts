/**
 * City and place helpers for the geographic wizards.
 * Cities come from the built-in official district list first; anything else is searched with
 * Google Places (New) in the browser (usePlaceAutocomplete), and mapped here.
 */

import type { PlaceAddressComponent } from '@/shared/hooks/usePlaceAutocomplete'
import { getOfficialDistrictsByState } from './officialDistrictsData'

export interface LiveCityItem {
  code: string
  name: string
  district: string
  stateName: string
  stateCode: string
  center: { lat: number; lng: number }
  officialBoundary?: number[][][]
}

/** Standard ISO 3166-2 state code resolution map for India */
export const STATE_CODE_MAP: Record<string, string> = {
  karnataka: 'KA',
  maharashtra: 'MH',
  delhi: 'DL',
  'new delhi': 'DL',
  'nct of delhi': 'DL',
  bihar: 'BR',
  'tamil nadu': 'TN',
  'uttar pradesh': 'UP',
  gujarat: 'GJ',
  rajasthan: 'RJ',
  'west bengal': 'WB',
  kerala: 'KL',
  'madhya pradesh': 'MP',
  'andhra pradesh': 'AP',
  telangana: 'TG',
  punjab: 'PB',
  haryana: 'HR',
  odisha: 'OD',
  orissa: 'OD',
  assam: 'AS',
  goa: 'GA',
  uttarakhand: 'UK',
  uttaranchal: 'UK',
  'himachal pradesh': 'HP',
  jharkhand: 'JH',
  chhattisgarh: 'CG',
  'jammu and kashmir': 'JK',
  'jammu & kashmir': 'JK',
  chandigarh: 'CH',
  puducherry: 'PY',
  pondicherry: 'PY',
  ladakh: 'LA',
}

const COMMON_IATA_CODES: Record<string, string> = {
  bengaluru: 'BLR',
  bangalore: 'BLR',
  delhi: 'DEL',
  'new delhi': 'NDL',
  mumbai: 'BOM',
  bombay: 'BOM',
  pune: 'PNQ',
  chennai: 'MAA',
  madras: 'MAA',
  kolkata: 'CCU',
  calcutta: 'CCU',
  hyderabad: 'HYD',
  ahmedabad: 'AMD',
  jaipur: 'JAI',
  lucknow: 'LKO',
  patna: 'PAT',
  srinagar: 'SGR',
  jammu: 'IXJ',
  chandigarh: 'IXC',
  bhopal: 'BHO',
  indore: 'IDR',
  kochi: 'COK',
  cochin: 'COK',
  thiruvananthapuram: 'TRV',
  trivandrum: 'TRV',
  guwahati: 'GAU',
  bhubaneswar: 'BBI',
  ranchi: 'IXR',
  raipur: 'RPR',
  dehradun: 'DED',
  shimla: 'SLV',
  panaji: 'GOI',
  goa: 'GOI',
  mysuru: 'MYQ',
  mysore: 'MYQ',
  mangaluru: 'IXE',
  mangalore: 'IXE',
  hubballi: 'HBX',
  hubli: 'HBX',
  belagavi: 'IXG',
  belgaum: 'IXG',
  kalaburagi: 'GBI',
  gulbarga: 'GBI',
  ballari: 'VDY',
  bellary: 'VDY',
  surat: 'STV',
  vadodara: 'BDQ',
  baroda: 'BDQ',
  nagpur: 'NAG',
  nashik: 'ISK',
  varanasi: 'VNS',
  kanpur: 'KNU',
  agra: 'AGR',
  noida: 'NDA',
  amritsar: 'ATQ',
  gurugram: 'GGN',
  gurgaon: 'GGN',
  faridabad: 'FBD',
  visakhapatnam: 'VTZ',
  vizag: 'VTZ',
  vijayawada: 'VGA',
  gaya: 'GAY',
  bhagalpur: 'BGP',
  muzaffarpur: 'MZU',
  darbhanga: 'DBR',
  purnia: 'PRN',
  cuttack: 'CTC',
  rourkela: 'RRK',
  silchar: 'IXS',
  dibrugarh: 'DIB',
  jorhat: 'JRH',
  margao: 'MAO',
  haridwar: 'HW',
  roorkee: 'RKE',
  dharamshala: 'DHM',
  jamshedpur: 'IXW',
  dhanbad: 'DHN',
  bokaro: 'BOK',
  bhilai: 'BHL',
  bilaspur: 'PAB',
}

/**
 * Derives standard uppercase city code (IATA if known, or first 3 letters)
 */
export function deriveCityCode(cityName: string): string {
  const normalized = cityName.toLowerCase().trim()
  if (COMMON_IATA_CODES[normalized]) return COMMON_IATA_CODES[normalized]
  const clean = cityName.replace(/[^a-zA-Z]/g, '').toUpperCase()
  return clean.slice(0, 3) || 'CTY'
}

/**
 * Resolves State Code from State Name
 */
export function resolveStateCode(stateName: string): string {
  const norm = stateName.toLowerCase().trim()
  return STATE_CODE_MAP[norm] ?? (stateName.slice(0, 2).toUpperCase() || 'IN')
}

/** A row in the city picker: an official district (with coordinates) or a Google suggestion. */
export type CityListItem = Omit<LiveCityItem, 'center'> & {
  center?: LiveCityItem['center']
  /** Google place id. Set on suggestions, whose coordinates come with the details fetched on pick. */
  placeId?: string
}

/** Google Places (New) primary types for cities and towns. */
export const CITY_PLACE_TYPES = ['locality', 'administrative_area_level_3']

/**
 * A Google city suggestion as a picker row. Its secondary text reads like "Karnataka, India"
 * or "Mysuru district, Karnataka, India"; the district is only known for sure after the pick.
 */
export function cityListItemFromSuggestion(suggestion: {
  placeId: string
  mainText: string
  secondaryText: string
}): CityListItem {
  const parts = suggestion.secondaryText
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p && p.toLowerCase() !== 'india')
  const stateName = parts[parts.length - 1] ?? ''
  return {
    placeId: suggestion.placeId,
    code: deriveCityCode(suggestion.mainText),
    name: suggestion.mainText,
    district: parts.length >= 2 ? parts[0] : '',
    stateName,
    stateCode: resolveStateCode(stateName),
  }
}

/** Whether a row's state matches the selected state ("Delhi" vs "NCT of Delhi"); unknown passes. */
export function isInState(stateName: string, selectedState?: string): boolean {
  if (!selectedState || !stateName) return true
  const a = stateName.toLowerCase()
  const b = selectedState.toLowerCase()
  return a.includes(b) || b.includes(a)
}

const componentText = (components: PlaceAddressComponent[], type: string) =>
  components.find((c) => c.types.includes(type))?.longText ?? ''

/** A picked Google city, from its place details, in the shape the city wizard stores. */
export function cityFromPlaceDetails(
  details: { name: string; location: { lat: number; lng: number }; addressComponents: PlaceAddressComponent[] },
  fallbackStateName = '',
): LiveCityItem {
  const components = details.addressComponents
  const name = componentText(components, 'locality') || details.name
  const stateName = componentText(components, 'administrative_area_level_1') || fallbackStateName
  // District: the most specific administrative level below the state that Google returns.
  const district =
    componentText(components, 'administrative_area_level_3') ||
    componentText(components, 'administrative_area_level_2')
  return {
    code: deriveCityCode(name),
    name,
    district: district && district !== name ? district : stateName || 'India',
    stateName,
    stateCode: resolveStateCode(stateName),
    center: {
      lat: Number(details.location.lat.toFixed(6)),
      lng: Number(details.location.lng.toFixed(6)),
    },
  }
}

export type PlaceKind = 'airport' | 'station' | 'place'

const STATION_TYPES = ['train_station', 'transit_station', 'subway_station', 'light_rail_station', 'bus_station']

/** How a Google place is labelled in the zone search list. */
export function placeKind(types: string[]): PlaceKind {
  if (types.includes('airport')) return 'airport'
  if (types.some((t) => STATION_TYPES.includes(t))) return 'station'
  return 'place'
}

/**
 * The state's official districts from the built-in list (e.g. all 20 for Jammu and Kashmir).
 * A state the list does not cover starts empty; the admin then searches Google by name.
 */
export function getInitialCitiesForState(stateCode: string, stateName?: string): LiveCityItem[] {
  const normCode = (stateCode || (stateName ? resolveStateCode(stateName) : '')).toUpperCase().trim()
  return getOfficialDistrictsByState(normCode)
}
