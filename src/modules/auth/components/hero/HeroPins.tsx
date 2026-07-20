import React from 'react'
import { pinHome, pinOffice, pinAirport, pinSchool } from '@/assets/images/auth'

export const HeroPins: React.FC = () => {
  return (
    <div className="absolute inset-0 select-none pointer-events-none z-20">
      {/* Home Pin - Bottom Left */}
      <div 
        className="absolute top-[44%] left-[22%] w-[42px] animate-bounce-pin"
        style={{ animationDelay: '0s' }}
      >
        <img src={pinHome} alt="Home Pin" className="w-full h-auto object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.35)]" />
      </div>

      {/* Office Pin - Mid Left/Center */}
      <div 
        className="absolute top-[28%] left-[32%] w-[42px] animate-bounce-pin"
        style={{ animationDelay: '1.2s' }}
      >
        <img src={pinOffice} alt="Office Pin" className="w-full h-auto object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.35)]" />
      </div>

      {/* Airport Pin - Mid Right/Center */}
      <div 
        className="absolute top-[24%] left-[64%] w-[42px] animate-bounce-pin"
        style={{ animationDelay: '0.6s' }}
      >
        <img src={pinAirport} alt="Airport Pin" className="w-full h-auto object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.35)]" />
      </div>

      {/* School Pin - Bottom Right */}
      <div 
        className="absolute top-[48%] left-[78%] w-[42px] animate-bounce-pin"
        style={{ animationDelay: '1.8s' }}
      >
        <img src={pinSchool} alt="School Pin" className="w-full h-auto object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.35)]" />
      </div>
    </div>
  )
}
