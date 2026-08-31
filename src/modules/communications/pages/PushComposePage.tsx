import React, { useState } from 'react'
import { Send, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import { useSchedulePush, useSendPush, useTemplates } from '../hooks'

type TargetMode = 'all' | 'roles' | 'users'

function errMsg(err: unknown): string {
  return (
    (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
      ?.message ??
    (err as Error)?.message ??
    'Failed to send push notification'
  )
}

export const PushComposePage: React.FC = () => {
  const navigate = useNavigate()
  const canWrite = hasPermission(useAuthStore((s) => s.user), 'communications:write')
  const { data: templatesData } = useTemplates({ channel: 'PUSH', isActive: 'true', limit: 100 })
  const sendPush = useSendPush()
  const schedulePush = useSchedulePush()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [targetMode, setTargetMode] = useState<TargetMode>('all')
  const [rolesText, setRolesText] = useState('rider,driver')
  const [userIdsText, setUserIdsText] = useState('')
  const [scheduleMode, setScheduleMode] = useState(false)
  const [scheduledAtLocal, setScheduledAtLocal] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const buildTargeting = () => {
    if (targetMode === 'all') return { all: true }
    if (targetMode === 'roles') {
      return { roles: rolesText.split(',').map((r) => r.trim()).filter(Boolean) }
    }
    return {
      userIds: userIdsText
        .split(/[\s,]+/)
        .map((id) => id.trim())
        .filter(Boolean),
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const payload = {
      title: title.trim(),
      body: body.trim(),
      targeting: buildTargeting(),
      ...(templateId ? { templateId } : {}),
    }

    const onError = (err: unknown) => setError(errMsg(err))
    const onSuccess = () => {
      setSuccess(scheduleMode ? 'Push notification scheduled.' : 'Push notification sent.')
      setTimeout(() => navigate('/communications/push/history'), 1200)
    }

    if (scheduleMode) {
      if (!scheduledAtLocal) {
        setError('Scheduled time is required.')
        return
      }
      schedulePush.mutate(
        { ...payload, scheduledAt: new Date(scheduledAtLocal).toISOString() },
        { onSuccess, onError },
      )
    } else {
      sendPush.mutate(payload, { onSuccess, onError })
    }
  }

  if (!canWrite) {
    return (
      <PageWrapper>
        <PageHeader title="Compose Push" description="You do not have permission to send push notifications." />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Compose Push Notification"
        description="Send or schedule a broadcast push to riders, drivers, or specific users."
      />

      <Card className="max-w-2xl premium-card">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error ? <p className="text-rose-600">{error}</p> : null}
            {success ? <p className="text-emerald-600">{success}</p> : null}

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-450">Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-450">Message Body</label>
              <textarea
                required
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-450">Template (optional)</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950"
              >
                <option value="">No template</option>
                {(templatesData?.data ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.eventKey}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 border border-border rounded-lg p-3 bg-muted/20">
              <label className="text-[10px] font-bold uppercase text-slate-450">Audience Targeting</label>
              <div className="flex flex-wrap gap-2">
                {(['all', 'roles', 'users'] as TargetMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTargetMode(mode)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${
                      targetMode === mode
                        ? 'bg-primary text-white border-primary'
                        : 'bg-card border-border text-muted-foreground'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              {targetMode === 'roles' ? (
                <input
                  value={rolesText}
                  onChange={(e) => setRolesText(e.target.value)}
                  placeholder="rider, driver"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card"
                />
              ) : null}
              {targetMode === 'users' ? (
                <textarea
                  value={userIdsText}
                  onChange={(e) => setUserIdsText(e.target.value)}
                  placeholder="User UUIDs separated by comma or newline"
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card font-mono"
                />
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <input
                id="schedule-mode"
                type="checkbox"
                checked={scheduleMode}
                onChange={(e) => setScheduleMode(e.target.checked)}
              />
              <label htmlFor="schedule-mode" className="text-xs font-medium">
                Schedule for later
              </label>
            </div>

            {scheduleMode ? (
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-450 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Scheduled At
                </label>
                <input
                  type="datetime-local"
                  required={scheduleMode}
                  value={scheduledAtLocal}
                  onChange={(e) => setScheduledAtLocal(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950 [color-scheme:light]"
                />
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => navigate('/communications/push/history')}>
                View History
              </Button>
              <Button type="submit" disabled={sendPush.isPending || schedulePush.isPending} className="gap-1.5">
                <Send className="h-3.5 w-3.5" />
                {scheduleMode
                  ? schedulePush.isPending
                    ? 'Scheduling…'
                    : 'Schedule Push'
                  : sendPush.isPending
                    ? 'Sending…'
                    : 'Send Now'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageWrapper>
  )
}

export default PushComposePage
