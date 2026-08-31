import { Navigate, Route } from 'react-router-dom'
import { RequirePermission } from '@/app/guards'
import UsersListPage from '@/modules/users/pages/UsersListPage'
import UserDetailPage from '@/modules/users/pages/UserDetailPage'
import CreateUserPage from '@/modules/users/pages/CreateUserPage'
import EditUserPage from '@/modules/users/pages/EditUserPage'
import RoleAccessPage from '@/modules/users/pages/RoleAccessPage'

export const accessControlChildRoutes = (
  <>
    <Route index element={<Navigate to="users" replace />} />
    <Route
      path="users"
      element={
        <RequirePermission requiredPermission="staff:write">
          <UsersListPage />
        </RequirePermission>
      }
    />
    <Route
      path="users/new"
      element={
        <RequirePermission requiredPermission="staff:write">
          <CreateUserPage />
        </RequirePermission>
      }
    />
    <Route
      path="users/:id/edit"
      element={
        <RequirePermission requiredPermission="staff:write">
          <EditUserPage />
        </RequirePermission>
      }
    />
    <Route
      path="users/:id"
      element={
        <RequirePermission requiredPermission="staff:write">
          <UserDetailPage />
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
  </>
)

export default accessControlChildRoutes
