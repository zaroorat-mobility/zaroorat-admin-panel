import React, { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueries } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { useToast } from '@/shared/context/toast'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import { stringsEn } from '@/design-system/tokens'
import { TranslationGrid } from '../components'
import { getTranslations } from '../api'
import { appConfigKey, useLocales, useUpsertTranslations } from '../hooks'
import { translationsFormSchema, type TranslationsFormValues } from '../schemas'
import type { AppClient } from '../types'

const appOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Driver', value: 'driver' },
  { label: 'Rider', value: 'rider' },
]

const bundledKeys = Object.keys(stringsEn)

export const TranslationsPage: React.FC = () => {
  const { user } = useAuthStore()
  const canWrite = hasPermission(user, 'settings:write')
  const { success, error } = useToast()
  const [search, setSearch] = useState('')
  const { data: localeRecords = [], isLoading: localesLoading } = useLocales()
  const upsert = useUpsertTranslations()

  const { control, handleSubmit, watch, setValue, reset } = useForm<TranslationsFormValues>({
    resolver: zodResolver(translationsFormSchema),
    defaultValues: { app: 'driver', entries: {} },
  })

  const app = (watch('app') ?? 'driver') as AppClient
  const entries = watch('entries') ?? {}
  const localeCodes = useMemo(
    () => (localeRecords.length > 0 ? localeRecords.map((l) => l.code) : ['en']),
    [localeRecords],
  )

  const translationQueries = useQueries({
    queries: localeCodes.map((locale) => ({
      queryKey: [...appConfigKey, 'translations', app, locale],
      queryFn: () => getTranslations(app, locale),
      enabled: !localesLoading,
    })),
  })

  const loadingTranslations = translationQueries.some((q) => q.isLoading)
  const translationsError = translationQueries.some((q) => q.isError)

  useEffect(() => {
    if (localesLoading || loadingTranslations) return
    const next: Record<string, Record<string, string>> = {}
    for (const key of bundledKeys) {
      next[key] = {}
      for (const locale of localeCodes) next[key][locale] = ''
    }
    translationQueries.forEach((query, index) => {
      const locale = localeCodes[index]
      for (const row of query.data ?? []) {
        if (!next[row.key]) {
          next[row.key] = {}
          for (const code of localeCodes) next[row.key][code] = ''
        }
        next[row.key][locale] = row.value
      }
    })
    reset({ app, entries: next })
    // Intentionally depend on settled query data fingerprints
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    app,
    localesLoading,
    loadingTranslations,
    localeCodes.join(','),
    translationQueries.map((q) => q.dataUpdatedAt).join(','),
    reset,
  ])

  const keys = useMemo(() => Object.keys(entries).sort(), [entries])

  const onCellChange = (key: string, locale: string, value: string) => {
    setValue(`entries.${key}.${locale}`, value, { shouldDirty: true })
  }

  const onSubmit = async (values: TranslationsFormValues) => {
    try {
      for (const locale of localeCodes) {
        const localeEntries = keys
          .map((key) => ({
            key,
            value: values.entries[key]?.[locale] ?? '',
          }))
          .filter((entry) => entry.value.trim().length > 0)
        if (localeEntries.length === 0) continue
        await upsert.mutateAsync({
          app: values.app,
          locale,
          entries: localeEntries,
        })
      }
      success('Translations saved', `Updated strings for ${values.app}.`)
    } catch (err) {
      error('Save failed', err instanceof Error ? err.message : 'Could not save translations')
    }
  }

  if (localesLoading || loadingTranslations) {
    return <p className="py-8 text-sm text-slate-500">Loading translations…</p>
  }

  if (translationsError) {
    return <p className="py-8 text-sm text-rose-600">Failed to load translations.</p>
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-left dark:border-slate-700 dark:bg-slate-950/40"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Controller
          control={control}
          name="app"
          render={({ field }) => (
            <Select
              label="App"
              options={appOptions}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />
        <Input
          label="Search keys"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="auth.login.title"
        />
      </div>

      <TranslationGrid
        keys={keys}
        locales={localeCodes}
        values={entries}
        search={search}
        disabled={!canWrite}
        onChange={onCellChange}
      />

      <div className="flex justify-end border-t border-slate-200 pt-3 dark:border-slate-700">
        <Button
          type="submit"
          className="gap-1.5 text-xs"
          disabled={!canWrite || upsert.isPending}
          loading={upsert.isPending}
          icon={<Save className="h-3.5 w-3.5" />}
        >
          Save translations
        </Button>
      </div>
    </form>
  )
}

export default TranslationsPage
