import React from 'react'
import { cn } from '@/shared/utils'
import { IMAGES } from '@/assets'
import { Button } from '../ui/Button'

export interface NoDataScreenProps {
  /** Override the default illustration */
  image?: string
  /** Main heading */
  title?: string
  /** Sub-copy */
  description?: string
  /** CTA button label — rendered only when `onAction` is provided */
  actionLabel?: string
  /** CTA callback */
  onAction?: () => void
  /** Extra wrapper className */
  className?: string
  /** Controls illustration height, default 200px */
  imageHeight?: number
}

/**
 * NoDataScreen
 * Full-area empty-state panel using the No_data.png illustration from assets.
 * Accepts props so every consuming page can customise copy and the CTA.
 */
export const NoDataScreen: React.FC<NoDataScreenProps> = ({
  image,
  title = 'No Data Found',
  description = 'There is nothing to display here yet. Try adjusting your filters or adding new entries.',
  actionLabel,
  onAction,
  className,
  imageHeight = 200,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'min-h-[380px] p-10 rounded-xl',
        'border-2 border-dashed border-border bg-card/50',
        className,
      )}
    >
      {/* Illustration */}
      <img
        src={image ?? IMAGES.noData}
        alt="No data"
        style={{ height: imageHeight, objectFit: 'contain' }}
        className="select-none pointer-events-none mb-6 opacity-90"
        draggable={false}
      />

      {/* Text */}
      <h3 className="text-[15px] font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-[13px] text-muted-foreground max-w-[340px] leading-relaxed mb-6">
        {description}
      </p>

      {/* Optional action */}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export default NoDataScreen
