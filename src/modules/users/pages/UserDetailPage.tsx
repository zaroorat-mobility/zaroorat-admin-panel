import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { roleDisplayName } from '@/infrastructure/permissions'

export const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: user, isLoading, isError } = useUser(id || '')

  return (
    <PageWrapper>
      <PageHeader
        title={user ? `User: ${user.name}` : 'User'}
        description="View access records and administrative details."
        onBack={() => navigate('/access-control/users')}
      />

      {isLoading ? (
        <p className="text-slate-500">Loading user metadata...</p>
      ) : isError || !user ? (
        <p className="text-slate-500">This administrative user could not be found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs font-semibold uppercase text-slate-400">Full Name</span>
                    <p className="font-semibold text-slate-800 dark:text-dark-100 mt-1">{user.name}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase text-slate-400">Email Address</span>
                    <p className="font-semibold text-slate-800 dark:text-dark-100 mt-1">{user.email}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase text-slate-400">Contact Number</span>
                    <p className="font-semibold text-slate-800 dark:text-dark-100 mt-1">{user.phone}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase text-slate-400">Created</span>
                    <p className="font-semibold text-slate-800 dark:text-dark-100 mt-1">
                      {user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase text-slate-400">Last login</span>
                    <p className="font-semibold text-slate-800 dark:text-dark-100 mt-1">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Status & Access Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400">Account Status</span>
                  <div className="mt-2">
                    <StatusBadge status={user.status} />
                  </div>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400">Role</span>
                  <p className="font-semibold mt-2">{roleDisplayName(user.role)}</p>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">{user.role}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400">Assigned Privilege Permissions</span>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {user.permissions.length === 0 ? (
                      <span className="text-sm text-slate-500">No extra permissions mapped</span>
                    ) : (
                      user.permissions.map((perm) => (
                        <Badge key={perm} variant="secondary">
                          {perm}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
export default UserDetailPage
