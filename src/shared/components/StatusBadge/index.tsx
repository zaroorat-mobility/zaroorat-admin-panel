import React from 'react'
import { Badge } from '../ui/Badge'

export type AppStatus =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled'
  | 'ongoing'
  | 'verified'
  | 'unverified'
  | 'suspended'

export interface StatusBadgeProps {
  status: AppStatus | string
  customLabel?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, customLabel }) => {
  const normalized = status.toLowerCase() as AppStatus

  const badgeMap: Record<
    AppStatus,
    { variant: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'; label: string }
  > = {
    active: { variant: 'success', label: 'Active' }, // Mapped to success (green) per latest requirement
    inactive: { variant: 'neutral', label: 'Inactive' },
    suspended: { variant: 'neutral', label: 'Suspended' }, // Gray
    pending: { variant: 'warning', label: 'Pending' }, // Amber
    approved: { variant: 'success', label: 'Approved' }, // Green
    rejected: { variant: 'danger', label: 'Rejected' }, // Red
    completed: { variant: 'success', label: 'Completed' },
    cancelled: { variant: 'danger', label: 'Cancelled' },
    ongoing: { variant: 'info', label: 'Ongoing' },
    verified: { variant: 'info', label: 'Verified' }, // Mapped to info (blue) per latest requirement
    unverified: { variant: 'neutral', label: 'Unverified' },
  }

  const mapped = badgeMap[normalized] || { variant: 'neutral', label: status }

  return <Badge variant={mapped.variant}>{customLabel || mapped.label}</Badge>
}
export default StatusBadge
