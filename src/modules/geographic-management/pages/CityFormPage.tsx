import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { ZoneMapEditor } from '@/shared/components/maps/ZoneMapEditor'
import { useCity, useCreateCity, useStates, useUpdateCity } from '../hooks'

export const CityFormPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const { data: city, isLoading } = useCity(id || '')
  const { data: states = [] } = useStates({ countryCode: 'IN', activeOnly: true })
  const createCity = useCreateCity()
  const updateCity = useUpdateCity()

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [stateId, setStateId] = useState('')
  const [boundary, setBoundary] = useState<number[][][] | null>(null)
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [mapReady, setMapReady] = useState(!isEdit)

  React.useEffect(() => {
    if (!city) return
    setCode(city.code)
    setName(city.name)
    setStateId(city.stateId ?? '')
    setBoundary(city.boundary)
    setCenter(city.center)
    setMapReady(true)
  }, [city])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      code,
      name,
      stateId: stateId || null,
      ...(boundary ? { boundary } : {}),
      ...(center ? { center } : {}),
      isActive: true,
    }
    if (isEdit && id) {
      await updateCity.mutateAsync({ id, payload })
      navigate(`/geographic-management/cities/${id}`)
    } else {
      const created = await createCity.mutateAsync(payload)
      navigate(`/geographic-management/cities/${created.id}`)
    }
  }

  return (
    <PageWrapper>
      <PageHeader
        title={isEdit ? `Edit City: ${city?.name ?? ''}` : 'Create City'}
        onBack={() => navigate('/geographic-management/cities')}
      />
      <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
        <div className="grid grid-cols-2 gap-4">
          <input className="border rounded-lg p-2 text-sm" placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} required />
          <input className="border rounded-lg p-2 text-sm" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <select className="border rounded-lg p-2 text-sm" value={stateId} onChange={(e) => setStateId(e.target.value)}>
            <option value="">Select state</option>
            {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        {isEdit && isLoading && <p className="text-sm text-muted-foreground">Loading city boundary…</p>}
        {mapReady && (
          <ZoneMapEditor
            key={isEdit ? id : 'new-city'}
            coordinates={boundary}
            center={center}
            onChange={setBoundary}
            onCenterChange={setCenter}
            allowCenterPick
            editable
          />
        )}
        <Button type="submit" disabled={createCity.isPending || updateCity.isPending || (isEdit && isLoading)}>
          Save City
        </Button>
      </form>
    </PageWrapper>
  )
}

export default CityFormPage
