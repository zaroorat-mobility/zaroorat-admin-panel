import React from 'react'
import { Routes, Route } from 'react-router-dom'
import DriversListPage from '../pages/DriversListPage'
import DriverDetailPage from '../pages/DriverDetailPage'

export const DriverRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<DriversListPage />} />
      <Route path=":id" element={<DriverDetailPage />} />
    </Routes>
  )
}

export default DriverRoutes
