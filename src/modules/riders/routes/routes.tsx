import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { RidersListPage } from '../pages/RidersListPage'
import { RiderDetailsPage } from '../pages/RiderDetailsPage'

export const RiderRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<RidersListPage />} />
      <Route path=":id" element={<RiderDetailsPage />} />
    </Routes>
  )
}

export default RiderRoutes
