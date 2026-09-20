import React, { useEffect, useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { useToast } from '@/shared/context/toast'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/infrastructure/permissions'
import { createDefaultBundle, type ButtonVariant, type ButtonVariantSpec, type ComponentSpecs } from '@/design-system/tokens'
import { ColorTokenField, TokenGroupSection } from '../components'
import { useThemes, useUpdateTheme } from '../hooks'
import { componentsFormSchema, type ComponentsFormValues } from '../schemas'
import {
  buildUpdateThemeBody,
  findThemeRecord,
  resolveThemeComponents,
} from '../services'
import type { AppClient, AppColorScheme } from '../types'

const VARIANTS: ButtonVariant[] = [
  'primary',
  'secondary',
  'outline',
  'ghost',
  'danger',
  'success',
]

const appOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Driver', value: 'driver' },
  { label: 'Rider', value: 'rider' },
]

const schemeOptions = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
]

function normalizeVariant(spec: ComponentSpecs['button'][ButtonVariant]) {
  return {
    background: spec.background,
    backgroundHover: spec.backgroundHover ?? '',
    backgroundActive: spec.backgroundActive ?? '',
    backgroundDisabled: spec.backgroundDisabled ?? '',
    text: spec.text,
    textDisabled: spec.textDisabled ?? '',
    border: spec.border ?? '',
    borderRadius: spec.borderRadius,
    height: spec.height,
    fontSize: spec.fontSize,
    fontWeight: spec.fontWeight,
  }
}

function componentsToForm(
  app: AppClient,
  colorScheme: AppColorScheme,
  components: ComponentSpecs,
): ComponentsFormValues {
  return {
    app,
    colorScheme,
    button: {
      primary: normalizeVariant(components.button.primary),
      secondary: normalizeVariant(components.button.secondary),
      outline: normalizeVariant(components.button.outline),
      ghost: normalizeVariant(components.button.ghost),
      danger: normalizeVariant(components.button.danger),
      success: normalizeVariant(components.button.success),
    },
  }
}

export const ComponentStylesPage: React.FC = () => {
  const { user } = useAuthStore()
  const canWrite = hasPermission(user, 'settings:write')
  const { success, error } = useToast()
  const { data: themes = [], isLoading, isError } = useThemes()
  const updateTheme = useUpdateTheme()

  const defaults = useMemo(
    () =>
      componentsToForm(
        'admin',
        'light',
        createDefaultBundle('admin').theme.light.components,
      ),
    [],
  )

  const { control, register, handleSubmit, reset, formState: { isDirty } } =
    useForm<ComponentsFormValues>({
      resolver: zodResolver(componentsFormSchema),
      defaultValues: defaults,
    })

  const app = useWatch({ control, name: 'app' }) ?? 'admin'
  const colorScheme = useWatch({ control, name: 'colorScheme' }) ?? 'light'

  useEffect(() => {
    if (isLoading) return
    const record = findThemeRecord(themes, app, colorScheme)
    const components = resolveThemeComponents(record, app, colorScheme)
    reset(componentsToForm(app, colorScheme, components))
  }, [app, colorScheme, themes, isLoading, reset])

  const onSubmit = (values: ComponentsFormValues) => {
    const base = resolveThemeComponents(
      findThemeRecord(themes, values.app, values.colorScheme),
      values.app,
      values.colorScheme,
    )
    const cleanVariant = (
      variant: ComponentsFormValues['button'][ButtonVariant],
      fallback: ButtonVariantSpec,
    ): ButtonVariantSpec => ({
      background: variant.background || fallback.background,
      text: variant.text || fallback.text,
      borderRadius: variant.borderRadius ?? fallback.borderRadius,
      height: variant.height ?? fallback.height,
      fontSize: variant.fontSize ?? fallback.fontSize,
      fontWeight: variant.fontWeight || fallback.fontWeight,
      ...(variant.backgroundHover ? { backgroundHover: variant.backgroundHover } : {}),
      ...(variant.backgroundActive ? { backgroundActive: variant.backgroundActive } : {}),
      ...(variant.backgroundDisabled ? { backgroundDisabled: variant.backgroundDisabled } : {}),
      ...(variant.textDisabled ? { textDisabled: variant.textDisabled } : {}),
      ...(variant.border ? { border: variant.border } : {}),
    })
    const components: ComponentSpecs = {
      ...base,
      button: {
        primary: cleanVariant(values.button.primary, base.button.primary),
        secondary: cleanVariant(values.button.secondary, base.button.secondary),
        outline: cleanVariant(values.button.outline, base.button.outline),
        ghost: cleanVariant(values.button.ghost, base.button.ghost),
        danger: cleanVariant(values.button.danger, base.button.danger),
        success: cleanVariant(values.button.success, base.button.success),
      },
    }
    updateTheme.mutate(
      buildUpdateThemeBody(values.app, values.colorScheme, undefined, components),
      {
        onSuccess: () =>
          success('Components saved', `${values.app} ${values.colorScheme} button styles updated.`),
        onError: (err) =>
          error('Save failed', err instanceof Error ? err.message : 'Could not save components'),
      },
    )
  }

  if (isLoading) return <p className="py-8 text-sm text-slate-500">Loading component styles…</p>
  if (isError) return <p className="py-8 text-sm text-rose-600">Failed to load component styles.</p>

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-left dark:border-slate-700 dark:bg-slate-950/40"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        <Controller
          control={control}
          name="colorScheme"
          render={({ field }) => (
            <Select
              label="Color scheme"
              options={schemeOptions}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />
      </div>

      {VARIANTS.map((variant) => (
        <TokenGroupSection key={variant} title={`Button · ${variant}`}>
          <ColorTokenField
            control={control}
            name={`button.${variant}.background`}
            label="Background"
          />
          <ColorTokenField
            control={control}
            name={`button.${variant}.backgroundHover`}
            label="Background hover"
          />
          <ColorTokenField control={control} name={`button.${variant}.text`} label="Text" />
          <ColorTokenField control={control} name={`button.${variant}.border`} label="Border" />
          <Input
            type="number"
            label="Border radius"
            {...register(`button.${variant}.borderRadius`)}
          />
          <Input type="number" label="Height" {...register(`button.${variant}.height`)} />
          <Input type="number" label="Font size" {...register(`button.${variant}.fontSize`)} />
          <Input label="Font weight" {...register(`button.${variant}.fontWeight`)} />
        </TokenGroupSection>
      ))}

      <div className="flex justify-end border-t border-slate-200 pt-3 dark:border-slate-700">
        <Button
          type="submit"
          className="gap-1.5 text-xs"
          disabled={!canWrite || updateTheme.isPending || !isDirty}
          loading={updateTheme.isPending}
          icon={<Save className="h-3.5 w-3.5" />}
        >
          Save components
        </Button>
      </div>
    </form>
  )
}

export default ComponentStylesPage
