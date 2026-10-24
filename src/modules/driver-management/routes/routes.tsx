import React from 'react'
import { Routes, Route } from 'react-router-dom'
import DriverManagementOverviewPage from '../pages/overview/DriverManagementOverviewPage'
import ApplicationsListPage from '../pages/applications/ApplicationsListPage'
import ApplicationReviewPage from '../pages/applications/ApplicationReviewPage'
import ManualRegistrationPage from '../pages/applications/ManualRegistrationPage'
import DriversListPage from '../pages/drivers/DriversListPage'
import DriverDetailsPage from '../pages/drivers/DriverDetailsPage'
import DriverEditPage from '../pages/drivers/DriverEditPage'
import { DocumentControllerPage } from '@/modules/document-controller'

export const DriverManagementRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<DriverManagementOverviewPage />} />
      <Route path="overview" element={<DriverManagementOverviewPage />} />

      <Route path="applications" element={<ApplicationsListPage />} />
      <Route path="applications/new" element={<ManualRegistrationPage />} />
      <Route path="applications/:id/edit" element={<ManualRegistrationPage />} />
      <Route path="applications/:id" element={<ApplicationReviewPage />} />

      <Route path="drivers" element={<DriversListPage />} />
      <Route path="drivers/:id" element={<DriverDetailsPage />} />
      <Route path="drivers/:id/edit" element={<DriverEditPage />} />

      <Route path="documents" element={<DocumentControllerPage />} />
    </Routes>
  )
}

export default DriverManagementRoutes
