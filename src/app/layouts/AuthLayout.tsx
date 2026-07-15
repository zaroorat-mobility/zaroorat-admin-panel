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
    <div className="min-h-screen flex bg-slate-50 dark:bg-dark-950 text-slate-800 dark:text-dark-100">
      
      {/* ── LEFT SIDE: Brand Details & Value Proposition ────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#2B317A] text-white flex-col justify-between p-12 relative overflow-hidden select-none">
        
        {/* Abstract graphic circles in background */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/[0.03] translate-x-12 -translate-y-12" />
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] rounded-full bg-white/[0.02] -translate-x-24 translate-y-24" />
        
        {/* Top Header Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md text-white font-extrabold text-xl border border-white/20">
            Z
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wider leading-none">ZAROORAT</h1>
            <p className="text-[10px] text-white/60 tracking-widest font-semibold mt-0.5">MOBILITY</p>
          </div>
        </div>

        {/* Brand Information Content */}
        <div className="my-auto max-w-md relative z-10 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-md border border-white/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Smart Carpool & Bike Pool Network</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight leading-[1.15]">
            Redefining Urban Ride-Sharing & Ride-Hailing.
          </h2>
          <p className="text-sm text-white/80 leading-relaxed">
            Welcome to the administration engine of Zaroorat Mobility. Coordinate live ride-sharing queues, verify driver compliance documents, audit passenger rides, and track pool matching efficiencies in real time.
          </p>

          {/* Quick Metrics Sticker list */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-2xl font-black">2.4M+</p>
              <p className="text-xs text-white/70 mt-0.5">Rides Completed</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-2xl font-black">&lt; 3.5 min</p>
              <p className="text-xs text-white/70 mt-0.5">Avg Pool Match Time</p>
            </div>
          </div>
        </div>

        {/* Footer Brand Info */}
        <div className="text-xs text-white/50 relative z-10 flex justify-between items-center">
          <span>&copy; {new Date().getFullYear()} Zaroorat Mobility Inc.</span>
          <span>Version 2.4.0 (Dev)</span>
        </div>
      </div>

      {/* ── RIGHT SIDE: Form Layout ─────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative overflow-hidden bg-slate-50 dark:bg-dark-950">
        
        {/* Background radial highlight */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-600/5 via-transparent to-transparent -z-10" />

        <div className="w-full max-w-[420px] glass-panel p-8 rounded-2xl shadow-xl bg-white/90 dark:bg-dark-900/80 border border-slate-200 dark:border-dark-800 relative z-10">
          
          {/* Logo header for small screens only */}
          <div className="flex lg:hidden flex-col items-center mb-6">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-[#2B317A] text-white font-extrabold text-2xl shadow-md">
              Z
            </div>
            <h2 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-slate-900 dark:text-dark-50">
              Zaroorat Mobility
            </h2>
            <p className="text-xs text-slate-550 dark:text-dark-400 mt-1">
              Administration Portal
            </p>
          </div>

          <Outlet />
        </div>
      </div>
      
    </div>
  )
}

export default AuthLayout
