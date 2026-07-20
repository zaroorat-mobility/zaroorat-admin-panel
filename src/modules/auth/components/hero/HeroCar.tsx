import React from 'react'
import { heroCar } from '@/assets/images/auth'

export const HeroCar: React.FC = () => {
  return (
    <div className="absolute top-[42%] left-[53%] -translate-x-1/2 -translate-y-1/2 w-[60%] max-w-[420px] select-none pointer-events-none z-10">
      <div className="animate-float-car">
        <img 
          src={heroCar} 
          alt="Zaroorat Hero Car" 
          className="w-full h-auto object-contain drop-shadow-[0_25px_30px_rgba(43,49,122,0.4)]" 
        />
      </div>
    </div>
  )
}
