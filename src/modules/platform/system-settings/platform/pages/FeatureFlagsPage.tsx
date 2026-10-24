import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/Table'
import { SearchInput } from '@/shared/components/SearchInput'
import { useToast } from '@/shared/context/toast'
import { useFeatureFlags, useUpdateFeatureFlags } from '@/modules/platform/system-settings/hooks'
import type { FeatureFlag, FeatureFlagStatus } from '@/modules/platform/system-settings/types'
import { SettingsError, SettingsFormActions, SettingsLoading } from '@/modules/platform/system-settings/components'

type FlagDraft = Pick<FeatureFlag, 'key' | 'status' | 'rolloutPercentage' | 'isActive'>
type FilterStatus = 'ALL' | 'ENABLED' | 'DISABLED'

export const FeatureFlagsPage: React.FC = () => {
  const { data, isLoading, isError } = useFeatureFlags()
  const { mutate: save, isPending } = useUpdateFeatureFlags()
  const { success, error } = useToast()
  const [drafts, setDrafts] = useState<FlagDraft[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL')

  useEffect(() => {
    if (!data) return
    setDrafts(
      data.map((flag) => ({
        key: flag.key,
        status: flag.status,
        rolloutPercentage: flag.rolloutPercentage,
        isActive: flag.isActive,
      })),
    )
  }, [data])

  const toggleStatus = (key: string) => {
    setDrafts((prev) =>
      prev.map((flag) => {
        if (flag.key !== key) return flag
        const isCurrentlyActive = flag.status === 'ON' || flag.status === 'PARTIAL'
        const nextStatus: FeatureFlagStatus = isCurrentlyActive ? 'OFF' : 'ON'
        return {
          ...flag,
          status: nextStatus,
          rolloutPercentage: nextStatus === 'ON' ? (flag.rolloutPercentage > 0 ? flag.rolloutPercentage : 100) : 0,
        }
      }),
    )
  }

  const setRollout = (key: string, rolloutPercentage: number) => {
    const clamped = Math.max(0, Math.min(100, rolloutPercentage))
    setDrafts((prev) =>
      prev.map((flag) => {
        if (flag.key !== key) return flag
        let nextStatus: FeatureFlagStatus = flag.status
        if (clamped === 100) {
          nextStatus = 'ON'
        } else if (clamped === 0) {
          nextStatus = 'OFF'
        } else {
          nextStatus = 'PARTIAL'
        }
        return {
          ...flag,
          rolloutPercentage: clamped,
          status: nextStatus,
        }
      }),
    )
  }

  const handleReset = () => {
    if (!data) return
    setDrafts(
      data.map((flag) => ({
        key: flag.key,
        status: flag.status,
        rolloutPercentage: flag.rolloutPercentage,
        isActive: flag.isActive,
      })),
    )
  }

  const flagMeta = useMemo(() => new Map((data ?? []).map((flag) => [flag.key, flag])), [data])

  const isDirty = useMemo(() => {
    if (!data) return false
    return drafts.some((draft) => {
      const original = data.find((f) => f.key === draft.key)
      if (!original) return false
      return (
        original.status !== draft.status ||
        Number(original.rolloutPercentage) !== Number(draft.rolloutPercentage)
      )
    })
  }, [drafts, data])

  const filteredDrafts = useMemo(() => {
    return drafts.filter((draft) => {
      const meta = flagMeta.get(draft.key)
      const q = search.trim().toLowerCase()
      const matchesSearch =
        !q ||
        draft.key.toLowerCase().includes(q) ||
        (meta?.name && meta.name.toLowerCase().includes(q)) ||
        (meta?.description && meta.description.toLowerCase().includes(q))

      const isEnabled = draft.status === 'ON' || draft.status === 'PARTIAL'
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ENABLED' && isEnabled) ||
        (statusFilter === 'DISABLED' && !isEnabled)

      return matchesSearch && matchesStatus
    })
  }, [drafts, flagMeta, search, statusFilter])

  const counts = useMemo(() => {
    const total = drafts.length
    const enabled = drafts.filter((d) => d.status === 'ON' || d.status === 'PARTIAL').length
    const disabled = total - enabled
    return { total, enabled, disabled }
  }, [drafts])

  const handleSave = () => {
    save(
      { flags: drafts },
      {
        onSuccess: () => success('Settings saved', 'Feature flags were updated successfully.'),
        onError: (err) =>
          error('Save failed', err instanceof Error ? err.message : 'Could not save settings'),
      },
    )
  }

  if (isLoading) return <SettingsLoading />
  if (isError || !data) return <SettingsError />

  return (
    <Card className="premium-card">
      <CardContent className="p-0">
        {/* Controls Bar: Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-b border-border bg-slate-50/50 dark:bg-slate-900/40">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search flags by name, key, or description..."
            className="w-full sm:max-w-md"
          />

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-white text-muted-foreground hover:bg-slate-100 border border-border dark:bg-slate-800 dark:hover:bg-slate-700'
              }`}
            >
              All ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ENABLED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'ENABLED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-muted-foreground hover:bg-slate-100 border border-border dark:bg-slate-800 dark:hover:bg-slate-700'
              }`}
            >
              Enabled ({counts.enabled})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DISABLED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'DISABLED'
                  ? 'bg-slate-600 text-white shadow-sm'
                  : 'bg-white text-muted-foreground hover:bg-slate-100 border border-border dark:bg-slate-800 dark:hover:bg-slate-700'
              }`}
            >
              Disabled ({counts.disabled})
            </button>
          </div>
        </div>

        {/* Flags Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[28%] min-w-[200px]">Flag</TableHead>
              <TableHead className="w-[44%] min-w-[260px]">Description</TableHead>
              <TableHead className="w-[14%] min-w-[130px]">Status</TableHead>
              <TableHead className="w-[14%] min-w-[120px]">Rollout %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDrafts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground whitespace-normal">
                  No feature flags match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredDrafts.map((draft) => {
                const meta = flagMeta.get(draft.key)
                const isEnabled = draft.status === 'ON' || draft.status === 'PARTIAL'

                return (
                  <TableRow key={draft.key}>
                    <TableCell className="align-top py-4">
                      <div>
                        <p className="font-semibold text-sm text-foreground">{meta?.name ?? draft.key}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5 tracking-tight">{draft.key}</p>
                      </div>
                    </TableCell>

                    <TableCell className="align-top py-4 whitespace-normal">
                      <p className="text-sm text-muted-foreground leading-relaxed break-words max-w-lg">
                        {meta?.description ?? '—'}
                      </p>
                    </TableCell>

                    <TableCell className="align-top py-4">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isEnabled}
                          onClick={() => toggleStatus(draft.key)}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                            draft.status === 'ON'
                              ? 'bg-emerald-600'
                              : draft.status === 'PARTIAL'
                                ? 'bg-amber-500'
                                : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            draft.status === 'ON'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                              : draft.status === 'PARTIAL'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {draft.status}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="align-top py-4">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={draft.rolloutPercentage}
                          onChange={(e) => setRollout(draft.key, Number(e.target.value) || 0)}
                          className="w-16 rounded-lg border border-input bg-white px-2.5 py-1 text-sm text-center font-medium shadow-sm focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
                          disabled={draft.status === 'OFF'}
                        />
                        <span className="text-xs font-medium text-muted-foreground">%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Footer Actions with Unsaved Changes Indicator & Discard */}
        <div className="p-4 sm:p-6 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
            <div className="text-xs text-muted-foreground">
              All settings are up to date.
            </div>
          )}

          <SettingsFormActions onSave={handleSave} isSaving={isPending} />
        </div>
      </CardContent>
    </Card>
  )
}

export default FeatureFlagsPage
