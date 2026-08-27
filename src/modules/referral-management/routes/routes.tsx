import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProgramsListPage } from '../programs/pages/ProgramsListPage'
import { ProgramFormPage } from '../programs/pages/ProgramFormPage'
import { CodesListPage } from '../codes/pages/CodesListPage'
import { HistoryListPage } from '../history/pages/HistoryListPage'

export const ReferralManagementRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="programs" replace />} />
      <Route path="programs" element={<ProgramsListPage />} />
      <Route path="programs/new" element={<ProgramFormPage />} />
      <Route path="programs/:id/edit" element={<ProgramFormPage />} />
      <Route path="codes" element={<CodesListPage />} />
      <Route path="history" element={<HistoryListPage />} />
    </Routes>
  )
}

export default ReferralManagementRoutes
