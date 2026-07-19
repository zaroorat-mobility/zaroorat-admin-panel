import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { TransactionsListPage } from '../pages/TransactionsListPage'
import { TransactionDetailsPage } from '../pages/TransactionDetailsPage'

export const TransactionsRoutes: React.FC = () => (
  <Routes>
    <Route index element={<TransactionsListPage />} />
    <Route path=":id" element={<TransactionDetailsPage />} />
  </Routes>
)

export default TransactionsRoutes
