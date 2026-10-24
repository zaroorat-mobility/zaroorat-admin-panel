import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { useToast } from '@/shared/context/toast'
import { useGeneralSettings, useUpdateGeneralSettings } from '@/modules/platform/system-settings/hooks'
import {
  AppMobilePreview,
  LogoUploadField,
  SettingFieldRow,
  SettingsError,
  SettingsFormActions,
  SettingsLoading,
} from '@/modules/platform/system-settings/components'
import { Globe, Phone, ShieldCheck, Sparkles, Smartphone, Eye, Sliders } from 'lucide-react'

export const GeneralSettingsPage: React.FC = () => {
  const { data, isLoading, isError } = useGeneralSettings()
  const { mutate: save, isPending } = useUpdateGeneralSettings()
  const { success, error } = useToast()
  const [activeTab, setActiveTab] = useState<'config' | 'viewer'>('config')
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
      setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const isDirty = useMemo(() => {
    if (!data) return false
    return (
      form.platformName !== data.platformName.value ||
      form.logoUrl !== data.logoUrl.value ||
      form.customerLogoUrl !== (data.customerLogoUrl?.value || '') ||
      form.driverLogoUrl !== (data.driverLogoUrl?.value || '') ||
      form.supportPhone !== data.supportPhone.value ||
      form.supportEmail !== data.supportEmail.value ||
      form.defaultLanguage !== data.defaultLanguage.value ||
      form.timezone !== data.timezone.value ||
      form.currency !== data.currency.value
    )
  }, [form, data])

  const handleReset = () => {
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
  }

  const handleSave = () => {
    save(form, {
      onSuccess: () => success('Settings saved', 'General settings were updated successfully.'),
      onError: (err) =>
        error('Save failed', err instanceof Error ? err.message : 'Could not save settings'),
    })
  }

  if (isLoading) return <SettingsLoading />
  if (isError || !data) return <SettingsError />

  return (
    <div className="w-full space-y-6">
      {/* Top Navigation Tabs: Configuration Form vs App Logo Viewer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'config'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>General Configuration Form</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('viewer')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'viewer'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>App Logo Viewer (iOS & Android Mockups)</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activeTab === 'viewer' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
              }`}
            >
              Like applogoviewer.com
            </span>
          </button>
        </div>

        {activeTab === 'config' ? (
          <button
            type="button"
            onClick={() => setActiveTab('viewer')}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Compare iOS & Android Homescreens Side-by-Side →</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            ← Back to Configuration Form
          </button>
        )}
      </div>

      {/* VIEW MODE: Dedicated Full Side-by-Side App Logo Viewer */}
      {activeTab === 'viewer' ? (
        <div className="w-full flex justify-center py-2 animate-in fade-in duration-200">
          <AppMobilePreview
            platformName={form.platformName}
            customerLogoUrl={form.customerLogoUrl}
            driverLogoUrl={form.driverLogoUrl}
            supportPhone={form.supportPhone}
            supportEmail={form.supportEmail}
            currency={form.currency}
            defaultLanguage={form.defaultLanguage}
            initialMode="side-by-side"
            onCloseViewer={() => setActiveTab('config')}
            onPlatformNameChange={(name) => setForm((prev) => ({ ...prev, platformName: name }))}
          />
        </div>
      ) : (
        /* CONFIGURATION FORM VIEW */
        <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
          {/* Left Column: Form Settings Cards */}
          <div className="xl:col-span-7 space-y-6">
            {/* Card 1: Brand & Platform Identity */}
            <Card className="premium-card">
              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Brand & Platform Identity
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Configure your public brand identity used across mobile applications, SMS notifications, and billing invoices.
                  </p>
                </div>

                <SettingFieldRow
                  label="Platform Name"
                  hint="Shown in app headers, ride receipts, SMS, and invoice templates"
                  source={data.platformName.source}
                >
                  <Input
                    value={form.platformName}
                    onChange={set('platformName')}
                    placeholder="e.g. Zaroorat"
                    className="font-medium text-sm"
                  />
                </SettingFieldRow>

                <div className="pt-4 border-t border-border space-y-6">
                  {/* Banner CTA to App Logo Viewer */}
                  <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-900/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md shrink-0">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            App Logo & Homescreen Mockups
                          </h4>
                          <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                            applogoviewer.com style
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          View squircle (iOS) & circular (Android) icons on real homescreen wallpapers with dock and widgets.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('viewer')}
                      className="px-3.5 py-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Open Homescreen Viewer</span>
                    </button>
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
                      platformName={form.platformName}
                      onOpenViewer={() => setActiveTab('viewer')}
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
                      platformName={form.platformName}
                      onOpenViewer={() => setActiveTab('viewer')}
                      value={form.driverLogoUrl}
                      onChange={(url) => setForm((prev) => ({ ...prev, driverLogoUrl: url }))}
                    />
                  </SettingFieldRow>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Contact & Customer Support */}
            <Card className="premium-card">
              <CardContent className="p-6 space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Contact & Support Hotlines
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Emergency and customer care contact details accessible to drivers and riders in-app.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <SettingFieldRow
                    label="Support Phone"
                    hint="Click-to-call support hotline"
                    source={data.supportPhone.source}
                  >
                    <Input
                      value={form.supportPhone}
                      onChange={set('supportPhone')}
                      placeholder="+91 98765 43210"
                    />
                  </SettingFieldRow>

                  <SettingFieldRow
                    label="Support Email"
                    hint="Helpdesk & receipts inbox"
                    source={data.supportEmail.source}
                  >
                    <Input
                      type="email"
                      value={form.supportEmail}
                      onChange={set('supportEmail')}
                      placeholder="support@zaroorat.com"
                    />
                  </SettingFieldRow>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Regional & Localization */}
            <Card className="premium-card">
              <CardContent className="p-6 space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Regional & Localization
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Configure currency symbol, operational timezone, and default language.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <SettingFieldRow
                    label="Currency"
                    hint="3-letter code (INR, USD)"
                    source={data.currency.source}
                  >
                    <Input
                      value={form.currency}
                      onChange={set('currency')}
                      placeholder="INR"
                      maxLength={3}
                      className="uppercase font-mono font-semibold"
                    />
                  </SettingFieldRow>

                  <SettingFieldRow
                    label="Timezone"
                    hint="Server time standard"
                    source={data.timezone.source}
                  >
                    <Input
                      value={form.timezone}
                      onChange={set('timezone')}
                      placeholder="Asia/Kolkata"
                    />
                  </SettingFieldRow>

                  <SettingFieldRow
                    label="Default Language"
                    hint="Locale code (en, hi)"
                    source={data.defaultLanguage.source}
                  >
                    <Input
                      value={form.defaultLanguage}
                      onChange={set('defaultLanguage')}
                      placeholder="en"
                      maxLength={5}
                    />
                  </SettingFieldRow>
                </div>
              </CardContent>
            </Card>

            {/* Action Bar with Unsaved Changes Alert & Save */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
              {isDirty ? (
                <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3 py-1.5 rounded-lg self-start">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>You have unsaved changes</span>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-amber-800 dark:text-amber-300 underline font-semibold ml-1 hover:text-amber-900"
                  >
                    Reset
                  </button>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>All general configuration settings are saved.</span>
                </div>
              )}

              <SettingsFormActions onSave={handleSave} isSaving={isPending} />
            </div>
          </div>

          {/* Right Column: Live Mobile App Interactive Preview */}
          <div className="xl:col-span-5 flex flex-col items-center xl:sticky xl:top-6 space-y-3">
            <div className="w-full flex items-center justify-between px-1 text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-500">
                Interactive Preview
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('viewer')}
                className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Side-by-Side Mockup ↗</span>
              </button>
            </div>
            <AppMobilePreview
              platformName={form.platformName}
              customerLogoUrl={form.customerLogoUrl}
              driverLogoUrl={form.driverLogoUrl}
              supportPhone={form.supportPhone}
              supportEmail={form.supportEmail}
              currency={form.currency}
              defaultLanguage={form.defaultLanguage}
              initialMode="ios-home"
              compact={true}
              onCloseViewer={() => setActiveTab('config')}
              onPlatformNameChange={(name) => setForm((prev) => ({ ...prev, platformName: name }))}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default GeneralSettingsPage

