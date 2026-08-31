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
  { id: 'access', label: 'Access Control & Admin Users', prefixes: ['staff', 'rbac', 'users', 'admin'] },
  { id: 'riders', label: 'Rider Management', prefixes: ['riders'] },
  { id: 'drivers', label: 'Driver Management', prefixes: ['drivers'] },
  { id: 'vehicles', label: 'Vehicle Management', prefixes: ['vehicles'] },
  { id: 'geography', label: 'Geographic Management', prefixes: ['geography'] },
  { id: 'pricing', label: 'Pricing Management', prefixes: ['pricing'] },
  { id: 'operations', label: 'Operations', prefixes: ['operations', 'dashboard', 'safety', 'support', 'rides'] },
  { id: 'finance', label: 'Financial Operations', prefixes: ['finance', 'payouts', 'refunds'] },
  { id: 'school', label: 'School Mobility', prefixes: ['school'] },
  { id: 'campaigns', label: 'Promotions & Campaigns', prefixes: ['campaigns'] },
  { id: 'communications', label: 'Communications', prefixes: ['communications'] },
  { id: 'referrals', label: 'Referral & Rewards', prefixes: ['referrals'] },
  { id: 'platform', label: 'Platform', prefixes: ['settings', 'monitoring', 'security', 'jobs'] },
  { id: 'documents', label: 'Document Controller', prefixes: ['documents'] },
  { id: 'carpooling', label: 'Carpooling Rules', prefixes: ['carpooling'] },
  { id: 'audit', label: 'Audit Log', prefixes: ['audit'] },
] as const

/** Maps permission actions to operator-friendly labels (admin panel docs). */
export const PERMISSION_ACTION_LABELS: Record<string, string> = {
  read: 'View',
  write: 'Update',
  manage: 'Manage settings',
  verify: 'Approve',
  execute: 'Execute',
  read_any: 'View (all)',
  process_any: 'Process (all)',
}

export const ROLE_CATALOG: Array<{
  slug: string
  label: string
  description: string
}> = [
  {
    slug: 'system_admin',
    label: 'Super Admin',
    description: 'Full platform access including role and staff provisioning.',
  },
  {
    slug: 'admin',
    label: 'Operations Admin',
    description: 'Day-to-day operations across riders, drivers, pricing, and live ops.',
  },
  {
    slug: 'support',
    label: 'Customer Support',
    description: 'Ride monitoring, tickets, safety incidents, and rider support.',
  },
  {
    slug: 'finance',
    label: 'Finance Manager',
    description: 'Settlements, payouts, refunds, and financial reporting.',
  },
]

export const roleDisplayName = (slug: string, fallbackName?: string): string => {
  const match = ROLE_CATALOG.find((role) => role.slug === slug)
  if (match) return match.label
  if (fallbackName) return fallbackName
  return slug.replace(/_/g, ' ')
}

export const permissionCategory = (code: string, resource?: string): string => {
  const key = (resource || code.split(':')[0] || '').toLowerCase()
  const match = PERMISSION_CATEGORIES.find((category) =>
    category.prefixes.some((prefix) => key === prefix || key.startsWith(`${prefix}_`)),
  )
  return match?.label ?? 'Other'
}

export const permissionActionLabel = (action: string): string =>
  PERMISSION_ACTION_LABELS[action] ?? action.replace(/_/g, ' ')

export const checkPermission = hasPermission
export const checkRole = hasRole
