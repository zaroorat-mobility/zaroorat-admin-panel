import React from 'react'
import { ShieldCheck, Clock, UserCheck } from 'lucide-react'
import { HeroBackground } from './HeroBackground'
import { HeroSkyline } from './HeroSkyline'
import { HeroRoad } from './HeroRoad'
import { HeroCar } from './HeroCar'
import { HeroClouds } from './HeroClouds'
import { HeroPins } from './HeroPins'
import { HeroStats } from './HeroStats'

export const AuthHero: React.FC = () => {
  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden select-none pb-[120px]">
      {/* Background radial glows and grid */}
      <HeroBackground />

      {/* City Skyline layer */}
      <HeroSkyline />

      {/* Curved Road texture & SVG path */}
      <HeroRoad />

      {/* Drifting Clouds */}
      <HeroClouds />

      {/* Bouncing Map Pins */}
      <HeroPins />

      {/* Floating 3D Car */}
      <HeroCar />

      {/* Glassmorphic Stats stickers */}
      <HeroStats />

      {/* Top Left Poster Card Overlay */}
      <div className="absolute top-[8%] left-[6%] z-40 max-w-[360px] bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-md rounded-2xl p-6 shadow-[0_16px_40px_rgba(0,0,0,0.3)] border border-white/20 dark:border-slate-800 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        <span className="text-xs font-black text-blue-600 dark:text-blue-400 tracking-widest uppercase">
          Launching Our
        </span>
        <h1 className="text-3xl font-black text-[#2B317A] dark:text-white tracking-tight mt-1 leading-none">
          Mobility Services
        </h1>
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-3 leading-snug">
          Where Safety Meets Reliability.
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Safe, robust and on-time rides for a better city.
        </p>
      </div>

      {/* Bottom Horizontal Curved Features Panel */}
      <div className="absolute bottom-0 left-0 w-full bg-white/95 dark:bg-[#0F172A]/95 border-t border-slate-100 dark:border-slate-800/80 p-6 z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] rounded-t-[2rem]">
        <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Column 1: Safety */}
          <div className="flex gap-3">
            <div className="p-2 h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#2B317A] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Safety
              </h4>
              <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-0.5 leading-snug">
                Your safety is our top priority
              </p>
            </div>
          </div>

          {/* Column 2: On Time */}
          <div className="flex gap-3">
            <div className="p-2 h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#2B317A] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                On Time Service
              </h4>
              <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-0.5 leading-snug">
                Punctual rides for stressless trips.
              </p>
            </div>
          </div>

          {/* Column 3: Background Checked */}
          <div className="flex gap-3">
            <div className="p-2 h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#2B317A] dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider text-ellipsis overflow-hidden whitespace-nowrap">
                Background Checked
              </h4>
              <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-0.5 leading-snug">
                Every driver undergoes detailed vetting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default AuthHero
