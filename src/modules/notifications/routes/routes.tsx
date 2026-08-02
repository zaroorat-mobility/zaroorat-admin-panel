import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { NotificationsPage } from '../pages/NotificationsPage'

export const NotificationsRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<NotificationsPage />} />
    </Routes>
  )
}

export default NotificationsRoutes
