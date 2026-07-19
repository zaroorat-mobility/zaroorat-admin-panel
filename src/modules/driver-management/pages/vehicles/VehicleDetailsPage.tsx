import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useVehicle } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { ExpiryIndicator } from '../../components/ExpiryIndicator'
import { User, AlertTriangle } from 'lucide-react'
import { logAuditAction } from '@/shared/services/auditLogger'

export const VehicleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: detail, isLoading, isError } = useVehicle(id || '')

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center p-12 text-slate-500 font-medium">
          Loading Vehicle Details...
        </div>
      </PageWrapper>
    )
  }

  if (isError || !detail) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <AlertTriangle className="h-12 w-12 text-slate-400" />
          <h3 className="text-base font-bold text-text-primary">Vehicle Profile Not Found</h3>
          <Button onClick={() => navigate('/driver-management/vehicles')}>Back to List</Button>
        </div>
      </PageWrapper>
    )
  }

  const { vehicle, driver } = detail

  return (
    <PageWrapper>
      <PageHeader
        title={`Vehicle Profile: ${vehicle.registrationPlate}`}
        description="Verify fleet partner registered vehicle, policy certifications and associated operator details."
        onBack={() => navigate('/driver-management/vehicles')}
        actions={
          <Button
            variant="outline"
            className="text-xs font-semibold h-9 rounded-lg border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-400 dark:hover:bg-amber-950/20"
            onClick={() => {
              logAuditAction(
                'Vehicle Flagged for Renewal',
                `Vehicle plate: ${vehicle.registrationPlate}. Flagged commercial certifications for audit renewal.`,
                vehicle.id,
                'vehicle'
              )
              alert('Vehicle documents successfully flagged for operational renewal. Driver partner will receive a system alert.')
            }}
          >
            Flag for Renewal
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-6">
        
        {/* Left main info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="premium-card text-left">
            <CardHeader>
              <CardTitle>Fleet Specs Identification</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <p><span className="text-slate-500 font-medium">Vehicle Class Type:</span> <strong className="uppercase">{vehicle.vehicleType}</strong></p>
              <p><span className="text-slate-500 font-medium">Category:</span> <strong>{vehicle.vehicleCategory || '—'}</strong></p>
              <p><span className="text-slate-500 font-medium">Brand & Model:</span> <strong>{vehicle.brand} {vehicle.model}</strong></p>
              <p><span className="text-slate-500 font-medium">Plate Number:</span> <strong className="uppercase">{vehicle.registrationPlate}</strong></p>
              <p><span className="text-slate-500 font-medium">Seats Capacity:</span> <strong>{vehicle.seatsCapacity} Seats</strong></p>
              <p><span className="text-slate-500 font-medium">Exterior Color:</span> <strong>{vehicle.color || '—'}</strong></p>
              <p><span className="text-slate-500 font-medium">Manufacturing Year:</span> <strong>{vehicle.manufacturingYear || '—'}</strong></p>
              <p><span className="text-slate-500 font-medium">RC Number:</span> <strong>{vehicle.rcNumber || '—'}</strong></p>
            </CardContent>
          </Card>

          <Card className="premium-card text-left">
            <CardHeader>
              <CardTitle>Insurance & Permits Expiry Indicators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Insurance Policy Cover', docNo: vehicle.insuranceNo, exp: vehicle.insuranceExpiry },
                { label: 'Commercial Road Permit', docNo: vehicle.permitNo, exp: vehicle.permitExpiry },
                { label: 'Pollution Certificate (PUC)', docNo: vehicle.pollutionNo, exp: vehicle.pollutionExpiry },
                ...(vehicle.fitnessNo ? [{ label: 'Fitness Certificate', docNo: vehicle.fitnessNo, exp: vehicle.fitnessExpiry }] : []),
              ].map((item, index) => (
                <div key={index} className="p-3.5 border border-border rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.label}</p>
                    <p className="text-[10px] text-slate-450 mt-0.5">Ref No: {item.docNo || '—'}</p>
                  </div>
                  <ExpiryIndicator expiryDate={item.exp} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right associated driver details */}
        <div className="space-y-6">
          <Card className="premium-card text-left">
            <CardHeader>
              <CardTitle>Associated Driver Partner</CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex gap-4 items-center">
              <div className="h-14 w-14 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-border flex items-center justify-center flex-shrink-0">
                {driver.profilePhotoUrl ? (
                  <img src={driver.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-6 w-6 text-slate-350" />
                )}
              </div>
              <div className="space-y-1 truncate">
                <h4
                  className="font-bold text-slate-800 dark:text-slate-100 hover:underline cursor-pointer truncate"
                  onClick={() => navigate(`/driver-management/drivers/${driver.id}`)}
                >
                  {driver.driverName}
                </h4>
                <p className="text-[10px] text-muted-foreground">{driver.mobileNumber}</p>
                <p className="text-[10px] text-primary hover:underline cursor-pointer" onClick={() => navigate(`/driver-management/drivers/${driver.id}`)}>
                  View Profile details
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </PageWrapper>
  )
}

export default VehicleDetailsPage
