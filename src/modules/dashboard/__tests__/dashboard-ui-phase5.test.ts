import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  formatInr,
  formatCount,
  formatDeltaPct,
  formatTimeAgo,
} from '../utils/formatters'
import { hasPermission } from '@/infrastructure/permissions'
import type { User } from '@/store/auth.store'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Rendering behaviour (zero / empty / forbidden / error states) is covered with real
// components and real DTO types in dashboard-data-integrity.test.ts.
describe('Operations Dashboard UI Phase 5 Acceptance Tests', () => {
  // ─── 1. Formatters: INR Currency, Counts, and Deltas ─────────────────────
  describe('1. Currency, Count, and Delta Formatters', () => {
    it('formats INR values accurately without precision loss', () => {
      assert.equal(formatInr(0), '₹0')
      assert.equal(formatInr(450), '₹450')
      assert.equal(formatInr(1250), '₹1,250')
      assert.equal(formatInr(428650), '₹4,28,650')
      assert.equal(formatInr(2845320), '₹28,45,320')
      assert.equal(formatInr(null), '—')
      assert.equal(formatInr(undefined), '—')
    })

    it('formats compact INR values when requested', () => {
      assert.equal(formatInr(25400, true), '₹25.4K')
      assert.equal(formatInr(240000, true), '₹2.4L')
      assert.equal(formatInr(15000000, true), '₹1.5Cr')
      assert.equal(formatInr(950, true), '₹950')
    })

    it('formats driver and ride counts accurately', () => {
      assert.equal(formatCount(0), '0')
      assert.equal(formatCount(842), '842')
      assert.equal(formatCount(2841), '2,841')
      assert.equal(formatCount(1240), '1,240')
      assert.equal(formatCount(null), '—')
      assert.equal(formatCount(undefined), '—')
    })

    it('formats percentage deltas with positive and negative indicators', () => {
      const pos = formatDeltaPct(12.4)
      assert.equal(pos.text, '+12.4%')
      assert.equal(pos.isPositive, true)
      assert.equal(pos.isNeutral, false)

      const neg = formatDeltaPct(-5.2)
      assert.equal(neg.text, '-5.2%')
      assert.equal(neg.isPositive, false)
      assert.equal(neg.isNeutral, false)

      const zero = formatDeltaPct(0)
      assert.equal(zero.text, '0%')
      assert.equal(zero.isNeutral, true)

      const nil = formatDeltaPct(null)
      assert.equal(nil.text, '—')
      assert.equal(nil.isNeutral, true)
    })

    it('formats time-ago intervals safely', () => {
      const now = new Date()
      const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString()
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
      const yesterday = new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString()

      assert.equal(formatTimeAgo(fiveMinsAgo), '5m ago')
      assert.equal(formatTimeAgo(twoHoursAgo), '2h ago')
      assert.equal(formatTimeAgo(yesterday), '1d ago')
      assert.equal(formatTimeAgo('invalid-date'), 'Just now')
    })
  })

  // ─── 2. Financial permission gate ────────────────────────────────────────
  describe('2. Financial KPIs Permission Gate', () => {
    const financeUser: User = {
      id: 'usr-fin',
      email: 'cfo@zaroorat.com',
      name: 'Chief Financial Officer',
      role: 'finance',
      roles: ['finance'],
      permissions: ['operations:read', 'finance:read'],
    }

    const opsUser: User = {
      id: 'usr-ops',
      email: 'ops@zaroorat.com',
      name: 'Operations Dispatcher',
      role: 'dispatcher',
      roles: ['dispatcher'],
      permissions: ['operations:read'], // NO finance:read
    }

    it('grants financial view for users with finance:read', () => {
      assert.equal(hasPermission(financeUser, 'finance:read'), true)
    })

    it('strictly denies financial view for users without finance:read', () => {
      assert.equal(hasPermission(opsUser, 'finance:read'), false)
    })
  })

  // ─── 3. Static Code Audit: No Math.random(), No Hardcoded City Coords ────
  describe('3. Static Code Audit (No Fake Data, No Math.random, No Default Cities)', () => {
    it('verifies dashboard production files do not use Math.random()', () => {
      const componentsDir = path.resolve(__dirname, '../components')
      const files = fs.readdirSync(componentsDir)

      for (const file of files) {
        if (!file.endsWith('.tsx') && !file.endsWith('.ts')) continue
        const filePath = path.join(componentsDir, file)
        const content = fs.readFileSync(filePath, 'utf-8')
        assert.ok(
          !content.includes('Math.random()'),
          `Found forbidden Math.random() in production component: ${file}`
        )
      }
    })

    it('verifies dashboard production files do not contain manual setInterval polling', () => {
      const componentsDir = path.resolve(__dirname, '../components')
      const files = fs.readdirSync(componentsDir)

      for (const file of files) {
        if (!file.endsWith('.tsx') && !file.endsWith('.ts')) continue
        const filePath = path.join(componentsDir, file)
        const content = fs.readFileSync(filePath, 'utf-8')
        assert.ok(
          !content.includes('setInterval('),
          `Found forbidden manual setInterval() in production component: ${file}`
        )
      }
    })

    it('verifies dashboard map component does not hardcode default city coordinates', () => {
      const mapComponentPath = path.resolve(__dirname, '../components/LiveOperationsMapSection.tsx')
      const content = fs.readFileSync(mapComponentPath, 'utf-8')

      // Must not hardcode Bengaluru coordinates as fallbacks
      assert.ok(!content.includes('12.9716'), 'Found hardcoded Bengaluru latitude in LiveOperationsMapSection')
      assert.ok(!content.includes('77.5946'), 'Found hardcoded Bengaluru longitude in LiveOperationsMapSection')
      // Must not hardcode Srinagar coordinates as fallbacks
      assert.ok(!content.includes('34.0837'), 'Found hardcoded Srinagar latitude in LiveOperationsMapSection')
      assert.ok(!content.includes('74.7973'), 'Found hardcoded Srinagar longitude in LiveOperationsMapSection')
    })
  })
})
