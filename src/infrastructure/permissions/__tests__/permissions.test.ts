import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { hasPermission, can, hasAccess } from '../index'
import { useAuthStore, type User } from '@/store/auth.store'

describe('Frontend Permission & Authorization Hardening (Phase 4.5)', () => {
  const adminUser: User = {
    id: 'user_admin_1',
    name: 'Ops Admin',
    email: 'ops@zaroorat.test',
    role: 'admin',
    roles: ['admin'],
    permissions: ['operations:read', 'riders:read', 'drivers:read'],
  }

  const financeUser: User = {
    id: 'user_finance_1',
    name: 'Finance Manager',
    email: 'finance@zaroorat.test',
    role: 'finance',
    roles: ['finance'],
    permissions: ['finance:read', 'payouts:read'],
  }

  const superAdminUser: User = {
    id: 'user_super_1',
    name: 'Super Admin',
    email: 'super@zaroorat.test',
    role: 'system_admin',
    roles: ['system_admin'],
    permissions: [],
  }

  it('1. hasPermission: grants access if user possesses required permission', () => {
    assert.equal(hasPermission(adminUser, 'operations:read'), true)
    assert.equal(hasPermission(financeUser, 'finance:read'), true)
  })

  it('2. hasPermission: denies access (returns false) if permission is missing without fallback', () => {
    assert.equal(hasPermission(adminUser, 'finance:read'), false)
    assert.equal(hasPermission(financeUser, 'operations:read'), false)
  })

  it('3. hasPermission: denies access for null/unauthenticated user', () => {
    assert.equal(hasPermission(null, 'operations:read'), false)
    assert.equal(hasPermission(null, 'finance:read'), false)
  })

  it('4. hasPermission: system_admin role grants superuser bypass', () => {
    assert.equal(hasPermission(superAdminUser, 'operations:read'), true)
    assert.equal(hasPermission(superAdminUser, 'finance:read'), true)
    assert.equal(hasPermission(superAdminUser, 'settings:write'), true)
  })

  it('5. can(): correctly checks permissions using provided user or auth store state', () => {
    // With explicit user
    assert.equal(can('operations:read', adminUser), true)
    assert.equal(can('finance:read', adminUser), false)

    // With auth store user
    useAuthStore.setState({ user: financeUser, isAuthenticated: true })
    assert.equal(can('finance:read'), true)
    assert.equal(can('operations:read'), false)

    // Reset store
    useAuthStore.setState({ user: null, isAuthenticated: false })
    assert.equal(can('operations:read'), false)
  })

  it('6. hasAccess: enforces both permission and role rules correctly', () => {
    assert.equal(hasAccess({ user: adminUser, permission: 'operations:read' }), true)
    assert.equal(hasAccess({ user: adminUser, permission: 'finance:read' }), false)
    assert.equal(hasAccess({ user: null, permission: 'operations:read' }), false)
    assert.equal(hasAccess({ user: superAdminUser, permission: 'arbitrary:permission' }), true)
  })

  it('7. No silent fallbacks: ensure missing permission is explicitly false, never mocked', () => {
    const unprivilegedUser: User = {
      id: 'guest_1',
      name: 'Guest',
      email: 'guest@zaroorat.test',
      role: 'support',
      roles: ['support'],
      permissions: [],
    }

    assert.equal(hasPermission(unprivilegedUser, 'operations:read'), false)
    assert.equal(hasPermission(unprivilegedUser, 'finance:read'), false)
  })
})
