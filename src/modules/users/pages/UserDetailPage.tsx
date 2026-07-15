import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card'
import { Badge } from '@/shared/components/ui/Badge'
import { StatusBadge } from '@/shared/components/StatusBadge'

export const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: user, isLoading } = useUser(id || '')

  // Fallback demo user
  const demoDetails = {
    id: id || '1',
    name: 'Alok Sharma',
    email: 'alok.sharma@zaroorat.in',
    phone: '9876543210',
    role: 'admin' as const,
    status: 'active' as const,
    lastLogin: '2026-07-14T21:40:00Z',
    permissions: ['users.read', 'users.write', 'drivers.read', 'riders.read'],
  }

  const activeUser = user ?? demoDetails

  return (
    <PageWrapper>
      <PageHeader
        title={`User: ${activeUser.name}`}
        description="View access records and administrative details."
        onBack={() => navigate('/users')}
      />

      {isLoading && !user ? (
        <p className="text-slate-500">Loading user metadata...</p>
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
                    <p className="font-semibold text-slate-800 dark:text-dark-100 mt-1">{activeUser.name}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase text-slate-400">Email Address</span>
                    <p className="font-semibold text-slate-800 dark:text-dark-100 mt-1">{activeUser.email}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase text-slate-400">Contact Number</span>
                    <p className="font-semibold text-slate-800 dark:text-dark-100 mt-1">{activeUser.phone}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase text-slate-400">Last System Access</span>
                    <p className="font-semibold text-slate-800 dark:text-dark-100 mt-1">
                      {new Date(activeUser.lastLogin).toLocaleString()}
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
                    <StatusBadge status={activeUser.status} />
                  </div>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400">Assigned Privilege Permissions</span>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {activeUser.permissions.map((perm) => (
                      <Badge key={perm} variant="secondary">
                        {perm}
                      </Badge>
                    ))}
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
