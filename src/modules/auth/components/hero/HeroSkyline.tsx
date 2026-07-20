import React from 'react'
import { citySkyline } from '@/assets/images/auth'

export const HeroSkyline: React.FC = () => {
  return (
    <div className="absolute bottom-[15%] left-[-10%] w-[120%] opacity-40 select-none pointer-events-none -z-15">
      <div className="animate-parallax">
        <img 
          src={citySkyline} 
          alt="City Skyline" 
          className="w-full h-auto object-contain max-h-[280px] md:max-h-[380px] mix-blend-lighten" 
        />
      </div>
    </div>
  )
}
