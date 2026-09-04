import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { Transaction } from '../transactions/types'

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
  const response = await api.get<{ data: Transaction[]; meta: { totalCount: number } }>(
    API_ENDPOINTS.finance.transactions,
    { params: { status: 'failed', limit: 100 } },
  )
  const failedTxns = response.data.data.filter((t) => t.status === 'failed')

  const totalFailedToday = failedTxns.filter((t) => {
    const diff = Date.now() - new Date(t.createdAt).getTime()
    return diff <= 86400000
  }).length

  const gatewayTimeouts = failedTxns.filter((t) => t.gatewayErrorCode === 'GATEWAY_TIMEOUT').length
  const bankDeclines = failedTxns.filter((t) => t.gatewayErrorCode === 'BANK_DECLINED').length
  const otpFailures = failedTxns.filter((t) => t.gatewayErrorCode === 'OTP_EXPIRED').length
  const insufficientFunds = failedTxns.filter(
    (t) => t.gatewayErrorCode === 'INSUFFICIENT_FUNDS',
  ).length
  const userCancelled = failedTxns.filter((t) => t.gatewayErrorCode === 'USER_CANCELLED').length

  const totalFailed = failedTxns.length || 1
  const reasons: FailureReasonCount[] = [
    {
      reason: 'Gateway Timeout',
      code: 'GATEWAY_TIMEOUT',
      count: gatewayTimeouts,
      percent: Math.round((gatewayTimeouts / totalFailed) * 100),
    },
    {
      reason: 'OTP Expired/Invalid',
      code: 'OTP_EXPIRED',
      count: otpFailures,
      percent: Math.round((otpFailures / totalFailed) * 100),
    },
    {
      reason: 'Bank Decline',
      code: 'BANK_DECLINED',
      count: bankDeclines,
      percent: Math.round((bankDeclines / totalFailed) * 100),
    },
    {
      reason: 'Insufficient Funds',
      code: 'INSUFFICIENT_FUNDS',
      count: insufficientFunds,
      percent: Math.round((insufficientFunds / totalFailed) * 100),
    },
    {
      reason: 'User Cancelled Tab',
      code: 'USER_CANCELLED',
      count: userCancelled,
      percent: Math.round((userCancelled / totalFailed) * 100),
    },
  ].sort((a, b) => b.count - a.count)

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const trends: FailedTrend[] = days.map((label, idx) => ({
    label,
    count: failedTxns.filter((t) => new Date(t.createdAt).getDay() === ((idx + 1) % 7)).length,
  }))

  const allTxnsResponse = await api.get<{ data: Transaction[] }>(API_ENDPOINTS.finance.transactions, {
    params: { limit: 100 },
  })
  const allTxns = allTxnsResponse.data.data
  const gateways = ['razorpay', 'phonepe', 'cashfree', 'paytm'] as const
  const matrix: GatewayMatrixRow[] = gateways.map((gateway) => {
    const rows = allTxns.filter((t) => t.paymentGateway === gateway)
    const failedAttempts = rows.filter((t) => t.status === 'failed').length
    const totalAttempts = rows.length
    return {
      gateway: gateway.toUpperCase(),
      totalAttempts,
      failedAttempts,
      successRate:
        totalAttempts > 0
          ? Math.round(((totalAttempts - failedAttempts) / totalAttempts) * 1000) / 10
          : 100,
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
