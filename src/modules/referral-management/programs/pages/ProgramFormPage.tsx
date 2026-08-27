import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useAddMilestone,
  useActivateMilestone,
  useCreateReferralProgram,
  useDeactivateMilestone,
  useReferralProgram,
  useUpdateReferralProgram,
} from '../../hooks'
import { PageWrapper } from '@/app/layouts/PageWrapper'
import { PageHeader } from '@/shared/components/PageHeader'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Button } from '@/shared/components/ui/Button'
import type { ReferralProgramInput } from '../../types'

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const emptyForm = (): ReferralProgramInput & {
  maxReferralsStr: string
  rewardExpiryStr: string
} => ({
  name: '',
  referrerReward: 50,
  refereeReward: 50,
  rewardType: 'WALLET',
  qualifyingEvent: 'FIRST_RIDE',
  qualifyingThreshold: 1,
  maxReferralsPerUser: null,
  maxReferralsStr: '',
  rewardExpiryDays: null,
  rewardExpiryStr: '',
  validFrom: new Date().toISOString().slice(0, 16),
  validTo: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 16),
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

export const ProgramFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { data: existing } = useReferralProgram(id ?? '')
  const create = useCreateReferralProgram()
  const update = useUpdateReferralProgram()
  const addMilestone = useAddMilestone()
  const activateMilestone = useActivateMilestone(id)
  const deactivateMilestone = useDeactivateMilestone(id)
  const [form, setForm] = useState(emptyForm())
  const [error, setError] = useState<string | null>(null)
  const [milestone, setMilestone] = useState({
    name: '',
    requiredReferrals: 5,
    bonusAmount: 100,
  })

  useEffect(() => {
    if (!existing) return
    setForm({
      code: existing.code,
      name: existing.name,
      referrerReward: existing.referrerReward,
      refereeReward: existing.refereeReward,
      rewardType: existing.rewardType,
      qualifyingEvent: existing.qualifyingEvent,
      qualifyingThreshold: existing.qualifyingThreshold,
      maxReferralsPerUser: existing.maxReferralsPerUser,
      maxReferralsStr:
        existing.maxReferralsPerUser != null ? String(existing.maxReferralsPerUser) : '',
      rewardExpiryDays: existing.rewardExpiryDays,
      rewardExpiryStr:
        existing.rewardExpiryDays != null ? String(existing.rewardExpiryDays) : '',
      validFrom: toLocalInput(existing.validFrom),
      validTo: toLocalInput(existing.validTo),
      isActive: existing.isActive,
    })
  }, [existing])

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const payload: ReferralProgramInput = {
      name: form.name || null,
      referrerReward: Number(form.referrerReward) || 0,
      refereeReward: Number(form.refereeReward) || 0,
      rewardType: form.rewardType,
      qualifyingEvent: form.qualifyingEvent,
      qualifyingThreshold: Number(form.qualifyingThreshold) || 1,
      maxReferralsPerUser: form.maxReferralsStr.trim()
        ? Number(form.maxReferralsStr)
        : null,
      rewardExpiryDays: form.rewardExpiryStr.trim()
        ? Number(form.rewardExpiryStr)
        : null,
      validFrom: new Date(form.validFrom).toISOString(),
      validTo: new Date(form.validTo).toISOString(),
      isActive: form.isActive,
    }
    const go = () => navigate('/referral-management/programs')
    if (isEdit && id) {
      update.mutate(
        { id, updates: payload },
        { onSuccess: go, onError: (err) => setError(errMsg(err)) },
      )
    } else {
      create.mutate(payload, {
        onSuccess: go,
        onError: (err) => setError(errMsg(err)),
      })
    }
  }

  const pending = create.isPending || update.isPending

  return (
    <PageWrapper>
      <PageHeader
        title={isEdit ? 'Edit referral program' : 'New referral program'}
        description="Configure referrer reward, new-user reward, eligibility, caps, and expiry."
        onBack={() => navigate('/referral-management/programs')}
      />
      <Card className="mt-4 max-w-3xl">
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block text-sm">
              <span className="font-medium">Name</span>
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.name ?? ''}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Launch referral"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="font-medium">Referrer reward (₹)</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.referrerReward ?? 0}
                  onChange={(e) => set('referrerReward', Number(e.target.value))}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">New-user reward (₹)</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.refereeReward ?? 0}
                  onChange={(e) => set('refereeReward', Number(e.target.value))}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="block text-sm">
                <span className="font-medium">Reward type</span>
                <select
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.rewardType}
                  onChange={(e) => set('rewardType', e.target.value)}
                >
                  <option value="WALLET">Wallet</option>
                  <option value="CREDIT">Credit</option>
                  <option value="PROMO">Promo</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium">Qualifying event</span>
                <select
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.qualifyingEvent}
                  onChange={(e) => set('qualifyingEvent', e.target.value)}
                >
                  <option value="FIRST_RIDE">First ride</option>
                  <option value="NTH_RIDE">Nth ride</option>
                  <option value="SIGNUP">Signup</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium">Qualifying threshold</span>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.qualifyingThreshold ?? 1}
                  onChange={(e) => set('qualifyingThreshold', Number(e.target.value))}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="font-medium">Max referrals per user</span>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded border px-3 py-2"
                  placeholder="Blank = unlimited"
                  value={form.maxReferralsStr}
                  onChange={(e) => set('maxReferralsStr', e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Reward expiry (days)</span>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded border px-3 py-2"
                  placeholder="Blank = no expiry"
                  value={form.rewardExpiryStr}
                  onChange={(e) => set('rewardExpiryStr', e.target.value)}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="font-medium">Valid from</span>
                <input
                  type="datetime-local"
                  required
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.validFrom.slice(0, 16)}
                  onChange={(e) => set('validFrom', e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Valid to</span>
                <input
                  type="datetime-local"
                  required
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.validTo.slice(0, 16)}
                  onChange={(e) => set('validTo', e.target.value)}
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive !== false}
                onChange={(e) => set('isActive', e.target.checked)}
              />
              Active
            </label>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={pending}>
                {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create program'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/referral-management/programs')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isEdit && id && existing && (
        <Card className="mt-4 max-w-3xl">
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm font-semibold">Milestones</p>
            {(existing.milestones ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">No milestones yet.</p>
            ) : (
              <ul className="space-y-2">
                {existing.milestones.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                  >
                    <span>
                      {m.name} — {m.requiredReferrals} refs → ₹{m.bonusAmount}
                      {!m.isActive ? (
                        <span className="ml-2 text-xs text-muted-foreground">(inactive)</span>
                      ) : null}
                    </span>
                    {m.isActive ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={deactivateMilestone.isPending}
                        onClick={() => deactivateMilestone.mutate(m.id)}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={activateMilestone.isPending}
                        onClick={() => activateMilestone.mutate(m.id)}
                      >
                        Activate
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-2">
              <input
                className="rounded border px-3 py-2 text-sm md:col-span-2"
                placeholder="Milestone name"
                value={milestone.name}
                onChange={(e) => setMilestone({ ...milestone, name: e.target.value })}
              />
              <input
                type="number"
                min={1}
                className="rounded border px-3 py-2 text-sm"
                placeholder="Required"
                value={milestone.requiredReferrals}
                onChange={(e) =>
                  setMilestone({ ...milestone, requiredReferrals: Number(e.target.value) })
                }
              />
              <input
                type="number"
                min={0}
                className="rounded border px-3 py-2 text-sm"
                placeholder="Bonus ₹"
                value={milestone.bonusAmount}
                onChange={(e) =>
                  setMilestone({ ...milestone, bonusAmount: Number(e.target.value) })
                }
              />
            </div>
            <Button
              type="button"
              disabled={addMilestone.isPending || !milestone.name.trim()}
              onClick={() =>
                addMilestone.mutate(
                  {
                    programId: id,
                    data: {
                      name: milestone.name.trim(),
                      requiredReferrals: milestone.requiredReferrals,
                      bonusAmount: milestone.bonusAmount,
                    },
                  },
                  {
                    onSuccess: () =>
                      setMilestone({ name: '', requiredReferrals: 5, bonusAmount: 100 }),
                  },
                )
              }
            >
              Add milestone
            </Button>
          </CardContent>
        </Card>
      )}
    </PageWrapper>
  )
}

export default ProgramFormPage
