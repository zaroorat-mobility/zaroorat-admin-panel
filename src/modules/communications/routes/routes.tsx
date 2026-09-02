import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { TemplatesPage } from '../pages/TemplatesPage'
import { PushComposePage } from '../pages/PushComposePage'
import { PushHistoryPage } from '../pages/PushHistoryPage'
import { DeliveryHistoryPage } from '../pages/DeliveryHistoryPage'

export const CommunicationsRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="templates" replace />} />
      <Route path="templates" element={<TemplatesPage />} />
      <Route path="push/compose" element={<PushComposePage />} />
      <Route path="push/history" element={<PushHistoryPage />} />
      <Route path="delivery-history" element={<DeliveryHistoryPage />} />
    </Routes>
  )
}

export default CommunicationsRoutes
