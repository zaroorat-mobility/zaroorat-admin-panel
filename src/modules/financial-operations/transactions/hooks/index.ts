import { useQuery } from '@tanstack/react-query'
import type { QueryParams } from '@/shared/types'
import {
  TransactionLedgerService,
  FinanceAnalyticsService,
  ReconciliationService,
  GatewayMetricsService,
  FinanceAuditService
} from '../../services'

const QK = {
  transactions: (p?: QueryParams) => ['finance', 'transactions', p || {}] as const,
  transaction: (id: string) => ['finance', 'transaction', id] as const,
  dashboardStats: () => ['finance', 'dashboard-stats'] as const,
  reconciliation: (p?: QueryParams) => ['finance', 'reconciliation', p || {}] as const,
  failedMetrics: () => ['finance', 'failed-metrics'] as const,
  auditLogs: (p?: QueryParams) => ['finance', 'audit-logs', p || {}] as const
}

export const useTransactions = (params?: QueryParams) =>
  useQuery({
    queryKey: QK.transactions(params),
    queryFn: () => TransactionLedgerService.getTransactions(params)
  })

export const useTransaction = (id: string) =>
  useQuery({
    queryKey: QK.transaction(id),
    queryFn: () => TransactionLedgerService.getTransactionById(id),
    enabled: !!id
  })

export const useDashboardStats = () =>
  useQuery({
    queryKey: QK.dashboardStats(),
    queryFn: () => FinanceAnalyticsService.getDashboardStats()
  })

export const useReconciliation = (params?: QueryParams) =>
  useQuery({
    queryKey: QK.reconciliation(params),
    queryFn: () => ReconciliationService.getReconciliationRecords(params)
  })

export const useFailedMetrics = () =>
  useQuery({
    queryKey: QK.failedMetrics(),
    queryFn: () => GatewayMetricsService.getFailedTransactionsMetrics()
  })

export const useFinanceAuditLogs = (params?: QueryParams) =>
  useQuery({
    queryKey: QK.auditLogs(params),
    queryFn: () => FinanceAuditService.getFinanceAuditLogs(params)
  })
