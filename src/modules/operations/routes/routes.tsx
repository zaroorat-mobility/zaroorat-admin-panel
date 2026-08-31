import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { RideMonitorPage, RideDetailsPage } from '../ride-monitor'
import { LiveDashboardPage } from '../live-dashboard/pages/LiveDashboardPage'
import { DispatchConsolePage } from '../dispatch/pages/DispatchConsolePage'
import { ComplaintsListPage, CreateComplaintPage, ComplaintDetailsPage } from '../complaints'
import { SafetyCenterPage } from '../safety-center/pages/SafetyCenterPage'

export const OperationsRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="ride-monitor" replace />} />
      
      {/* Ride Monitor */}
      <Route path="ride-monitor" element={<RideMonitorPage />} />
      <Route path="ride-monitor/:id" element={<RideDetailsPage />} />
      
      {/* Live Operations */}
      <Route path="live-dashboard" element={<LiveDashboardPage />} />

      {/* Dispatch & Matching Console */}
      <Route path="dispatch" element={<DispatchConsolePage />} />

      {/* Complaints Queue */}
      <Route path="complaints" element={<ComplaintsListPage />} />
      <Route path="complaints/new" element={<CreateComplaintPage />} />
      <Route path="complaints/:id" element={<ComplaintDetailsPage />} />

      {/* Safety Center (Consolidated SOS & Mishaps) */}
      <Route path="safety-center" element={<SafetyCenterPage />} />
      <Route path="sos-monitor" element={<Navigate to="../safety-center" replace />} />
      <Route path="mishaps" element={<Navigate to="../safety-center" replace />} />
    </Routes>
  )
}

export default OperationsRoutes
