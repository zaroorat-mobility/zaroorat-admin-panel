import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDriver, useActivateDriver } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'

export const DriverEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: driver, isLoading } = useDriver(id || '')
  const { mutate: activate, isPending } = useActivateDriver()

  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')

  React.useEffect(() => {
    if (driver) {
      setName(driver.driverName)
      setEmail(driver.email || '')
      setPhone(driver.mobileNumber)
    }
  }, [driver])

  const handleSave = () => {
    activate({ id: id || '', notes: `Driver profile details edited manually: Name=${name}, Phone=${phone}` }, {
      onSuccess: () => navigate(`/driver-management/drivers/${id}`)
    })
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center p-12 text-slate-500 font-medium">
          Loading Driver Profile...
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <PageHeader
        title={`Edit Driver Profile: ${driver?.driverName}`}
        description="Quick edit driver account parameters."
        onBack={() => navigate(`/driver-management/drivers/${id}`)}
      />

      <Card className="rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden text-left max-w-xl mx-auto mt-6 bg-white dark:bg-slate-900">
        <CardHeader className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-[16px] font-bold text-[#1F2B6D] dark:text-white">Edit Partner Information</CardTitle>
          <CardDescription className="text-xs text-slate-500">Update general partner account details.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Driver Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="focus:border-[#1F2B6D] focus:ring-[#1F2B6D]" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Mobile Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="focus:border-[#1F2B6D] focus:ring-[#1F2B6D]" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Email Address</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} className="focus:border-[#1F2B6D] focus:ring-[#1F2B6D]" />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => navigate(`/driver-management/drivers/${id}`)}>Cancel</Button>
            <Button className="bg-[#1F2B6D] hover:bg-[#182258] text-white font-semibold shadow-sm" onClick={handleSave} loading={isPending}>Save Profile</Button>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  )
}

export default DriverEditPage
