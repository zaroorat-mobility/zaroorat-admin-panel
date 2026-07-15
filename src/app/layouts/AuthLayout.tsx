import React from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

export const AuthLayout: React.FC = () => {
  const { isAuthenticated } = useAuthStore()

  // Redirect to dashboard if session already active
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-dark-950 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-600/10 via-transparent to-transparent -z-10" />

      <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-2xl shadow-xl bg-white/80 dark:bg-dark-900/80 border border-slate-200 dark:border-dark-800">
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-brand-600 text-white font-extrabold text-2xl shadow-md">
            Z
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900 dark:text-dark-50">
            Zaroorat MyRide
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500 dark:text-dark-400">
            Administration Portal
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
export default AuthLayout
