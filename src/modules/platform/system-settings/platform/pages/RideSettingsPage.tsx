import React, { useEffect, useState } from "react"
import { Card, CardContent } from "@/shared/components/ui/Card"
import { Input } from "@/shared/components/ui/Input"
import { useToast } from "@/shared/context/toast"
import { useRideSettings, useUpdateRideSettings } from "@/modules/platform/system-settings/hooks"
import {
  SettingFieldRow,
  SettingsError,
  SettingsFormActions,
  SettingsLoading,
} from "@/modules/platform/system-settings/components"

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
    pickupGeofenceMeters: 100,
    dropGeofenceMeters: 100,
    arrivalMaxAccuracyMeters: 50,
    arrivalRequiredFixes: 3,
    dispatchMaxRounds: 5,
    dispatchMaxAttemptedDrivers: 20,
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
      pickupGeofenceMeters: data.pickupGeofenceMeters?.value ?? 100,
      dropGeofenceMeters: data.dropGeofenceMeters?.value ?? 100,
      arrivalMaxAccuracyMeters: data.arrivalMaxAccuracyMeters?.value ?? 50,
      arrivalRequiredFixes: data.arrivalRequiredFixes?.value ?? 3,
      dispatchMaxRounds: data.dispatchMaxRounds?.value ?? 5,
      dispatchMaxAttemptedDrivers: data.dispatchMaxAttemptedDrivers?.value ?? 20,
    })
  }, [data])

  const num = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: Number(e.target.value) || 0 })

  const handleSave = () => {
    save(form, {
      onSuccess: () => success("Settings saved", "Ride settings were updated."),
      onError: (err) =>
        error("Save failed", err instanceof Error ? err.message : "Could not save settings"),
    })
  }

  if (isLoading) return <SettingsLoading />
  if (isError || !data) return <SettingsError />

  return (
    <Card className="premium-card max-w-3xl">
      <CardContent className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
            Dispatch & Search Boundaries
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingFieldRow label="Request expiry (minutes)" source={data.requestExpiryMinutes.source}>
              <Input type="number" value={form.requestExpiryMinutes} onChange={num("requestExpiryMinutes")} />
            </SettingFieldRow>
            <SettingFieldRow label="Dispatch timeout (seconds)" source={data.dispatchTimeoutSeconds.source}>
              <Input type="number" value={form.dispatchTimeoutSeconds} onChange={num("dispatchTimeoutSeconds")} />
            </SettingFieldRow>
            <SettingFieldRow label="Dispatch batch size" source={data.dispatchBatchSize.source}>
              <Input type="number" value={form.dispatchBatchSize} onChange={num("dispatchBatchSize")} />
            </SettingFieldRow>
            <SettingFieldRow label="Search radius (meters)" source={data.searchRadiusMeters.source}>
              <Input type="number" value={form.searchRadiusMeters} onChange={num("searchRadiusMeters")} />
            </SettingFieldRow>
            <SettingFieldRow label="Max search radius (meters)" source={data.maxSearchRadiusMeters.source}>
              <Input type="number" value={form.maxSearchRadiusMeters} onChange={num("maxSearchRadiusMeters")} />
            </SettingFieldRow>
            <SettingFieldRow label="Cancellation grace (minutes)" source={data.cancellationGraceMinutes.source}>
              <Input type="number" value={form.cancellationGraceMinutes} onChange={num("cancellationGraceMinutes")} />
            </SettingFieldRow>
            <SettingFieldRow label="Default cancellation fee" source={data.defaultCancellationFee.source}>
              <Input type="number" value={form.defaultCancellationFee} onChange={num("defaultCancellationFee")} />
            </SettingFieldRow>
            <SettingFieldRow label="Dispatch max rounds" source={data.dispatchMaxRounds?.source ?? "default"}>
              <Input type="number" value={form.dispatchMaxRounds} onChange={num("dispatchMaxRounds")} />
            </SettingFieldRow>
            <SettingFieldRow label="Dispatch max attempted drivers" source={data.dispatchMaxAttemptedDrivers?.source ?? "default"}>
              <Input type="number" value={form.dispatchMaxAttemptedDrivers} onChange={num("dispatchMaxAttemptedDrivers")} />
            </SettingFieldRow>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
            Arrival Geofence & Proximity Detection
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingFieldRow label="Pickup Geofence (meters)" source={data.pickupGeofenceMeters?.source ?? "default"}>
              <Input type="number" value={form.pickupGeofenceMeters} onChange={num("pickupGeofenceMeters")} />
            </SettingFieldRow>
            <SettingFieldRow label="Drop-off Geofence (meters)" source={data.dropGeofenceMeters?.source ?? "default"}>
              <Input type="number" value={form.dropGeofenceMeters} onChange={num("dropGeofenceMeters")} />
            </SettingFieldRow>
            <SettingFieldRow label="Arrival Max GPS Accuracy (meters)" source={data.arrivalMaxAccuracyMeters?.source ?? "default"}>
              <Input type="number" value={form.arrivalMaxAccuracyMeters} onChange={num("arrivalMaxAccuracyMeters")} />
            </SettingFieldRow>
            <SettingFieldRow label="Arrival Required Consecutive Fixes" source={data.arrivalRequiredFixes?.source ?? "default"}>
              <Input type="number" value={form.arrivalRequiredFixes} onChange={num("arrivalRequiredFixes")} />
            </SettingFieldRow>
          </div>
        </div>

        <SettingsFormActions onSave={handleSave} isSaving={isPending} />
      </CardContent>
    </Card>
  )
}

export default RideSettingsPage
