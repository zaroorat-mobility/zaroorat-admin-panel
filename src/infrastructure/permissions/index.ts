import type { User } from '@/store/auth.store'

export const hasPermission = (user: User | null, requiredPermission: string): boolean => {
  if (!user) return false
  if (user.role === 'system_admin' || user.roles.includes('system_admin')) return true
  return user.permissions.includes(requiredPermission)
}

export const hasRole = (user: User | null, allowedRoles: User['role'][]): boolean => {
  if (!user) return false
  if (user.role === 'system_admin' || user.roles.includes('system_admin')) return true
  return allowedRoles.includes(user.role)
}

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
  if (user.role === 'system_admin' || user.roles.includes('system_admin')) return true
  if (permission && !hasPermission(user, permission)) return false
  if (roles && !hasRole(user, roles)) return false
  return true
}

export const PERMISSION_CATEGORIES = [
  { id: 'users', label: 'User Management', prefixes: ['staff', 'rbac', 'users', 'admin'] },
  { id: 'riders', label: 'Rider Management', prefixes: ['riders'] },
  { id: 'drivers', label: 'Driver Management', prefixes: ['drivers'] },
  { id: 'vehicles', label: 'Vehicle Management', prefixes: ['vehicles'] },
  { id: 'pricing', label: 'Pricing Management', prefixes: ['pricing'] },
  { id: 'operations', label: 'Operations', prefixes: ['operations', 'dashboard'] },
  { id: 'finance', label: 'Financial Operations', prefixes: ['finance'] },
  { id: 'school', label: 'School Mobility', prefixes: ['school'] },
  { id: 'campaigns', label: 'Promotions & Campaigns', prefixes: ['campaigns', 'notifications'] },
  { id: 'referrals', label: 'Referral & Rewards', prefixes: ['referrals'] },
  { id: 'documents', label: 'Document Controller', prefixes: ['documents'] },
  { id: 'carpooling', label: 'Carpooling Rules', prefixes: ['carpooling'] },
  { id: 'audit', label: 'Audit Log', prefixes: ['audit'] },
] as const

export const permissionCategory = (code: string, resource?: string): string => {
  const key = (resource || code.split(':')[0] || '').toLowerCase()
  const match = PERMISSION_CATEGORIES.find((category) =>
    category.prefixes.some((prefix) => key === prefix || key.startsWith(`${prefix}_`)),
  )
  return match?.label ?? 'Other'
}

export const checkPermission = hasPermission
export const checkRole = hasRole
