import React, { useState } from 'react'
import {
  useCouponBatches,
  useCreateCouponBatch,
  useActivateCouponBatch,
  useDeactivateCouponBatch,
  usePromotions,
  useCampaigns,
  useCoupons,
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
import { Plus, ToggleLeft, ToggleRight, Eye } from 'lucide-react'
import type { CouponBatch } from '../../types'

const emptyForm = () => ({
  promotionId: '',
  campaignId: '',
  name: '',
  prefix: 'CPN',
  totalCount: 10,
  perUserLimit: 1,
  expiresAtLocal: '',
  isActive: true,
})

function errMsg(err: unknown): string {
  return (
    (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
      ?.message ??
    (err as Error)?.message ??
    'Request failed'
  )
}

export const BatchesListPage: React.FC = () => {
  const canWrite = hasPermission(useAuthStore((s) => s.user), 'campaigns:write')
  const { data, isLoading, refetch } = useCouponBatches()
  const { data: promos } = usePromotions({ limit: 100 })
  const { data: campaigns } = useCampaigns({ limit: 100 })
  const create = useCreateCouponBatch()
  const activate = useActivateCouponBatch()
  const deactivate = useDeactivateCouponBatch()
  const [selectedBatch, setSelectedBatch] = useState<string | undefined>()
  const { data: coupons } = useCoupons(selectedBatch ? { batchId: selectedBatch } : undefined)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [error, setError] = useState<string | null>(null)

  const campaignCodeById = new Map((campaigns?.data ?? []).map((c) => [c.id, c.code]))

  const rows = data?.data ?? []
  const columns: DataTableColumn<CouponBatch>[] = [
    {
      key: 'name',
      label: 'Batch',
      render: (v: string | null, row) => (
        <div>
          <span className="font-semibold">{v || row.prefix || row.id.slice(0, 8)}</span>
          {row.prefix ? (
            <p className="text-[10px] font-mono text-muted-foreground">{row.prefix}-*</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'promotionCode',
      label: 'Promotion',
      render: (v: string) => <span className="font-mono text-xs">{v}</span>,
    },
    {
      key: 'campaignId',
      label: 'Campaign',
      render: (v: string | null) => (
        <span className="font-mono text-xs">{v ? campaignCodeById.get(v) ?? v.slice(0, 8) : '—'}</span>
      ),
    },
    {
      key: 'generatedCount',
      label: 'Generated',
      render: (v: number, row) => (
        <span className="font-mono text-xs">
          {v} / {row.totalCount}
        </span>
      ),
    },
    {
      key: 'perUserLimit',
      label: 'Per user',
      render: (v: number) => <span className="font-mono text-xs">{v}</span>,
    },
    {
      key: 'expiresAt',
      label: 'Expires',
      render: (v: string | null) => (v ? new Date(v).toLocaleDateString() : '—'),
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
        const dropActions: DropdownAction[] = [
          {
            label: 'View codes',
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => setSelectedBatch(row.id),
          },
        ]
        if (canWrite) {
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
        }
        return <ActionDropdown actions={dropActions} />
      },
    },
  ]

  return (
    <PageWrapper>
      <PageHeader
        title="Coupon batches"
        description="Generate unique codes linked to a promotion (optional campaign, limits, expiry)."
        actions={
          canWrite ? (
            <Button
              onClick={() => {
                setForm(emptyForm())
                setError(null)
                setShowForm((s) => !s)
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> New batch
            </Button>
          ) : undefined
        }
      />
      {showForm && canWrite && (
        <Card className="mt-4 mb-4 max-w-3xl">
          <CardContent className="pt-6 space-y-3">
            <select
              className="w-full rounded border px-3 py-2"
              value={form.promotionId}
              onChange={(e) => setForm({ ...form, promotionId: e.target.value })}
            >
              <option value="">Select promotion *</option>
              {(promos?.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.title || 'Untitled'}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded border px-3 py-2"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="rounded border px-3 py-2"
                placeholder="Batch name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className="rounded border px-3 py-2 font-mono"
                placeholder="Prefix"
                value={form.prefix}
                onChange={(e) => setForm({ ...form, prefix: e.target.value.toUpperCase() })}
              />
              <input
                type="number"
                min={1}
                className="rounded border px-3 py-2"
                placeholder="Total codes"
                value={form.totalCount}
                onChange={(e) => setForm({ ...form, totalCount: Number(e.target.value) })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="block text-sm">
                <span className="font-medium">Per-user limit</span>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.perUserLimit}
                  onChange={(e) => setForm({ ...form, perUserLimit: Number(e.target.value) })}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Expires at</span>
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.expiresAtLocal}
                  onChange={(e) => setForm({ ...form, expiresAtLocal: e.target.value })}
                />
              </label>
              <label className="flex items-center gap-2 mt-6 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Active
              </label>
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="flex gap-2">
              <Button
                disabled={create.isPending || !form.promotionId}
                onClick={() => {
                  setError(null)
                  create.mutate(
                    {
                      promotionId: form.promotionId,
                      campaignId: form.campaignId || null,
                      name: form.name || null,
                      prefix: form.prefix || null,
                      totalCount: form.totalCount,
                      perUserLimit: form.perUserLimit,
                      expiresAt: form.expiresAtLocal
                        ? new Date(form.expiresAtLocal).toISOString()
                        : null,
                      isActive: form.isActive,
                      generateNow: true,
                    },
                    {
                      onSuccess: () => {
                        setShowForm(false)
                        setForm(emptyForm())
                        refetch()
                      },
                      onError: (err: unknown) => setError(errMsg(err)),
                    },
                  )
                }}
              >
                {create.isPending ? 'Creating…' : 'Create & generate'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="mt-4">
        <DataTable columns={columns} data={rows} isLoading={isLoading} />
      </div>
      {selectedBatch && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Codes in batch</h3>
          <DataTable
            columns={[
              {
                key: 'code',
                label: 'Code',
                render: (v: string) => <span className="font-mono font-bold">{v}</span>,
              },
              { key: 'status', label: 'Status' },
              {
                key: 'expiresAt',
                label: 'Expires',
                render: (v: string | null) => (v ? new Date(v).toLocaleDateString() : '—'),
              },
            ]}
            data={coupons?.data ?? []}
          />
        </div>
      )}
    </PageWrapper>
  )
}

export default BatchesListPage
