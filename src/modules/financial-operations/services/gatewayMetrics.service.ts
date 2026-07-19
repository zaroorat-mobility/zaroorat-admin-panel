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

const getFailedTransactionsMetrics = async (): Promise<FailedTransactionsMetrics> => {
  const transactions = TransactionLedgerService.getDb()
  const failedTxns = transactions.filter(t => t.status === 'failed')
  
  // Total failed today estimate
  const totalFailedToday = failedTxns.filter(t => {
    const diff = Date.now() - new Date(t.createdAt).getTime()
    return diff <= 86400000
  }).length

  // Counts by error code
  const gatewayTimeouts = failedTxns.filter(t => t.gatewayErrorCode === 'GATEWAY_TIMEOUT').length
  const bankDeclines = failedTxns.filter(t => t.gatewayErrorCode === 'BANK_DECLINED').length
  const otpFailures = failedTxns.filter(t => t.gatewayErrorCode === 'OTP_EXPIRED').length
  const insufficientFunds = failedTxns.filter(t => t.gatewayErrorCode === 'INSUFFICIENT_FUNDS').length
  const userCancelled = failedTxns.filter(t => t.gatewayErrorCode === 'USER_CANCELLED').length

  const totalFailed = failedTxns.length || 1 // Avoid divide by zero
  const reasons: FailureReasonCount[] = [
    { reason: 'Gateway Timeout', code: 'GATEWAY_TIMEOUT', count: gatewayTimeouts, percent: Math.round((gatewayTimeouts / totalFailed) * 100) },
    { reason: 'OTP Expired/Invalid', code: 'OTP_EXPIRED', count: otpFailures, percent: Math.round((otpFailures / totalFailed) * 100) },
    { reason: 'Bank Decline', code: 'BANK_DECLINED', count: bankDeclines, percent: Math.round((bankDeclines / totalFailed) * 100) },
    { reason: 'Insufficient Funds', code: 'INSUFFICIENT_FUNDS', count: insufficientFunds, percent: Math.round((insufficientFunds / totalFailed) * 100) },
    { reason: 'User Cancelled Tab', code: 'USER_CANCELLED', count: userCancelled, percent: Math.round((userCancelled / totalFailed) * 100) }
  ].sort((a, b) => b.count - a.count)

  // Trends
  const trends: FailedTrend[] = [
    { label: 'Today', count: totalFailedToday },
    { label: 'Yesterday', count: Math.round(totalFailedToday * 1.2) + 2 },
    { label: 'Last 7 Days', count: failedTxns.length }
  ]

  // PG Matrix
  const pgs = ['razorpay', 'phonepe', 'cashfree', 'paytm'] as const
  const matrix: GatewayMatrixRow[] = pgs.map(pg => {
    const pgTxns = transactions.filter(t => t.paymentGateway === pg)
    const total = pgTxns.length
    const failed = pgTxns.filter(t => t.status === 'failed').length
    const rate = total > 0 ? Math.round(((total - failed) / total) * 1000) / 10 : 100
    
    return {
      gateway: pg.toUpperCase(),
      totalAttempts: total,
      failedAttempts: failed,
      successRate: rate
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
    bankDeclines
  }
}

export const GatewayMetricsService = {
  getFailedTransactionsMetrics
}

export default GatewayMetricsService
