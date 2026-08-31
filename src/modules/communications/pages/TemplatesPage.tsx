import React, { useState } from 'react'
import { Plus, Edit2 } from 'lucide-react'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { Button } from '@/shared/components/ui/Button'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import { useCreateTemplate, useTemplates, useUpdateTemplate } from '../hooks'
import type { NotificationChannel, NotificationTemplate, TemplateInput } from '../types'

const CHANNELS: NotificationChannel[] = ['PUSH', 'SMS', 'EMAIL', 'IN_APP', 'WHATSAPP']

type FormState = {
  eventKey: string
  channel: NotificationChannel
  subject: string
  body: string
  variables: string
  isActive: boolean
}

const emptyForm = (): FormState => ({
  eventKey: '',
  channel: 'PUSH',
  subject: '',
  body: '',
  variables: '',
  isActive: true,
})

function errMsg(err: unknown): string {
  return (
    (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
      ?.message ??
    (err as Error)?.message ??
    'Failed to save template'
  )
}

export const TemplatesPage: React.FC = () => {
  const canWrite = hasPermission(useAuthStore((s) => s.user), 'communications:write')
  const [channelFilter, setChannelFilter] = useState<NotificationChannel | ''>('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading, refetch } = useTemplates({
    limit: 50,
    channel: channelFilter || undefined,
    isActive: activeFilter,
  })
  const create = useCreateTemplate()
  const update = useUpdateTemplate()

  const rows = data?.data ?? []

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setError(null)
    setShowForm(true)
  }

  const openEdit = (row: NotificationTemplate) => {
    setEditingId(row.id)
    setForm({
      eventKey: row.eventKey,
      channel: row.channel,
      subject: row.subject ?? '',
      body: row.body,
      variables: row.variables.join(', '),
      isActive: row.isActive,
    })
    setError(null)
    setShowForm(true)
  }

  const toPayload = (): TemplateInput => ({
    eventKey: form.eventKey.trim(),
    channel: form.channel,
    subject: form.subject.trim() || null,
    body: form.body.trim(),
    variables: form.variables
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean),
    isActive: form.isActive,
  })

  const submit = () => {
    setError(null)
    const payload = toPayload()
    const onError = (err: unknown) => setError(errMsg(err))
    const onSuccess = () => {
      setShowForm(false)
      refetch()
    }

    if (editingId) {
      update.mutate({ id: editingId, updates: payload }, { onSuccess, onError })
    } else {
      create.mutate(payload, { onSuccess, onError })
    }
  }

  const columns: DataTableColumn<NotificationTemplate>[] = [
    {
      key: 'eventKey',
      label: 'Event Key',
      render: (val: string) => <span className="font-mono font-bold text-xs">{val}</span>,
    },
    {
      key: 'channel',
      label: 'Channel',
      render: (val: string) => (
        <span className="text-[10px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
          {val}
        </span>
      ),
    },
    {
      key: 'body',
      label: 'Template Body',
      render: (val: string, row) => (
        <div className="max-w-xs">
          {row.subject ? (
            <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 truncate">
              {row.subject}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground line-clamp-2">{val}</p>
        </div>
      ),
    },
    {
      key: 'variables',
      label: 'Variables',
      render: (_: unknown, row) =>
        row.variables.length ? (
          <span className="text-[10px] font-mono text-slate-500">{row.variables.join(', ')}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (val: boolean) => <StatusBadge status={val ? 'active' : 'inactive'} />,
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      render: (val: string) => (
        <span className="text-[10px] font-mono text-muted-foreground">
          {new Date(val).toLocaleString()}
        </span>
      ),
    },
    ...(canWrite
      ? [
          {
            key: 'actions',
            label: 'Action',
            align: 'center' as const,
            render: (_: unknown, row: NotificationTemplate) => (
              <Button size="sm" variant="ghost" onClick={() => openEdit(row)} className="h-7 text-xs gap-1">
                <Edit2 className="h-3 w-3" />
                Edit
              </Button>
            ),
          },
        ]
      : []),
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Notification Templates"
        description="Manage multi-channel notification templates keyed by event identifiers."
        actions={
          canWrite ? (
            <Button onClick={openCreate} className="gap-1.5 text-xs h-9">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          ) : undefined
        }
      />

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as NotificationChannel | '')}
            className="text-xs border border-border rounded-md px-2 py-1.5 bg-card"
          >
            <option value="">All channels</option>
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as 'all' | 'true' | 'false')}
            className="text-xs border border-border rounded-md px-2 py-1.5 bg-card"
          >
            <option value="all">All statuses</option>
            <option value="true">Active only</option>
            <option value="false">Inactive only</option>
          </select>
        </div>

        <DataTable columns={columns} data={rows} isLoading={isLoading} resultLabel="templates" />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg premium-card">
            <CardContent className="p-5 space-y-4 text-xs">
              <h3 className="font-bold text-sm">{editingId ? 'Edit Template' : 'Create Template'}</h3>
              {error ? <p className="text-rose-600 text-xs">{error}</p> : null}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold uppercase text-slate-450">Event Key</label>
                  <input
                    value={form.eventKey}
                    onChange={(e) => setForm({ ...form, eventKey: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950"
                    placeholder="ride.completed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-450">Channel</label>
                  <select
                    value={form.channel}
                    onChange={(e) => setForm({ ...form, channel: e.target.value as NotificationChannel })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950"
                  >
                    {CHANNELS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-450">Active</label>
                  <select
                    value={form.isActive ? 'true' : 'false'}
                    onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold uppercase text-slate-450">Subject (optional)</label>
                  <input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold uppercase text-slate-450">Body</label>
                  <textarea
                    rows={4}
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold uppercase text-slate-450">
                    Variables (comma-separated)
                  </label>
                  <input
                    value={form.variables}
                    onChange={(e) => setForm({ ...form, variables: e.target.value })}
                    placeholder="riderName, rideCode"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-slate-50 dark:bg-slate-950"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={submit}
                  disabled={create.isPending || update.isPending || !form.eventKey.trim() || !form.body.trim()}
                >
                  {create.isPending || update.isPending ? 'Saving…' : 'Save Template'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageWrapper>
  )
}

export default TemplatesPage
