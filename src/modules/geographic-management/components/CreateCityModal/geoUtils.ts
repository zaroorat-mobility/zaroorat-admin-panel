/**
 * Geographic calculation utilities for City boundaries (WGS84).
 */

export interface LatLngPoint {
  lat: number
  lng: number
}

const EARTH_RADIUS_KM = 6371
const MIN_ZONE_AREA_KM2 = 0.05

/**
 * Generate a smooth circular polygon (GeoJSON ring format: [[[lng, lat], ...]])
 */
export function generateCirclePolygon(
  center: LatLngPoint,
  radiusKm: number,
  points = 64
): number[][][] {
  const ring: [number, number][] = []
  const latRad = (center.lat * Math.PI) / 180
  const lngRad = (center.lng * Math.PI) / 180
  const d = radiusKm / EARTH_RADIUS_KM

  for (let i = 0; i < points; i++) {
    const bearing = (i * 2 * Math.PI) / points
    const pLat = Math.asin(
      Math.sin(latRad) * Math.cos(d) +
      Math.cos(latRad) * Math.sin(d) * Math.cos(bearing)
    )
    const pLng =
      lngRad +
      Math.atan2(
        Math.sin(bearing) * Math.sin(d) * Math.cos(latRad),
        Math.cos(d) - Math.sin(latRad) * Math.sin(pLat)
      )

    const lngDeg = Number(((pLng * 180) / Math.PI).toFixed(6))
    const latDeg = Number(((pLat * 180) / Math.PI).toFixed(6))
    ring.push([lngDeg, latDeg])
  }

  // Close ring
  if (ring.length > 0) {
    ring.push([ring[0][0], ring[0][1]])
  }

  return [ring]
}

/**
 * The default zone for a new polygon, or null until the selected city has loaded.
 */
export function seedRingFor(input: {
  cityCode: string
  loadedCityCode: string | null
  center: LatLngPoint | null
  radiusKm: number
}): number[][][] | null {
  if (!input.center || input.loadedCityCode !== input.cityCode) return null
  return generateCirclePolygon(input.center, input.radiusKm, 8)
}

/**
 * The middle of a boundary's points, used when a city has a boundary but no saved centre.
 */
export function boundaryCenter(coordinates?: number[][][] | null): LatLngPoint | null {
  const ring = coordinates?.[0]
  if (!ring || ring.length < 3) return null
  const first = ring[0]
  const last = ring[ring.length - 1]
  const points = first[0] === last[0] && first[1] === last[1] ? ring.slice(0, -1) : ring
  const sum = points.reduce((acc, [lng, lat]) => ({ lat: acc.lat + lat, lng: acc.lng + lng }), {
    lat: 0,
    lng: 0,
  })
  return { lat: sum.lat / points.length, lng: sum.lng / points.length }
}

export interface ZoneCheck {
  ok: boolean
  label: string
}

/**
 * Whether a drawn zone can be saved, in words the admin can act on. Each label says what is
 * true now, so a failed check never reads like a passed one.
 */
export function zoneChecks(input: {
  cityName: string
  coordinates?: number[][][] | null
  cityBoundary?: number[][][] | null
}): { ok: boolean; insideCity: boolean; checks: ZoneCheck[] } {
  const { cityName, coordinates, cityBoundary } = input
  const ring = coordinates?.[0] ?? []
  if (ring.length < 4) {
    return {
      ok: false,
      insideCity: true,
      checks: [{ ok: false, label: 'Add at least 3 points' }],
    }
  }

  const insideCity = ring.every(([lng, lat]) => isPointInsidePolygon({ lng, lat }, cityBoundary))
  const noCrossing = !hasSelfIntersections(coordinates)
  const area = calculatePolygonAreaKm2(coordinates)
  const bigEnough = area > MIN_ZONE_AREA_KM2

  return {
    ok: insideCity && noCrossing && bigEnough,
    insideCity,
    checks: [
      {
        ok: insideCity,
        label: insideCity ? `Inside ${cityName}` : `Part of this zone is outside ${cityName}`,
      },
      {
        ok: noCrossing,
        label: noCrossing ? 'Lines do not cross' : 'The lines of this zone cross each other',
      },
      {
        ok: bigEnough,
        label: bigEnough
          ? `Area is ${area.toFixed(2)} km²`
          : `This zone is too small (${area.toFixed(2)} km²)`,
      },
      { ok: true, label: `${ring.length - 1} points` },
    ],
  }
}

/**
 * Great-circle distance between two points in kilometers (Haversine formula).
 */
export function haversineDistanceKm(p1: LatLngPoint, p2: LatLngPoint): number {
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180
  const lat1 = (p1.lat * Math.PI) / 180
  const lat2 = (p2.lat * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

/**
 * Calculate perimeter in kilometers for a GeoJSON polygon ring.
 */
export function calculatePolygonPerimeterKm(coordinates?: number[][][] | null): number {
  if (!coordinates?.[0] || coordinates[0].length < 3) return 0
  const ring = coordinates[0]
  let perimeter = 0

  for (let i = 0; i < ring.length - 1; i++) {
    const p1 = { lng: ring[i][0], lat: ring[i][1] }
    const p2 = { lng: ring[i + 1][0], lat: ring[i + 1][1] }
    perimeter += haversineDistanceKm(p1, p2)
  }

  return Number(perimeter.toFixed(2))
}

/**
 * Calculate spherical surface area in km² of a polygon ring on Earth.
 */
export function calculatePolygonAreaKm2(coordinates?: number[][][] | null): number {
  if (!coordinates?.[0] || coordinates[0].length < 3) return 0
  const ring = coordinates[0]

  let totalAngle = 0
  const len = ring.length - 1 // ignore duplicated closing point if present

  for (let i = 0; i < len; i++) {
    const p1 = ring[i]
    const p2 = ring[(i + 1) % len]

    const lng1Rad = (p1[0] * Math.PI) / 180
    const lat1Rad = (p1[1] * Math.PI) / 180
    const lng2Rad = (p2[0] * Math.PI) / 180
    const lat2Rad = (p2[1] * Math.PI) / 180

    totalAngle += (lng2Rad - lng1Rad) * (2 + Math.sin(lat1Rad) + Math.sin(lat2Rad))
  }

  const area = Math.abs((totalAngle * EARTH_RADIUS_KM * EARTH_RADIUS_KM) / 2)
  return Number(area.toFixed(2))
}

/**
 * Point in polygon check using ray-casting algorithm.
 */
export function isPointInsidePolygon(point: LatLngPoint, coordinates?: number[][][] | null): boolean {
  if (!coordinates?.[0] || coordinates[0].length < 3) return false
  const ring = coordinates[0]
  const x = point.lng
  const y = point.lat

  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }

  return inside
}

/**
 * Simple self-intersection check for polygon ring edges.
 */
export function hasSelfIntersections(coordinates?: number[][][] | null): boolean {
  if (!coordinates?.[0] || coordinates[0].length < 4) return false
  const ring = coordinates[0]

  function ccw(A: number[], B: number[], C: number[]) {
    return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])
  }

  function intersect(A: number[], B: number[], C: number[], D: number[]) {
    return ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D)
  }

  const n = ring.length - 1
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue
      if (intersect(ring[i], ring[i + 1], ring[j], ring[j + 1])) {
        return true
      }
    }
  }

  return false
}
