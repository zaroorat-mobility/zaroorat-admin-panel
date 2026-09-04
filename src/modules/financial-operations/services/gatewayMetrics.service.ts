import { FinanceAnalyticsService } from './financeAnalytics.service'
import { TransactionLedgerService } from './transactionLedger.service'

export interface FailureReasonCount {
  reason: string
  code: string
  count: number
  percent: number
}

export interface FailedTrend {
  label: string
  count: number
}

export interface GatewayMatrixRow {
  gateway: string
  totalAttempts: number
  failedAttempts: number
  successRate: number
}

export interface FailedTransactionsMetrics {
  reasons: FailureReasonCount[]
  trends: FailedTrend[]
  matrix: GatewayMatrixRow[]
  totalFailedToday: number
  gatewayTimeouts: number
  otpFailures: number
  insufficientFunds: number
  bankDeclines: number
}

const REASON_LABELS: Record<string, string> = {
  GATEWAY_TIMEOUT: 'Gateway Timeout',
  OTP_EXPIRED: 'OTP Expired/Invalid',
  BANK_DECLINED: 'Bank Decline',
  INSUFFICIENT_FUNDS: 'Insufficient Funds',
  USER_CANCELLED: 'User Cancelled Tab',
}

const getFailedTransactionsMetrics = async (): Promise<FailedTransactionsMetrics> => {
  const [dashboard, failedRes] = await Promise.all([
    FinanceAnalyticsService.getDashboardStats(),
    TransactionLedgerService.getTransactions({ status: 'failed', limit: 100, page: 1 }),
  ])

  const failedTxns = failedRes.data
  const totalFailedToday = failedTxns.filter((t) => {
    const diff = Date.now() - new Date(t.createdAt).getTime()
    return diff <= 86400000
  }).length

  const countByCode = (code: string) =>
    failedTxns.filter((t) => t.gatewayErrorCode === code).length

  const gatewayTimeouts = countByCode('GATEWAY_TIMEOUT')
  const bankDeclines = countByCode('BANK_DECLINED')
  const otpFailures = countByCode('OTP_EXPIRED')
  const insufficientFunds = countByCode('INSUFFICIENT_FUNDS')
  const userCancelled = countByCode('USER_CANCELLED')

  const totalFailed = failedTxns.length || 1
  const reasonCodes = [
    ['GATEWAY_TIMEOUT', gatewayTimeouts],
    ['OTP_EXPIRED', otpFailures],
    ['BANK_DECLINED', bankDeclines],
    ['INSUFFICIENT_FUNDS', insufficientFunds],
    ['USER_CANCELLED', userCancelled],
  ] as const

  const reasons: FailureReasonCount[] = reasonCodes
    .map(([code, count]) => ({
      reason: REASON_LABELS[code] ?? code,
      code,
      count,
      percent: Math.round((count / totalFailed) * 100),
    }))
    .sort((a, b) => b.count - a.count)

  const trends: FailedTrend[] = [
    { label: 'Today', count: totalFailedToday },
    { label: 'Last page', count: failedTxns.length },
    { label: 'Dashboard total', count: dashboard.actions.failedTransactions },
  ]

  const matrix: GatewayMatrixRow[] = dashboard.gateways.map((g) => {
    const failedAttempts = g.failedCount
    const successRate = g.successRate
    const totalAttempts =
      successRate < 100 && failedAttempts > 0
        ? Math.round(failedAttempts / (1 - successRate / 100))
        : failedAttempts + Math.round((failedAttempts * successRate) / Math.max(1, 100 - successRate))
    return {
      gateway: g.gateway,
      totalAttempts: totalAttempts || failedAttempts,
      failedAttempts,
      successRate,
    }
  })

  return {
    reasons,
    trends,
    matrix,
    totalFailedToday,
    gatewayTimeouts,
    otpFailures,
    insufficientFunds,
    bankDeclines,
  }
}

export const GatewayMetricsService = {
  getFailedTransactionsMetrics,
}

export default GatewayMetricsService
