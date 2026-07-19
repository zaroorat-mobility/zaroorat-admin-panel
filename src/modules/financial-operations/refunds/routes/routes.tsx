import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { RefundsListPage } from '../pages/RefundsListPage'
import { CreateRefundPage } from '../pages/CreateRefundPage'
import { RefundDetailsPage } from '../pages/RefundDetailsPage'
import { RefundReviewPage } from '../pages/RefundReviewPage'
import { RefundProcessPage } from '../pages/RefundProcessPage'

export const RefundsRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<RefundsListPage />} />
      <Route path="new" element={<CreateRefundPage />} />
      <Route path=":id" element={<RefundDetailsPage />} />
      <Route path=":id/review" element={<RefundReviewPage />} />
      <Route path=":id/process" element={<RefundProcessPage />} />
    </Routes>
  )
}

export default RefundsRoutes
