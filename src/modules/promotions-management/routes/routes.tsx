import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { PromotionsListPage } from '../promotions/pages/PromotionsListPage'
import { PromotionFormPage } from '../promotions/pages/PromotionFormPage'
import { CampaignsListPage } from '../campaigns/pages/CampaignsListPage'
import { SegmentsListPage } from '../segments/pages/SegmentsListPage'
import { BatchesListPage } from '../batches/pages/BatchesListPage'
import { BannersListPage } from '../banners/pages/BannersListPage'
import { PromoReportsPage } from '../reports/pages/PromoReportsPage'

export const PromotionsManagementRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="promotions" replace />} />
      <Route path="promotions" element={<PromotionsListPage />} />
      <Route path="promotions/new" element={<PromotionFormPage />} />
      <Route path="promotions/:id/edit" element={<PromotionFormPage />} />
      <Route path="campaigns" element={<CampaignsListPage />} />
      <Route path="segments" element={<SegmentsListPage />} />
      <Route path="batches" element={<BatchesListPage />} />
      <Route path="banners" element={<BannersListPage />} />
      <Route path="reports" element={<PromoReportsPage />} />
    </Routes>
  )
}

export default PromotionsManagementRoutes
