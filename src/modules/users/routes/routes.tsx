import React from 'react'
import { Routes, Route } from 'react-router-dom'
import UsersListPage from '../pages/UsersListPage'
import UserDetailPage from '../pages/UserDetailPage'

export const UserRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<UsersListPage />} />
      <Route path=":id" element={<UserDetailPage />} />
    </Routes>
  )
}

export default UserRoutes
