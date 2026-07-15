import React from 'react'
import { Routes, Route } from 'react-router-dom'
import VerificationListPage from '../pages/VerificationListPage'
import VerificationDetailPage from '../pages/VerificationDetailPage'

export const VerificationRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<VerificationListPage />} />
      <Route path=":id" element={<VerificationDetailPage />} />
    </Routes>
  )
}

export default VerificationRoutes
