import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { useToast } from '@/shared/context/toast'
import { useGeneralSettings, useUpdateGeneralSettings } from '@/modules/platform/system-settings/hooks'
import {
  LogoUploadField,
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
    customerLogoUrl: '',
    driverLogoUrl: '',
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
      customerLogoUrl: data.customerLogoUrl?.value || '',
      driverLogoUrl: data.driverLogoUrl?.value || '',
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
      <CardContent className="p-6 space-y-6">
        <SettingFieldRow label="Platform name" source={data.platformName.source}>
          <Input value={form.platformName} onChange={set('platformName')} />
        </SettingFieldRow>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Mobile App Branding & Icons
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize real-time icons and logos for Customer and Driver applications independently.
            </p>
          </div>

          <SettingFieldRow
            label="Customer App Icon / Logo"
            source={data.customerLogoUrl?.source || data.logoUrl.source}
          >
            <LogoUploadField
              appName="Customer App"
              brandBgColor="#1F2B6D"
              brandLabel="Customer Navy Theme (#1F2B6D)"
              fallbackBadge="Bundled AppIcon.svg (Default)"
              value={form.customerLogoUrl}
              onChange={(url) => setForm((prev) => ({ ...prev, customerLogoUrl: url }))}
            />
          </SettingFieldRow>

          <SettingFieldRow
            label="Driver App Icon / Logo"
            source={data.driverLogoUrl?.source || data.logoUrl.source}
          >
            <LogoUploadField
              appName="Driver App"
              brandBgColor="#0F172A"
              brandLabel="Driver Dark Theme (#0F172A)"
              fallbackBadge="Bundled ZarooratLogo2.png (Default)"
              value={form.driverLogoUrl}
              onChange={(url) => setForm((prev) => ({ ...prev, driverLogoUrl: url }))}
            />
          </SettingFieldRow>
        </div>
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
