import { useCallback, useEffect, useState } from 'react'
import { getCity } from '../api'
import { boundaryCenter } from '../components/CreateCityModal/geoUtils'
import type { CityListItem, CoverageMode } from '../types'

interface LoadedCityMap {
  cityCode: string
  boundary: number[][][] | null
  center: { lat: number; lng: number } | null
  coverageMode: CoverageMode | null
  failed: boolean
}

export function useCityMapContext(cityCode: string, cities: CityListItem[]) {
  const [loaded, setLoaded] = useState<LoadedCityMap | null>(null)
  const [attempt, setAttempt] = useState(0)
  const cityId = cities.find((c) => c.code === cityCode && c.code !== 'GLOBAL')?.id

  useEffect(() => {
    if (!cityId) return

    let cancelled = false
    void getCity(cityId)
      .then((detail) => {
        if (cancelled) return
        const center = detail.center ?? boundaryCenter(detail.boundary)
        setLoaded({
          cityCode,
          boundary: detail.boundary,
          center,
          coverageMode: detail.coverageMode ?? null,
          // A city with no boundary cannot hold a zone, so it counts as not loaded.
          failed: !center || !detail.boundary?.[0]?.length,
        })
      })
      .catch(() => {
        if (cancelled) return
        setLoaded({ cityCode, boundary: null, center: null, coverageMode: null, failed: true })
      })

    return () => {
      cancelled = true
    }
  }, [cityCode, cityId, attempt])

  const retry = useCallback(() => {
    setLoaded(null)
    setAttempt((n) => n + 1)
  }, [])

  // Read through the city code, so a render can never see the previous city's centre.
  const current = loaded?.cityCode === cityCode ? loaded : null

  return {
    referenceBoundary: current?.boundary ?? null,
    cityCenter: current?.center ?? null,
    coverageMode: current?.coverageMode ?? null,
    mapReady: Boolean(current),
    loadedCityCode: current && !current.failed ? cityCode : null,
    failed: Boolean(current?.failed) || Boolean(cityCode && cities.length > 0 && !cityId),
    retry,
  }
}
