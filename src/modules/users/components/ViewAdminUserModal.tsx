import React from 'react'
import { User, Edit3 } from 'lucide-react'
import { Modal } from '@/shared/components/ui/Modal'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { roleDisplayName } from '@/infrastructure/permissions'
import { useUser } from '../hooks'
import type { UserEntity } from '../types'

export interface ViewAdminUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserEntity | null
  onEdit?: (user: UserEntity) => void
}

export const ViewAdminUserModal: React.FC<ViewAdminUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onEdit,
}) => {
  const { data: userDetails, isLoading } = useUser(isOpen && user ? user.id : '')
  const fullUser = userDetails || user

  if (!isOpen || !user) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Admin User Details"
    >
      <div className="space-y-5 text-left">
        {/* Banner with Icon & Context */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-dark-800/60 border border-slate-200/80 dark:border-dark-700/80">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                {fullUser?.name || 'Administrative Staff'}
              </h4>
              {fullUser?.status && <StatusBadge status={fullUser.status} />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Role: <span className="font-semibold text-slate-700 dark:text-slate-200">{fullUser ? roleDisplayName(fullUser.role) : '—'}</span>
            </p>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200/80 dark:border-dark-700/80 bg-white dark:bg-dark-900/50">
          <div className="space-y-1">
            <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Full Name
            </span>
            <p className="text-sm font-semibold text-slate-900 dark:text-dark-50">
              {fullUser?.name || '—'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Email Address
            </span>
            <p className="text-sm font-semibold text-slate-900 dark:text-dark-50 truncate">
              {fullUser?.email || '—'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Contact Phone
            </span>
            <p className="text-sm font-semibold text-slate-900 dark:text-dark-50">
              {fullUser?.phone || '—'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              System Role
            </span>
            <p className="text-sm font-semibold text-primary">
              {fullUser ? roleDisplayName(fullUser.role) : '—'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Account Created
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              {fullUser?.createdAt
                ? new Date(fullUser.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                : '—'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Last Login
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              {fullUser?.lastLogin
                ? new Date(fullUser.lastLogin).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                : 'Never'}
            </p>
          </div>
        </div>

        {/* Assigned Privilege Permissions */}
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-dark-700/80 bg-slate-50/50 dark:bg-dark-900/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Assigned Permissions
            </span>
            {isLoading && (
              <span className="text-[10px] text-muted-foreground animate-pulse">Loading permissions...</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
            {userDetails?.permissions && userDetails.permissions.length > 0 ? (
              userDetails.permissions.map((perm) => (
                <Badge
                  key={perm}
                  variant="secondary"
                  className="font-mono text-[11px] px-2.5 py-0.5 bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300"
                >
                  {perm}
                </Badge>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                {isLoading
                  ? 'Fetching permissions...'
                  : 'Standard role-based permissions granted by system policy.'}
              </p>
            )}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-dark-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="px-5 font-medium"
          >
            Close
          </Button>
          {onEdit && (
            <Button
              type="button"
              onClick={() => {
                onClose()
                onEdit(fullUser)
              }}
              className="gap-2 px-5 font-medium shadow-sm hover:shadow"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit user</span>
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default ViewAdminUserModal
