import { create } from 'zustand'

interface UserPreference {
  density: 'compact' | 'normal' | 'comfortable'
  notificationsEnabled: boolean
  recentModuleSearches: string[]
}

interface UserPreferencesState {
  preferences: UserPreference
  updatePreferences: (prefs: Partial<UserPreference>) => void
  addSearchTerm: (term: string) => void
  clearSearchHistory: () => void
}

export const useUserPreferencesStore = create<UserPreferencesState>((set) => ({
  preferences: {
    density: 'normal',
    notificationsEnabled: true,
    recentModuleSearches: [],
  },
  updatePreferences: (prefs) =>
    set((state) => ({
      preferences: { ...state.preferences, ...prefs },
    })),
  addSearchTerm: (term) =>
    set((state) => {
      const history = [term, ...state.preferences.recentModuleSearches.filter((t) => t !== term)].slice(0, 5)
      return {
        preferences: { ...state.preferences, recentModuleSearches: history },
      }
    }),
  clearSearchHistory: () =>
    set((state) => ({
      preferences: { ...state.preferences, recentModuleSearches: [] },
    })),
}))
