import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { StatusBadge } from '../index'

/// The applications list shows each backend application status through this badge.
describe('StatusBadge — driver application statuses', () => {
  const cases: Array<[string, string]> = [
    ['pending_review', 'Pending Review'],
    ['under_review', 'Under Review'],
    ['resubmission_required', 'Resubmission Required'],
    ['approved', 'Approved'],
    ['rejected', 'Rejected'],
  ]
  for (const [status, label] of cases) {
    it(`labels ${status} as "${label}"`, () => {
      const html = renderToStaticMarkup(createElement(StatusBadge, { status }))
      assert.ok(html.includes(`>${label}<`), html)
    })
  }
})
