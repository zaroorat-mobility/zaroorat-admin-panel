/**
 * No city in the app has a real official polygon, so "Official" always produced an invented
 * 8 km octagon labelled as government limits. It stays hidden until a real polygon exists.
 */
import '../../../../dashboard/__tests__/dom-env'
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { act, createElement, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { InternalAxiosRequestConfig } from 'axios'
import { api, API_ENDPOINTS } from '@/infrastructure/api'
import { generateCirclePolygon } from '../geoUtils'
import { Step2Boundary } from '../Step2Boundary'

const CENTER = { lat: 34.209, lng: 74.3436 }
const REAL_POLYGON = generateCirclePolygon(CENTER, 12, 16)

const originalAdapter = api.defaults.adapter
let container: HTMLDivElement
let root: Root
let chosenType: string
let chosenBoundary: number[][][] | null

const flush = () => act(async () => new Promise((r) => setTimeout(r, 0)))
const settle = async () => {
  for (let i = 0; i < 10; i++) await flush()
}

function Harness({ officialBoundary }: { officialBoundary?: number[][][] }) {
  const [boundaryType, setBoundaryType] = useState<'official' | 'radius' | 'polygon'>('official')
  const [boundary, setBoundary] = useState<number[][][] | null>(null)
  const [selectedOfficialCity] = useState(() => ({
    code: 'BRM',
    name: 'Baramulla',
    district: 'Baramulla',
    stateName: 'J&K',
    stateCode: 'JK',
    center: CENTER,
    ...(officialBoundary ? { officialBoundary } : {}),
  }))
  chosenType = boundaryType
  chosenBoundary = boundary
  return createElement(Step2Boundary, {
    cityName: 'Baramulla',
    cityCode: 'BRM',
    stateName: 'J&K',
    country: 'India',
    center: CENTER,
    setCenter: () => {},
    boundaryType,
    setBoundaryType,
    radiusKm: 10,
    setRadiusKm: () => {},
    boundary,
    setBoundary,
    selectedOfficialCity,
  })
}

async function render(officialBoundary?: number[][][]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  await act(async () =>
    root.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(Harness, officialBoundary ? { officialBoundary } : {}),
      ),
    ),
  )
  await settle()
}

beforeEach(() => {
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const ok = (data: unknown) => ({ data, status: 200, statusText: 'OK', headers: {}, config })
    if (config.url === API_ENDPOINTS.settings.mapsClientConfig) return ok({ data: { providers: {} } })
    return ok({ data: [] })
  }
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  api.defaults.adapter = originalAdapter
})

describe('Step2Boundary: the Official option', () => {
  it('is hidden without a real polygon, and the form moves to Radius', async () => {
    await render()
    assert.ok(!(container.textContent ?? '').includes('Government limits'))
    assert.equal(chosenType, 'radius')
    assert.equal(chosenBoundary?.[0].length, 65)
  })

  it('is offered and used when a real polygon exists', async () => {
    await render(REAL_POLYGON)
    assert.ok((container.textContent ?? '').includes('Government limits'))
    assert.equal(chosenType, 'official')
    assert.deepEqual(chosenBoundary, REAL_POLYGON)
  })
})
