import { create } from 'zustand'
import { storage } from '@/infrastructure/storage'

export type AdminRole = 'superadmin' | 'admin' | 'support' | 'dispatcher'

export interface User {
  id: string
  name: string
  email: string
  role: AdminRole
  permissions: string[]
}

interface AuthState {
  isAuthenticated: boolean
  token: string | null
  refreshToken: string | null
  user: User | null
  isLoading: boolean
  setCredentials: (token: string, user: User, refreshToken?: string | null) => void
  clearCredentials: () => void
  setLoading: (isLoading: boolean) => void
}

// Load initial credentials from local storage
const cachedToken = storage.get<string>('auth_token')
const cachedRefresh = storage.get<string>('auth_refresh_token')
const cachedUser = storage.get<User>('auth_user')

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!cachedToken,
  token: cachedToken,
  refreshToken: cachedRefresh,
  user: cachedUser,
  isLoading: false,
  setCredentials: (token, user, refreshToken = null) => {
    storage.set('auth_token', token)
    storage.set('auth_user', user)
    if (refreshToken) storage.set('auth_refresh_token', refreshToken)
    else storage.remove('auth_refresh_token')
    set({ isAuthenticated: true, token, user, refreshToken })
  },
  clearCredentials: () => {
    storage.remove('auth_token')
    storage.remove('auth_refresh_token')
    storage.remove('auth_user')
    set({ isAuthenticated: false, token: null, refreshToken: null, user: null })
  },
  setLoading: (isLoading) => set({ isLoading }),
}))
