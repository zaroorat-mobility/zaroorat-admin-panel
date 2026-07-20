import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Clock, UserCheck } from 'lucide-react'
import Clouds from './Clouds'
import CityBackground from './CityBackground'
import AnimatedRoad from './AnimatedRoad'
import HeroCar from './HeroCar'
import MotionLines from './MotionLines'
import heroLogo from "@/assets/images/hero-logo.jpg"

export const AuthHero: React.FC = () => {
  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-white dark:bg-[#0B0F19] border-r border-slate-100 dark:border-slate-800/60 select-none pb-16">
      
      {/* ── Background Subtle Glow ─────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(100%_100%_at_0%_0%,rgba(43,49,122,0.03)_0%,rgba(255,255,255,0)_100%)] dark:bg-[radial-gradient(100%_100%_at_0%_0%,rgba(43,49,122,0.15)_0%,rgba(0,0,0,0)_100%)] -z-10" />

      {/* ── Animated Parallax Vector Layers ────────────────────────────────── */}
      {/* Clouds & Birds Layer (5% drift speed) */}
      <Clouds />

      {/* Cities, Houses & Trees Layer (10% & 20% speeds) */}
      <CityBackground />

      {/* Speed Lines Layer behind the car */}
      <MotionLines />

      {/* Perspective outline road: wide at footer, narrows behind car */}
      <AnimatedRoad />

      {/* Large white Sedan car hovering prominently */}
      <HeroCar />

      {/* ── Top Left Branding Overlay (Poster Alignment) ───────────────────── */}
      <div className="absolute top-[6vh] left-[6vw] z-40 max-w-[420px] flex flex-col justify-start items-start text-left">
        {/* Brand Logo Container */}
        <motion.div 
          className="flex items-center gap-3 mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-100 flex items-center justify-center bg-white shadow-sm">
            <img src={heroLogo} alt="Zaroorat logo" className="w-full h-full object-cover scale-[1.1]" />
          </div>
          <div>
            <h1 className="text-sm font-black text-[#2B317A] dark:text-white leading-none uppercase tracking-widest">Zaroorat</h1>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Mobility</span>
          </div>
        </motion.div>
        
        {/* Main Header */}
        <motion.h2 
          className="text-4xl font-black text-[#2B317A] dark:text-white tracking-tight mt-1 leading-none uppercase"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Mobility Services
        </motion.h2>
        
        {/* Tagline */}
        <motion.h3 
          className="text-base font-bold text-slate-700 dark:text-slate-200 mt-2.5 leading-snug"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Where Safety Meets Reliability.
        </motion.h3>

        {/* Sub-description */}
        <motion.p 
          className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Safe, reliable and on-time rides for a better city.
        </motion.p>

        {/* Compact tagline feature chips */}
        <motion.div 
          className="flex flex-wrap gap-2.5 mt-5"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-750 dark:text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2B317A] dark:text-blue-400" />
            <span>Safe Rides</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-750 dark:text-slate-300">
            <UserCheck className="w-3.5 h-3.5 text-[#2B317A] dark:text-blue-400" />
            <span>Verified Drivers</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-750 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-[#2B317A] dark:text-blue-400" />
            <span>On-Time Service</span>
          </div>
        </motion.div>
      </div>

      {/* ── Curved Bottom Slogan Ribbon ────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 w-full z-45 h-14 pointer-events-none">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-full fill-[#2B317A]">
          <path d="M0,60 L1440,60 L1440,15 C1080,-5 360,-5 0,15 Z" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center gap-2.5 text-white text-xs md:text-sm font-bold tracking-wide">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-white">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            <path d="M8 11h8" strokeWidth="1.5" />
            <path d="M10 13h4" strokeWidth="1.5" />
          </svg>
          <span>Better Mobility. Better City. Better Tomorrow.</span>
        </div>
      </div>
    </div>
  )
}
export default AuthHero
