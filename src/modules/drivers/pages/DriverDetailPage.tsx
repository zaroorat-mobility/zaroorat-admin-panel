import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDriver } from '../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { ShieldCheck, ShieldAlert, Star, Wallet, Calendar, AlertCircle } from 'lucide-react'

export const DriverDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: driver, isLoading } = useDriver(id || '')

  const demoDetails = {
    id: id || 'd1',
    name: 'Rajesh Kumar',
    email: 'rajesh.k@gmail.com',
    phone: '9765432101',
    vehicleType: 'Sedan Cab' as const,
    vehicleNumber: 'MH-12-PQ-4567',
    status: 'approved' as const,
    rating: 4.9,
    licenseNumber: 'DL-MH1220150045612',
    walletBalance: 1250.75,
    aadhaarVerified: true,
    panVerified: true,
    joinedDate: '2026-01-12T00:00:00Z',
    documentsUrl: {
      license: '#',
      rc: '#',
    },
    stats: {
      tripsCompleted: 154,
      cancelledTrips: 3,
      earningsTotal: 48500,
    },
  }

  const activeDriver = driver ?? demoDetails

  return (
    <PageWrapper>
      <PageHeader
        title={`Driver Profile: ${activeDriver.name}`}
        description="Verify compliance checks, personal data details, and earnings history parameters."
        onBack={() => navigate('/drivers')}
      />

      {isLoading && !driver ? (
        <p className="text-slate-500">Loading driver details...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* PROFILE CARD & VERIFICATION STATUS */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl mx-auto border border-primary/20">
                  {activeDriver.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">{activeDriver.name}</h3>
                  <p className="text-xs text-text-secondary mt-1">{activeDriver.vehicleNumber}</p>
                </div>
                <div className="flex justify-center">
                  <StatusBadge status={activeDriver.status} />
                </div>
                <div className="flex justify-center items-center gap-6 pt-4 border-t border-border text-xs">
                  <div className="text-center">
                    <p className="text-text-secondary font-medium">Rating</p>
                    <p className="font-bold text-text-primary mt-1 flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      <span>{activeDriver.rating.toFixed(1)}</span>
                    </p>
                  </div>
                  <div className="h-6 w-px bg-brand-border" />
                  <div className="text-center">
                    <p className="text-text-secondary font-medium">Joined Platform</p>
                    <p className="font-bold text-text-primary mt-1">
                      {new Date(activeDriver.joinedDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Checks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-xs p-1">
                  <div className="flex items-center gap-2">
                    {activeDriver.aadhaarVerified ? (
                      <ShieldCheck className="h-4.5 w-4.5 text-success" />
                    ) : (
                      <ShieldAlert className="h-4.5 w-4.5 text-warning" />
                    )}
                    <span className="font-semibold">Aadhaar Verification</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-success">Verified</span>
                </div>
                <div className="flex items-center justify-between text-xs p-1">
                  <div className="flex items-center gap-2">
                    {activeDriver.panVerified ? (
                      <ShieldCheck className="h-4.5 w-4.5 text-success" />
                    ) : (
                      <ShieldAlert className="h-4.5 w-4.5 text-warning" />
                    )}
                    <span className="font-semibold">PAN Card Verification</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-success">Verified</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PERSONAL & VEHICLE INFORMATION */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-xs">
                    <span className="font-semibold text-text-secondary uppercase">Email Reference</span>
                    <p className="font-bold text-text-primary mt-1">{activeDriver.email}</p>
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-text-secondary uppercase">Phone Number</span>
                    <p className="font-bold text-text-primary mt-1">{activeDriver.phone}</p>
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-text-secondary uppercase">Driving License</span>
                    <p className="font-bold text-text-primary mt-1">{activeDriver.licenseNumber}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-xs">
                    <span className="font-semibold text-text-secondary uppercase">Vehicle Type</span>
                    <p className="font-bold text-text-primary mt-1">{activeDriver.vehicleType}</p>
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-text-secondary uppercase">Registration Number</span>
                    <p className="font-bold text-text-primary mt-1 uppercase">{activeDriver.vehicleNumber}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIDE STATISTICS */}
            <Card>
              <CardHeader>
                <CardTitle>Operating Statistics</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-brand-border text-center space-y-1">
                  <span className="font-semibold text-text-secondary">Completed Trips</span>
                  <p className="text-lg font-bold text-text-primary">{activeDriver.stats.tripsCompleted}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-brand-border text-center space-y-1">
                  <span className="font-semibold text-text-secondary">Cancelled Trips</span>
                  <p className="text-lg font-bold text-text-primary">{activeDriver.stats.cancelledTrips}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-brand-border text-center space-y-1">
                  <span className="font-semibold text-text-secondary">Total Earnings</span>
                  <p className="text-lg font-bold text-text-primary">₹{activeDriver.stats.earningsTotal.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* DOCUMENTS */}
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documentation</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-border rounded-xl flex items-center justify-between">
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-text-primary">Driver License</p>
                    <a href={activeDriver.documentsUrl.license} className="text-[11px] text-primary hover:underline font-semibold block">
                      Download PDF Document
                    </a>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-success" />
                </div>
                <div className="p-4 border border-border rounded-xl flex items-center justify-between">
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-text-primary">Registration Certificate (RC)</p>
                    <a href={activeDriver.documentsUrl.rc} className="text-[11px] text-primary hover:underline font-semibold block">
                      Download PDF Document
                    </a>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-success" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
export default DriverDetailPage
