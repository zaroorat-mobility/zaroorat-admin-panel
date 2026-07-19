import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuditLogPage } from '../pages/AuditLogPage'

export const AuditLogRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<AuditLogPage />} />
    </Routes>
  )
}

export default AuditLogRoutes
