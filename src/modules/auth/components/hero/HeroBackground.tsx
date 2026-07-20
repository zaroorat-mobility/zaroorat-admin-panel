import React from 'react'

export const HeroBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-[#0F1235] overflow-hidden -z-20">
      {/* Blurred radial gradients behind the scene */}
      <div 
        className="absolute top-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-blue-600/25 blur-[120px] animate-pulse-glow"
        style={{ animationDelay: '0s' }}
      />
      <div 
        className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] rounded-full bg-indigo-500/20 blur-[130px] animate-pulse-glow"
        style={{ animationDelay: '3s' }}
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-purple-600/15 blur-[150px] animate-pulse-glow"
        style={{ animationDelay: '1.5s' }}
      />
      
      {/* Abstract Grid Backdrop */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:40px_40px]" />
    </div>
  )
}
