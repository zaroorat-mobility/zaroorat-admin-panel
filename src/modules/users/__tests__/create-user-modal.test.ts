import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { userFormSchema, userEditFormSchema } from '../schemas'
import { CreateAdminUserModal } from '../components/CreateAdminUserModal'
import { EditAdminUserModal } from '../components/EditAdminUserModal'
import { ViewAdminUserModal } from '../components/ViewAdminUserModal'

describe('Admin Users Modal & Form Validation', () => {
  it('1. CreateAdminUserModal, EditAdminUserModal, and ViewAdminUserModal are exported and defined', () => {
    assert.equal(typeof CreateAdminUserModal, 'function')
    assert.equal(typeof EditAdminUserModal, 'function')
    assert.equal(typeof ViewAdminUserModal, 'function')
  })

  it('2. validates valid admin user form payload', () => {
    const validData = {
      name: 'Saqib Ali Mir',
      email: 'saqib@zaroorat.com',
      phone: '+919876543210',
      role: 'admin',
      password: 'StrongPassword@123',
    }
    const result = userFormSchema.safeParse(validData)
    assert.equal(result.success, true)
  })

  it('3. rejects invalid email in admin user form', () => {
    const invalidEmail = {
      name: 'Saqib Ali Mir',
      email: 'not-an-email',
      phone: '+919876543210',
      role: 'admin',
      password: 'StrongPassword@123',
    }
    const result = userFormSchema.safeParse(invalidEmail)
    assert.equal(result.success, false)
  })

  it('4. rejects short name or missing role', () => {
    const invalidName = {
      name: 'A',
      email: 'test@zaroorat.com',
      phone: '+919876543210',
      role: '',
      password: 'StrongPassword@123',
    }
    const result = userFormSchema.safeParse(invalidName)
    assert.equal(result.success, false)
  })

  it('5. rejects weak password', () => {
    const invalidPassword = {
      name: 'Saqib Ali Mir',
      email: 'test@zaroorat.com',
      phone: '+919876543210',
      role: 'admin',
      password: '123',
    }
    const result = userFormSchema.safeParse(invalidPassword)
    assert.equal(result.success, false)
  })

  it('6. validates user edit payload with blank password (retaining current password)', () => {
    const editWithoutPassword = {
      name: 'Saqib Ali Mir',
      email: 'saqib@zaroorat.com',
      phone: '+919876543210',
      role: 'finance',
      password: '',
    }
    const result = userEditFormSchema.safeParse(editWithoutPassword)
    assert.equal(result.success, true)
  })

  it('7. validates user edit payload with updated valid password', () => {
    const editWithNewPassword = {
      name: 'Saqib Ali Mir',
      email: 'saqib@zaroorat.com',
      phone: '+919876543210',
      role: 'finance',
      password: 'NewStrongPassword@2026',
    }
    const result = userEditFormSchema.safeParse(editWithNewPassword)
    assert.equal(result.success, true)
  })

  it('8. rejects weak password in user edit payload', () => {
    const editWithWeakPassword = {
      name: 'Saqib Ali Mir',
      email: 'saqib@zaroorat.com',
      phone: '+919876543210',
      role: 'finance',
      password: 'short',
    }
    const result = userEditFormSchema.safeParse(editWithWeakPassword)
    assert.equal(result.success, false)
  })
})
