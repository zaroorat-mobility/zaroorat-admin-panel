import React from 'react'
import { cn } from '@/shared/utils'

export interface InfinityLoaderProps {
  /** Size in px of the bounding box */
  size?: number
  /** Override stroke colour — defaults to brand primary */
  color?: string
  /** Optional label rendered below the animation */
  label?: string
  /** Extra wrapper classes */
  className?: string
  /** If true, centres inside a min-h-[50vh] flex container */
  centered?: boolean
}

/**
 * InfinityLoader
 * A silky, CSS-only animated ∞ symbol built with two SVG circles.
 * It uses stroke-dashoffset trick so it works at any size with zero
 * external dependencies.
 */
export const InfinityLoader: React.FC<InfinityLoaderProps> = ({
  size = 64,
  color = '#2B317A',
  label,
  className,
  centered = false,
}) => {
  const stroke = size * 0.09
  const r = (size * 0.28)
  const cx1 = size * 0.31
  const cx2 = size * 0.69
  const cy  = size * 0.5
  const circumference = 2 * Math.PI * r

  const inner = (
    <div
      className={cn('flex flex-col items-center justify-center gap-3', className)}
      role="status"
      aria-label={label ?? 'Loading…'}
    >
      {/* ── SVG infinity ─────────────────────────────────────────── */}
      <svg
        width={size}
        height={size * 0.56}
        viewBox={`0 0 ${size} ${size * 0.56}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <style>{`
          @keyframes _zarInfL {
            0%   { stroke-dashoffset: ${circumference}; }
            100% { stroke-dashoffset: ${-circumference}; }
          }
          @keyframes _zarInfR {
            0%   { stroke-dashoffset: ${-circumference}; }
            100% { stroke-dashoffset: ${circumference}; }
          }
          ._zar-inf-l {
            stroke-dasharray: ${circumference};
            stroke-dashoffset: ${circumference};
            animation: _zarInfL 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          ._zar-inf-r {
            stroke-dasharray: ${circumference};
            stroke-dashoffset: ${-circumference};
            animation: _zarInfR 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          ._zar-inf-track {
            stroke-dasharray: ${circumference};
          }
        `}</style>

        {/* Track circles (faint) */}
        <circle
          className="_zar-inf-track"
          cx={cx1}
          cy={cy}
          r={r}
          stroke={color}
          strokeOpacity="0.12"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
        />
        <circle
          className="_zar-inf-track"
          cx={cx2}
          cy={cy}
          r={r}
          stroke={color}
          strokeOpacity="0.12"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
        />

        {/* Animated arcs */}
        <circle
          className="_zar-inf-l"
          cx={cx1}
          cy={cy}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
        />
        <circle
          className="_zar-inf-r"
          cx={cx2}
          cy={cy}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
        />

        {/* Centre dot pulse */}
        <circle cx={size * 0.5} cy={cy} r={stroke * 0.6} fill={color}>
          <animate
            attributeName="r"
            values={`${stroke * 0.4};${stroke * 0.9};${stroke * 0.4}`}
            dur="1.6s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
          />
          <animate
            attributeName="opacity"
            values="0.6;1;0.6"
            dur="1.6s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>

      {/* Optional label */}
      {label && (
        <p className="text-[13px] font-medium text-muted-foreground tracking-wide animate-pulse">
          {label}
        </p>
      )}
    </div>
  )

  if (centered) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] w-full">
        {inner}
      </div>
    )
  }
  return inner
}

export default InfinityLoader
