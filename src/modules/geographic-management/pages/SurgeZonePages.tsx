import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { ZoneMapEditor } from '@/shared/components/maps/ZoneMapEditor'
import { useCities } from '../hooks'
import { useCityMapContext } from '../hooks/useCityMapContext'
import { createSurgeZone, getSurgeZone, updateSurgeZone } from '../api/surge'

function errMsg(err: unknown): string {
  return (
    (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
      ?.message ??
    (err as Error)?.message ??
    'Request failed'
  )
}

export const SurgeZoneFormPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: cities = [] } = useCities(true)
  const createMutation = useMutation({ mutationFn: createSurgeZone })

  const [cityCode, setCityCode] = useState('')
  const [name, setName] = useState('')
  const [coordinates, setCoordinates] = useState<number[][][] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { referenceBoundary, mapReady } = useCityMapContext(cityCode, cities)

  useEffect(() => {
    const active = cities.filter((c) => c.code !== 'GLOBAL')
    if (!active.length) return
    setCityCode((prev) => (prev && active.some((c) => c.code === prev) ? prev : active[0].code))
  }, [cities])

  const handleCityChange = (next: string) => {
    setCityCode(next)
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
      const created = await createMutation.mutateAsync({ cityCode, name: name.trim(), coordinates })
      navigate(`/geographic-management/surge-zones/${created.id}/edit`)
    } catch (err) {
      setError(errMsg(err))
    }
  }

  return (
    <PageWrapper>
      <PageHeader title="Create Surge Zone" onBack={() => navigate('/geographic-management/surge-zones')} />
      <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
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
          <input
            className="border rounded-lg p-2 text-sm"
            placeholder="Zone name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
        <Button type="submit" disabled={createMutation.isPending || !mapReady || !cityCode}>
          Create Surge Zone
        </Button>
      </form>
    </PageWrapper>
  )
}

export const SurgeZoneEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: cities = [] } = useCities(true)

  const { data: zone, isLoading } = useQuery({
    queryKey: ['surge-zone', id],
    queryFn: () => getSurgeZone(id!),
    enabled: !!id,
  })

  const [name, setName] = useState('')
  const [coordinates, setCoordinates] = useState<number[][][] | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { referenceBoundary, mapReady: cityMapReady } = useCityMapContext(zone?.cityCode ?? '', cities)

  useEffect(() => {
    if (!zone) return
    setName(zone.name)
    setCoordinates(zone.boundary)
    setMapReady(true)
  }, [zone])

  const saveMutation = useMutation({
    mutationFn: (payload: { name: string; coordinates: number[][][] }) =>
      updateSurgeZone(id!, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['surge-zones'] })
      void qc.invalidateQueries({ queryKey: ['surge-zone', id] })
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!coordinates?.[0]?.length || coordinates[0].length < 3) {
      setError('Draw a valid zone polygon before saving.')
      return
    }
    try {
      await saveMutation.mutateAsync({ name: name.trim(), coordinates })
      navigate('/geographic-management/surge-zones')
    } catch (err) {
      setError(errMsg(err))
    }
  }

  if (isLoading || !zone) {
    return <PageWrapper><p className="text-sm text-muted-foreground">Loading surge zone…</p></PageWrapper>
  }

  return (
    <PageWrapper>
      <PageHeader
        title={`Edit Surge Zone: ${zone.name}`}
        description={`${zone.cityCode} · ${zone.isActive ? 'Active' : 'Inactive'}`}
        onBack={() => navigate('/geographic-management/surge-zones')}
      />
      <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <input className="border rounded-lg p-2 text-sm bg-slate-50" value={zone.cityCode} disabled />
          <input
            className="border rounded-lg p-2 text-sm"
            placeholder="Zone name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
        <Button type="submit" disabled={saveMutation.isPending}>Save Changes</Button>
      </form>
    </PageWrapper>
  )
}
