import React from 'react'
import { motion } from 'framer-motion'

export const CityBackground: React.FC = () => {
  return (
    <div className="absolute inset-x-0 bottom-[36%] select-none pointer-events-none z-0 overflow-hidden h-[240px]">
      {/* ── LAYER 2: Modern City Skyline (10% Speed Parallax) ────────────────────── */}
      <motion.div 
        className="absolute bottom-12 left-[-15%] w-[130%] h-[120px] opacity-[0.25]"
        animate={{ x: [0, -40, 0] }}
        transition={{ duration: 40, ease: "easeInOut", repeat: Infinity }}
      >
        <svg 
          viewBox="0 0 1200 120" 
          fill="none" 
          stroke="#2B317A" 
          strokeWidth="1.8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-full h-full"
        >
          {/* Skyline Towers */}
          <rect x="50" y="30" width="45" height="90" />
          <rect x="95" y="10" width="55" height="110" />
          <line x1="122.5" y1="10" x2="122.5" y2="0" />
          <rect x="180" y="50" width="35" height="70" />
          <rect x="230" y="20" width="50" height="100" />
          <polygon points="230,20 255,5 280,20" />
          
          <rect x="340" y="40" width="45" height="80" />
          <rect x="385" y="15" width="50" height="105" />
          
          <rect x="500" y="30" width="40" height="90" />
          <rect x="540" y="5" width="60" height="115" />
          <line x1="570" y1="5" x2="570" y2="-5" />
          <rect x="620" y="45" width="35" height="75" />
          
          <rect x="710" y="25" width="50" height="95" />
          <polygon points="710,25 735,8 760,25" />
          <rect x="780" y="50" width="40" height="70" />
          
          <rect x="870" y="15" width="55" height="105" />
          <line x1="897.5" y1="15" x2="897.5" y2="5" />
          <rect x="925" y="40" width="35" height="80" />
          
          <rect x="1020" y="35" width="50" height="85" />
          <rect x="1070" y="10" width="45" height="110" />
        </svg>
      </motion.div>

      {/* ── LAYER 3: Suburban Houses & Trees (20% Speed Parallax) ───────────────── */}
      <motion.div 
        className="absolute bottom-0 left-[-15%] w-[130%] h-[90px] opacity-[0.4]"
        animate={{ x: [0, -80, 0] }}
        transition={{ duration: 25, ease: "easeInOut", repeat: Infinity }}
      >
        <svg 
          viewBox="0 0 1200 90" 
          fill="none" 
          stroke="#2B317A" 
          strokeWidth="1.8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-full h-full"
        >
          {/* House 1 & Tree */}
          <rect x="60" y="40" width="50" height="50" />
          <polygon points="55,40 85,20 115,40" />
          <rect x="80" y="65" width="12" height="25" />
          <rect x="72" y="48" width="10" height="10" />
          <rect x="88" y="48" width="10" height="10" />
          {/* Tree */}
          <line x1="140" y1="90" x2="140" y2="60" />
          <circle cx="140" cy="50" r="15" />

          {/* House 2 */}
          <rect x="220" y="45" width="60" height="45" />
          <polygon points="215,45 250,22 285,45" />
          <rect x="245" y="65" width="12" height="25" />
          <rect x="232" y="52" width="10" height="10" />
          <rect x="258" y="52" width="10" height="10" />
          {/* Tree */}
          <line x1="310" y1="90" x2="310" y2="65" />
          <circle cx="310" cy="52" r="18" />

          {/* House 3 & Garage */}
          <rect x="420" y="40" width="50" height="50" />
          <polygon points="415,40 445,20 475,40" />
          <rect x="440" y="65" width="12" height="25" />
          <rect x="430" y="48" width="10" height="10" />
          <rect x="470" y="55" width="35" height="35" />
          <polygon points="465,55 487.5,42 510,55" />
          <rect x="477" y="68" width="20" height="22" strokeDasharray="3 3" />

          {/* House 4 */}
          <rect x="620" y="45" width="55" height="45" />
          <polygon points="615,45 647.5,23 680,45" />
          <rect x="642" y="65" width="12" height="25" />
          {/* Tree */}
          <line x1="710" y1="90" x2="710" y2="60" />
          <circle cx="710" cy="48" r="16" />

          {/* House 5 */}
          <rect x="800" y="40" width="50" height="50" />
          <polygon points="795,40 825,20 855,40" />
          <rect x="820" y="65" width="12" height="25" />
          {/* Trees */}
          <line x1="890" y1="90" x2="890" y2="65" />
          <circle cx="890" cy="52" r="14" />
          <line x1="920" y1="90" x2="920" y2="70" />
          <circle cx="920" cy="58" r="12" />

          {/* House 6 & Trees */}
          <rect x="1000" y="45" width="60" height="45" />
          <polygon points="995,45 1030,22 1065,45" />
          <rect x="1025" y="65" width="12" height="25" />
        </svg>
      </motion.div>
    </div>
  )
}
export default CityBackground
