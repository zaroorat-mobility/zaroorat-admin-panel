/**
 * GeoJSON ring helpers shared by the Google polygon editors.
 * A ring is a list of [lng, lat] pairs; it is closed (last point repeats the first)
 * once it has 3 vertices, and open while it is still being drawn.
 */

export type LngLat = [number, number]

const round6 = (n: number) => Number(n.toFixed(6))

/** The ring's distinct vertices, without the closing repeat. */
export function openRing(ring: number[][] | null | undefined): LngLat[] {
  if (!ring?.length) return []
  const points = ring.map(([lng, lat]) => [lng, lat] as LngLat)
  const first = points[0]
  const last = points[points.length - 1]
  const closed = points.length > 1 && first[0] === last[0] && first[1] === last[1]
  return closed ? points.slice(0, -1) : points
}

/** Closes the ring once it has 3 vertices; shorter lists stay open. */
export function closeRing(points: LngLat[]): LngLat[] {
  if (points.length < 3) return points
  return [...points, [points[0][0], points[0][1]]]
}

/** Adds a vertex (rounded to 6 dp) after the ring's existing vertices. */
export function appendVertex(ring: number[][] | null | undefined, point: { lat: number; lng: number }): LngLat[] {
  return closeRing([...openRing(ring), [round6(point.lng), round6(point.lat)]])
}

/** Reads map points (e.g. a Google polygon path) into a ring, rounded to 6 dp. */
export function latLngsToRing(points: Array<{ lat: number; lng: number }>): LngLat[] {
  return closeRing(points.map((p) => [round6(p.lng), round6(p.lat)] as LngLat))
}

/** A ring as Google `LatLngLiteral`s. */
export function ringToLatLngs(ring: number[][]): Array<{ lat: number; lng: number }> {
  return ring.map(([lng, lat]) => ({ lat, lng }))
}
