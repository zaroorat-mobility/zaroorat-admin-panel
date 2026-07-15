import { create } from 'zustand'
import { storage } from '@/infrastructure/storage'

export interface User {
  id: string
  name: string
  email: string
  role: 'superadmin' | 'admin' | 'support' | 'dispatcher'
  permissions: string[]
}

interface AuthState {
  isAuthenticated: boolean
  token: string | null
  user: User | null
  isLoading: boolean
  setCredentials: (token: string, user: User) => void
  clearCredentials: () => void
  setLoading: (isLoading: boolean) => void
}

// Load initial credentials from local storage
const cachedToken = storage.get<string>('auth_token')
const cachedUser = storage.get<User>('auth_user')

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!cachedToken,
  token: cachedToken,
  user: cachedUser,
  isLoading: false,
  setCredentials: (token, user) => {
    storage.set('auth_token', token)
    storage.set('auth_user', user)
    set({ isAuthenticated: true, token, user })
  },
  clearCredentials: () => {
    storage.remove('auth_token')
    storage.remove('auth_user')
    set({ isAuthenticated: false, token: null, user: null })
  },
  setLoading: (isLoading) => set({ isLoading }),
}))
