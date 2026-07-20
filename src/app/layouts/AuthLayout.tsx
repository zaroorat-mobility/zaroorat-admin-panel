import React from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { AuthHero } from '@/components/auth-scene'
import navbarLogo from '@/assets/images/navbar_logo.jpg'

export const AuthLayout: React.FC = () => {
  const { isAuthenticated } = useAuthStore()

  // Redirect to dashboard if session already active
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-[#0B0F19] overflow-hidden flex items-center justify-center md:items-start p-4 text-slate-850 dark:text-dark-100">
      
      {/* ── UNIFIED CANVAS BACKGROUND SCENE (100% Width) ────────────────── */}
      <div className="absolute inset-0 z-0 hidden md:block w-full h-full">
        <AuthHero />
      </div>

      {/* ── GLASSMORPHIC LOGIN CARD CONTAINER (Right Floating) ───────────────── */}
      <div className="relative z-30 w-full max-w-[400px] md:absolute md:right-[6vw] lg:right-[8vw] md:top-[50%] md:-translate-y-1/2 md:left-auto md:translate-x-0 p-8 rounded-3xl backdrop-blur-xl bg-white/75 dark:bg-slate-950/60 border border-white/30 dark:border-slate-800/40 shadow-[0_24px_65px_rgba(43,49,122,0.15)] transition-all duration-300">
        
        {/* Logo header for small screens only */}
        <div className="flex md:hidden flex-col items-center justify-center mb-6 w-full text-center">
          <img src={navbarLogo} alt="Zaroorat Mobility" className="h-10 object-contain mb-2 translate-x-3" />
          <p className="text-xs text-slate-550 dark:text-dark-400">
            Administration Portal
          </p>
        </div>

        <Outlet />
      </div>
      
    </div>
  )
}

export default AuthLayout
