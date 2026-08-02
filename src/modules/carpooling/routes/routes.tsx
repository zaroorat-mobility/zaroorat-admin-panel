import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { CarpoolingPage } from '../pages/CarpoolingPage'

export const CarpoolingRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<CarpoolingPage />} />
    </Routes>
  )
}

export default CarpoolingRoutes
