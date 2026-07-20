import React from 'react'
import { motion } from 'framer-motion'

export const Clouds: React.FC = () => {
  // Simple clean SVG path for outline clouds
  const CloudSVG = () => (
    <svg viewBox="0 0 180 100" fill="none" stroke="#2B317A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full opacity-40">
      <path d="M20 80 A 20 20 0 0 1 45 45 A 30 30 0 0 1 105 35 A 20 20 0 0 1 140 55 A 15 15 0 0 1 160 80 Z" />
    </svg>
  )

  // Simple clean SVG path for a line-art flapping bird
  const BirdSVG = () => (
    <svg viewBox="0 0 40 25" fill="none" stroke="#2B317A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full opacity-50">
      <motion.path 
        d="M 5 15 Q 15 2 20 12 Q 25 2 35 15"
        animate={{
          d: [
            "M 5 15 Q 15 2 20 12 Q 25 2 35 15",
            "M 5 7 Q 15 14 20 12 Q 25 14 35 7",
            "M 5 15 Q 15 2 20 12 Q 25 2 35 15"
          ]
        }}
        transition={{
          duration: 1.8,
          ease: "easeInOut",
          repeat: Infinity
        }}
      />
    </svg>
  )

  return (
    <div className="absolute inset-0 select-none pointer-events-none z-0 overflow-hidden">
      {/* Drifting Clouds (Layer 1 - 5% speed / long cycle) */}
      <motion.div 
        className="absolute top-[8%] left-[-10%] w-[130px] h-[70px]"
        animate={{ x: [0, 200, 0] }}
        transition={{ duration: 60, ease: "linear", repeat: Infinity }}
      >
        <CloudSVG />
      </motion.div>

      <motion.div 
        className="absolute top-[16%] right-[10%] w-[160px] h-[90px]"
        animate={{ x: [0, -150, 0] }}
        transition={{ duration: 80, ease: "linear", repeat: Infinity }}
      >
        <CloudSVG />
      </motion.div>

      <motion.div 
        className="absolute top-[28%] left-[25%] w-[110px] h-[60px]"
        animate={{ x: [0, 100, 0] }}
        transition={{ duration: 50, ease: "linear", repeat: Infinity }}
      >
        <CloudSVG />
      </motion.div>

      {/* Additional clouds on right side to fill empty area */}
      <motion.div 
        className="absolute top-[6%] right-[28%] w-[140px] h-[75px]"
        animate={{ x: [0, -120, 0] }}
        transition={{ duration: 70, ease: "linear", repeat: Infinity, delay: 8 }}
      >
        <CloudSVG />
      </motion.div>

      <motion.div 
        className="absolute top-[30%] right-[6%] w-[120px] h-[65px]"
        animate={{ x: [0, -100, 0] }}
        transition={{ duration: 55, ease: "linear", repeat: Infinity, delay: 15 }}
      >
        <CloudSVG />
      </motion.div>

      {/* Flapping Birds - Occasional drifting movement */}
      <motion.div 
        className="absolute top-[22%] left-[12%] w-7 h-5"
        animate={{ 
          y: [0, -6, 0],
          x: [0, 12, 0]
        }}
        transition={{ 
          duration: 6, 
          ease: "easeInOut", 
          repeat: Infinity 
        }}
      >
        <BirdSVG />
      </motion.div>

      <motion.div 
        className="absolute top-[12%] left-[45%] w-6 h-4"
        animate={{ 
          y: [0, -4, 0],
          x: [0, -8, 0]
        }}
        transition={{ 
          duration: 5, 
          ease: "easeInOut", 
          repeat: Infinity,
          delay: 1 
        }}
      >
        <BirdSVG />
      </motion.div>

      <motion.div 
        className="absolute top-[18%] left-[48%] w-5 h-3.5"
        animate={{ 
          y: [0, -5, 0],
          x: [0, -10, 0]
        }}
        transition={{ 
          duration: 5.5, 
          ease: "easeInOut", 
          repeat: Infinity,
          delay: 2.2 
        }}
      >
        <BirdSVG />
      </motion.div>

      {/* Extra birds on the right side */}
      <motion.div 
        className="absolute top-[10%] right-[18%] w-6 h-4"
        animate={{ 
          y: [0, -5, 0],
          x: [0, -10, 0]
        }}
        transition={{ 
          duration: 6.5, 
          ease: "easeInOut", 
          repeat: Infinity,
          delay: 3 
        }}
      >
        <BirdSVG />
      </motion.div>
    </div>
  )
}
export default Clouds
