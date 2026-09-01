/** Decode a Google-encoded polyline into lat/lng points (precision 1e5). */
export function decodeEncodedPolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const coordinates: Array<{ lat: number; lng: number }> = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    let result = 0
    let shift = 0
    let byte: number

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1
    lat += deltaLat

    result = 0
    shift = 0

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1
    lng += deltaLng

    coordinates.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }

  return coordinates
}

export function resolveRoutePath(
  route?: {
    path?: Array<{ lat: number; lng: number }> | null
    encodedPolyline?: string | null
  } | null,
): Array<{ lat: number; lng: number }> | null {
  if (!route) return null
  if (route.path && route.path.length >= 2) return route.path
  if (route.encodedPolyline?.trim()) {
    const decoded = decodeEncodedPolyline(route.encodedPolyline.trim())
    return decoded.length >= 2 ? decoded : null
  }
  return null
}
