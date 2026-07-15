import { create } from 'zustand'

interface AppState {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (isOpen: boolean) => void
  globalAlert: {
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
  } | null
  setGlobalAlert: (alert: AppState['globalAlert']) => void
  clearGlobalAlert: () => void
}

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  globalAlert: null,
  setGlobalAlert: (globalAlert) => set({ globalAlert }),
  clearGlobalAlert: () => set({ globalAlert: null }),
}))
