/**
 * The real ApplicationReviewPage mounted in jsdom against a fixture application. What it
 * shows as complete, and whether it offers Approve, must follow the documents — not which
 * tab the reviewer happens to be on.
 */
import '../../dashboard/__tests__/dom-env'
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { InternalAxiosRequestConfig } from 'axios'
import { api } from '@/infrastructure/api'
import { useAuthStore, type User } from '@/store/auth.store'
import { ToastProvider } from '@/shared/context/toast'
import { ApplicationReviewPage } from '../pages/applications/ApplicationReviewPage'
import {
  evaluateBankNameMatch,
  formatBankStatusLabel,
  isDocumentExpired,
  validateBankAccountDetails,
} from '../utils/application-review.utils'

const admin: User = {
  id: 'u-admin',
  name: 'Ops Admin',
  email: 'ops@zaroorat.test',
  role: 'admin',
  roles: ['admin'],
  permissions: ['drivers:read', 'drivers:verify'],
}

type Doc = {
  id: string
  docType: string
  verifyStatus: string
  fileUrl: string
  category: 'driver' | 'vehicle'
  expiryDate?: string
}
const doc = (
  id: string,
  docType: string,
  verifyStatus: 'approved' | 'pending' | 'rejected',
  fileUrl = `https://example.invalid/${docType}.jpg`,
  category: 'driver' | 'vehicle' = 'driver',
  expiryDate?: string,
): Doc => ({ id, docType, verifyStatus, fileUrl, category, ...(expiryDate ? { expiryDate } : {}) })

function application(documents: Doc[]) {
  return {
    id: 'drv-1',
    applicationId: 'DRV_TEST_0001',
    driverId: 'drv-1',
    driverName: 'Test Applicant',
    mobileNumber: '+919800000001',
    vehicleType: 'cab',
    applicationStatus: 'under_review',
    source: 'driver_app',
    submittedAt: '2026-10-10T04:27:32.000Z',
    createdAt: '2026-10-10T04:27:32.000Z',
    updatedAt: '2026-10-10T04:27:32.000Z',
    onlineStatus: 'offline',
    bgCheckStatus: 'not_started',
    ratingAvg: 0,
    totalTrips: 0,
    isAvailable: true,
    isBlocked: false,
    documents: documents.map((d) => ({ ...d, driverId: 'drv-1', createdAt: '2026-10-10T05:00:00.000Z' })),
    vehicle: { id: 'veh-1', driverId: 'drv-1', vehicleType: 'cab', registrationPlate: 'JK01AB2020' },
    bankAccounts: [],
    timeline: [],
    auditLogs: [],
  }
}

const originalAdapter = api.defaults.adapter
const originalOpen = window.open
let fixture: ReturnType<typeof application>
let opened: string[]
let posted: Array<{ url: string; body: unknown }>
let container: HTMLDivElement
let root: Root

const flush = () => act(async () => new Promise((r) => setTimeout(r, 0)))
const settle = async () => {
  for (let i = 0; i < 10; i++) await flush()
}

async function render(documents: Doc[]) {
  fixture = application(documents)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  await act(async () =>
    root.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(
          ToastProvider,
          null,
          createElement(
            MemoryRouter,
            { initialEntries: ['/driver-management/applications/drv-1'] },
            createElement(
              Routes,
              null,
              createElement(Route, {
                path: '/driver-management/applications/:id',
                element: createElement(ApplicationReviewPage),
              }),
              createElement(Route, {
                path: '/driver-management/applications',
                element: createElement('h2', null, 'Applications queue'),
              }),
            ),
          ),
        ),
      ),
    ),
  )
  await settle()
}

async function click(el: Element) {
  await act(async () => {
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
  })
  await settle()
}

const button = (text: string) => {
  const found = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes(text))
  assert.ok(found, `button "${text}"`)
  return found as HTMLButtonElement
}

/// A stepper circle holds its number until the step is complete, then a check icon.
function stepComplete(label: string): boolean {
  const span = [...container.querySelectorAll('span')].find(
    (s) => s.textContent === label && s.previousElementSibling?.classList.contains('rounded-full'),
  )
  assert.ok(span, `step "${label}"`)
  return span.previousElementSibling!.querySelector('svg') !== null
}

const steps = () =>
  Object.fromEntries(
    ['Overview', 'Claim Form', 'Documents', 'Bank Details', 'Final Review', 'Decision'].map((s) => [s, stepComplete(s)]),
  )

beforeEach(() => {
  opened = []
  posted = []
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const ok = (data: unknown) => ({ data, status: 200, statusText: 'OK', headers: {}, config })
    if (config.method === 'post') {
      posted.push({ url: config.url ?? '', body: JSON.parse(String(config.data ?? '{}')) })
      return ok({ data: { ...fixture, applicationStatus: 'approved' } })
    }
    if (config.url === '/admin/applications/drv-1') return ok({ data: fixture })
    // A stored file is read through a short-lived signed URL; the disposition is in the link.
    if (config.url?.startsWith('/files/')) {
      const disposition = (config.params as { disposition: string }).disposition
      return ok({
        url: `https://signed.example${config.url}?${disposition}`,
        contentType: 'image/jpeg',
        expiresAt: '2026-10-13T00:05:00.000Z',
      })
    }
    throw new Error(`unexpected request ${config.url}`)
  }
  window.open = ((url?: string | URL) => {
    opened.push(String(url))
    return null
  }) as typeof window.open
  useAuthStore.setState({ user: admin, token: 'token-1', isAuthenticated: true })
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  api.defaults.adapter = originalAdapter
  window.open = originalOpen
})

const stepButton = (label: string) => {
  const span = [...container.querySelectorAll('span')].find(
    (s) => s.textContent === label && s.previousElementSibling?.classList.contains('rounded-full'),
  )
  assert.ok(span?.parentElement, `step button "${label}"`)
  return span.parentElement as HTMLElement
}

describe('ApplicationReviewPage — progress follows real DB verification state', () => {
  it('opens on Overview with no premature green ticks and refuses Approve when no documents were uploaded', async () => {
    await render([])

    // Starts on Overview (Step 1) with no ticks on current or upcoming steps
    assert.ok(container.textContent?.includes('Application Status'))
    assert.ok(container.textContent?.includes('Required Documents'))

    assert.deepEqual(steps(), {
      Overview: false,
      'Claim Form': false,
      Documents: false,
      'Bank Details': false,
      'Final Review': false,
      Decision: false,
    })
    assert.ok(container.textContent?.includes('0 / 0 documents verified'))
    assert.ok(!container.textContent?.includes('sections completed'))

    await click(stepButton('Decision'))
    assert.equal(button('Approve Application').disabled, true)
  })

  it('keeps Approve refused and Documents incomplete while a document still awaits review', async () => {
    await render([doc('d1', 'driving_license', 'approved'), doc('d2', 'aadhaar', 'pending')])

    assert.equal(steps().Documents, false)
    assert.equal(steps()['Final Review'], false)
    assert.ok(container.textContent?.includes('1 / 2 documents verified'))

    await click(stepButton('Decision'))
    assert.equal(button('Approve Application').disabled, true)
  })

  it('marks Documents complete when all documents are verified and offers Approve on Decision', async () => {
    await render([
      doc('d1', 'driving_license', 'approved'),
      doc('v1', 'rc', 'approved', 'https://example.invalid/rc.jpg', 'vehicle'),
    ])

    // On initial load at Overview, upcoming steps have no premature ticks
    assert.deepEqual(steps(), {
      Overview: false,
      'Claim Form': false,
      Documents: false,
      'Bank Details': false,
      'Final Review': false,
      Decision: false,
    })
    assert.ok(container.textContent?.includes('2 / 2 documents verified'))

    await click(stepButton('Decision'))
    assert.deepEqual(steps(), {
      Overview: true,
      'Claim Form': true,
      Documents: true,
      'Bank Details': true,
      'Final Review': true,
      Decision: false,
    })
    assert.equal(button('Approve Application').disabled, false)
  })

  it('marks Bank Details complete dynamically when bank details are verified', async () => {
    fixture = {
      ...application([]),
      bankAccounts: [
        {
          id: 'ba-1',
          bankName: 'HDFC Bank',
          bankAccountName: 'Test Applicant',
          bankIfsc: 'HDFC0001234',
          accountNumberMasked: '•••• •••• 1234',
          status: 'VERIFIED',
          payoutEnabled: true,
        },
      ] as any,
    }
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    await act(async () =>
      root.render(
        createElement(
          QueryClientProvider,
          { client },
          createElement(
            ToastProvider,
            null,
            createElement(
              MemoryRouter,
              { initialEntries: ['/driver-management/applications/drv-1'] },
              createElement(
                Routes,
                null,
                createElement(Route, {
                  path: '/driver-management/applications/:id',
                  element: createElement(ApplicationReviewPage),
                }),
              ),
            ),
          ),
        ),
      ),
    )
    await settle()

    await click(stepButton('Final Review'))
    assert.equal(steps()['Bank Details'], true)
  })

  it('marks all steps incomplete when application is completely blank', async () => {
    fixture = {
      ...application([]),
      driverName: '',
      mobileNumber: '',
      vehicle: null as any,
      vehicleType: '',
      documents: [],
      bankAccounts: [],
    }
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    await act(async () =>
      root.render(
        createElement(
          QueryClientProvider,
          { client },
          createElement(
            ToastProvider,
            null,
            createElement(
              MemoryRouter,
              { initialEntries: ['/driver-management/applications/drv-1'] },
              createElement(
                Routes,
                null,
                createElement(Route, {
                  path: '/driver-management/applications/:id',
                  element: createElement(ApplicationReviewPage),
                }),
              ),
            ),
          ),
        ),
      ),
    )
    await settle()

    assert.deepEqual(steps(), {
      Overview: false,
      'Claim Form': false,
      Documents: false,
      'Bank Details': false,
      'Final Review': false,
      Decision: false,
    })
  })

  it('marks each step complete with green checkmarks as the reviewer reviews and advances via Next', async () => {
    await render([doc('d1', 'driving_license', 'pending')])

    assert.equal(steps().Documents, false)
    assert.equal(steps()['Bank Details'], false)

    // Step sequentially through all tabs via Next
    await click(button('Next')) // Claim Form
    await click(button('Next')) // Documents
    await click(button('Next')) // Bank Details
    await click(button('Next')) // Final Review
    await click(button('Next')) // Decision

    // Stepping sequentially records each reviewed step with its green checkmark
    assert.deepEqual(steps(), {
      Overview: true,
      'Claim Form': true,
      Documents: true,
      'Bank Details': true,
      'Final Review': true,
      Decision: false,
    })

    // Clicking Previous back to Overview removes ticks from backed-out steps
    await click(button('Previous')) // Final Review
    await click(button('Previous')) // Bank Details
    await click(button('Previous')) // Documents
    await click(button('Previous')) // Claim Form
    await click(button('Previous')) // Overview

    assert.deepEqual(steps(), {
      Overview: false,
      'Claim Form': false,
      Documents: false,
      'Bank Details': false,
      'Final Review': false,
      Decision: false,
    })

    // Clicking Next again brings the tick back
    await click(button('Next')) // Claim Form
    assert.deepEqual(steps(), {
      Overview: true,
      'Claim Form': false,
      Documents: false,
      'Bank Details': false,
      'Final Review': false,
      Decision: false,
    })
  })

  it('marks all steps complete with green ticks when an application is fully approved in DB', async () => {
    fixture = {
      ...application([doc('d1', 'driving_license', 'approved'), doc('v1', 'rc', 'approved')]),
      applicationStatus: 'approved',
    }
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    await act(async () =>
      root.render(
        createElement(
          QueryClientProvider,
          { client },
          createElement(
            ToastProvider,
            null,
            createElement(
              MemoryRouter,
              { initialEntries: ['/driver-management/applications/drv-1'] },
              createElement(
                Routes,
                null,
                createElement(Route, {
                  path: '/driver-management/applications/:id',
                  element: createElement(ApplicationReviewPage),
                }),
              ),
            ),
          ),
        ),
      ),
    )
    await settle()

    assert.deepEqual(steps(), {
      Overview: true,
      'Claim Form': true,
      Documents: true,
      'Bank Details': true,
      'Final Review': true,
      Decision: true,
    })
  })

  it('evaluates bank holder name matching accurately without hardcoding Verified', () => {
    assert.equal(evaluateBankNameMatch('Bilal Ahmad', 'BILAL AHMAD').level, 'exact')
    assert.equal(evaluateBankNameMatch('Bilal Ahmad', 'Bilal A').level, 'partial')
    assert.equal(evaluateBankNameMatch('Bilal Ahmad', 'John Smith').level, 'mismatch')
    assert.equal(evaluateBankNameMatch('Bilal Ahmad', '—').level, 'missing')
  })

  it('flags placeholder/invalid bank details and formats raw bank status enums cleanly', () => {
    const placeholder = validateBankAccountDetails({
      bankName: 'Bank',
      accountHolderName: 'Bilal Ahmad',
      accountNumber: '****0000',
      ifscCode: 'IFSC0000000',
    })
    assert.equal(placeholder.isValid, false)
    assert.equal(placeholder.isIfscValid, false)
    assert.ok(placeholder.issues.length >= 2)

    const valid = validateBankAccountDetails({
      bankName: 'J&K Bank',
      accountHolderName: 'Bilal Ahmad',
      accountNumber: '****4821',
      ifscCode: 'JAKA0PATTAN',
    })
    assert.equal(valid.isValid, true)
    assert.equal(valid.isIfscValid, true)

    assert.equal(formatBankStatusLabel('ENTERED', false), 'Pending Verification')
    assert.equal(formatBankStatusLabel('VERIFIED', false), 'Verified')
    assert.equal(formatBankStatusLabel('PAYOUT_ENABLED', true), 'Active for Payouts')
    assert.equal(formatBankStatusLabel('REJECTED', false), 'Rejected')
  })

  it('detects expired documents accurately and blocks approval even if marked approved', async () => {
    assert.equal(isDocumentExpired('2020-01-01T00:00:00.000Z'), true)
    assert.equal(isDocumentExpired('2099-12-31T00:00:00.000Z'), false)
    assert.equal(isDocumentExpired(undefined), false)
    assert.equal(isDocumentExpired('not-a-date'), false)

    await render([
      doc('d1', 'driving_license', 'approved', 'https://example.invalid/dl.jpg', 'driver', '2020-01-01T00:00:00.000Z'),
      doc('v1', 'rc', 'approved', 'https://example.invalid/rc.jpg', 'vehicle', '2099-12-31T00:00:00.000Z'),
    ])

    await click(stepButton('Decision'))
    assert.equal(button('Approve Application').disabled, true)
    assert.ok(container.textContent?.includes('expired'))
  })

  it('shows a clear recovery state with Verified Driver Profile link on 409 already-verified error', async () => {
    api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      const error = Object.assign(new Error('Driver is already verified'), {
        isAxiosError: true,
        response: {
          status: 409,
          statusText: 'Conflict',
          data: { message: 'This driver application has already been verified.' },
          headers: {},
          config,
        },
      })
      throw error
    }

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    await act(async () =>
      root.render(
        createElement(
          QueryClientProvider,
          { client },
          createElement(
            ToastProvider,
            null,
            createElement(
              MemoryRouter,
              { initialEntries: ['/driver-management/applications/drv-1'] },
              createElement(
                Routes,
                null,
                createElement(Route, {
                  path: '/driver-management/applications/:id',
                  element: createElement(ApplicationReviewPage),
                }),
              ),
            ),
          ),
        ),
      ),
    )
    await settle()

    assert.ok(container.textContent?.includes('Open Verified Driver Profile'))
  })
})

describe('ApplicationReviewPage — reviewer can open a document before deciding (M3)', () => {
  it('opens an unverified PDF from the preview', async () => {
    await render([doc('d1', 'driving_license', 'pending', 'https://example.invalid/licence.pdf')])

    const card = [...container.querySelectorAll('div.cursor-pointer')].find((el) =>
      el.textContent?.includes('Driving License'),
    )
    assert.ok(card, 'document card')
    await click(card)

    const open = button('Open document')
    assert.equal(open.disabled, false)
    await click(open)
    assert.deepEqual(opened, ['https://example.invalid/licence.pdf'])
  })

  it('opens a stored file for viewing in the browser, not as a download', async () => {
    const fileId = '01a12410-f039-7720-8ac8-d1ad084c901e'
    await render([{ ...doc('d1', 'driving_license', 'pending', ''), fileId } as Doc])

    const card = [...container.querySelectorAll('div.cursor-pointer')].find((el) =>
      el.textContent?.includes('Driving License'),
    )
    assert.ok(card, 'document card')
    await click(card)
    await click(button('Open document'))

    assert.deepEqual(opened, [`https://signed.example/files/${fileId}/url?inline`])
  })
})

describe('ApplicationReviewPage — both sides of a two-sided card (M4)', () => {
  const backId = '01a12410-f039-7720-8ac8-d1ad084c9999'
  async function preview(document: Doc) {
    await render([document])
    const card = [...container.querySelectorAll('div.cursor-pointer')].find((el) =>
      el.textContent?.includes(document.docType === 'pan' ? 'PAN Card' : 'Driving License'),
    )
    assert.ok(card, 'document card')
    await click(card)
  }

  it('shows the back beside the front and opens it on its own', async () => {
    await preview({ ...doc('d1', 'driving_license', 'pending'), backFileId: backId } as Doc)

    const backSrc = `https://signed.example/files/${backId}/url?inline`
    assert.ok([...container.querySelectorAll('img')].some((img) => img.getAttribute('src') === backSrc))
    await click(button('Open back'))
    assert.deepEqual(opened, [backSrc])
  })

  it('says the back is missing for a licence uploaded without one', async () => {
    await preview(doc('d1', 'driving_license', 'pending'))

    assert.ok(container.textContent?.includes('Back not provided'))
  })

  it('asks for no back on a one-sided document', async () => {
    await preview(doc('d1', 'pan', 'pending'))

    assert.ok(!container.textContent?.includes('Back not provided'))
  })

  it('renders a PDF licence as a single complete document preview without asking for a back', async () => {
    await preview({ ...doc('d1', 'driving_license', 'pending', 'https://example.invalid/licence.pdf'), isPdf: true } as Doc)

    assert.ok(!container.textContent?.includes('Back not provided'))
    assert.ok(container.textContent?.includes('Complete Digital Document (PDF contains all pages)'))
    assert.ok(container.querySelector('iframe'))
  })
})

describe('ApplicationReviewPage — accepting an application', () => {
  it('asks nothing about Commission or Subscription: the driver chooses that in the app', async () => {
    await render([
      doc('d1', 'driving_license', 'approved'),
      doc('v1', 'rc', 'approved', 'https://example.invalid/rc.jpg', 'vehicle'),
    ])
    await click(stepButton('Decision'))
    await click(button('Approve Application'))

    assert.ok(button('Yes, Approve Application'), 'the confirmation is open')
    assert.ok(!/commission|subscription|billing/i.test(container.textContent ?? ''))
  })

  it('approves with only the notes, then returns to the applications queue', async () => {
    await render([
      doc('d1', 'driving_license', 'approved'),
      doc('v1', 'rc', 'approved', 'https://example.invalid/rc.jpg', 'vehicle'),
    ])
    await click(stepButton('Decision'))
    await click(button('Approve Application'))
    await click(button('Yes, Approve Application'))

    assert.deepEqual(posted, [
      { url: '/admin/applications/drv-1/approve', body: { notes: 'Application approved' } },
    ])
    assert.ok(container.textContent?.includes('Applications queue'), container.textContent?.slice(0, 200))
  })
})
