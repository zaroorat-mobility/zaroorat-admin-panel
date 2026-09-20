import React, { useEffect, useMemo } from 'react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { useToast } from '@/shared/context/toast'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import { defaultFonts, type AppFontSpec } from '@/design-system/tokens'
import { useFonts, useUpdateFonts } from '../hooks'
import { fontsFormSchema, type FontsFormValues } from '../schemas'
import { buildUpdateFontsBody, mapFontRecordsToSpecs } from '../services'
import type { AppClient } from '../types'

const appOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Driver', value: 'driver' },
  { label: 'Rider', value: 'rider' },
]

const sourceOptions = [
  { label: 'Bundled', value: 'bundled' },
  { label: 'Google', value: 'google' },
  { label: 'Remote', value: 'remote' },
]

const styleOptions = [
  { label: 'Normal', value: 'normal' },
  { label: 'Italic', value: 'italic' },
]

export const FontsSettingsPage: React.FC = () => {
  const { user } = useAuthStore()
  const canWrite = hasPermission(user, 'settings:write')
  const { success, error } = useToast()

  const { control, register, handleSubmit, reset, setValue } = useForm<FontsFormValues>({
    resolver: zodResolver(fontsFormSchema),
    defaultValues: { app: 'admin', fonts: defaultFonts },
  })

  const app = (useWatch({ control, name: 'app' }) ?? 'admin') as AppClient
  const { data: fontRecords = [], isLoading, isError } = useFonts(app)
  const updateFonts = useUpdateFonts()
  const { fields, append, remove } = useFieldArray({ control, name: 'fonts' })

  const mapped = useMemo(() => mapFontRecordsToSpecs(fontRecords), [fontRecords])

  useEffect(() => {
    if (isLoading) return
    reset({
      app,
      fonts: mapped.length > 0 ? mapped : defaultFonts,
    })
  }, [app, mapped, isLoading, reset])

  const onSubmit = (values: FontsFormValues) => {
    const cleaned: AppFontSpec[] = values.fonts.map((f) => ({
      family: f.family ?? 'Inter',
      weight: f.weight ?? '400',
      style: f.style ?? 'normal',
      source: f.source ?? 'bundled',
      url: f.url === '' || f.url == null ? null : f.url,
      isActive: f.isActive ?? true,
    }))
    updateFonts.mutate(buildUpdateFontsBody(values.app, cleaned), {
      onSuccess: () => success('Fonts saved', `${values.app} font list updated.`),
      onError: (err) =>
        error('Save failed', err instanceof Error ? err.message : 'Could not save fonts'),
    })
  }

  if (isLoading) return <p className="py-8 text-sm text-slate-500">Loading fonts…</p>
  if (isError) return <p className="py-8 text-sm text-rose-600">Failed to load fonts.</p>

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-left dark:border-slate-700 dark:bg-slate-950/40"
    >
      <Controller
        control={control}
        name="app"
        render={({ field }) => (
          <div className="max-w-xs">
            <Select
              label="App"
              options={appOptions}
              value={field.value}
              onChange={(e) => {
                field.onChange(e.target.value)
                setValue('app', e.target.value as AppClient)
              }}
            />
          </div>
        )}
      />

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-3"
          >
            <Input label="Family" {...register(`fonts.${index}.family`)} />
            <Input label="Weight" {...register(`fonts.${index}.weight`)} />
            <Controller
              control={control}
              name={`fonts.${index}.style`}
              render={({ field: styleField }) => (
                <Select
                  label="Style"
                  options={styleOptions}
                  value={styleField.value}
                  onChange={(e) => styleField.onChange(e.target.value)}
                />
              )}
            />
            <Controller
              control={control}
              name={`fonts.${index}.source`}
              render={({ field: sourceField }) => (
                <Select
                  label="Source"
                  options={sourceOptions}
                  value={sourceField.value}
                  onChange={(e) => sourceField.onChange(e.target.value)}
                />
              )}
            />
            <Input label="URL (optional)" {...register(`fonts.${index}.url`)} />
            <label className="flex items-center gap-2 pt-6 text-xs font-semibold text-slate-600">
              <input type="checkbox" {...register(`fonts.${index}.isActive`)} />
              Active
            </label>
            <div className="flex items-end sm:col-span-2 lg:col-span-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1 text-xs text-rose-600"
                disabled={!canWrite || fields.length <= 1}
                onClick={() => remove(index)}
                icon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          disabled={!canWrite}
          onClick={() =>
            append({
              family: 'Inter',
              weight: '400',
              style: 'normal',
              source: 'bundled',
              url: null,
              isActive: true,
            })
          }
          icon={<Plus className="h-3.5 w-3.5" />}
        >
          Add font
        </Button>
        <Button
          type="submit"
          className="gap-1.5 text-xs"
          disabled={!canWrite || updateFonts.isPending}
          loading={updateFonts.isPending}
          icon={<Save className="h-3.5 w-3.5" />}
        >
          Save fonts
        </Button>
      </div>
    </form>
  )
}

export default FontsSettingsPage
