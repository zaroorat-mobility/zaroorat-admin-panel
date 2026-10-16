import React, { useState, useEffect, useMemo } from 'react'
import { Navigation, RefreshCw, Zap, Loader2 } from 'lucide-react'
import { api, API_ENDPOINTS } from '@/infrastructure/api'
import { GoogleLiveMap } from '@/shared/components/maps/google/GoogleLiveMap'
import { MapplsLiveMap } from '@/shared/components/maps/mappls/MapplsLiveMap'
import { useMapClientConfig } from '@/shared/hooks/useMapClientConfig'
import { useCities, useCity } from '@/modules/geographic-management/hooks'

export interface MapStudioPreviewProps {
  providerName: string
}

type ProviderSdkState = 'loading' | 'ok' | 'unavailable'
type RouteState = 'loading' | 'ok' | 'unavailable'

interface RouteResponse {
  distanceMeters: number
  durationSeconds: number
  providerName: string
  path?: Array<{ latitude: number; longitude: number }>
}

export const MapStudioPreview: React.FC<MapStudioPreviewProps> = ({ providerName }) => {
  const { data: clientConfig, isLoading: isLoadingConfig } = useMapClientConfig()
  const { data: cities = [] } = useCities(true)

  const activeCity = useMemo(
    () => cities.find((c) => c.code !== 'GLOBAL' && c.isActive) || cities[0],
    [cities]
  )
  const { data: cityDetail } = useCity(activeCity?.id || '')

  const resolvedCenter = useMemo<[number, number] | null>(() => {
    if (cityDetail?.center) {
      return [cityDetail.center.lat, cityDetail.center.lng]
    }
    return null
  }, [cityDetail?.center])

  const [center, setCenter] = useState<[number, number] | null>(null)
  const [zoom, setZoom] = useState<number>(13)

  // Interactive markers state dynamically initialized from active operational region
  const [pickupPos, setPickupPos] = useState<[number, number] | null>(null)
  const [dropoffPos, setDropoffPos] = useState<[number, number] | null>(null)
  const [testPinPos, setTestPinPos] = useState<[number, number] | null>(null)
  const [showRoute, setShowRoute] = useState<boolean>(true)

  useEffect(() => {
    if (resolvedCenter && !center) {
      const [lat, lng] = resolvedCenter
      setCenter([lat, lng])
      setPickupPos([lat, lng])
      setDropoffPos([lat + 0.012, lng + 0.01])
      setTestPinPos([lat - 0.008, lng - 0.008])
    }
  }, [resolvedCenter, center])

  const providerSdkKey =
    providerName === 'mappls'
      ? clientConfig?.providers.mappls?.clientSdkKey ||
        (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_MAPPLS_MAP_KEY : '') ||
        ''
      : clientConfig?.providers.google?.clientSdkKey ||
        (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GOOGLE_MAPS_API_KEY : '') ||
        ''

  const providerSdkState: ProviderSdkState = isLoadingConfig
    ? 'loading'
    : providerSdkKey
      ? 'ok'
      : 'unavailable'

  // Routing comes from the configured provider via the backend, never a third party.
  const [routePath, setRoutePath] = useState<[number, number][]>([])
  const [roadDistanceKm, setRoadDistanceKm] = useState<number | null>(null)
  const [roadEtaMins, setRoadEtaMins] = useState<number | null>(null)
  const [routeProvider, setRouteProvider] = useState<string | null>(null)
  const [routeState, setRouteState] = useState<RouteState>('loading')
  const [routeMessage, setRouteMessage] = useState<string | null>(null)

  // Straight-line distance, shown only where it is labelled as such.
  const calculateDistance = (p1: [number, number], p2: [number, number]): number => {
    const R = 6371
    const dLat = ((p2[0] - p1[0]) * Math.PI) / 180
    const dLon = ((p2[1] - p1[1]) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((p1[0] * Math.PI) / 180) *
        Math.cos((p2[0] * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return parseFloat((R * c).toFixed(2))
  }

  const straightDistanceKm =
    pickupPos && dropoffPos ? calculateDistance(pickupPos, dropoffPos) : 0

  useEffect(() => {
    if (!pickupPos || !dropoffPos) return
    let isMounted = true
    setRouteState('loading')

    const fetchRoute = async () => {
      try {
        const res = await api.post<{ data: RouteResponse }>(API_ENDPOINTS.maps.route, {
          originLat: pickupPos[0],
          originLng: pickupPos[1],
          destinationLat: dropoffPos[0],
          destinationLng: dropoffPos[1],
        })
        if (!isMounted) return
        const route = res.data.data
        setRoutePath((route.path ?? []).map((c) => [c.latitude, c.longitude] as [number, number]))
        setRoadDistanceKm(parseFloat((route.distanceMeters / 1000).toFixed(2)))
        setRoadEtaMins(Math.max(1, Math.round(route.durationSeconds / 60)))
        setRouteProvider(route.providerName)
        setRouteMessage(null)
        setRouteState('ok')
      } catch (err) {
        if (!isMounted) return
        setRoutePath([])
        setRoadDistanceKm(null)
        setRoadEtaMins(null)
        setRouteProvider(null)
        setRouteMessage(err instanceof Error ? err.message : 'Routing request failed')
        setRouteState('unavailable')
      }
    }

    const timer = setTimeout(fetchRoute, 250)
    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [pickupPos, dropoffPos])

  const handleResetView = () => {
    if (resolvedCenter) {
      const [lat, lng] = resolvedCenter
      setCenter([lat, lng])
      setZoom(13)
      setPickupPos([lat, lng])
      setDropoffPos([lat + 0.012, lng + 0.01])
    }
  }

  const providerStatus: Record<ProviderSdkState, { text: string; dot: string; tone: string }> = {
    loading: {
      text: 'Checking provider SDK configuration...',
      dot: 'bg-slate-400',
      tone: 'text-slate-300',
    },
    ok: {
      text: `SUCCESS - ${providerName.toUpperCase()} Web SDK loaded with configured client SDK key`,
      dot: 'bg-emerald-400',
      tone: 'text-emerald-300',
    },
    unavailable: {
      text: `NOT AVAILABLE - no browser SDK key configured for ${providerName}`,
      dot: 'bg-amber-400',
      tone: 'text-amber-300',
    },
  }

  const status = providerStatus[providerSdkState]

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
      {/* Studio Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Interactive Map Studio
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Native Web SDK rendered by{' '}
              <span className="font-semibold capitalize text-primary">{providerName}</span> using
              configured client key
            </p>
          </div>
        </div>

        {/* Map controls */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold capitalize text-slate-800 dark:text-slate-200">
            {providerName} Web SDK
          </div>

          <button
            type="button"
            onClick={handleResetView}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
            title="Reset Map Bounds"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Display Container */}
      <div className="relative flex-1 min-h-[380px] w-full bg-slate-900">
        {!center || !pickupPos || !dropoffPos ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs gap-2 min-h-[380px]">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span>Connecting to active operational region...</span>
          </div>
        ) : providerName === 'mappls' ? (
          <MapplsLiveMap
            center={center}
            zoom={zoom}
            markers={[
              { id: 'pickup', lat: pickupPos[0], lng: pickupPos[1], kind: 'pickup', label: 'Pickup Location' },
              { id: 'dropoff', lat: dropoffPos[0], lng: dropoffPos[1], kind: 'drop', label: 'Dropoff Destination' },
              ...(testPinPos ? [{ id: 'test-pin', lat: testPinPos[0], lng: testPinPos[1], kind: 'driver' as const, label: 'Static Test Pin' }] : []),
            ]}
            routes={[
              {
                id: 'studio-route',
                pickup: { lat: pickupPos[0], lng: pickupPos[1], label: 'Pickup' },
                drop: { lat: dropoffPos[0], lng: dropoffPos[1], label: 'Dropoff' },
                path: showRoute && routePath.length > 0 ? routePath.map(([lat, lng]) => ({ lat, lng })) : null,
              },
            ]}
            height="100%"
            apiKey={providerSdkKey}
          />
        ) : (
          <GoogleLiveMap
            center={center}
            zoom={zoom}
            markers={[
              { id: 'pickup', lat: pickupPos[0], lng: pickupPos[1], kind: 'pickup', label: 'Pickup Location' },
              { id: 'dropoff', lat: dropoffPos[0], lng: dropoffPos[1], kind: 'drop', label: 'Dropoff Destination' },
              ...(testPinPos ? [{ id: 'test-pin', lat: testPinPos[0], lng: testPinPos[1], kind: 'driver' as const, label: 'Static Test Pin' }] : []),
            ]}
            routes={[
              {
                id: 'studio-route',
                pickup: { lat: pickupPos[0], lng: pickupPos[1], label: 'Pickup' },
                drop: { lat: dropoffPos[0], lng: dropoffPos[1], label: 'Dropoff' },
                path: showRoute && routePath.length > 0 ? routePath.map(([lat, lng]) => ({ lat, lng })) : null,
              },
            ]}
            height="100%"
            apiKey={providerSdkKey}
          />
        )}

        {/* Floating route overlay */}
        <div className="absolute top-4 left-4 z-[500] p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-lg text-xs space-y-2 max-w-xs select-none">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
            <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              {routeState === 'loading'
                ? 'Requesting route...'
                : routeState === 'ok'
                  ? `Road route — ${routeProvider}`
                  : 'Routing not available'}
            </span>
            <button
              type="button"
              onClick={() => setShowRoute(!showRoute)}
              className="text-[10px] font-semibold text-primary hover:underline"
            >
              {showRoute ? 'Hide Line' : 'Show Line'}
            </button>
          </div>

          {routeState === 'ok' ? (
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">
                  Road distance
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {roadDistanceKm} km
                </span>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">
                  Provider ETA
                </span>
                <span className="font-extrabold text-primary text-sm">~{roadEtaMins} mins</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-[11px]">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">
                  Straight-line distance (not a road route)
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {straightDistanceKm} km
                </span>
              </div>
              {routeState === 'unavailable' && routeMessage ? (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-snug">
                  {routeMessage}
                </p>
              ) : null}
            </div>
          )}

          <p className="text-[10px] text-slate-400 pt-0.5">
            Test route calculation and interactive marker display from the configured provider.
          </p>
        </div>

        {/* Truthful tile status pill */}
        {dropoffPos && (
          <div className="absolute bottom-4 left-4 z-[500] px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-800 text-white text-[11px] font-medium flex items-center gap-2 max-w-[calc(100%-2rem)]">
            <span className={`w-2 h-2 rounded-full shrink-0 ${status.dot}`}></span>
            <span className={status.tone}>{status.text}</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300 font-mono shrink-0">
              {dropoffPos[0].toFixed(4)}, {dropoffPos[1].toFixed(4)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default MapStudioPreview
