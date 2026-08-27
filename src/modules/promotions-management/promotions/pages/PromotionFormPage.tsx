import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useCreatePromotion, usePromotion, useUpdatePromotion, useCities } from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import { api, API_ENDPOINTS } from '@/infrastructure/api'
import type { DiscountType, PromotionInput } from '../../types'

const emptyForm: PromotionInput = {
  title: '',
  description: '',
  discountType: 'PERCENT',
  discountValue: 10,
  maxDiscount: 50,
  minFare: 0,
  applicableCity: '',
  applicableVehicleTypeId: null,
  firstRideOnly: false,
  usageLimitTotal: 1000,
  usageLimitPerUser: 1,
  validFrom: new Date().toISOString().slice(0, 16),
  validTo: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
  isActive: true,
}

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const PromotionFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { data: existing } = usePromotion(id ?? '')
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
  const create = useCreatePromotion()
  const update = useUpdatePromotion()
  const [form, setForm] = useState<PromotionInput>(emptyForm)

  useEffect(() => {
    if (!existing) return
    setForm({
      code: existing.code,
      title: existing.title,
      description: existing.description,
      discountType: existing.discountType,
      discountValue: existing.discountValue,
      maxDiscount: existing.maxDiscount,
      minFare: existing.minFare,
      applicableCity: existing.applicableCity,
      applicableVehicleTypeId: existing.applicableVehicleTypeId,
      firstRideOnly: existing.firstRideOnly,
      usageLimitTotal: existing.usageLimitTotal,
      usageLimitPerUser: existing.usageLimitPerUser,
      validFrom: toLocalInput(existing.validFrom),
      validTo: toLocalInput(existing.validTo),
      isActive: existing.isActive,
    })
  }, [existing])

  const set = <K extends keyof PromotionInput>(key: K, value: PromotionInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: PromotionInput = {
      ...form,
      title: form.title || null,
      description: form.description || null,
      applicableCity: form.applicableCity || null,
      applicableVehicleTypeId: form.applicableVehicleTypeId || null,
      maxDiscount: form.maxDiscount == null ? null : Number(form.maxDiscount),
      usageLimitTotal: form.usageLimitTotal == null ? null : Number(form.usageLimitTotal),
      validFrom: new Date(form.validFrom).toISOString(),
      validTo: new Date(form.validTo).toISOString(),
    }
    // Code is auto-generated on create; keep existing on edit
    if (!isEdit) {
      delete payload.code
    }
    const go = () => navigate('/promotions-management/promotions')
    if (isEdit && id) {
      update.mutate({ id, updates: payload }, { onSuccess: go })
    } else {
      create.mutate(payload, { onSuccess: go })
    }
  }

  const pending = create.isPending || update.isPending

  return (
    <PageWrapper>
      <PageHeader
        title={isEdit ? 'Edit promotion' : 'Create promotion'}
        description="Configure coupon code, discount type, limits, and eligibility."
        onBack={() => navigate('/promotions-management/promotions')}
      />
      <Card className="mt-4 max-w-3xl">
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-4">
            {isEdit && (
              <label className="block text-sm">
                <span className="font-medium">Coupon code (auto-generated)</span>
                <input
                  readOnly
                  className="mt-1 w-full rounded border px-3 py-2 font-mono bg-slate-50"
                  value={form.code ?? existing?.code ?? ''}
                />
              </label>
            )}
            {!isEdit && (
              <p className="text-sm text-muted-foreground">
                A unique coupon code will be generated automatically from the title.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm md:col-span-2">
                <span className="font-medium">Title</span>
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.title ?? ''}
                  onChange={(e) => set('title', e.target.value)}
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="font-medium">Description</span>
              <textarea
                className="mt-1 w-full rounded border px-3 py-2"
                rows={2}
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value)}
              />
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="block text-sm">
                <span className="font-medium">Discount type</span>
                <select
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.discountType}
                  onChange={(e) => set('discountType', e.target.value as DiscountType)}
                >
                  <option value="PERCENT">Percentage</option>
                  <option value="FIXED">Fixed amount</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium">Discount value</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.discountValue}
                  onChange={(e) => set('discountValue', Number(e.target.value))}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Max discount (₹)</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.maxDiscount ?? ''}
                  onChange={(e) =>
                    set('maxDiscount', e.target.value === '' ? null : Number(e.target.value))
                  }
                />
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="block text-sm">
                <span className="font-medium">Min ride amount (₹)</span>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.minFare ?? 0}
                  onChange={(e) => set('minFare', Number(e.target.value))}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Usage limit (total)</span>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.usageLimitTotal ?? ''}
                  onChange={(e) =>
                    set(
                      'usageLimitTotal',
                      e.target.value === '' ? null : Number(e.target.value),
                    )
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Per-user limit</span>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.usageLimitPerUser ?? 1}
                  onChange={(e) => set('usageLimitPerUser', Number(e.target.value))}
                />
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="font-medium">Start</span>
                <input
                  type="datetime-local"
                  required
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={typeof form.validFrom === 'string' ? form.validFrom.slice(0, 16) : ''}
                  onChange={(e) => set('validFrom', e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">End</span>
                <input
                  type="datetime-local"
                  required
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={typeof form.validTo === 'string' ? form.validTo.slice(0, 16) : ''}
                  onChange={(e) => set('validTo', e.target.value)}
                />
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="font-medium">Eligible city</span>
                <select
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.applicableCity ?? ''}
                  onChange={(e) => set('applicableCity', e.target.value || null)}
                >
                  <option value="">All cities</option>
                  {(cities ?? [])
                    .filter((c) => c.code !== 'GLOBAL')
                    .map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.name}
                        {c.state ? ` (${c.state})` : ''}
                      </option>
                    ))}
                </select>
                <span className="text-xs text-muted-foreground">
                  Uses City.code from the cities catalog. Rider apps must pass the same
                  cityCode on quote/request.
                </span>
              </label>
              <label className="block text-sm">
                <span className="font-medium">Eligible vehicle category</span>
                <select
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.applicableVehicleTypeId ?? ''}
                  onChange={(e) =>
                    set('applicableVehicleTypeId', e.target.value || null)
                  }
                >
                  <option value="">All vehicle types</option>
                  {(vehicleTypes ?? []).map((vt) => (
                    <option key={vt.id} value={vt.id}>
                      {vt.code} — {vt.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!form.firstRideOnly}
                onChange={(e) => set('firstRideOnly', e.target.checked)}
              />
              First ride only
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive !== false}
                onChange={(e) => set('isActive', e.target.checked)}
              />
              Active
            </label>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={pending}>
                {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create promotion'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/promotions-management/promotions')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageWrapper>
  )
}

export default PromotionFormPage
