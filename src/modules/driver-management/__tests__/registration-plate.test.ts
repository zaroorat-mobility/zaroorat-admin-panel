import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { registrationPlateSchema } from '../schemas/index.js';

describe('Admin Panel Registration Plate Validation (Phase 14)', () => {
  const plateSchema = registrationPlateSchema;

  it('accepts standard Indian state registration without hyphens', () => {
    assert.equal(plateSchema.safeParse('JK01AB1234').success, true);
    assert.equal(plateSchema.safeParse('JK01A1234').success, true);
    assert.equal(plateSchema.safeParse('DL1CAB1234').success, true);
  });

  it('accepts Bharat series (BH) plates', () => {
    assert.equal(plateSchema.safeParse('22BH1234AA').success, true);
  });

  it('accepts hyphenated registration plates', () => {
    assert.equal(plateSchema.safeParse('MH-12-PQ-4567').success, true);
  });

  it('accepts registrations with spaces', () => {
    assert.equal(plateSchema.safeParse('JK 01 AB 1234').success, true);
  });

  it('rejects too short or invalid character inputs', () => {
    assert.equal(plateSchema.safeParse('ABC').success, false);
    assert.equal(plateSchema.safeParse('').success, false);
    assert.equal(plateSchema.safeParse('INVALID!@#$').success, false);
  });
});
