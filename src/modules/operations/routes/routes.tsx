import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { RideMonitorPage, RideDetailsPage } from '../ride-monitor'
import { SosMonitorPage } from '../sos-monitor'
import { ComplaintsListPage, CreateComplaintPage, ComplaintDetailsPage } from '../complaints'

export const OperationsRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="ride-monitor" replace />} />
      
      {/* Ride Monitor */}
      <Route path="ride-monitor" element={<RideMonitorPage />} />
      <Route path="ride-monitor/:id" element={<RideDetailsPage />} />
      
      {/* SOS Monitor */}
      <Route path="sos-monitor" element={<SosMonitorPage />} />
      
      {/* Complaints Queue */}
      <Route path="complaints" element={<ComplaintsListPage />} />
      <Route path="complaints/new" element={<CreateComplaintPage />} />
      <Route path="complaints/:id" element={<ComplaintDetailsPage />} />
    </Routes>
  )
}

export default OperationsRoutes
