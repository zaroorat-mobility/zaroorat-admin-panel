import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { SettlementsListPage } from '../pages/SettlementsListPage'
import { SettlementDetailsPage } from '../pages/SettlementDetailsPage'
import { SettlementRunPage } from '../pages/SettlementRunPage'
import { DriverLedgerPage } from '../pages/DriverLedgerPage'

export const SettlementsRoutes: React.FC = () => (
  <Routes>
    <Route index element={<SettlementsListPage />} />
    <Route path="run" element={<SettlementRunPage />} />
    <Route path="drivers/:driverId" element={<DriverLedgerPage />} />
    <Route path=":id" element={<SettlementDetailsPage />} />
  </Routes>
)

export default SettlementsRoutes
