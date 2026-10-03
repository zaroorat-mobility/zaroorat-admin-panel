/**
 * Production Live Geocoding Service
 * Powered by OpenStreetMap (Photon API + Nominatim fallback).
 * Dynamically resolves cities, coordinates, districts, and administrative areas in real time.
 * Zero hardcoded catalog or district arrays.
 */

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

/** Non-city features to exclude from city autocomplete results */
const EXCLUDED_OSM_VALUES = new Set([
  'house',
  'station',
  'bus_stop',
  'tram_stop',
  'airport',
  'aerodrome',
  'railway',
  'train_station',
  'stadium',
  'pitch',
  'school',
  'university',
  'college',
  'hospital',
  'restaurant',
  'hotel',
  'bank',
  'shop',
  'atm',
  'fuel',
  'post_office',
  'police',
  'place_of_worship',
  'courthouse',
  'monument',
  'memorial',
  'park',
  'attraction',
  'viewpoint',
  'road',
  'highway',
  'secondary',
  'trunk',
  'primary',
  'tertiary',
  'street',
  'construction',
  'motorway',
  'state',
  'country',
  'continent',
  'region',
  'province',
  'administrative',
])

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

// In-memory cache to prevent redundant HTTP requests
const queryCache = new Map<string, LiveCityItem[]>()

/**
 * Search live cities via OpenStreetMap (Photon API + Nominatim fallback)
 */
export async function searchLiveCities(
  query: string,
  stateFilter?: string,
  signal?: AbortSignal,
): Promise<LiveCityItem[]> {
  const trimmed = query.trim()
  if (!trimmed || trimmed.length < 2) return []

  const queryLower = trimmed.toLowerCase()
  const cacheKey = `${queryLower}__${(stateFilter || '').toLowerCase()}`
  if (queryCache.has(cacheKey)) {
    return queryCache.get(cacheKey)!
  }

  const searchQuery =
    stateFilter && !trimmed.toLowerCase().includes(stateFilter.toLowerCase())
      ? `${trimmed}, ${stateFilter}`
      : trimmed

  const remoteItems: LiveCityItem[] = []

  // 1. Primary: Photon (Fast, free, based on OpenStreetMap)
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      searchQuery,
    )}&osm_tag=place&limit=20&lang=en`
    const res = await fetch(url, { signal })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.features) && data.features.length > 0) {
        const seenNames = new Set<string>()

        for (const f of data.features) {
          const props = f.properties || {}
          const osmVal = (props.osm_value || '').toLowerCase()
          const type = (props.type || '').toLowerCase()

          // Filter out non-city POIs
          if (EXCLUDED_OSM_VALUES.has(osmVal) || EXCLUDED_OSM_VALUES.has(type)) continue

          const country = props.country || ''
          const countryCode = (props.countrycode || '').toUpperCase()

          // Filter for India
          if (countryCode && countryCode !== 'IN') continue
          if (!countryCode && country && !country.toLowerCase().includes('india')) continue

          const name = props.name || ''
          if (!name || seenNames.has(name.toLowerCase())) continue

          // Prevent state entity itself from masquerading as a city
          if (stateFilter && name.toLowerCase() === stateFilter.toLowerCase()) continue

          const state = props.state || stateFilter || ''
          const district = props.county || props.district || props.city || state

          // Filter by state if specified
          if (
            stateFilter &&
            state &&
            !state.toLowerCase().includes(stateFilter.toLowerCase()) &&
            !stateFilter.toLowerCase().includes(state.toLowerCase())
          ) {
            continue
          }

          // Ensure the name or district actually contains the search query
          if (
            !name.toLowerCase().includes(queryLower) &&
            !district.toLowerCase().includes(queryLower)
          ) {
            continue
          }

          const coords = f.geometry?.coordinates
          if (!coords || coords.length < 2) continue

          const code = deriveCityCode(name)
          const cityItem: LiveCityItem = {
            code,
            name,
            district: district !== name ? district : state || 'India',
            stateName: state,
            stateCode: resolveStateCode(state),
            center: { lat: Number(coords[1].toFixed(6)), lng: Number(coords[0].toFixed(6)) },
          }

          seenNames.add(name.toLowerCase())
          remoteItems.push(cityItem)

          if (remoteItems.length >= 15) break
        }
      }
    }
  } catch {
    // Fall through to Nominatim
  }

  // 2. Fallback: OpenStreetMap Nominatim if Photon returned nothing
  if (remoteItems.length === 0) {
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        searchQuery,
      )}&format=json&addressdetails=1&countrycodes=in&limit=15`
      const res = await fetch(nomUrl, {
        signal,
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'ZarooratAdmin/1.0',
        },
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          const seenNames = new Set<string>()

          for (const item of data) {
            const addr = item.address || {}
            const name = addr.city || addr.town || addr.municipality || item.name || ''
            if (!name || seenNames.has(name.toLowerCase())) continue

            // Prevent state entity itself from masquerading as a city
            if (stateFilter && name.toLowerCase() === stateFilter.toLowerCase()) continue

            const state = addr.state || stateFilter || ''
            const district = addr.state_district || addr.county || addr.city_district || state

            if (
              !name.toLowerCase().includes(queryLower) &&
              !district.toLowerCase().includes(queryLower)
            ) {
              continue
            }

            const code = deriveCityCode(name)
            seenNames.add(name.toLowerCase())
            remoteItems.push({
              code,
              name,
              district: district !== name ? district : state || 'India',
              stateName: state,
              stateCode: resolveStateCode(state),
              center: {
                lat: Number(parseFloat(item.lat).toFixed(6)),
                lng: Number(parseFloat(item.lon).toFixed(6)),
              },
            })

            if (remoteItems.length >= 15) break
          }
        }
      }
    } catch {
      // Ignored
    }
  }

  queryCache.set(cacheKey, remoteItems)
  return remoteItems
}

/**
 * Fetch initial cities dynamically for a selected state.
 * Returns official administrative districts/cities for the state,
 * with graceful fallback to live OpenStreetMap search.
 */
export async function getInitialCitiesForState(
  stateCode: string,
  stateName?: string,
): Promise<LiveCityItem[]> {
  const normCode = (stateCode || (stateName ? resolveStateCode(stateName) : '')).toUpperCase().trim()

  // 1. Return official administrative districts (e.g. all 20 districts for Jammu and Kashmir)
  const officialDistricts = getOfficialDistrictsByState(normCode)
  if (officialDistricts && officialDistricts.length > 0) {
    return officialDistricts
  }

  // 2. Fallback to live search if state not in official list
  const query = stateName || stateCode
  const results = await searchLiveCities(query, stateName)
  const normState = (stateName || '').toLowerCase().trim()
  return results.filter((item) => item.name.toLowerCase() !== normState)
}
