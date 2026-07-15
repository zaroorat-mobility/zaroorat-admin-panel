import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { checkRole, checkPermission } from '@/infrastructure/permissions'

interface GuardProps {
  children: React.ReactNode
}

/**
 * Route protection wrapper requiring active session authentication
 */
export const AuthGuard: React.FC<GuardProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    // Redirect to login but save the current state for backward navigation
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

/**
 * Guest-only page guard (e.g. login, forgot password) redirecting logged-in admins to home
 */
export const GuestGuard: React.FC<GuardProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

interface RoleGuardProps extends GuardProps {
  allowedRoles?: ('superadmin' | 'admin' | 'support' | 'dispatcher')[]
  requiredPermission?: string
  fallbackPath?: string
}

/**
 * Role-Based Access Guard protecting specific path components
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  requiredPermission,
  fallbackPath = '/dashboard',
}) => {
  const { user } = useAuthStore()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Bypass for superadmin
  if (user.role === 'superadmin') {
    return <>{children}</>
  }

  if (allowedRoles && !checkRole(user, allowedRoles)) {
    return <Navigate to={fallbackPath} replace />
  }

  if (requiredPermission && !checkPermission(user, requiredPermission)) {
    return <Navigate to={fallbackPath} replace />
  }

  return <>{children}</>
}
