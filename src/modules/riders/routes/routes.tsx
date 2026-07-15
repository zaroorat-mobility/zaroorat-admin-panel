import React from 'react'
import { Routes, Route } from 'react-router-dom'
import RidersListPage from '../pages/RidersListPage'
import RiderDetailPage from '../pages/RiderDetailPage'

export const RiderRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<RidersListPage />} />
      <Route path=":id" element={<RiderDetailPage />} />
    </Routes>
  )
}

export default RiderRoutes
