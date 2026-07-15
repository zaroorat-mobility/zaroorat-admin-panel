import React from 'react'
import { cn } from '@/shared/utils'
import { IMAGES } from '@/assets'
import { Button } from '../ui/Button'

export interface NetworkErrorScreenProps {
  /** Override the default illustration */
  image?: string
  /** Main heading */
  title?: string
  /** Sub-copy */
  description?: string
  /** Retry button label */
  retryLabel?: string
  /** Retry callback */
  onRetry?: () => void
  /** Whether a retry is in progress */
  retrying?: boolean
  /** Extra wrapper className */
  className?: string
  /** Controls illustration height, default 200px */
  imageHeight?: number
}

/**
 * NetworkErrorScreen
 * Full-area error-state panel using the Something_went_wrong.png
 * illustration. Accepts an optional onRetry callback so pages can
 * re-trigger their data fetches without navigating away.
 */
export const NetworkErrorScreen: React.FC<NetworkErrorScreenProps> = ({
  image,
  title = 'Something Went Wrong',
  description = 'We ran into an unexpected error. Please check your connection and try again.',
  retryLabel = 'Try Again',
  onRetry,
  retrying = false,
  className,
  imageHeight = 200,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'min-h-[380px] p-10 rounded-xl',
        'border-2 border-dashed border-destructive/20 bg-destructive/[0.03]',
        className,
      )}
    >
      {/* Illustration */}
      <img
        src={image ?? IMAGES.somethingWentWrong}
        alt="Something went wrong"
        style={{ height: imageHeight, objectFit: 'contain' }}
        className="select-none pointer-events-none mb-6 opacity-90"
        draggable={false}
      />

      {/* Text */}
      <h3 className="text-[15px] font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-[13px] text-muted-foreground max-w-[340px] leading-relaxed mb-6">
        {description}
      </p>

      {/* Retry action */}
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          loading={retrying}
          icon={
            !retrying && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 4v6h6" />
                <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
              </svg>
            )
          }
        >
          {retryLabel}
        </Button>
      )}
    </div>
  )
}

export default NetworkErrorScreen
