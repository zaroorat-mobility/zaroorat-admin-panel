import { useCallback, useEffect, useState } from 'react'
import { getCity } from '../api'
import type { CityListItem } from '../types'

interface LoadedCityMap {
  cityCode: string
  boundary: number[][][] | null
  center: { lat: number; lng: number } | null
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
        setLoaded({ cityCode, boundary: detail.boundary, center: detail.center, failed: false })
      })
      .catch(() => {
        if (cancelled) return
        setLoaded({ cityCode, boundary: null, center: null, failed: true })
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
    mapReady: Boolean(current),
    loadedCityCode: current && !current.failed ? cityCode : null,
    failed: Boolean(current?.failed),
    retry,
  }
}
