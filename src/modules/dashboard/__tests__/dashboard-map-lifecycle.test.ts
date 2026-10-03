/**
 * Phase 3 map lifecycle: mounts the real LiveOperationsMapSection (react-leaflet + Leaflet)
 * in jsdom and counts what Leaflet actually does on each data refresh.
 *
 * Coordinates are generated inside a synthetic box by a seeded generator: test data only,
 * never a real place and never used by the app.
 */
import './dom-env'
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { act, createElement, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import L from 'leaflet'
import { LiveOperationsMapSection } from '../components/LiveOperationsMapSection'
import type { LiveDriver } from '../types'

// ─── Leaflet instrumentation ─────────────────────────────────────────────────

const counts = { maps: 0, mapsRemoved: 0, markers: 0, setLatLng: 0, setIcon: 0, fitBounds: 0, setView: 0 }
let lastMap: L.Map | null = null

function spy(proto: object, method: string, key: keyof typeof counts, onCall?: (self: unknown) => void) {
  const p = proto as Record<string, (...args: unknown[]) => unknown>
  const original = p[method]
  p[method] = function (this: unknown, ...args: unknown[]) {
    counts[key]++
    onCall?.(this)
    return original.apply(this, args)
  }
}
spy(L.Map.prototype, 'initialize', 'maps', (self) => (lastMap = self as L.Map))
spy(L.Map.prototype, 'remove', 'mapsRemoved')
spy(L.Map.prototype, 'fitBounds', 'fitBounds')
spy(L.Map.prototype, 'setView', 'setView')
spy(L.Marker.prototype, 'initialize', 'markers')
spy(L.Marker.prototype, 'setLatLng', 'setLatLng')
spy(L.Marker.prototype, 'setIcon', 'setIcon')

const snapshot = () => ({ ...counts })
const delta = (before: typeof counts) =>
  Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, v - before[k as keyof typeof counts]])) as typeof counts

// ─── Fixtures ────────────────────────────────────────────────────────────────

function generatedDrivers(n: number, seed = 7): LiveDriver[] {
  let x = seed
  const rand = () => (x = (x * 16807) % 2147483647) / 2147483647
  return Array.from({ length: n }, (_, i) => ({
    id: `drv-${i}`,
    driverNumber: `D-${i}`,
    fullName: `Driver ${i}`,
    phoneNumber: '',
    avatarUrl: null,
    status: 'ONLINE',
    mode: null,
    vehicle: null,
    location: { lat: 20 + rand(), lng: 70 + rand() },
    speedKmh: null,
    heading: null,
    activeTrip: null,
    recordedAt: '2026-09-30T06:00:00.000Z',
    gpsFreshness: 'LIVE',
    gpsLagSeconds: 5,
    lastUpdateText: '5s ago',
  }))
}

/** A refresh: new objects from the server, same values unless changed. */
const refreshed = (drivers: LiveDriver[], change: (d: LiveDriver, i: number) => Partial<LiveDriver> = () => ({})) =>
  drivers.map((d, i) => ({ ...d, location: d.location ? { ...d.location } : null, ...change(d, i) }))

const moved = (d: LiveDriver): Partial<LiveDriver> => ({
  location: { lat: d.location!.lat + 0.001, lng: d.location!.lng + 0.001 },
})

// ─── Rendering ───────────────────────────────────────────────────────────────

let container: HTMLDivElement
let root: Root
const client = new QueryClient({ defaultOptions: { queries: { enabled: false, retry: false } } })

async function render(drivers: LiveDriver[] | undefined) {
  await act(async () => {
    // StrictMode, as main.tsx renders the app: effects mount, unmount and mount again
    root.render(
      createElement(
        StrictMode,
        null,
        createElement(
          QueryClientProvider,
          { client },
          createElement(LiveOperationsMapSection, {
            drivers,
            onlineCount: drivers?.filter((d) => d.status === 'ONLINE').length ?? 0,
            gpsStaleAfterSec: 120,
          }),
        ),
      ),
    )
  })
}

const markerEls = () => [...container.querySelectorAll<HTMLElement>('.leaflet-marker-icon')]

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Phase 3: live map lifecycle (real Leaflet in jsdom)', () => {
  it('creates the map once, fits once, and never remounts or re-fits across 20 polls', async () => {
    const before = snapshot()
    let drivers = generatedDrivers(50)
    await render(drivers)
    const afterMount = delta(before)
    assert.equal(afterMount.maps, 1)
    assert.equal(afterMount.markers, 50)
    assert.equal(afterMount.fitBounds, 1, 'one initial fit to the real driver bounds')

    const mounted = snapshot()
    for (let poll = 0; poll < 20; poll++) {
      drivers = refreshed(drivers, moved)
      await render(drivers)
    }
    const d = delta(mounted)
    assert.equal(d.maps, 0, 'no map remount')
    assert.equal(d.mapsRemoved, 0)
    assert.equal(d.markers, 0, 'no marker recreated')
    assert.equal(d.fitBounds, 0, 'FitBounds is not called on refresh')
    assert.equal(d.setView, 0, 'the view is not reset on refresh')
    assert.equal(d.setLatLng, 20 * 50, 'each moved marker is moved in place')
  })

  it('an identical refresh touches no marker; one moved driver moves one marker', async () => {
    const drivers = generatedDrivers(30)
    await render(drivers)

    let s = snapshot()
    await render(refreshed(drivers))
    assert.deepEqual(
      { ...delta(s) },
      { maps: 0, mapsRemoved: 0, markers: 0, setLatLng: 0, setIcon: 0, fitBounds: 0, setView: 0 },
    )

    s = snapshot()
    await render(refreshed(drivers, (d, i) => (i === 3 ? moved(d) : {})))
    const d = delta(s)
    assert.equal(d.setLatLng, 1)
    assert.equal(d.setIcon, 0)
    assert.equal(d.markers, 0)
  })

  it('preserves a user-chosen viewport (pan + zoom) across refreshes', async () => {
    const drivers = generatedDrivers(40)
    await render(drivers)
    const map = lastMap!
    await act(async () => {
      map.setView([20.25, 70.75], 9) // the user pans and zooms out
    })
    const center = map.getCenter()
    const zoom = map.getZoom()
    for (let i = 0; i < 5; i++) await render(refreshed(drivers, moved))
    assert.equal(map.getZoom(), zoom)
    assert.ok(map.getCenter().equals(center), 'center unchanged by data refreshes')
  })

  it('the Center map button re-fits to the drivers on demand, once per click', async () => {
    await render(generatedDrivers(12))
    const button = container.querySelector<HTMLButtonElement>('button[aria-label="Center map on all shown locations"]')
    assert.ok(button, 'center button rendered')
    const s = snapshot()
    await act(async () => {
      button.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    })
    assert.equal(delta(s).fitBounds, 1)
  })

  it('marks a stale fix by shape and text, not colour alone, and updates it in place', async () => {
    const drivers = generatedDrivers(5)
    await render(drivers)
    const s = snapshot()
    await render(refreshed(drivers, (_, i) => (i === 2 ? { gpsFreshness: 'STALE', lastUpdateText: '4m ago' } : {})))
    const d = delta(s)
    assert.equal(d.setIcon, 1, 'only the changed marker gets a new icon')
    assert.equal(d.markers, 0)
    const stale = markerEls().filter((el) => el.innerHTML.includes('dashed'))
    assert.equal(stale.length, 1, 'stale marker is a dashed hollow ring')
    assert.match(stale[0].getAttribute('aria-label') ?? '', /GPS stale/)
    assert.match(stale[0].getAttribute('title') ?? '', /GPS stale/)
    assert.match(container.textContent ?? '', /Stale GPS \(> 120s\)/, 'legend names the backend threshold')
  })

  it('colours markers by backend status exactly as the legend does; offline is never shown as live', async () => {
    const drivers = generatedDrivers(4).map((d, i) => ({
      ...d,
      status: (['ONLINE', 'ON_TRIP', 'BUSY', 'OFFLINE'] as const)[i],
      gpsFreshness: i === 3 ? ('OFFLINE' as const) : ('LIVE' as const),
    }))
    await render(drivers)
    const html = markerEls().map((el) => el.innerHTML)
    assert.match(html[0], /#16A34A/)
    assert.match(html[1], /#2563EB/)
    assert.match(html[2], /#F59E0B/)
    assert.match(html[3], /#64748B/)
    assert.match(markerEls()[3].getAttribute('aria-label') ?? '', /Offline, Off duty/)
    // jsdom serialises inline colours as rgb()
    const legend = container.querySelector('ul[aria-label="Map legend"]')!.innerHTML
    const rgb = (hex: string) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`
    for (const color of ['#16A34A', '#2563EB', '#F59E0B', '#64748B']) {
      assert.ok(legend.includes(rgb(color)), `legend has ${color}`)
    }
    assert.ok(!/Active Ride/.test(container.textContent ?? ''), 'no legend entry without a marker')
  })

  it('never places a driver without a valid coordinate; unknown GPS is counted, not drawn', async () => {
    const base = generatedDrivers(6)
    const drivers: LiveDriver[] = [
      base[0],
      { ...base[1], location: null, recordedAt: null, gpsFreshness: 'UNKNOWN', lastUpdateText: 'No GPS signal' },
      { ...base[2], location: { lat: Number.NaN, lng: 70.5 } },
      { ...base[3], location: { lat: 200, lng: 70.5 } },
      { ...base[4], location: { lat: 0, lng: 0 } },
      base[5],
    ]
    await render(drivers)
    assert.equal(markerEls().length, 2)
    assert.match(container.textContent ?? '', /1 on-duty driver has no GPS fix and is not on the map/)
  })

  it('a selected driver stays selected across refreshes, switches cleanly, and closes', async () => {
    const click = (el: Element) =>
      act(async () => {
        el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      })
    const popupText = () => container.querySelector('.leaflet-popup-content')?.textContent ?? null

    let drivers = generatedDrivers(8)
    await render(drivers)
    assert.equal(container.querySelectorAll('.leaflet-popup').length, 0, 'no popup until a driver is selected')

    await click(markerEls()[2])
    assert.match(popupText() ?? '', /Driver 2/)

    // 5 polls: the driver moves and changes state; the same popup stays open and updates
    for (let i = 0; i < 5; i++) {
      drivers = refreshed(drivers, (d, j) => (j === 2 ? { ...moved(d), status: 'ON_TRIP' } : moved(d)))
      await render(drivers)
    }
    assert.equal(container.querySelectorAll('.leaflet-popup').length, 1)
    assert.match(popupText() ?? '', /Driver 2.*On trip/)

    await click(markerEls()[5])
    assert.equal(container.querySelectorAll('.leaflet-popup').length, 1)
    assert.match(popupText() ?? '', /Driver 5/, 'selection switched to the clicked driver')

    await click(container.querySelector('.leaflet-popup-close-button')!)
    await render(refreshed(drivers, moved))
    assert.equal(popupText(), null, 'closed popup does not reopen on refresh')
  })

  it('a marker is a keyboard button: Enter selects the driver, Enter again closes', async () => {
    await render(generatedDrivers(3))
    const marker = markerEls()[1]
    assert.equal(marker.getAttribute('role'), 'button')
    assert.equal(marker.getAttribute('tabindex'), '0')
    const press = () =>
      act(async () => {
        marker.dispatchEvent(new window.KeyboardEvent('keypress', { key: 'Enter', keyCode: 13, bubbles: true, cancelable: true }))
      })
    await press()
    assert.match(container.querySelector('.leaflet-popup-content')?.textContent ?? '', /Driver 1/)
    await press()
    assert.equal(container.querySelectorAll('.leaflet-popup').length, 0)
  })

  it('popup text from the backend is shown as text, never parsed as HTML', async () => {
    const hostile = '<img src=x onerror="window.__pwned=1">Evil'
    const drivers = generatedDrivers(1).map((d) => ({ ...d, fullName: hostile }))
    await render(drivers)
    await act(async () => {
      markerEls()[0].dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    })
    const content = container.querySelector('.leaflet-popup-content')!
    assert.equal(content.querySelector('img'), null, 'no element created from the name')
    assert.ok(content.textContent!.includes(hostile))
  })

  it('shows the empty state, and no map at all, when no driver has a coordinate', async () => {
    const s = snapshot()
    await render(generatedDrivers(3).map((d) => ({ ...d, location: null, gpsFreshness: 'UNKNOWN' as const })))
    assert.equal(delta(s).maps, 0, 'no map with a made-up centre')
    assert.match(container.textContent ?? '', /No live driver locations available/)
  })

  it('removes a driver that left without touching the others, and cleans up on unmount', async () => {
    const drivers = generatedDrivers(10)
    await render(drivers)
    const s = snapshot()
    await render(refreshed(drivers).slice(1))
    assert.equal(markerEls().length, 9)
    assert.deepEqual(
      { maps: delta(s).maps, markers: delta(s).markers, setLatLng: delta(s).setLatLng },
      { maps: 0, markers: 0, setLatLng: 0 },
    )
    const beforeUnmount = snapshot()
    await act(async () => root.unmount())
    assert.equal(delta(beforeUnmount).mapsRemoved, 1, 'Leaflet map destroyed on unmount')
    root = createRoot(container) // afterEach unmounts again
  })

  // Step 15 measurements. jsdom timings are relative (no layout / paint), counts are exact.
  for (const n of [10, 50, 100, 200]) {
    it(`performance: ${n} drivers`, async (t) => {
      let drivers = generatedDrivers(n, n)
      const s0 = snapshot()
      const t0 = performance.now()
      await render(drivers)
      const mountMs = performance.now() - t0
      const mount = delta(s0)

      const s1 = snapshot()
      const t1 = performance.now()
      await render(refreshed(drivers))
      const identicalMs = performance.now() - t1
      const identical = delta(s1)

      drivers = refreshed(drivers, moved)
      const s2 = snapshot()
      const t2 = performance.now()
      await render(drivers)
      const allMovedMs = performance.now() - t2
      const allMoved = delta(s2)

      assert.equal(mount.maps, 1)
      assert.equal(mount.markers, n)
      assert.equal(markerEls().length, n)
      assert.deepEqual([identical.maps, identical.markers, identical.setLatLng, identical.fitBounds], [0, 0, 0, 0])
      assert.deepEqual([allMoved.maps, allMoved.markers, allMoved.setLatLng, allMoved.fitBounds], [0, 0, n, 0])
      t.diagnostic(
        `PERF n=${n} mount=${mountMs.toFixed(1)}ms maps=${mount.maps} markersCreated=${mount.markers} fitBounds=${mount.fitBounds}` +
          ` | identicalRefresh=${identicalMs.toFixed(1)}ms markerUpdates=${identical.setLatLng}` +
          ` | allMovedRefresh=${allMovedMs.toFixed(1)}ms markerUpdates=${allMoved.setLatLng} remounts=${allMoved.maps} fitBounds=${allMoved.fitBounds}`,
      )
    })
  }
})
