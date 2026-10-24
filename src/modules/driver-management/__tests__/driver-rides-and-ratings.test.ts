import '../../dashboard/__tests__/dom-env'
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { ToastProvider } from '@/shared/context/toast'
import { DriverRidesPerformanceTab } from '../components/DriverRidesPerformanceTab'
import { DriverRatingsReviewsTab } from '../components/DriverRatingsReviewsTab'
import type { DriverDetails } from '../types'

function testDriver(overrides?: Partial<DriverDetails>): DriverDetails {
  return {
    id: 'drv-1',
    applicationId: 'DRV_TEST_0001',
    driverCode: 'DRV_TEST_0001',
    driverName: 'Mohammad Farooq',
    mobileNumber: '+919419012345',
    vehicleType: 'cab',
    driverStatus: 'active',
    verificationStatus: 'VERIFIED',
    ratingAvg: 4.8,
    totalTrips: 320,
    walletBalance: 2000,
    joinedAt: '2026-10-10T04:27:32.000Z',
    isOnline: true,
    isSuspended: false,
    isBlocked: false,
    city: 'Srinagar',
    state: 'Jammu & Kashmir',
    createdAt: '2026-10-10T04:27:32.000Z',
    updatedAt: '2026-10-10T04:27:32.000Z',
    documents: [],
    timeline: [],
    ...overrides,
  }
}

let container: HTMLDivElement
let root: Root

const flush = () => act(async () => new Promise((r) => setTimeout(r, 0)))

describe('DriverRidesPerformanceTab', () => {
  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('renders 6 KPI metric cards, trends chart, donut distribution, and rides table matching mockup', async () => {
    const driver = testDriver()
    await act(async () => {
      root.render(
        createElement(
          ToastProvider,
          null,
          createElement(DriverRidesPerformanceTab, { driver }),
        ),
      )
    })
    await flush()

    const text = container.textContent || ''
    // 6 KPI Cards
    assert.ok(text.includes('Total Rides'), 'Should show Total Rides card')
    assert.ok(text.includes('Completed Rides'), 'Should show Completed Rides card')
    assert.ok(text.includes('Cancelled Rides'), 'Should show Cancelled Rides card')
    assert.ok(text.includes('Avg. Ride Duration'), 'Should show Avg Ride Duration card')
    assert.ok(text.includes('Total Distance'), 'Should show Total Distance card')
    assert.ok(text.includes('Driver Rating'), 'Should show Driver Rating card')

    // Performance Sections
    assert.ok(text.includes('Ride Trends'), 'Should show Ride Trends chart section')
    assert.ok(text.includes('Service-wise Rides'), 'Should show Service-wise Rides distribution')
    assert.ok(text.includes('Recent Rides'), 'Should show Recent Rides table')
    assert.ok(text.includes('Earnings Overview (Driver)'), 'Should show Driver Earnings overview')
  })

  it('displays driver performance metrics dynamically when driver has trip records', async () => {
    const driver = testDriver({ totalTrips: 150 })
    await act(async () => {
      root.render(
        createElement(
          ToastProvider,
          null,
          createElement(DriverRidesPerformanceTab, { driver }),
        ),
      )
    })
    await flush()

    const text = container.textContent || ''
    assert.ok(text.includes('150'), 'Should reflect driver totalTrips of 150')
  })
})

describe('DriverRatingsReviewsTab', () => {
  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('renders rating summary card, star breakdown, category scores, and reviews table', async () => {
    const driver = testDriver()
    await act(async () => {
      root.render(
        createElement(
          ToastProvider,
          null,
          createElement(DriverRatingsReviewsTab, { driver }),
        ),
      )
    })
    await flush()

    const text = container.textContent || ''
    // Top Row Cards
    assert.ok(text.includes('Driver Rating'), 'Should show Driver Rating summary')
    assert.ok(text.includes('Rating Distribution'), 'Should show 5-Star Rating Distribution breakdown')
    assert.ok(text.includes('Category Performance'), 'Should show Category Performance scores')
    assert.ok(text.includes('Rider Behaviour'), 'Should show Rider Behaviour category')
    assert.ok(text.includes('Safe Driving'), 'Should show Safe Driving category')
    assert.ok(text.includes('Cleanliness'), 'Should show Cleanliness category')

    // Table
    assert.ok(text.includes('Passenger Reviews & Feedback'), 'Should show Passenger Reviews & Feedback table')
    assert.ok(text.includes('Export CSV'), 'Should have Export CSV action')
  })

  it('opens custom review details popup modal when clicking View', async () => {
    const driver = testDriver()
    await act(async () => {
      root.render(
        createElement(
          ToastProvider,
          null,
          createElement(DriverRatingsReviewsTab, { driver }),
        ),
      )
    })
    await flush()

    // Find the first View button
    const viewButtons = Array.from(container.querySelectorAll('button')).filter((b) =>
      b.textContent?.trim().includes('View'),
    )
    assert.ok(viewButtons.length > 0, 'Should have at least one View button in table')

    await act(async () => {
      viewButtons[0].click()
    })
    await flush()

    const text = container.textContent || ''
    assert.ok(text.includes('Review Details'), 'Modal should display Review Details header')
    assert.ok(text.includes('Passenger Feedback Quote'), 'Modal should display Passenger Feedback Quote')
    assert.ok(text.includes('Trip Category Breakdown'), 'Modal should display Trip Category Breakdown')
  })
})
