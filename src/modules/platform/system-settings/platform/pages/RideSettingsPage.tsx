import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { useToast } from '@/shared/context/toast'
import { useRideSettings, useUpdateRideSettings } from '@/modules/platform/system-settings/hooks'
import {
  SettingFieldRow,
  SettingsError,
  SettingsFormActions,
  SettingsLoading,
} from '@/modules/platform/system-settings/components'

export const RideSettingsPage: React.FC = () => {
  const { data, isLoading, isError } = useRideSettings()
  const { mutate: save, isPending } = useUpdateRideSettings()
  const { success, error } = useToast()
  const [form, setForm] = useState({
    requestExpiryMinutes: 5,
    dispatchTimeoutSeconds: 30,
    dispatchBatchSize: 5,
    searchRadiusMeters: 3000,
    maxSearchRadiusMeters: 10000,
    cancellationGraceMinutes: 2,
    defaultCancellationFee: 0,
  })

  useEffect(() => {
    if (!data) return
    setForm({
      requestExpiryMinutes: data.requestExpiryMinutes.value,
      dispatchTimeoutSeconds: data.dispatchTimeoutSeconds.value,
      dispatchBatchSize: data.dispatchBatchSize.value,
      searchRadiusMeters: data.searchRadiusMeters.value,
      maxSearchRadiusMeters: data.maxSearchRadiusMeters.value,
      cancellationGraceMinutes: data.cancellationGraceMinutes.value,
      defaultCancellationFee: data.defaultCancellationFee.value,
    })
  }, [data])

  const num = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: Number(e.target.value) || 0 })

  const handleSave = () => {
    save(form, {
      onSuccess: () => success('Settings saved', 'Ride settings were updated.'),
      onError: (err) =>
        error('Save failed', err instanceof Error ? err.message : 'Could not save settings'),
    })
  }

  if (isLoading) return <SettingsLoading />
  if (isError || !data) return <SettingsError />

  return (
    <Card className="premium-card max-w-3xl">
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingFieldRow label="Request expiry (minutes)" source={data.requestExpiryMinutes.source}>
            <Input type="number" value={form.requestExpiryMinutes} onChange={num('requestExpiryMinutes')} />
          </SettingFieldRow>
          <SettingFieldRow label="Dispatch timeout (seconds)" source={data.dispatchTimeoutSeconds.source}>
            <Input type="number" value={form.dispatchTimeoutSeconds} onChange={num('dispatchTimeoutSeconds')} />
          </SettingFieldRow>
          <SettingFieldRow label="Dispatch batch size" source={data.dispatchBatchSize.source}>
            <Input type="number" value={form.dispatchBatchSize} onChange={num('dispatchBatchSize')} />
          </SettingFieldRow>
          <SettingFieldRow label="Search radius (meters)" source={data.searchRadiusMeters.source}>
            <Input type="number" value={form.searchRadiusMeters} onChange={num('searchRadiusMeters')} />
          </SettingFieldRow>
          <SettingFieldRow label="Max search radius (meters)" source={data.maxSearchRadiusMeters.source}>
            <Input type="number" value={form.maxSearchRadiusMeters} onChange={num('maxSearchRadiusMeters')} />
          </SettingFieldRow>
          <SettingFieldRow label="Cancellation grace (minutes)" source={data.cancellationGraceMinutes.source}>
            <Input type="number" value={form.cancellationGraceMinutes} onChange={num('cancellationGraceMinutes')} />
          </SettingFieldRow>
          <SettingFieldRow label="Default cancellation fee" source={data.defaultCancellationFee.source}>
            <Input type="number" value={form.defaultCancellationFee} onChange={num('defaultCancellationFee')} />
          </SettingFieldRow>
        </div>
        <SettingsFormActions onSave={handleSave} isSaving={isPending} />
      </CardContent>
    </Card>
  )
}

export default RideSettingsPage
