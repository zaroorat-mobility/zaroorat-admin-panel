import { useEffect, useState } from 'react'
import { getCity } from '../api'
import type { CityListItem } from '../types'

export function useCityMapContext(cityCode: string, cities: CityListItem[]) {
  const [referenceBoundary, setReferenceBoundary] = useState<number[][][] | null>(null)
  const [cityCenter, setCityCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (!cityCode) {
      setReferenceBoundary(null)
      setCityCenter(null)
      setMapReady(false)
      return
    }

    const city = cities.find((c) => c.code === cityCode && c.code !== 'GLOBAL')
    if (!city) {
      setMapReady(false)
      return
    }

    let cancelled = false
    setMapReady(false)
    void getCity(city.id)
      .then((detail) => {
        if (cancelled) return
        setReferenceBoundary(detail.boundary)
        setCityCenter(detail.center)
        setMapReady(true)
      })
      .catch(() => {
        if (cancelled) return
        setReferenceBoundary(null)
        setCityCenter(null)
        setMapReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [cityCode, cities])

  return { referenceBoundary, cityCenter, mapReady }
}
