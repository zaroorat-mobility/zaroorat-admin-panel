import type { User } from '@/store/auth.store'

/**
 * Role-Based Access Control (RBAC) helper functions
 */

export const checkPermission = (user: User | null, requiredPermission: string): boolean => {
  if (!user) return false
  if (user.role === 'superadmin') return true // Superadmin bypass
  return user.permissions.includes(requiredPermission)
}

export const checkRole = (user: User | null, allowedRoles: User['role'][]): boolean => {
  if (!user) return false
  if (user.role === 'superadmin') return true // Superadmin bypass
  return allowedRoles.includes(user.role)
}

export interface PermissionGateProps {
  user: User | null
  permission?: string
  roles?: User['role'][]
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Permission Gate Helper for conditional rendering in UI components
 */
export const hasAccess = ({
  user,
  permission,
  roles,
}: {
  user: User | null
  permission?: string
  roles?: User['role'][]
}): boolean => {
  if (!user) return false
  if (user.role === 'superadmin') return true

  if (permission && !checkPermission(user, permission)) {
    return false
  }

  if (roles && !checkRole(user, roles)) {
    return false
  }

  return true
}
