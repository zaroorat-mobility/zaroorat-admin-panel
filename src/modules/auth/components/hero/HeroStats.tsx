import React from 'react'
import { Car, Users, Globe } from 'lucide-react'

export const HeroStats: React.FC = () => {
  return (
    <div className="absolute inset-0 select-none pointer-events-none z-30 font-sans">
      {/* Card 1 - Top Left */}
      <div className="absolute top-[26%] left-[6%] animate-float-card-1 pointer-events-auto">
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-4 shadow-[0_12px_24px_rgba(0,0,0,0.25)] flex items-center gap-3.5 max-w-[200px] transition-transform duration-300 hover:scale-105">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/20">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-white tracking-tight leading-none">5,000+</div>
            <div className="text-[10px] text-slate-300 font-semibold tracking-wider uppercase mt-1">Daily Rides</div>
          </div>
        </div>
      </div>

      {/* Card 2 - Bottom Left */}
      <div className="absolute bottom-[24%] left-[10%] animate-float-card-2 pointer-events-auto">
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-4 shadow-[0_12px_24px_rgba(0,0,0,0.25)] flex items-center gap-3.5 max-w-[200px] transition-transform duration-300 hover:scale-105">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-white tracking-tight leading-none">120+</div>
            <div className="text-[10px] text-slate-300 font-semibold tracking-wider uppercase mt-1">Drivers Online</div>
          </div>
        </div>
      </div>

      {/* Card 3 - Mid Right */}
      <div className="absolute top-[48%] right-[8%] animate-float-card-1 pointer-events-auto">
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-4 shadow-[0_12px_24px_rgba(0,0,0,0.25)] flex items-center gap-3.5 max-w-[200px] transition-transform duration-300 hover:scale-105">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/20">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-white tracking-tight leading-none">15+</div>
            <div className="text-[10px] text-slate-300 font-semibold tracking-wider uppercase mt-1">Cities Covered</div>
          </div>
        </div>
      </div>
    </div>
  )
}
