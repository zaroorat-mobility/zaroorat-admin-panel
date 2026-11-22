import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const PRICING_DIR = path.resolve(import.meta.dirname, '..')

function collectSourceFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectSourceFiles(full))
    } else if (
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
      !entry.name.endsWith('.test.ts')
    ) {
      results.push(full)
    }
  }
  return results
}

describe('Phase 0 — Pricing Management truthfulness static gate', () => {
  const forbiddenPatterns: Array<{ label: string; regex: RegExp }> = [
    { label: 'DEFAULT_ACTIVE_ fallback datasets', regex: /DEFAULT_ACTIVE_/ },
    { label: 'fabricated KPI count fallback (? 24)', regex: /\?\s*24\b/ },
    { label: 'sample GSTIN 29AAAAA1111A1Z1', regex: /29AAAAA1111A1Z1/ },
    { label: 'sample GSTIN 29XXXXX9999X9Z9', regex: /29XXXXX9999X9Z9/ },
    { label: 'fabricated Demo Driver identity', regex: /Demo Driver/ },
    { label: 'fabricated DRV0001 identifier', regex: /DRV0001/ },
    { label: 'hardcoded 7% preview multiplier (0.07)', regex: /\*\s*0\.07\b/ },
    { label: 'browser alert() stub', regex: /\balert\s*\(/ },
    { label: 'browser localStorage usage (Rev 5 T8)', regex: /\blocalStorage\b/ },
    { label: 'deleted pricing-config.storage import', regex: /pricing-config\.storage/ },
    { label: 'hardcoded static dashboard date range', regex: /Nov 1, 2026/ },
    { label: 'hardcoded 5.00% default GST KPI', regex: />[\s\r\n]*5\.00%[\s\r\n]*</ },
    { label: 'stale GST not persisted alert', regex: /GST configuration not persisted/i },
    { label: 'stale Invoice generation not working alert', regex: /Invoice generation not working/i },
    { label: 'stale Pending Hook badge', regex: /Pending Hook/ },
    { label: 'fake Import processed toast stub', regex: /Import processed/ },
    { label: 'hardcoded Srinagar fallback option', regex: /Srinagar \(SGR\)/ },
    { label: 'hardcoded Bengaluru fallback option', regex: /Bengaluru \(BLR\)/ },
    { label: 'hardcoded SGR cityCode lookup', regex: /cityCode\s*===\s*['"]SGR['"]/ },
    { label: 'legacy client-side reverse GST preview', regex: /\bbuildPreviewContext\b/ },
  ]

  it('contains zero fabricated money values, sample GSTINs, demo identities, or alert() stubs', () => {
    const files = collectSourceFiles(PRICING_DIR)
    assert.ok(files.length > 0, 'Expected pricing-management source files to scan')

    const violations: string[] = []
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8')
      const rel = path.relative(PRICING_DIR, file)
      for (const { label, regex } of forbiddenPatterns) {
        if (regex.test(content)) {
          violations.push(`${rel}: matched forbidden pattern [${label}]`)
        }
      }
    }

    assert.deepEqual(violations, [], `Found truthfulness violations:\n${violations.join('\n')}`)
  })
})
