import React, { useMemo, useState } from 'react'
import {
  useCampaigns,
  useCreateCampaign,
  useUpdateCampaign,
  useSetCampaignTargets,
  useSegments,
  usePromotions,
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
import {
  Plus,
  Pause,
  Play,
  XCircle,
  Edit2,
  FileText,
  CalendarClock,
  CheckCircle2,
} from 'lucide-react'
import type { Campaign, CampaignInput } from '../../types'

const STATUSES = ['DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED'] as const

type TargetDraft = { segmentId: string; promotionId: string }

const emptyForm = (): CampaignInput & { budgetStr: string; startsAtLocal: string; endsAtLocal: string } => ({
  name: '',
  objective: 'ACQUISITION',
  status: 'DRAFT',
  budget: null,
  budgetStr: '',
  startsAt: null,
  endsAt: null,
  startsAtLocal: '',
  endsAtLocal: '',
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
    'Request failed'
  )
}

export const CampaignsListPage: React.FC = () => {
  const canWrite = hasPermission(useAuthStore((s) => s.user), 'campaigns:write')
  const { data, isLoading, refetch } = useCampaigns()
  const { data: segmentsData } = useSegments({ limit: 100 })
  const { data: promotionsData } = usePromotions({ limit: 100 })
  const create = useCreateCampaign()
  const update = useUpdateCampaign()
  const setTargets = useSetCampaignTargets()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [targets, setTargetsState] = useState<TargetDraft[]>([])
  const [error, setError] = useState<string | null>(null)

  const segments = segmentsData?.data ?? []
  const promotions = promotionsData?.data ?? []
  const rows = data?.data ?? []

  const editingCampaign = useMemo(
    () => (editingId ? rows.find((r) => r.id === editingId) ?? null : null),
    [editingId, rows],
  )

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setTargetsState([])
    setError(null)
    setShowForm(true)
  }

  const openEdit = (row: Campaign) => {
    setEditingId(row.id)
    setForm({
      name: row.name,
      objective: row.objective,
      status: row.status,
      budget: row.budget,
      budgetStr: row.budget != null ? String(row.budget) : '',
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      startsAtLocal: toLocalInput(row.startsAt),
      endsAtLocal: toLocalInput(row.endsAt),
    })
    setTargetsState(
      (row.targets ?? []).map((t) => ({
        segmentId: t.segmentId,
        promotionId: t.promotionId ?? '',
      })),
    )
    setError(null)
    setShowForm(true)
  }

  const buildPayload = (): CampaignInput => ({
    name: form.name.trim(),
    objective: form.objective,
    status: form.status,
    budget: form.budgetStr.trim() === '' ? null : Number(form.budgetStr),
    startsAt: form.startsAtLocal ? new Date(form.startsAtLocal).toISOString() : null,
    endsAt: form.endsAtLocal ? new Date(form.endsAtLocal).toISOString() : null,
  })

  const submit = () => {
    setError(null)
    const payload = buildPayload()
    if (!payload.name) {
      setError('Name is required')
      return
    }

    const afterSave = (campaignId: string) => {
      const cleaned = targets
        .filter((t) => t.segmentId)
        .map((t) => ({
          segmentId: t.segmentId,
          promotionId: t.promotionId || null,
        }))
      setTargets.mutate(
        { id: campaignId, targets: cleaned },
        {
          onSuccess: () => {
            setShowForm(false)
            setEditingId(null)
            setForm(emptyForm())
            setTargetsState([])
            refetch()
          },
          onError: (err) => setError(errMsg(err)),
        },
      )
    }

    if (editingId) {
      update.mutate(
        { id: editingId, updates: payload },
        {
          onSuccess: (camp) => afterSave(camp.id),
          onError: (err) => setError(errMsg(err)),
        },
      )
    } else {
      create.mutate(payload, {
        onSuccess: (camp) => afterSave(camp.id),
        onError: (err) => setError(errMsg(err)),
      })
    }
  }

  const setStatus = (id: string, status: string) => {
    update.mutate({ id, updates: { status } })
  }

  const columns: DataTableColumn<Campaign>[] = [
    {
      key: 'code',
      label: 'Code',
      render: (v: string) => <span className="font-mono font-bold">{v}</span>,
    },
    { key: 'name', label: 'Name' },
    { key: 'objective', label: 'Objective' },
    {
      key: 'status',
      label: 'Status',
      render: (v: string) => <StatusBadge status={v.toLowerCase()} />,
    },
    {
      key: 'targets',
      label: 'Targets',
      render: (_: unknown, row) => (
        <div className="text-xs">
          <span className="font-semibold">{row.targets?.length ?? 0}</span>
          {row.targets?.length ? (
            <p className="text-muted-foreground line-clamp-2">
              {row.targets.map((t) => t.segmentCode).join(', ')}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'budget',
      label: 'Budget',
      render: (v: number | null, row) =>
        v != null ? (
          <span className="text-sm">
            ₹{v}
            <span className="text-muted-foreground text-xs"> · spent ₹{row.spent}</span>
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'startsAt',
      label: 'Window',
      render: (_: string | null, row) => (
        <div className="text-[10px] font-mono text-slate-500">
          <p>{row.startsAt ? new Date(row.startsAt).toLocaleString() : '—'}</p>
          <p>→ {row.endsAt ? new Date(row.endsAt).toLocaleString() : '—'}</p>
        </div>
      ),
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

        if (row.status !== 'DRAFT') {
          dropActions.push({
            label: 'Set Draft',
            icon: <FileText className="h-3.5 w-3.5" />,
            onClick: () => setStatus(row.id, 'DRAFT'),
          })
        }
        if (row.status !== 'SCHEDULED') {
          dropActions.push({
            label: 'Set Scheduled',
            icon: <CalendarClock className="h-3.5 w-3.5" />,
            onClick: () => setStatus(row.id, 'SCHEDULED'),
          })
        }
        if (row.status !== 'RUNNING') {
          dropActions.push({
            label: 'Set Running',
            icon: <Play className="h-3.5 w-3.5" />,
            onClick: () => setStatus(row.id, 'RUNNING'),
          })
        }
        if (row.status === 'RUNNING' || row.status === 'SCHEDULED') {
          dropActions.push({
            label: 'Pause',
            icon: <Pause className="h-3.5 w-3.5" />,
            onClick: () => setStatus(row.id, 'PAUSED'),
          })
        }
        if (row.status !== 'COMPLETED' && row.status !== 'CANCELLED') {
          dropActions.push({
            label: 'Mark Completed',
            icon: <CheckCircle2 className="h-3.5 w-3.5" />,
            onClick: () => setStatus(row.id, 'COMPLETED'),
          })
        }
        if (row.status !== 'CANCELLED') {
          dropActions.push({
            label: 'Cancel',
            icon: <XCircle className="h-3.5 w-3.5 text-rose-500" />,
            onClick: () => setStatus(row.id, 'CANCELLED'),
            variant: 'danger',
          })
        }
        return <ActionDropdown actions={dropActions} />
      },
    },
  ]

  const pending = create.isPending || update.isPending || setTargets.isPending

  return (
    <PageWrapper>
      <PageHeader
        title="Campaigns"
        description="Set status, budget, schedule, and audience targets (segment ↔ promotion)."
        actions={
          canWrite ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" /> New campaign
            </Button>
          ) : undefined
        }
      />
      {showForm && canWrite && (
        <Card className="mt-4 mb-4 max-w-3xl">
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm font-semibold">
              {editingId ? `Edit ${editingCampaign?.code ?? 'campaign'}` : 'New campaign'}
            </p>
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="Campaign name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                className="rounded border px-3 py-2"
                value={form.objective}
                onChange={(e) => setForm({ ...form, objective: e.target.value })}
              >
                <option value="ACQUISITION">Acquisition</option>
                <option value="RETENTION">Retention</option>
                <option value="REACTIVATION">Reactivation</option>
                <option value="AWARENESS">Awareness</option>
              </select>
              <select
                className="rounded border px-3 py-2"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                step="0.01"
                className="rounded border px-3 py-2"
                placeholder="Budget (₹, optional)"
                value={form.budgetStr}
                onChange={(e) => setForm({ ...form, budgetStr: e.target.value })}
              />
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

            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Targets (segment → promotion)</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setTargetsState((prev) => [...prev, { segmentId: '', promotionId: '' }])
                  }
                >
                  Add target
                </Button>
              </div>
              {targets.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No targets yet. Add audience segments (create them under Segments first).
                </p>
              )}
              {targets.map((t, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
                  <select
                    className="rounded border px-3 py-2 text-sm"
                    value={t.segmentId}
                    onChange={(e) => {
                      const next = [...targets]
                      next[idx] = { ...next[idx], segmentId: e.target.value }
                      setTargetsState(next)
                    }}
                  >
                    <option value="">Select segment…</option>
                    {segments.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded border px-3 py-2 text-sm"
                    value={t.promotionId}
                    onChange={(e) => {
                      const next = [...targets]
                      next[idx] = { ...next[idx], promotionId: e.target.value }
                      setTargetsState(next)
                    }}
                  >
                    <option value="">Any / no promo</option>
                    {promotions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.title || 'Untitled'}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTargetsState(targets.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="flex gap-2">
              <Button disabled={pending || !form.name.trim()} onClick={submit}>
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

export default CampaignsListPage
