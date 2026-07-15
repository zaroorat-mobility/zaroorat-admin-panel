import React from 'react'
import { Drawer } from '../ui/Drawer'

export interface ViewDrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export const ViewDrawer: React.FC<ViewDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) => {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={title} footer={footer} size={size}>
      <div className="space-y-6">{children}</div>
    </Drawer>
  )
}
export default ViewDrawer
