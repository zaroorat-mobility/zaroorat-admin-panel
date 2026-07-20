import React from 'react'
import { motion } from 'framer-motion'
import heroVehicles from '@/assets/images/auth/hero-vehicles.png'

export const HeroCar: React.FC = () => {
  return (
    <div className="absolute top-[62vh] left-[32vw] -translate-x-1/2 -translate-y-1/2 w-[34vw] max-w-[500px] min-w-[280px] select-none pointer-events-none z-20">
      {/* Framer Motion float + suspension bounce */}
      <motion.div
        animate={{
          y: [0, -8, 2, -4, 0],
          rotate: [0, 0.5, -0.5, 0.3, 0]
        }}
        transition={{
          duration: 3.5,
          ease: "easeInOut",
          repeat: Infinity
        }}
        className="relative w-full"
      >
        {/* White Branded Vehicles Image */}
        <img 
          src={heroVehicles} 
          alt="Zaroorat Hero Vehicles" 
          className="w-full h-auto object-contain drop-shadow-[0_22px_28px_rgba(43,49,122,0.22)]" 
        />

        {/* Headlight Glow Layer (Pulsing Light Flare) */}
        <motion.div 
          className="absolute top-[51%] left-[3%] w-7 h-7 rounded-full bg-blue-300/40 blur-[10px] pointer-events-none"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity
          }}
        />
        <motion.div 
          className="absolute top-[51%] left-[3%] w-24 h-12 bg-gradient-to-r from-blue-300/25 to-transparent blur-[10px] origin-left -rotate-6 pointer-events-none"
          animate={{
            opacity: [0.2, 0.7, 0.2]
          }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity
          }}
        />

        {/* Brand Logo glow */}
        <motion.div 
          className="absolute top-[38%] right-[32%] w-8 h-8 rounded-full bg-blue-400/20 blur-[8px] pointer-events-none"
          animate={{
            opacity: [0.15, 0.55, 0.15]
          }}
          transition={{
            duration: 3.2,
            ease: "easeInOut",
            repeat: Infinity
          }}
        />
      </motion.div>
    </div>
  )
}
export default HeroCar
