import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { DisputesListPage, CreateDisputePage, DisputeDetailsPage } from '../disputes'
import { RefundsRoutes } from '../refunds'
import { SettlementsRoutes } from '../settlements'
import { FinancialDashboardPage } from '../dashboard'
import { TransactionsRoutes } from '../transactions'
import { FailedTransactionsPage } from '../transactions/pages/FailedTransactionsPage'
import { TransactionReconciliationPage } from '../transactions/pages/TransactionReconciliationPage'
import { FinanceAuditLogsPage } from '../audit-logs'

export const FinancialOperationsRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Land on dashboard by default */}
      <Route index element={<Navigate to="dashboard" replace />} />
      
      {/* Financial Operations Dashboard */}
      <Route path="dashboard" element={<FinancialDashboardPage />} />

      {/* Transactions Ledger */}
      <Route path="transactions/*" element={<TransactionsRoutes />} />

      {/* Failed Transactions Analyzer */}
      <Route path="failed-transactions" element={<FailedTransactionsPage />} />

      {/* Reconciliation Analyzer */}
      <Route path="reconciliation" element={<TransactionReconciliationPage />} />

      {/* Disputes sub-module */}
      <Route path="disputes" element={<DisputesListPage />} />
      <Route path="disputes/new" element={<CreateDisputePage />} />
      <Route path="disputes/:id" element={<DisputeDetailsPage />} />
      
      {/* Refunds sub-module */}
      <Route path="refunds/*" element={<RefundsRoutes />} />
      
      {/* Settlements sub-module */}
      <Route path="settlements/*" element={<SettlementsRoutes />} />

      {/* Finance Audit Logs */}
      <Route path="audit-logs" element={<FinanceAuditLogsPage />} />
    </Routes>
  )
}

export default FinancialOperationsRoutes

