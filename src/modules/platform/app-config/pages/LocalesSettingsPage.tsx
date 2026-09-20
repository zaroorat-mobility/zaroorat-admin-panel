import React, { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { useToast } from '@/shared/context/toast'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import { defaultLocales } from '@/design-system/tokens'
import { useLocales, useUpdateLocale } from '../hooks'
import { localesFormSchema, type LocalesFormValues } from '../schemas'

export const LocalesSettingsPage: React.FC = () => {
  const { user } = useAuthStore()
  const canWrite = hasPermission(user, 'settings:write')
  const { success, error } = useToast()
  const { data: localeRecords = [], isLoading, isError } = useLocales()
  const updateLocale = useUpdateLocale()

  const { control, register, handleSubmit, reset } = useForm<LocalesFormValues>({
    resolver: zodResolver(localesFormSchema),
    defaultValues: { locales: defaultLocales },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'locales' })

  useEffect(() => {
    if (isLoading) return
    reset({
      locales:
        localeRecords.length > 0
          ? localeRecords.map((l) => ({
              code: l.code,
              label: l.label,
              nativeLabel: l.nativeLabel,
              isRtl: l.isRtl,
              isActive: l.isActive,
              isDefault: l.isDefault,
              sortOrder: l.sortOrder,
            }))
          : defaultLocales,
    })
  }, [localeRecords, isLoading, reset])

  const onSubmit = async (values: LocalesFormValues) => {
    try {
      for (const locale of values.locales) {
        await updateLocale.mutateAsync({
          code: locale.code ?? '',
          label: locale.label ?? '',
          nativeLabel: locale.nativeLabel ?? '',
          isRtl: locale.isRtl ?? false,
          isActive: locale.isActive ?? true,
          isDefault: locale.isDefault ?? false,
          sortOrder: locale.sortOrder ?? 0,
        })
      }
      success('Locales saved', `${values.locales.length} locale(s) upserted.`)
    } catch (err) {
      error('Save failed', err instanceof Error ? err.message : 'Could not save locales')
    }
  }

  if (isLoading) return <p className="py-8 text-sm text-slate-500">Loading locales…</p>
  if (isError) return <p className="py-8 text-sm text-rose-600">Failed to load locales.</p>

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-left dark:border-slate-700 dark:bg-slate-950/40"
    >
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Input label="Code" {...register(`locales.${index}.code`)} />
            <Input label="Label" {...register(`locales.${index}.label`)} />
            <Input label="Native label" {...register(`locales.${index}.nativeLabel`)} />
            <Input
              type="number"
              label="Sort order"
              {...register(`locales.${index}.sortOrder`)}
            />
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <input type="checkbox" {...register(`locales.${index}.isRtl`)} />
              RTL
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <input type="checkbox" {...register(`locales.${index}.isActive`)} />
              Active
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <input type="checkbox" {...register(`locales.${index}.isDefault`)} />
              Default
            </label>
            <div className="flex items-center">
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
              code: '',
              label: '',
              nativeLabel: '',
              isRtl: false,
              isActive: true,
              isDefault: false,
              sortOrder: fields.length,
            })
          }
          icon={<Plus className="h-3.5 w-3.5" />}
        >
          Add locale
        </Button>
        <Button
          type="submit"
          className="gap-1.5 text-xs"
          disabled={!canWrite || updateLocale.isPending}
          loading={updateLocale.isPending}
          icon={<Save className="h-3.5 w-3.5" />}
        >
          Save locales
        </Button>
      </div>
    </form>
  )
}

export default LocalesSettingsPage
