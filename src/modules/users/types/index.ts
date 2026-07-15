import type { BaseEntity } from '@/shared/types'

export interface UserEntity extends BaseEntity {
  name: string
  email: string
  phone: string
  role: 'superadmin' | 'admin' | 'support' | 'dispatcher'
  status: 'active' | 'inactive'
}

export interface UserDetails extends UserEntity {
  lastLogin: string
  permissions: string[]
}
