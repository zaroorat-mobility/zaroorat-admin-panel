import '../../dashboard/__tests__/dom-env'
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { ToastProvider } from '@/shared/context/toast'
import { DriverActivityLogsTab } from '../components/DriverActivityLogsTab'
import type { DriverDetails } from '../types'

function testDriver(): DriverDetails {
  return {
    id: 'drv-1',
    applicationId: 'DRV_TEST_0001',
    driverCode: 'DRV_TEST_0001',
    driverName: 'Ramesh Kumar',
    mobileNumber: '+919800000001',
    vehicleType: 'cab',
    driverStatus: 'active',
    verificationStatus: 'VERIFIED',
    ratingAvg: 4.8,
    totalTrips: 142,
    walletBalance: 2000,
    joinedAt: '2026-10-10T04:27:32.000Z',
    isOnline: true,
    isSuspended: false,
    isBlocked: false,
    createdAt: '2026-10-10T04:27:32.000Z',
    updatedAt: '2026-10-10T04:27:32.000Z',
    documents: [],
    timeline: [],
  }
}

let container: HTMLDivElement
let root: Root

const flush = () => act(async () => new Promise((r) => setTimeout(r, 0)))

describe('DriverActivityLogsTab', () => {
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

  it('renders table headers, title, and export action matching design', async () => {
    const driver = testDriver()
    await act(async () => {
      root.render(
        createElement(
          ToastProvider,
          null,
          createElement(DriverActivityLogsTab, { driver }),
        ),
      )
    })
    await flush()

    const text = container.textContent || ''
    assert.ok(text.includes('Activity Logs'), 'renders main title')
    assert.ok(
      text.includes('Complete history of actions, changes, and important events'),
      'renders subtitle',
    )
    assert.ok(text.includes('Export Logs'), 'renders Export Logs button')

    // Table columns
    assert.ok(text.includes('Date & Time'), 'has Date & Time column')
    assert.ok(text.includes('Category'), 'has Category column')
    assert.ok(text.includes('Event / Action'), 'has Event / Action column')
    assert.ok(text.includes('Details'), 'has Details column')
    assert.ok(text.includes('Performed By'), 'has Performed By column')
    assert.ok(text.includes('Actions'), 'has Actions column')
  })

  it('renders baseline activity records matching specification', async () => {
    const driver = testDriver()
    await act(async () => {
      root.render(
        createElement(
          ToastProvider,
          null,
          createElement(DriverActivityLogsTab, { driver }),
        ),
      )
    })
    await flush()

    const text = container.textContent || ''
    assert.ok(text.includes('Ride Completed'), 'includes Ride Completed event')
    assert.ok(text.includes('Commission Deducted'), 'includes Commission Deducted event')
    assert.ok(text.includes('Subscription Renewed'), 'includes Subscription Renewed event')
    assert.ok(text.includes('Payment Successful'), 'includes Payment Successful event')
    assert.ok(text.includes('Profile Updated'), 'includes Profile Updated event')
    assert.ok(text.includes('Vehicle Document Updated'), 'includes Vehicle Document Updated')
    assert.ok(text.includes('Application Approved'), 'includes Application Approved')
    assert.ok(text.includes('Document Verified'), 'includes Document Verified')
  })

  it('renders the Activity Summary 4 tiles and Recent Important Events sidebar', async () => {
    const driver = testDriver()
    await act(async () => {
      root.render(
        createElement(
          ToastProvider,
          null,
          createElement(DriverActivityLogsTab, { driver }),
        ),
      )
    })
    await flush()

    const text = container.textContent || ''
    assert.ok(text.includes('Quick Actions'), 'renders Quick Actions sidebar')
    assert.ok(text.includes('Total Activities'), 'renders Total Activities KPI')
    assert.ok(text.includes('48'), 'renders total activities count 48')
    assert.ok(text.includes('Ride Activities'), 'renders Ride Activities KPI')
    assert.ok(text.includes('26'), 'renders ride activities count 26')
    assert.ok(text.includes('Account Changes'), 'renders Account Changes KPI')
    assert.ok(text.includes('8'), 'renders account changes count 8')
    assert.ok(text.includes('Document Actions'), 'renders Document Actions KPI')
    assert.ok(text.includes('6'), 'renders document actions count 6')

    // Recent Important Events
    assert.ok(text.includes('Recent Important Events'), 'renders Recent Important Events header')
    assert.ok(text.includes('+ ₹2,000.00'), 'renders wallet recharge amount')
  })

  it('opens details modal when clicking View', async () => {
    const driver = testDriver()
    await act(async () => {
      root.render(
        createElement(
          ToastProvider,
          null,
          createElement(DriverActivityLogsTab, { driver }),
        ),
      )
    })
    await flush()

    // Find the first "View" button in the table
    const viewButtons = Array.from(container.querySelectorAll('button')).filter((b) =>
      b.textContent?.includes('View'),
    )
    assert.ok(viewButtons.length > 0, 'found at least one View button')

    await act(async () => {
      viewButtons[0].click()
    })
    await flush()

    const bodyText = document.body.textContent || ''
    assert.ok(
      bodyText.includes('Activity Log Details'),
      'modal opened with Activity Log Details title',
    )
    assert.ok(
      bodyText.includes('Copy Details'),
      'modal contains Copy Details button',
    )
  })

  it('calculates and renders dynamic pagination without hardcoded numbers', async () => {
    const driver = testDriver()
    await act(async () => {
      root.render(
        createElement(
          ToastProvider,
          null,
          createElement(DriverActivityLogsTab, { driver }),
        ),
      )
    })
    await flush()

    const text = container.textContent || ''
    // Total default activities is 12, with 10/page default:
    // It should say "Showing 1 to 10 of 12 records"
    assert.ok(
      text.includes('Showing 1 to 10 of 12 records'),
      'renders dynamic showing 1 to 10 of 12 records',
    )
    // It should NOT have hardcoded 142 records or hardcoded page 15
    assert.ok(!text.includes('142 records'), 'does NOT have hardcoded 142 records')
    assert.ok(!text.includes('...'), 'does NOT show ellipsis when only 2 pages exist')
  })

  it('strictly displays activities and metrics for real driver without system-wide fake logs', async () => {
    const pendingDriver: DriverDetails = {
      ...testDriver(),
      id: 'drv-pending-99',
      driverName: 'Mir Saqib',
      driverStatus: 'pending_review',
      totalTrips: 0,
      walletBalance: 0,
      documents: [],
      timeline: [
        {
          id: 'tl-1',
          action: 'Driver Profile Created',
          actor: 'System',
          timestamp: '2026-10-10T09:57:00Z',
          isSystem: true,
        },
        {
          id: 'tl-2',
          action: 'Driver Resubmission Requested',
          actor: 'Admin User',
          timestamp: '2026-10-14T23:56:00Z',
          notes: 'Document is expired',
        },
        {
          id: 'tl-3',
          action: 'Driver Verification Approved',
          actor: 'Admin User',
          timestamp: '2026-10-15T00:26:00Z',
          notes: 'Application approved',
        },
      ],
    }

    await act(async () => {
      root.render(
        createElement(
          ToastProvider,
          null,
          createElement(DriverActivityLogsTab, { driver: pendingDriver }),
        ),
      )
    })
    await flush()

    const text = container.textContent || ''
    // Must contain this driver's actual events
    assert.ok(text.includes('Driver Profile Created'), 'has Driver Profile Created')
    assert.ok(text.includes('Driver Resubmission Requested'), 'has Driver Resubmission Requested')
    assert.ok(text.includes('Driver Verification Approved'), 'has Driver Verification Approved')

    // Must NOT contain fake rides or subscriptions from other drivers
    assert.ok(!text.includes('RID_123456 completed'), 'does not contain fake completed ride RID_123456')
    assert.ok(!text.includes('Auto Monthly Plan'), 'does not contain fake subscription Auto Monthly Plan')

    // Total activities must be 3, ride activities must be 0
    assert.ok(text.includes('3 events logged for this driver'), 'displays 3 events logged for this driver')
    assert.ok(text.includes('0 completed trips'), 'displays 0 completed trips')
    assert.ok(text.includes('3 Events'), 'sidebar shows 3 Events badge')
  })
})
