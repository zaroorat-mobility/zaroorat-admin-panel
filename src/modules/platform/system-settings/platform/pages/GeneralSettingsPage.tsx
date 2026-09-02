import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { useToast } from '@/shared/context/toast'
import { useGeneralSettings, useUpdateGeneralSettings } from '@/modules/platform/system-settings/hooks'
import {
  SettingFieldRow,
  SettingsError,
  SettingsFormActions,
  SettingsLoading,
} from '@/modules/platform/system-settings/components'

export const GeneralSettingsPage: React.FC = () => {
  const { data, isLoading, isError } = useGeneralSettings()
  const { mutate: save, isPending } = useUpdateGeneralSettings()
  const { success, error } = useToast()
  const [form, setForm] = useState({
    platformName: '',
    logoUrl: '',
    supportPhone: '',
    supportEmail: '',
    defaultLanguage: '',
    timezone: '',
    currency: '',
  })

  useEffect(() => {
    if (!data) return
    setForm({
      platformName: data.platformName.value,
      logoUrl: data.logoUrl.value,
      supportPhone: data.supportPhone.value,
      supportEmail: data.supportEmail.value,
      defaultLanguage: data.defaultLanguage.value,
      timezone: data.timezone.value,
      currency: data.currency.value,
    })
  }, [data])

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [key]: e.target.value })

  const handleSave = () => {
    save(form, {
      onSuccess: () => success('Settings saved', 'General settings were updated.'),
      onError: (err) =>
        error('Save failed', err instanceof Error ? err.message : 'Could not save settings'),
    })
  }

  if (isLoading) return <SettingsLoading />
  if (isError || !data) return <SettingsError />

  return (
    <Card className="premium-card w-full max-w-3xl">
      <CardContent className="p-6 space-y-4">
        <SettingFieldRow label="Platform name" source={data.platformName.source}>
          <Input value={form.platformName} onChange={set('platformName')} />
        </SettingFieldRow>
        <SettingFieldRow label="Logo URL" source={data.logoUrl.source}>
          <Input value={form.logoUrl} onChange={set('logoUrl')} placeholder="https://..." />
        </SettingFieldRow>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingFieldRow label="Support phone" source={data.supportPhone.source}>
            <Input value={form.supportPhone} onChange={set('supportPhone')} />
          </SettingFieldRow>
          <SettingFieldRow label="Support email" source={data.supportEmail.source}>
            <Input type="email" value={form.supportEmail} onChange={set('supportEmail')} />
          </SettingFieldRow>
          <SettingFieldRow label="Default language" source={data.defaultLanguage.source}>
            <Input value={form.defaultLanguage} onChange={set('defaultLanguage')} placeholder="en" />
          </SettingFieldRow>
          <SettingFieldRow label="Timezone" source={data.timezone.source}>
            <Input value={form.timezone} onChange={set('timezone')} placeholder="Asia/Kolkata" />
          </SettingFieldRow>
          <SettingFieldRow label="Currency" source={data.currency.source}>
            <Input value={form.currency} onChange={set('currency')} placeholder="INR" maxLength={3} />
          </SettingFieldRow>
        </div>
        <SettingsFormActions onSave={handleSave} isSaving={isPending} />
      </CardContent>
    </Card>
  )
}

export default GeneralSettingsPage
