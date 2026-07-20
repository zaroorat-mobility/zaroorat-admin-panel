import React from 'react'
import { roadCurve } from '@/assets/images/auth'

export const HeroRoad: React.FC = () => {
  return (
    <div className="absolute bottom-[22%] left-1/2 -translate-x-1/2 w-[110%] select-none pointer-events-none -z-10">
      <div className="relative w-full h-[220px]">
        {/* Road Texture Image */}
        <img 
          src={roadCurve} 
          alt="Road curve" 
          className="w-full h-full object-contain mix-blend-lighten opacity-80" 
        />

        {/* Animated glowing route path SVG overlaid on the curve */}
        <svg 
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1000 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base Route Path shadow glow */}
          <path
            d="M 100 160 Q 350 40, 650 140 T 900 110"
            stroke="#3B82F6"
            strokeWidth="6"
            strokeLinecap="round"
            className="opacity-40 blur-[4px]"
          />
          {/* Main glowing route path line */}
          <path
            d="M 100 160 Q 350 40, 650 140 T 900 110"
            stroke="url(#routeGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="16 12"
            className="animate-pulse-route"
          />

          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  )
}
