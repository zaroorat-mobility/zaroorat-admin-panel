import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { ZoneMapEditor } from '@/shared/components/maps/ZoneMapEditor'
import { api, API_ENDPOINTS } from '@/infrastructure/api'
import { useCities, useCreateServiceZone, useServiceZone, useUpdateServiceZone } from '../hooks'
import { useCityMapContext } from '../hooks/useCityMapContext'
import type { ServiceZoneType } from '../types'

function errMsg(err: unknown): string {
  return (
    (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
      ?.message ??
    (err as Error)?.message ??
    'Failed to save service zone'
  )
}

export const ServiceZoneFormPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: cities = [] } = useCities(true)
  const createZone = useCreateServiceZone()

  const [cityCode, setCityCode] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [zoneType, setZoneType] = useState<ServiceZoneType>('SERVICE')
  const [coordinates, setCoordinates] = useState<number[][][] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [vehicleTypeIds, setVehicleTypeIds] = useState<string[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<Array<{ id: string; code: string; name: string }>>([])

  const { referenceBoundary, mapReady } = useCityMapContext(cityCode, cities)

  useEffect(() => {
    const active = cities.filter((c) => c.code !== 'GLOBAL')
    if (!active.length) return
    setCityCode((prev) => (prev && active.some((c) => c.code === prev) ? prev : active[0].code))
  }, [cities])

  useEffect(() => {
    void api.get<{ data: Array<{ id: string; code: string; name: string }> }>(API_ENDPOINTS.vehicleTypes.list)
      .then((res) => setVehicleTypes(res.data.data ?? res.data as unknown as Array<{ id: string; code: string; name: string }>))
      .catch(() => setVehicleTypes([]))
  }, [])

  const handleCityChange = (nextCityCode: string) => {
    setCityCode(nextCityCode)
    setCoordinates(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!coordinates?.[0]?.length || coordinates[0].length < 3) {
      setError('Draw a zone polygon on the map before saving.')
      return
    }
    try {
      const created = await createZone.mutateAsync({
        cityCode,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        zoneType,
        coordinates,
        ...(vehicleTypeIds.length > 0 ? { vehicleTypeIds } : {}),
      })
      navigate(`/geographic-management/service-zones/${created.id}/edit`)
    } catch (err) {
      setError(errMsg(err))
    }
  }

  return (
    <PageWrapper>
      <PageHeader title="Create Service Zone" onBack={() => navigate('/geographic-management/service-zones')} />
      <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <select
            className="border rounded-lg p-2 text-sm"
            value={cityCode}
            onChange={(e) => handleCityChange(e.target.value)}
            required
          >
            {cities.filter((c) => c.code !== 'GLOBAL').map((c) => (
              <option key={c.id} value={c.code}>{c.name}</option>
            ))}
          </select>
          <select className="border rounded-lg p-2 text-sm" value={zoneType} onChange={(e) => setZoneType(e.target.value as ServiceZoneType)}>
            <option value="SERVICE">Service</option>
            <option value="AIRPORT">Airport</option>
            <option value="RESTRICTED">Restricted</option>
          </select>
          <input className="border rounded-lg p-2 text-sm" placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} required />
          <input className="border rounded-lg p-2 text-sm" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <p className="text-xs font-bold mb-2">Supported vehicle categories</p>
          <div className="flex flex-wrap gap-2">
            {vehicleTypes.map((vt) => (
              <label key={vt.id} className="flex items-center gap-1 text-xs border rounded px-2 py-1">
                <input
                  type="checkbox"
                  checked={vehicleTypeIds.includes(vt.id)}
                  onChange={(e) => {
                    setVehicleTypeIds((prev) =>
                      e.target.checked ? [...prev, vt.id] : prev.filter((id) => id !== vt.id),
                    )
                  }}
                />
                {vt.code}
              </label>
            ))}
          </div>
        </div>
        {mapReady ? (
          <ZoneMapEditor
            key={cityCode}
            coordinates={coordinates}
            referenceCoordinates={referenceBoundary}
            onChange={setCoordinates}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Loading city map…</p>
        )}
        <Button type="submit" disabled={createZone.isPending || !mapReady || !cityCode}>
          Create Zone
        </Button>
      </form>
    </PageWrapper>
  )
}

export const ServiceZoneEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: cities = [] } = useCities(true)
  const { data: zone, isLoading } = useServiceZone(id || '')
  const updateZone = useUpdateServiceZone()

  const [name, setName] = useState('')
  const [zoneType, setZoneType] = useState<ServiceZoneType>('SERVICE')
  const [coordinates, setCoordinates] = useState<number[][][] | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [allowsPickup, setAllowsPickup] = useState(true)
  const [allowsDropoff, setAllowsDropoff] = useState(true)
  const [vehicleTypeIds, setVehicleTypeIds] = useState<string[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<Array<{ id: string; code: string }>>([])
  const [error, setError] = useState<string | null>(null)

  const { referenceBoundary, mapReady: cityMapReady } = useCityMapContext(zone?.cityCode ?? '', cities)

  useEffect(() => {
    if (!zone) return
    setName(zone.name)
    setZoneType(zone.zoneType)
    setCoordinates(zone.boundary)
    setAllowsPickup(zone.allowsPickup)
    setAllowsDropoff(zone.allowsDropoff)
    setVehicleTypeIds(zone.vehicleTypeIds)
    setMapReady(true)
  }, [zone])

  useEffect(() => {
    void api.get<{ data: Array<{ id: string; code: string }> }>(API_ENDPOINTS.vehicleTypes.list)
      .then((res) => setVehicleTypes((res.data as { data: Array<{ id: string; code: string }> }).data))
      .catch(() => setVehicleTypes([]))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setError(null)
    if (!coordinates?.[0]?.length || coordinates[0].length < 3) {
      setError('Draw a valid zone polygon before saving.')
      return
    }
    try {
      await updateZone.mutateAsync({
        id,
        payload: {
          name: name.trim(),
          zoneType,
          coordinates,
          allowsPickup,
          allowsDropoff,
          vehicleTypeIds,
        },
      })
      navigate(`/geographic-management/service-zones/${id}`)
    } catch (err) {
      setError(errMsg(err))
    }
  }

  if (isLoading || !zone) {
    return <PageWrapper><p className="text-sm text-muted-foreground">Loading service zone…</p></PageWrapper>
  }

  return (
    <PageWrapper>
      <PageHeader
        title={`Edit Service Zone: ${zone.name}`}
        description={`${zone.code} · ${zone.cityCode}`}
        onBack={() => navigate(`/geographic-management/service-zones/${id}`)}
      />
      <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <input className="border rounded-lg p-2 text-sm bg-slate-50" value={zone.code} disabled />
          <input className="border rounded-lg p-2 text-sm bg-slate-50" value={zone.cityCode} disabled />
          <input className="border rounded-lg p-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} required />
          <select className="border rounded-lg p-2 text-sm" value={zoneType} onChange={(e) => setZoneType(e.target.value as ServiceZoneType)}>
            <option value="SERVICE">Service</option>
            <option value="AIRPORT">Airport</option>
            <option value="RESTRICTED">Restricted</option>
          </select>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={allowsPickup} onChange={(e) => setAllowsPickup(e.target.checked)} />
            Pickup allowed
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={allowsDropoff} onChange={(e) => setAllowsDropoff(e.target.checked)} />
            Drop allowed
          </label>
        </div>
        <div>
          <p className="text-xs font-bold mb-2">Supported vehicle categories</p>
          <div className="flex flex-wrap gap-2">
            {vehicleTypes.map((vt) => (
              <label key={vt.id} className="flex items-center gap-1 text-xs border rounded px-2 py-1">
                <input
                  type="checkbox"
                  checked={vehicleTypeIds.includes(vt.id)}
                  onChange={(e) => {
                    setVehicleTypeIds((prev) =>
                      e.target.checked ? [...prev, vt.id] : prev.filter((vid) => vid !== vt.id),
                    )
                  }}
                />
                {vt.code}
              </label>
            ))}
          </div>
        </div>
        {mapReady && cityMapReady && coordinates ? (
          <ZoneMapEditor
            key={zone.id}
            coordinates={coordinates}
            referenceCoordinates={referenceBoundary}
            onChange={setCoordinates}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Loading map…</p>
        )}
        <Button type="submit" disabled={updateZone.isPending}>Save Changes</Button>
      </form>
    </PageWrapper>
  )
}

export const ServiceZoneDetailPage: React.FC<{ zoneId: string }> = ({ zoneId }) => {
  const navigate = useNavigate()
  const { data: zone, isLoading } = useServiceZone(zoneId)
  const { data: cities = [] } = useCities(true)
  const { referenceBoundary, mapReady } = useCityMapContext(zone?.cityCode ?? '', cities)

  if (isLoading || !zone) return <PageWrapper><p>Loading...</p></PageWrapper>

  return (
    <PageWrapper>
      <PageHeader
        title={zone.name}
        description={`${zone.zoneType} · ${zone.cityCode}`}
        onBack={() => navigate('/geographic-management/service-zones')}
        actions={
          <div className="flex gap-3 items-center flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(`/geographic-management/service-zones/${zone.id}/edit`)}
            >
              Edit Zone
            </Button>
            <Link
              to={`/pricing-management/fare-rules?cityCode=${zone.cityCode}&serviceZoneId=${zone.id}`}
              className="text-xs font-semibold text-primary underline"
            >
              View linked fare rules
            </Link>
            <Link
              to={`/pricing-management/fare-rules/new?cityCode=${zone.cityCode}&serviceZoneId=${zone.id}`}
              className="text-xs font-semibold text-primary underline"
            >
              Create fare rule for this zone
            </Link>
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2 text-sm">
          <p><strong>Code:</strong> {zone.code}</p>
          <p><strong>Pickup allowed:</strong> {zone.allowsPickup ? 'Yes' : 'No'}</p>
          <p><strong>Drop allowed:</strong> {zone.allowsDropoff ? 'Yes' : 'No'}</p>
          <p><strong>Linked fare rules:</strong> {zone.fareRuleCount}</p>
          {zone.vehicleTypeCodes.length > 0 && (
            <p><strong>Vehicle types:</strong> {zone.vehicleTypeCodes.join(', ')}</p>
          )}
        </div>
        {mapReady ? (
          <ZoneMapEditor
            coordinates={zone.boundary}
            referenceCoordinates={referenceBoundary}
            editable={false}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Loading map…</p>
        )}
      </div>
    </PageWrapper>
  )
}

export default ServiceZoneFormPage
