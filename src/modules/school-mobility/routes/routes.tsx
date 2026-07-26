import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { StudentRegistryPage } from '../pages/StudentRegistryPage'
import { RouteOptimizationPage } from '../pages/RouteOptimizationPage'
import { ParentPortalSettingsPage } from '../pages/ParentPortalSettingsPage'

export const SchoolMobilityRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="student-registry" replace />} />
      <Route path="student-registry" element={<StudentRegistryPage />} />
      <Route path="route-optimization" element={<RouteOptimizationPage />} />
      <Route path="parent-portal" element={<ParentPortalSettingsPage />} />
    </Routes>
  )
}

export default SchoolMobilityRoutes
