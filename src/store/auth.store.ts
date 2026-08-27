import { create } from 'zustand'
import { storage } from '@/infrastructure/storage'

export type AdminRole = 'system_admin' | 'admin' | 'support' | 'finance' | 'dispatcher'

export interface User {
  id: string
  name: string
  email: string
  role: AdminRole
  roles: string[]
  permissions: string[]
}

interface SetCredentialsOptions {
  rememberMe?: boolean
}

interface AuthState {
  isAuthenticated: boolean
  token: string | null
  refreshToken: string | null
  user: User | null
  isLoading: boolean
  setCredentials: (
    token: string,
    user: User,
    refreshToken?: string | null,
    options?: SetCredentialsOptions,
  ) => void
  clearCredentials: () => void
  setLoading: (isLoading: boolean) => void
}

const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_REFRESH_KEY = 'auth_refresh_token'
const AUTH_USER_KEY = 'auth_user'
const AUTH_REMEMBER_KEY = 'auth_remember_me'
const AUTH_EMAIL_KEY = 'auth_remembered_email'

function readAuthFromStorage(): {
  token: string | null
  refreshToken: string | null
  user: User | null
} {
  const fromLocal = {
    token: storage.get<string>(AUTH_TOKEN_KEY),
    refreshToken: storage.get<string>(AUTH_REFRESH_KEY),
    user: storage.get<User>(AUTH_USER_KEY),
  }
  if (fromLocal.token) return fromLocal

  return {
    token: storage.session.get<string>(AUTH_TOKEN_KEY),
    refreshToken: storage.session.get<string>(AUTH_REFRESH_KEY),
    user: storage.session.get<User>(AUTH_USER_KEY),
  }
}

const cached = readAuthFromStorage()

function clearAuthStorage() {
  storage.remove(AUTH_TOKEN_KEY)
  storage.remove(AUTH_REFRESH_KEY)
  storage.remove(AUTH_USER_KEY)
  storage.remove(AUTH_REMEMBER_KEY)
  storage.session.remove(AUTH_TOKEN_KEY)
  storage.session.remove(AUTH_REFRESH_KEY)
  storage.session.remove(AUTH_USER_KEY)
  // Keep AUTH_EMAIL_KEY so "Remember me" can prefill email after logout.
}

export function getRememberedEmail(): string {
  return storage.get<string>(AUTH_EMAIL_KEY) ?? ''
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!cached.token,
  token: cached.token,
  refreshToken: cached.refreshToken,
  user: cached.user,
  isLoading: false,
  setCredentials: (token, user, refreshToken = null, options = {}) => {
    const rememberMe = options.rememberMe === true
    clearAuthStorage()

    const store = rememberMe ? storage : storage.session
    store.set(AUTH_TOKEN_KEY, token)
    store.set(AUTH_USER_KEY, user)
    if (refreshToken) store.set(AUTH_REFRESH_KEY, refreshToken)

    if (rememberMe) {
      storage.set(AUTH_REMEMBER_KEY, true)
      if (user.email) storage.set(AUTH_EMAIL_KEY, user.email)
    } else {
      storage.remove(AUTH_EMAIL_KEY)
    }

    set({ isAuthenticated: true, token, user, refreshToken })
  },
  clearCredentials: () => {
    clearAuthStorage()
    set({ isAuthenticated: false, token: null, refreshToken: null, user: null })
  },
  setLoading: (isLoading) => set({ isLoading }),
}))
