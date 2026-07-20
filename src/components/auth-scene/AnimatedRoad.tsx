import React from 'react'
import { motion } from 'framer-motion'

export const AnimatedRoad: React.FC = () => {
  // Perspective road: wide at bottom (footer), narrows behind car
  // Car is at ~top-[62vh] left-[32vw], width ~34vw
  // Road spans from footer (~90vh) to below the car (~68vh)
  // SVG viewBox represents this region

  return (
    <div className="absolute top-[58vh] left-[8vw] w-[48vw] h-[34vh] select-none pointer-events-none z-15">
      <svg
        viewBox="0 0 500 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        {/* ── Perspective Road Outline Lines ─────────────────────────── */}
        {/* Left edge: narrows from bottom-left (0,300) to top-center-left (185,0) */}
        <line x1="0" y1="300" x2="185" y2="0" stroke="#2B317A" strokeWidth="2" strokeOpacity="0.55" />

        {/* Right edge: narrows from bottom-right (500,300) to top-center-right (315,0) */}
        <line x1="500" y1="300" x2="315" y2="0" stroke="#2B317A" strokeWidth="2" strokeOpacity="0.55" />

        {/* Optional soft inner shoulder lines for depth */}
        <line x1="80" y1="300" x2="210" y2="0" stroke="#2B317A" strokeWidth="1" strokeOpacity="0.2" />
        <line x1="420" y1="300" x2="290" y2="0" stroke="#2B317A" strokeWidth="1" strokeOpacity="0.2" />

        {/* ── Animated Center Dashes ──────────────────────────────────── */}
        {/* These animate their y offset downward to simulate forward motion */}

        {/* Dash segment 1 */}
        <motion.line
          x1="250" y1="15" x2="250" y2="45"
          stroke="#2B317A" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8"
          animate={{ y: [0, 60, 120, 180, 240], opacity: [0, 1, 1, 0.5, 0] }}
          transition={{ duration: 1.4, ease: "linear", repeat: Infinity, delay: 0 }}
        />

        {/* Dash segment 2 */}
        <motion.line
          x1="250" y1="15" x2="250" y2="45"
          stroke="#2B317A" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8"
          animate={{ y: [0, 60, 120, 180, 240], opacity: [0, 1, 1, 0.5, 0] }}
          transition={{ duration: 1.4, ease: "linear", repeat: Infinity, delay: 0.35 }}
        />

        {/* Dash segment 3 */}
        <motion.line
          x1="250" y1="15" x2="250" y2="45"
          stroke="#2B317A" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8"
          animate={{ y: [0, 60, 120, 180, 240], opacity: [0, 1, 1, 0.5, 0] }}
          transition={{ duration: 1.4, ease: "linear", repeat: Infinity, delay: 0.7 }}
        />

        {/* Dash segment 4 */}
        <motion.line
          x1="250" y1="15" x2="250" y2="45"
          stroke="#2B317A" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8"
          animate={{ y: [0, 60, 120, 180, 240], opacity: [0, 1, 1, 0.5, 0] }}
          transition={{ duration: 1.4, ease: "linear", repeat: Infinity, delay: 1.05 }}
        />
      </svg>
    </div>
  )
}
export default AnimatedRoad
