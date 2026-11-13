import { useEffect, useState } from 'react'
import { getServiceZone } from '../api'
import { useServiceZones } from './index'
import type { ServiceZoneDetail } from '../types'

export function useCityZonesWithBoundaries(cityCode?: string) {
  const { data: list = [], isLoading: isLoadingList } = useServiceZones({
    ...(cityCode ? { cityCode } : {}),
    activeOnly: true,
  })

  const [zonesWithBoundaries, setZonesWithBoundaries] = useState<ServiceZoneDetail[]>([])
  const [isLoadingBoundaries, setIsLoadingBoundaries] = useState(false)

  useEffect(() => {
    if (!list.length) {
      // `list` is a new [] on every render while loading. A new [] here would re-render forever.
      setZonesWithBoundaries((prev) => (prev.length ? [] : prev))
      return
    }

    let cancelled = false
    setIsLoadingBoundaries(true)

    // Load full boundary details for existing active service zones in this city
    Promise.all(
      list.map(async (zoneItem) => {
        try {
          return await getServiceZone(zoneItem.id)
        } catch {
          return null
        }
      }),
    )
      .then((details) => {
        if (cancelled) return
        const valid = details.filter((d): d is ServiceZoneDetail => Boolean(d && d.boundary?.length))
        setZonesWithBoundaries(valid)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBoundaries(false)
      })

    return () => {
      cancelled = true
    }
  }, [list])

  return {
    zones: zonesWithBoundaries,
    zoneList: list,
    isLoading: isLoadingList || isLoadingBoundaries,
  }
}
