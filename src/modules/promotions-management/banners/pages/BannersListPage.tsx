import React, { useState } from 'react'
import {
  useBanners,
  useCreateBanner,
  useUpdateBanner,
  useActivateBanner,
  useDeactivateBanner,
  useDeleteBanner,
  useCampaigns,
} from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Button } from '@/shared/components/ui/Button'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { ActionDropdown, type DropdownAction } from '@/modules/driver-management/components/ActionDropdown'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import { Plus, ToggleLeft, ToggleRight, Trash2, Edit2 } from 'lucide-react'
import type { PromoBanner } from '../../types'

const PLACEMENTS = ['HOME', 'RIDE', 'WALLET', 'SPLASH', 'OFFERS'] as const

type FormState = {
  title: string
  imageUrl: string
  placement: string
  campaignId: string
  actionUrl: string
  priority: number
  startsAtLocal: string
  endsAtLocal: string
  isActive: boolean
}

const emptyForm = (): FormState => ({
  title: '',
  imageUrl: '',
  placement: 'HOME',
  campaignId: '',
  actionUrl: '',
  priority: 0,
  startsAtLocal: '',
  endsAtLocal: '',
  isActive: true,
})

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function errMsg(err: unknown): string {
  return (
    (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
      ?.message ??
    (err as Error)?.message ??
    'Failed to save banner (image URL must be a valid https URL)'
  )
}

export const BannersListPage: React.FC = () => {
  const canWrite = hasPermission(useAuthStore((s) => s.user), 'campaigns:write')
  const { data, isLoading, refetch } = useBanners()
  const { data: campaigns } = useCampaigns({ limit: 100 })
  const create = useCreateBanner()
  const update = useUpdateBanner()
  const activate = useActivateBanner()
  const deactivate = useDeactivateBanner()
  const remove = useDeleteBanner()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [error, setError] = useState<string | null>(null)

  const campaignCodeById = new Map((campaigns?.data ?? []).map((c) => [c.id, c.code]))
  const rows = data?.data ?? []

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setError(null)
    setShowForm(true)
  }

  const openEdit = (row: PromoBanner) => {
    setEditingId(row.id)
    setForm({
      title: row.title ?? '',
      imageUrl: row.imageUrl,
      placement: row.placement,
      campaignId: row.campaignId ?? '',
      actionUrl: row.actionUrl ?? '',
      priority: row.priority,
      startsAtLocal: toLocalInput(row.startsAt),
      endsAtLocal: toLocalInput(row.endsAt),
      isActive: row.isActive,
    })
    setError(null)
    setShowForm(true)
  }

  const submit = () => {
    setError(null)
    const payload = {
      title: form.title.trim() || null,
      imageUrl: form.imageUrl.trim(),
      placement: form.placement,
      campaignId: form.campaignId || null,
      actionUrl: form.actionUrl.trim() || null,
      priority: Number(form.priority) || 0,
      startsAt: form.startsAtLocal ? new Date(form.startsAtLocal).toISOString() : null,
      endsAt: form.endsAtLocal ? new Date(form.endsAtLocal).toISOString() : null,
      isActive: form.isActive,
    }
    const done = {
      onSuccess: () => {
        setShowForm(false)
        setEditingId(null)
        setForm(emptyForm())
        refetch()
      },
      onError: (err: unknown) => setError(errMsg(err)),
    }
    if (editingId) {
      update.mutate({ id: editingId, updates: payload }, done)
    } else {
      create.mutate(payload, done)
    }
  }

  const columns: DataTableColumn<PromoBanner>[] = [
    {
      key: 'title',
      label: 'Title',
      render: (v: string | null, row) => (
        <div>
          <p className="font-semibold">{v || '—'}</p>
          {row.actionUrl ? (
            <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">{row.actionUrl}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'placement',
      label: 'Placement',
      render: (v: string) => <span className="font-mono text-xs">{v}</span>,
    },
    {
      key: 'campaignId',
      label: 'Campaign',
      render: (v: string | null) => (
        <span className="font-mono text-xs">
          {v ? campaignCodeById.get(v) ?? v.slice(0, 8) : '—'}
        </span>
      ),
    },
    {
      key: 'imageUrl',
      label: 'Image',
      render: (v: string) => (
        <a
          href={v}
          target="_blank"
          rel="noreferrer"
          className="text-primary text-xs truncate max-w-[140px] block"
        >
          {v}
        </a>
      ),
    },
    { key: 'priority', label: 'Priority' },
    {
      key: 'startsAt',
      label: 'Window',
      render: (_: string | null, row) => (
        <div className="text-[10px] font-mono text-slate-500">
          <p>{row.startsAt ? new Date(row.startsAt).toLocaleDateString() : '—'}</p>
          <p>→ {row.endsAt ? new Date(row.endsAt).toLocaleDateString() : '—'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      key: 'id',
      label: 'Actions',
      align: 'center',
      render: (_: string, row) => {
        if (!canWrite) return null
        const dropActions: DropdownAction[] = [
          {
            label: 'Edit',
            icon: <Edit2 className="h-3.5 w-3.5" />,
            onClick: () => openEdit(row),
          },
        ]
        if (row.isActive) {
          dropActions.push({
            label: 'Deactivate',
            icon: <ToggleLeft className="h-3.5 w-3.5" />,
            onClick: () => deactivate.mutate(row.id),
          })
        } else {
          dropActions.push({
            label: 'Activate',
            icon: <ToggleRight className="h-3.5 w-3.5" />,
            onClick: () => activate.mutate(row.id),
          })
        }
        dropActions.push({
          label: 'Delete',
          icon: <Trash2 className="h-3.5 w-3.5 text-rose-500" />,
          onClick: () => {
            if (window.confirm('Permanently delete this banner?')) remove.mutate(row.id)
          },
          variant: 'danger',
        })
        return <ActionDropdown actions={dropActions} />
      },
    },
  ]

  const pending = create.isPending || update.isPending

  return (
    <PageWrapper>
      <PageHeader
        title="Promo banners"
        description="In-app creatives with placement, priority, schedule, and optional campaign link."
        actions={
          canWrite ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" /> New banner
            </Button>
          ) : undefined
        }
      />
      {showForm && canWrite && (
        <Card className="mt-4 mb-4 max-w-3xl">
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm font-semibold">{editingId ? 'Edit banner' : 'New banner'}</p>
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="Image URL (https://...) *"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            />
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="Action URL (optional, https://...)"
              value={form.actionUrl}
              onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                className="rounded border px-3 py-2"
                value={form.placement}
                onChange={(e) => setForm({ ...form, placement: e.target.value })}
              >
                {PLACEMENTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <select
                className="rounded border px-3 py-2"
                value={form.campaignId}
                onChange={(e) => setForm({ ...form, campaignId: e.target.value })}
              >
                <option value="">No campaign</option>
                {(campaigns?.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
              <label className="block text-sm">
                <span className="font-medium">Priority</span>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                />
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="font-medium">Starts at</span>
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.startsAtLocal}
                  onChange={(e) => setForm({ ...form, startsAtLocal: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Ends at</span>
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.endsAtLocal}
                  onChange={(e) => setForm({ ...form, endsAtLocal: e.target.value })}
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Active
            </label>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="flex gap-2">
              <Button disabled={pending || !form.imageUrl.trim()} onClick={submit}>
                {pending ? 'Saving…' : editingId ? 'Save changes' : 'Create'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setError(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="mt-4">
        <DataTable columns={columns} data={rows} isLoading={isLoading} />
      </div>
    </PageWrapper>
  )
}

export default BannersListPage
