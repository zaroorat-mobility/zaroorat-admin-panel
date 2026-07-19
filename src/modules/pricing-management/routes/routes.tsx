import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { PricingDashboardPage } from '../dashboard'
import {
  FareRulesListPage,
  CreateFareRulePage,
  EditFareRulePage,
  FareRuleDetailsPage
} from '../fare-rules'
import {
  SurgeRulesListPage,
  CreateSurgeRulePage,
  EditSurgeRulePage,
  SurgeRuleDetailsPage
} from '../surge-rules'
import {
  CancellationRulesListPage,
  CreateCancellationRulePage,
  EditCancellationRulePage,
  CancellationRuleDetailsPage
} from '../cancellation-rules'
import { PricingHistoryPage } from '../pricing-history'

export const PricingManagementRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Landing Dashboard */}
      <Route index element={<PricingDashboardPage />} />

      {/* Fare Rules */}
      <Route path="fare-rules" element={<FareRulesListPage />} />
      <Route path="fare-rules/new" element={<CreateFareRulePage />} />
      <Route path="fare-rules/:id" element={<FareRuleDetailsPage />} />
      <Route path="fare-rules/:id/edit" element={<EditFareRulePage />} />

      {/* Surge Rules */}
      <Route path="surge-rules" element={<SurgeRulesListPage />} />
      <Route path="surge-rules/new" element={<CreateSurgeRulePage />} />
      <Route path="surge-rules/:id" element={<SurgeRuleDetailsPage />} />
      <Route path="surge-rules/:id/edit" element={<EditSurgeRulePage />} />

      {/* Cancellation Rules */}
      <Route path="cancellation-rules" element={<CancellationRulesListPage />} />
      <Route path="cancellation-rules/new" element={<CreateCancellationRulePage />} />
      <Route path="cancellation-rules/:id" element={<CancellationRuleDetailsPage />} />
      <Route path="cancellation-rules/:id/edit" element={<EditCancellationRulePage />} />

      {/* Pricing History */}
      <Route path="pricing-history" element={<PricingHistoryPage />} />
    </Routes>
  )
}

export default PricingManagementRoutes
