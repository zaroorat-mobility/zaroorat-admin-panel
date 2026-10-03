/**
 * Operations Dashboard Formatting Utilities
 *
 * Provides locale-aware Indian Rupee (INR) and numerical formatting
 * without floating-point inaccuracies or mock fallbacks.
 */

/**
 * Formats a currency amount into standard Indian Rupee notation (₹ X,XX,XXX).
 *
 * @param amount Number in INR
 * @param compact Whether to abbreviate large values (e.g. ₹ 4.3L, ₹ 2.8Cr)
 */
export function formatInr(amount: number | null | undefined, compact = false): string {
  if (amount == null || !Number.isFinite(amount)) return '—'

  if (compact) {
    const abs = Math.abs(amount)
    const sign = amount < 0 ? '-' : ''
    if (abs >= 10000000) {
      const val = (abs / 10000000).toFixed(1).replace(/\.0$/, '')
      return `${sign}₹${val}Cr`
    }
    if (abs >= 100000) {
      const val = (abs / 100000).toFixed(1).replace(/\.0$/, '')
      return `${sign}₹${val}L`
    }
    if (abs >= 1000) {
      const val = (abs / 1000).toFixed(1).replace(/\.0$/, '')
      return `${sign}₹${val}K`
    }
  }

  // Sign before the symbol, as in compact mode ("-₹500", never "₹-500").
  const rounded = Math.round(Math.abs(amount))
  const formatted = new Intl.NumberFormat('en-IN').format(rounded)
  return `${amount < 0 && rounded !== 0 ? '-' : ''}₹${formatted}`
}

/**
 * Formats integer/count quantities (e.g. 1,240).
 */
export function formatCount(count: number | null | undefined): string {
  if (count == null || !Number.isFinite(count)) return '—'
  return new Intl.NumberFormat('en-IN').format(count)
}

/**
 * Formats benchmark percentage change indicators (e.g. "+12%", "-24%").
 */
export function formatDeltaPct(pct: number | null | undefined): {
  text: string
  isPositive: boolean
  isNeutral: boolean
} {
  if (pct == null || !Number.isFinite(pct)) {
    return { text: '—', isPositive: false, isNeutral: true }
  }

  const rounded = Math.round(pct * 10) / 10
  if (rounded === 0) {
    return { text: '0%', isPositive: false, isNeutral: true }
  }

  const sign = rounded > 0 ? '+' : ''
  return {
    text: `${sign}${rounded}%`,
    isPositive: rounded > 0,
    isNeutral: false,
  }
}

/**
 * Formats an ISO date string or Date object into human-readable relative time (e.g., "5m ago", "2h ago", "1d ago").
 */
export function formatTimeAgo(isoStringOrDate: string | Date | null | undefined): string {
  if (!isoStringOrDate) return 'Just now'

  const date = typeof isoStringOrDate === 'string' ? new Date(isoStringOrDate) : isoStringOrDate
  const timestamp = date.getTime()
  if (Number.isNaN(timestamp)) return 'Just now'

  const now = Date.now()
  const diffMs = Math.max(0, now - timestamp)
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) return 'Just now'

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays}d ago`

  const diffMonths = Math.floor(diffDays / 30)
  return `${diffMonths}mo ago`
}
