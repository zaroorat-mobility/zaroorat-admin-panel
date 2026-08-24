import React from 'react'
import { Routes, Route } from 'react-router-dom'
import UsersListPage from '../pages/UsersListPage'
import UserDetailPage from '../pages/UserDetailPage'
import CreateUserPage from '../pages/CreateUserPage'
import RoleAccessPage from '../pages/RoleAccessPage'
import { RequirePermission } from '@/app/guards'

export const UserRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        index
        element={
          <RequirePermission requiredPermission="staff:write">
            <UsersListPage />
          </RequirePermission>
        }
      />
      <Route
        path="new"
        element={
          <RequirePermission requiredPermission="staff:write">
            <CreateUserPage />
          </RequirePermission>
        }
      />
      <Route
        path="roles"
        element={
          <RequirePermission requiredPermission="rbac:manage">
            <RoleAccessPage />
          </RequirePermission>
        }
      />
      <Route
        path=":id"
        element={
          <RequirePermission requiredPermission="staff:write">
            <UserDetailPage />
          </RequirePermission>
        }
      />
    </Routes>
  )
}

export default UserRoutes
