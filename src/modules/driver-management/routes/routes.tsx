import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ApplicationsListPage from '../pages/applications/ApplicationsListPage'
import ApplicationReviewPage from '../pages/applications/ApplicationReviewPage'
import ManualRegistrationPage from '../pages/applications/ManualRegistrationPage'
import DriversListPage from '../pages/drivers/DriversListPage'
import DriverDetailsPage from '../pages/drivers/DriverDetailsPage'
import DriverEditPage from '../pages/drivers/DriverEditPage'
import VehiclesListPage from '../pages/vehicles/VehiclesListPage'
import VehicleDetailsPage from '../pages/vehicles/VehicleDetailsPage'

export const DriverManagementRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root redirect to applications */}
      <Route index element={<Navigate to="applications" replace />} />
      
      {/* Applications Routing */}
      <Route path="applications" element={<ApplicationsListPage />} />
      <Route path="applications/new" element={<ManualRegistrationPage />} />
      <Route path="applications/:id" element={<ApplicationReviewPage />} />
      <Route path="applications/:id/edit" element={<ManualRegistrationPage />} />

      {/* Drivers Routing */}
      <Route path="drivers" element={<DriversListPage />} />
      <Route path="drivers/:id" element={<DriverDetailsPage />} />
      <Route path="drivers/:id/edit" element={<DriverEditPage />} />

      {/* Vehicles Routing */}
      <Route path="vehicles" element={<VehiclesListPage />} />
      <Route path="vehicles/:id" element={<VehicleDetailsPage />} />
    </Routes>
  )
}

export default DriverManagementRoutes
