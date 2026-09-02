import type { BaseEntity } from '@/shared/types'

export type StaffRole = string

export interface UserEntity extends BaseEntity {
  name: string
  email: string
  phone: string
  role: StaffRole
  status: 'active' | 'inactive'
  lastLogin?: string | null
}

export interface UserDetails extends UserEntity {
  lastLogin: string | null
  permissions: string[]
}
