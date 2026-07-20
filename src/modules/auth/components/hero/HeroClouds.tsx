import React from 'react'
import { cloud1, cloud2, cloud3 } from '@/assets/images/auth'

export const HeroClouds: React.FC = () => {
  return (
    <div className="absolute inset-0 select-none pointer-events-none z-0 overflow-hidden">
      {/* Cloud 1 - Top Left */}
      <div className="absolute top-[12%] left-[8%] w-[150px] opacity-60 animate-float-cloud-1">
        <img src={cloud1} alt="Cloud Left" className="w-full h-auto object-contain mix-blend-lighten" />
      </div>

      {/* Cloud 2 - Top Right */}
      <div className="absolute top-[18%] right-[15%] w-[180px] opacity-50 animate-float-cloud-2">
        <img src={cloud2} alt="Cloud Right" className="w-full h-auto object-contain mix-blend-lighten" />
      </div>

      {/* Cloud 3 - Mid Right (closer depth) */}
      <div className="absolute top-[45%] right-[6%] w-[130px] opacity-40 animate-float-cloud-3">
        <img src={cloud3} alt="Cloud Middle" className="w-full h-auto object-contain mix-blend-lighten" />
      </div>
      
      {/* Cloud 4 - Bottom Left (background depth) */}
      <div className="absolute bottom-[30%] left-[5%] w-[110px] opacity-35 animate-float-cloud-2">
        <img src={cloud1} alt="Cloud Lower" className="w-full h-auto object-contain mix-blend-lighten" />
      </div>
    </div>
  )
}
