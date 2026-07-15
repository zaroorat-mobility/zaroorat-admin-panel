import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRider } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card'
import { StatusBadge } from '@/shared/components/StatusBadge'

export const RiderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: rider, isLoading } = useRider(id || '')

  const demoDetails = {
    id: id || 'r1',
    name: 'Kabir Dev',
    email: 'kabir.dev@gmail.com',
    phone: '9887766554',
    rating: 4.8,
    totalRides: 42,
    status: 'active' as const,
    joinedDate: '2026-01-15T00:00:00Z',
    walletBalance: 450.5,
    emergencyContact: '9887766500 (Wife)',
  }

  const activeRider = rider ?? demoDetails

  return (
    <PageWrapper>
      <PageHeader
        title={`Rider: ${activeRider.name}`}
        description="Review customer profile metrics and trip parameters."
        onBack={() => navigate('/riders')}
      />

      {isLoading && !rider ? (
        <p className="text-slate-500">Loading rider profile...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Rider Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs font-semibold uppercase text-slate-400">Customer Name</span>
                    <p className="font-semibold text-slate-800 dark:text-dark-100 mt-1">{activeRider.name}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase text-slate-400">Email Reference</span>
                    <p className="font-semibold text-slate-800 dark:text-dark-100 mt-1">{activeRider.email}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase text-slate-400">Phone Contact</span>
                    <p className="font-semibold text-slate-800 dark:text-dark-100 mt-1">{activeRider.phone}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase text-slate-400">Emergency Phone Contact</span>
                    <p className="font-semibold text-slate-800 dark:text-dark-100 mt-1">
                      {activeRider.emergencyContact || 'Not Provided'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400">Account status</span>
                  <div className="mt-2">
                    <StatusBadge status={activeRider.status} />
                  </div>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400">Wallet balance</span>
                  <p className="text-lg font-bold text-slate-850 dark:text-dark-100 mt-1">
                    ₹{activeRider.walletBalance.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400">Joined Platform</span>
                  <p className="text-sm font-semibold text-slate-700 dark:text-dark-200 mt-1">
                    {new Date(activeRider.joinedDate).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
export default RiderDetailPage
