import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import VehiclesListPage from '../pages/vehicles/VehiclesListPage'
import VehicleDetailsPage from '../pages/vehicles/VehicleDetailsPage'

export const VehicleManagementRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="vehicles" replace />} />
      <Route path="vehicles" element={<VehiclesListPage />} />
      <Route path="vehicles/:id" element={<VehicleDetailsPage />} />
    </Routes>
  )
}

export default VehicleManagementRoutes
