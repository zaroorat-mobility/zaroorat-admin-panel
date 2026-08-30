import React from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { ProgramsListPage } from '../programs/pages/ProgramsListPage'
import { ProgramFormPage } from '../programs/pages/ProgramFormPage'
import { CodesListPage } from '../codes/pages/CodesListPage'
import { HistoryListPage } from '../history/pages/HistoryListPage'

const LegacyProgramEditRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/referral-management/rider/programs/${id}/edit`} replace />
}

export const ReferralManagementRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="rider/programs" replace />} />

      <Route path="rider/programs" element={<ProgramsListPage />} />
      <Route path="rider/programs/new" element={<ProgramFormPage />} />
      <Route path="rider/programs/:id/edit" element={<ProgramFormPage />} />
      <Route path="rider/codes" element={<CodesListPage />} />
      <Route path="rider/history" element={<HistoryListPage />} />

      <Route path="driver/programs" element={<ProgramsListPage />} />
      <Route path="driver/programs/new" element={<ProgramFormPage />} />
      <Route path="driver/programs/:id/edit" element={<ProgramFormPage />} />
      <Route path="driver/codes" element={<CodesListPage />} />
      <Route path="driver/history" element={<HistoryListPage />} />

      <Route path="programs" element={<Navigate to="/referral-management/rider/programs" replace />} />
      <Route path="programs/new" element={<Navigate to="/referral-management/rider/programs/new" replace />} />
      <Route path="programs/:id/edit" element={<LegacyProgramEditRedirect />} />
      <Route path="codes" element={<Navigate to="/referral-management/rider/codes" replace />} />
      <Route path="history" element={<Navigate to="/referral-management/rider/history" replace />} />
    </Routes>
  )
}

export default ReferralManagementRoutes
