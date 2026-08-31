import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { useToast } from '@/shared/context/toast'
import { useOnboardingSettings, useUpdateOnboardingSettings } from '@/modules/platform/system-settings/hooks'
import {
  SettingFieldRow,
  SettingsError,
  SettingsFormActions,
  SettingsLoading,
} from '@/modules/platform/system-settings/components'

const listToText = (items: string[]) => items.join('\n')
const textToList = (text: string) =>
  text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

export const OnboardingSettingsPage: React.FC = () => {
  const { data, isLoading, isError } = useOnboardingSettings()
  const { mutate: save, isPending } = useUpdateOnboardingSettings()
  const { success, error } = useToast()
  const [driverDocs, setDriverDocs] = useState('')
  const [vehicleDocs, setVehicleDocs] = useState('')
  const [warningDays, setWarningDays] = useState(30)
  const [requireApproved, setRequireApproved] = useState(false)

  useEffect(() => {
    if (!data) return
    setDriverDocs(listToText(data.driverRequiredDocuments.value))
    setVehicleDocs(listToText(data.vehicleRequiredDocuments.value))
    setWarningDays(data.driverDocExpiryWarningDays.value)
    setRequireApproved(data.requireApprovedDocuments.value)
  }, [data])

  const handleSave = () => {
    save(
      {
        driverRequiredDocuments: textToList(driverDocs),
        vehicleRequiredDocuments: textToList(vehicleDocs),
        driverDocExpiryWarningDays: warningDays,
        requireApprovedDocuments: requireApproved,
      },
      {
        onSuccess: () => success('Settings saved', 'Onboarding settings were updated.'),
        onError: (err) =>
          error('Save failed', err instanceof Error ? err.message : 'Could not save settings'),
      },
    )
  }

  if (isLoading) return <SettingsLoading />
  if (isError || !data) return <SettingsError />

  return (
    <Card className="premium-card max-w-3xl">
      <CardContent className="p-6 space-y-4">
        <SettingFieldRow
          label="Driver required documents"
          source={data.driverRequiredDocuments.source}
          hint="One document type per line"
        >
          <textarea
            value={driverDocs}
            onChange={(e) => setDriverDocs(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm dark:bg-slate-900"
          />
        </SettingFieldRow>
        <SettingFieldRow
          label="Vehicle required documents"
          source={data.vehicleRequiredDocuments.source}
          hint="One document type per line"
        >
          <textarea
            value={vehicleDocs}
            onChange={(e) => setVehicleDocs(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm dark:bg-slate-900"
          />
        </SettingFieldRow>
        <SettingFieldRow label="Doc expiry warning (days)" source={data.driverDocExpiryWarningDays.source}>
          <Input type="number" value={warningDays} onChange={(e) => setWarningDays(Number(e.target.value) || 0)} />
        </SettingFieldRow>
        <SettingFieldRow label="Require approved documents" source={data.requireApprovedDocuments.source}>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={requireApproved}
              onChange={(e) => setRequireApproved(e.target.checked)}
              className="rounded border-border"
            />
            Block onboarding until documents are approved
          </label>
        </SettingFieldRow>
        <SettingsFormActions onSave={handleSave} isSaving={isPending} />
      </CardContent>
    </Card>
  )
}

export default OnboardingSettingsPage
