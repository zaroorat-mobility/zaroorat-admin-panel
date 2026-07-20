import React from 'react'
import { motion } from 'framer-motion'

export const MotionLines: React.FC = () => {
  return (
    <div className="absolute top-[52vh] left-[4vw] w-[60vw] h-[140px] select-none pointer-events-none z-10">
      <svg 
        viewBox="0 0 800 140" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        {/* Motion Line 1 - Upper stream */}
        <motion.path 
          d="M 0 30 L 120 30" 
          stroke="#2B317A" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          strokeOpacity="0.45"
          animate={{
            x: [-150, 950],
            opacity: [0, 0.8, 0.8, 0]
          }}
          transition={{
            duration: 1.6,
            ease: "linear",
            repeat: Infinity,
            delay: 0
          }}
        />

        {/* Motion Line 2 - Mid stream (aligned with car center) */}
        <motion.path 
          d="M 0 70 L 180 70" 
          stroke="#2B317A" 
          strokeWidth="2" 
          strokeLinecap="round"
          strokeOpacity="0.5"
          animate={{
            x: [-200, 900],
            opacity: [0, 0.9, 0.9, 0]
          }}
          transition={{
            duration: 1.2,
            ease: "linear",
            repeat: Infinity,
            delay: 0.4
          }}
        />

        {/* Motion Line 3 - Lower stream */}
        <motion.path 
          d="M 0 110 L 100 110" 
          stroke="#2B317A" 
          strokeWidth="1.8" 
          strokeLinecap="round"
          strokeOpacity="0.4"
          animate={{
            x: [-120, 980],
            opacity: [0, 0.7, 0.7, 0]
          }}
          transition={{
            duration: 2.0,
            ease: "linear",
            repeat: Infinity,
            delay: 0.8
          }}
        />

        {/* Motion Line 4 - Short high-speed streak */}
        <motion.path 
          d="M 0 50 L 70 50" 
          stroke="#2B317A" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          strokeOpacity="0.6"
          animate={{
            x: [-100, 920],
            opacity: [0, 1, 1, 0]
          }}
          transition={{
            duration: 0.9,
            ease: "linear",
            repeat: Infinity,
            delay: 0.2
          }}
        />
      </svg>
    </div>
  )
}
export default MotionLines
