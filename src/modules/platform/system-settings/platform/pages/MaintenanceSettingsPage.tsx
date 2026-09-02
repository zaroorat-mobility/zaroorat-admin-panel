import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { useToast } from '@/shared/context/toast'
import { useMaintenanceSettings, useUpdateMaintenanceSettings } from '@/modules/platform/system-settings/hooks'
import {
  SettingFieldRow,
  SettingsError,
  SettingsFormActions,
  SettingsLoading,
} from '@/modules/platform/system-settings/components'

export const MaintenanceSettingsPage: React.FC = () => {
  const { data, isLoading, isError } = useMaintenanceSettings()
  const { mutate: save, isPending } = useUpdateMaintenanceSettings()
  const { success, error } = useToast()
  const [enabled, setEnabled] = useState(false)
  const [message, setMessage] = useState('')
  const [allowAdminAccess, setAllowAdminAccess] = useState(true)
  const [scheduleTitle, setScheduleTitle] = useState('')
  const [scheduleDescription, setScheduleDescription] = useState('')
  const [scheduleStartsAt, setScheduleStartsAt] = useState('')
  const [scheduleEndsAt, setScheduleEndsAt] = useState('')

  useEffect(() => {
    if (!data) return
    setEnabled(data.enabled)
    setMessage(data.message)
    setAllowAdminAccess(data.allowAdminAccess)
  }, [data])

  const handleSave = () => {
    const body: Parameters<typeof save>[0] = {
      enabled,
      message,
      allowAdminAccess,
    }
    if (scheduleTitle && scheduleStartsAt && scheduleEndsAt) {
      body.schedule = {
        title: scheduleTitle,
        description: scheduleDescription || undefined,
        startsAt: new Date(scheduleStartsAt).toISOString(),
        endsAt: new Date(scheduleEndsAt).toISOString(),
      }
    }
    save(body, {
      onSuccess: () => success('Settings saved', 'Maintenance settings were updated.'),
      onError: (err) =>
        error('Save failed', err instanceof Error ? err.message : 'Could not save settings'),
    })
  }

  if (isLoading) return <SettingsLoading />
  if (isError || !data) return <SettingsError />

  return (
    <div className="space-y-4 max-w-3xl">
      <Card className="premium-card">
        <CardContent className="p-6 space-y-4">
          <SettingFieldRow label="Maintenance mode">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="rounded border-border"
              />
              Enable maintenance mode for end users
            </label>
          </SettingFieldRow>
          <SettingFieldRow label="Maintenance message">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm dark:bg-slate-900"
              placeholder="We are performing scheduled maintenance..."
            />
          </SettingFieldRow>
          <SettingFieldRow label="Admin access">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allowAdminAccess}
                onChange={(e) => setAllowAdminAccess(e.target.checked)}
                className="rounded border-border"
              />
              Allow admin panel access during maintenance
            </label>
          </SettingFieldRow>
          <SettingsFormActions onSave={handleSave} isSaving={isPending} />
        </CardContent>
      </Card>

      {data.activeWindow ? (
        <Card className="premium-card border-amber-200">
          <CardContent className="p-6 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Active window</p>
            <p className="font-medium">{data.activeWindow.title}</p>
            {data.activeWindow.description ? (
              <p className="text-sm text-muted-foreground">{data.activeWindow.description}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {new Date(data.activeWindow.startsAt).toLocaleString()} —{' '}
              {new Date(data.activeWindow.endsAt).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="premium-card">
        <CardContent className="p-6 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Schedule maintenance window
          </p>
          <SettingFieldRow label="Title">
            <Input value={scheduleTitle} onChange={(e) => setScheduleTitle(e.target.value)} />
          </SettingFieldRow>
          <SettingFieldRow label="Description">
            <textarea
              value={scheduleDescription}
              onChange={(e) => setScheduleDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm dark:bg-slate-900"
            />
          </SettingFieldRow>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingFieldRow label="Starts at">
              <Input
                type="datetime-local"
                value={scheduleStartsAt}
                onChange={(e) => setScheduleStartsAt(e.target.value)}
              />
            </SettingFieldRow>
            <SettingFieldRow label="Ends at">
              <Input
                type="datetime-local"
                value={scheduleEndsAt}
                onChange={(e) => setScheduleEndsAt(e.target.value)}
              />
            </SettingFieldRow>
          </div>
          {data.scheduled.length > 0 ? (
            <div className="pt-2 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Upcoming ({data.scheduled.length})
              </p>
              {data.scheduled.map((window) => (
                <div key={window.id} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{window.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(window.startsAt).toLocaleString()} —{' '}
                    {new Date(window.endsAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

export default MaintenanceSettingsPage
