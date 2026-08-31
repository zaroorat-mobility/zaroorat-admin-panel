import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/shared/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/Table'
import { useToast } from '@/shared/context/toast'
import { useFeatureFlags, useUpdateFeatureFlags } from '@/modules/platform/system-settings/hooks'
import type { FeatureFlag, FeatureFlagStatus } from '@/modules/platform/system-settings/types'
import { SettingsError, SettingsFormActions, SettingsLoading } from '@/modules/platform/system-settings/components'

type FlagDraft = Pick<FeatureFlag, 'key' | 'status' | 'rolloutPercentage' | 'isActive'>

export const FeatureFlagsPage: React.FC = () => {
  const { data, isLoading, isError } = useFeatureFlags()
  const { mutate: save, isPending } = useUpdateFeatureFlags()
  const { success, error } = useToast()
  const [drafts, setDrafts] = useState<FlagDraft[]>([])

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
      prev.map((flag) =>
        flag.key === key
          ? { ...flag, status: flag.status === 'ON' ? 'OFF' : ('ON' as FeatureFlagStatus) }
          : flag,
      ),
    )
  }

  const setRollout = (key: string, rolloutPercentage: number) => {
    setDrafts((prev) =>
      prev.map((flag) => (flag.key === key ? { ...flag, rolloutPercentage } : flag)),
    )
  }

  const handleSave = () => {
    save(
      { flags: drafts },
      {
        onSuccess: () => success('Settings saved', 'Feature flags were updated.'),
        onError: (err) =>
          error('Save failed', err instanceof Error ? err.message : 'Could not save settings'),
      },
    )
  }

  if (isLoading) return <SettingsLoading />
  if (isError || !data) return <SettingsError />

  const flagMeta = new Map(data.map((flag) => [flag.key, flag]))

  return (
    <Card className="premium-card">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Flag</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rollout %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drafts.map((draft) => {
              const meta = flagMeta.get(draft.key)
              return (
                <TableRow key={draft.key}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{meta?.name ?? draft.key}</p>
                      <p className="text-xs text-muted-foreground font-mono">{draft.key}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs whitespace-normal">
                    <p className="text-sm text-muted-foreground">{meta?.description ?? '—'}</p>
                  </TableCell>
                  <TableCell>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.status === 'ON'}
                        onChange={() => toggleStatus(draft.key)}
                        className="rounded border-border"
                      />
                      <span className={draft.status === 'ON' ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}>
                        {draft.status}
                      </span>
                    </label>
                  </TableCell>
                  <TableCell>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={draft.rolloutPercentage}
                      onChange={(e) => setRollout(draft.key, Number(e.target.value) || 0)}
                      className="w-20 rounded-lg border border-input bg-white px-2 py-1 text-sm dark:bg-slate-900"
                      disabled={draft.status !== 'PARTIAL' && draft.status !== 'ON'}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <div className="p-6">
          <SettingsFormActions onSave={handleSave} isSaving={isPending} />
        </div>
      </CardContent>
    </Card>
  )
}

export default FeatureFlagsPage
