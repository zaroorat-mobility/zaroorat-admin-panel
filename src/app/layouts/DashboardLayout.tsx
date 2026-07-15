import React, { useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useThemeStore } from '@/store/theme.store'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export const DashboardLayout: React.FC = () => {
  const { isAuthenticated } = useAuthStore()
  const { theme } = useThemeStore()

  // Sync theme class on mount and state changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // Protect layout from unauthorized entry
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Panel content wrapper */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Global sticky Header bar */}
        <Header />

        {/* Scrollable route page container */}
        <main className="flex-1 overflow-y-auto bg-background relative">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
export default DashboardLayout
