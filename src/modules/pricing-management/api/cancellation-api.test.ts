import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { normalizeCancellation, toCancellationPayload } from './index'

describe('cancellation policy API mapper (Phase 3)', () => {
  it('converts UI form units & fields cleanly to the strict M-06 backend schema', () => {
    const payload = toCancellationPayload({
      ruleName: 'Rider Late Cancel',
      actor: 'rider',
      scenario: 'after_arrival',
      chargeType: 'percentage',
      chargeAmount: 15,
      freeCancellationWindow: 3,
      freeCancellationUnit: 'minutes',
      maxChargeAmount: 50,
      driverPayout: 30,
      driverPenalty: null,
      expectedVersion: 2,
      status: 'active',
    })

    assert.deepEqual(payload, {
      ruleName: 'Rider Late Cancel',
      actor: 'rider',
      scenario: 'after_arrival',
      chargeType: 'percentage',
      chargeAmount: 15,
      freeCancelWindowSec: 180,
      maxFee: 50,
      driverCompensationType: 'FLAT',
      driverCompensationAmount: 30,
      driverPenaltyAmount: null,
      expectedVersion: 2,
      status: 'active',
    })
  })

  it('normalizes M-06 backend DTO back into form-compatible fields without data loss', () => {
    const normalized = normalizeCancellation({
      id: '00000000-0000-7000-8000-000000000001',
      ruleName: 'Rider Late Cancel',
      familyId: '00000000-0000-7000-8000-000000000099',
      version: 3,
      actor: 'rider',
      scenario: 'after_arrival',
      chargeType: 'percentage',
      chargeAmount: 15,
      feeBase: 'QUOTED_FARE',
      maxFee: 60,
      freeCancelWindowSec: 150,
      driverCompensationType: 'PERCENT_OF_FEE',
      driverCompensationAmount: 75,
      driverPenaltyAmount: 20,
      status: 'active',
      createdAt: '2026-11-18T00:00:00Z',
      updatedAt: '2026-11-18T00:00:00Z',
    })

    assert.equal(normalized.version, 3)
    assert.equal(normalized.freeCancellationWindow, 150)
    assert.equal(normalized.freeCancellationUnit, 'seconds')
    assert.equal(normalized.maxChargeAmount, 60)
    assert.equal(normalized.driverPayout, 75)
    assert.equal(normalized.driverPenalty, 20)
  })
})
