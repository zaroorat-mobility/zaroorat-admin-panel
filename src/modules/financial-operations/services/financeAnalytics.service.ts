import { api, API_ENDPOINTS } from '@/infrastructure/api'

export interface RevenueOverview {
  gtv: number
  netRevenue: number
  todayCollection: number
  weeklyCollection: number
  monthlyCollection: number
  outstandingRefunds: number
  outstandingSettlements: number
  openDisputesValue: number
}

export interface ActionRequiredMetrics {
  failedTransactions: number
  openDisputes: number
  refundsPendingReview: number
  settlementVariances: number
  unreconciledTransactions: number
  transactionsStuck: number
}

export interface TransactionHealth {
  successRate: number
  avgGatewayResponseTime: number
  refundRatio: number
  disputeRatio: number
  settlementSuccessRate: number
}

export interface GatewayPerformance {
  gateway: string
  successRate: number
  failedCount: number
  avgResponseTime: number
}

export interface FinancialDashboardStats {
  revenue: RevenueOverview
  actions: ActionRequiredMetrics
  health: TransactionHealth
  gateways: GatewayPerformance[]
}

const getDashboardStats = async (): Promise<FinancialDashboardStats> => {
  const response = await api.get<{ data: FinancialDashboardStats }>(API_ENDPOINTS.finance.dashboard)
  return response.data.data
}

export const FinanceAnalyticsService = {
  getDashboardStats,
}

export default FinanceAnalyticsService
