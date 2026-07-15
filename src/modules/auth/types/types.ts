import type { User } from '@/store/auth.store'

export interface LoginResponse {
  token: string
  user: User
}

export interface AuthError {
  message: string
  errors?: Record<string, string[]>
}
