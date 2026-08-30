import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  useSegments,
  useCreateSegment,
  useUpdateSegment,
  useDeleteSegment,
  useCities,
} from '../../hooks'
import { MultiCheckPicker } from '../../components/MultiCheckPicker'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable'
import { Button } from '@/shared/components/ui/Button'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { ActionDropdown, type DropdownAction } from '@/modules/driver-management/components/ActionDropdown'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import { api, API_ENDPOINTS } from '@/infrastructure/api'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import type { AudienceSegment } from '../../types'

type FormState = {
  name: string
  description: string
  cityCodes: string[]
  vehicleTypeIds: string[]
  firstRideOnly: boolean
  estimatedSize: string
  isDynamic: boolean
}

const emptyForm = (): FormState => ({
  name: '',
  description: '',
  cityCodes: [],
  vehicleTypeIds: [],
  firstRideOnly: false,
  estimatedSize: '',
  isDynamic: true,
})

function errMsg(err: unknown): string {
  return (
    (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
      ?.message ??
    (err as Error)?.message ??
    'Request failed'
  )
}

function rulesSummary(rules: AudienceSegment['rules']): string {
  if (!rules) return '—'
  const parts: string[] = []
  if (rules.cityCodes?.length) parts.push(`cities: ${rules.cityCodes.join(',')}`)
  if (rules.vehicleTypeIds?.length) parts.push(`vehicles: ${rules.vehicleTypeIds.length}`)
  if (rules.firstRideOnly) parts.push('1st ride')
  if (rules.userIds?.length) parts.push(`users: ${rules.userIds.length}`)
  return parts.length ? parts.join(' · ') : '—'
}

export const SegmentsListPage: React.FC = () => {
  const canWrite = hasPermission(useAuthStore((s) => s.user), 'campaigns:write')
  const { data, isLoading, refetch } = useSegments()
  const { data: cities } = useCities()
  const { data: vehicleTypes } = useQuery({
    queryKey: ['vehicle-types'],
    queryFn: async () => {
      const res = await api.get<{ data: Array<{ id: string; code: string; name: string }> }>(
        API_ENDPOINTS.vehicleTypes.list,
      )
      return res.data.data
    },
  })
  const create = useCreateSegment()
  const update = useUpdateSegment()
  const remove = useDeleteSegment()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AudienceSegment | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [error, setError] = useState<string | null>(null)

  const rows = data?.data ?? []

  const cityOptions = useMemo(
    () =>
      (cities ?? [])
        .filter((c) => c.code !== 'GLOBAL')
        .map((c) => ({
          value: c.code,
          label: c.code,
          hint: c.state ? `${c.name} · ${c.state}` : c.name,
        })),
    [cities],
  )

  const vehicleOptions = useMemo(
    () =>
      (vehicleTypes ?? []).map((vt) => ({
        value: vt.id,
        label: vt.code,
        hint: vt.name,
      })),
    [vehicleTypes],
  )

  const columns: DataTableColumn<AudienceSegment>[] = [
    {
      key: 'code',
      label: 'Code',
      render: (v: string) => <span className="font-mono font-bold">{v}</span>,
    },
    {
      key: 'name',
      label: 'Name',
      render: (v: string, row) => (
        <div>
          <p className="font-semibold">{v}</p>
          {row.description ? (
            <p className="text-[10px] text-muted-foreground line-clamp-1">{row.description}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'rules',
      label: 'Rules',
      render: (v: AudienceSegment['rules']) => (
        <span className="text-xs">{rulesSummary(v)}</span>
      ),
    },
    {
      key: 'estimatedSize',
      label: 'Est. size',
      render: (v: number | null) => (v != null ? v.toLocaleString() : '—'),
    },
    {
      key: 'isDynamic',
      label: 'Dynamic',
      render: (v: boolean) => (v ? 'Yes' : 'No'),
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
            onClick: () => {
              setEditing(row)
              setForm({
                name: row.name,
                description: row.description ?? '',
                cityCodes: row.rules?.cityCodes ?? [],
                vehicleTypeIds: row.rules?.vehicleTypeIds ?? [],
                firstRideOnly: !!row.rules?.firstRideOnly,
                estimatedSize: row.estimatedSize != null ? String(row.estimatedSize) : '',
                isDynamic: row.isDynamic,
              })
              setError(null)
              setShowForm(true)
            },
          },
          {
            label: 'Delete',
            icon: <Trash2 className="h-3.5 w-3.5 text-rose-500" />,
            onClick: () => {
              if (window.confirm('Permanently delete this segment?')) remove.mutate(row.id)
            },
            variant: 'danger',
          },
        ]
        return <ActionDropdown actions={dropActions} />
      },
    },
  ]

  const submit = () => {
    setError(null)
    const hasRules =
      form.cityCodes.length > 0 || form.vehicleTypeIds.length > 0 || form.firstRideOnly
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      estimatedSize: form.estimatedSize.trim() === '' ? null : Number(form.estimatedSize),
      isDynamic: form.isDynamic,
      rules: hasRules
        ? {
            ...(form.cityCodes.length ? { cityCodes: form.cityCodes } : {}),
            ...(form.vehicleTypeIds.length ? { vehicleTypeIds: form.vehicleTypeIds } : {}),
            ...(form.firstRideOnly ? { firstRideOnly: true } : {}),
          }
        : null,
    }
    const done = {
      onSuccess: () => {
        setShowForm(false)
        setEditing(null)
        setForm(emptyForm())
        refetch()
      },
      onError: (err: unknown) => setError(errMsg(err)),
    }
    if (editing) {
      update.mutate({ id: editing.id, updates: payload }, done)
    } else {
      create.mutate(payload, done)
    }
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Audience segments"
        description="Eligible user groups for campaign targeting (cities, vehicles, first-ride)."
        actions={
          canWrite ? (
            <Button
              onClick={() => {
                setEditing(null)
                setForm(emptyForm())
                setError(null)
                setShowForm((s) => !s)
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> New segment
            </Button>
          ) : undefined
        }
      />
      {showForm && canWrite && (
        <Card className="mt-4 mb-4 max-w-3xl">
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm font-semibold">
              {editing ? `Edit ${editing.code}` : 'New segment'}
            </p>
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="Segment name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <textarea
              className="w-full rounded border px-3 py-2 min-h-[72px]"
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MultiCheckPicker
                label="Eligible cities"
                options={cityOptions}
                value={form.cityCodes}
                onChange={(cityCodes) => setForm({ ...form, cityCodes })}
                placeholder="Search cities…"
                emptyHint="None selected = all cities"
              />
              <MultiCheckPicker
                label="Eligible vehicle types"
                options={vehicleOptions}
                value={form.vehicleTypeIds}
                onChange={(vehicleTypeIds) => setForm({ ...form, vehicleTypeIds })}
                placeholder="Search vehicle types…"
                emptyHint="None selected = all vehicle types"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <label className="block text-sm">
                <span className="font-medium">Estimated size</span>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded border px-3 py-2"
                  placeholder="Optional"
                  value={form.estimatedSize}
                  onChange={(e) => setForm({ ...form, estimatedSize: e.target.value })}
                />
              </label>
              <label className="flex items-center gap-2 text-sm pb-2">
                <input
                  type="checkbox"
                  checked={form.firstRideOnly}
                  onChange={(e) => setForm({ ...form, firstRideOnly: e.target.checked })}
                />
                First ride only
              </label>
              <label className="flex items-center gap-2 text-sm pb-2">
                <input
                  type="checkbox"
                  checked={form.isDynamic}
                  onChange={(e) => setForm({ ...form, isDynamic: e.target.checked })}
                />
                Dynamic segment
              </label>
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="flex gap-2">
              <Button
                disabled={create.isPending || update.isPending || !form.name.trim()}
                onClick={submit}
              >
                {create.isPending || update.isPending
                  ? 'Saving…'
                  : editing
                    ? 'Save changes'
                    : 'Create'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditing(null)
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

export default SegmentsListPage
