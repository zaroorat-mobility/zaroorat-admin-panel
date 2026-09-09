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
import { createDefaultBundle, type ThemeTokens } from '@/design-system/tokens'
import {
  ColorTokenField,
  PublishBar,
  ThemePreview,
  TokenGroupSection,
} from '../components'
import { useThemes, useUpdateTheme } from '../hooks'
import { themeFormSchema, type ThemeFormValues } from '../schemas'
import {
  buildUpdateThemeBody,
  findThemeRecord,
  resolveThemeTokens,
} from '../services'
import type { AppClient, AppColorScheme } from '../types'

function tokensToFormValues(
  app: AppClient,
  colorScheme: AppColorScheme,
  tokens: ThemeTokens,
): ThemeFormValues {
  return {
    app,
    colorScheme,
    colors: {
      brand: tokens.colors.brand,
      semantic: tokens.colors.semantic,
      surface: tokens.colors.surface,
      sidebar: tokens.colors.sidebar,
      chart: tokens.colors.chart,
    },
    typographySize: { ...tokens.typography.size },
    radii: {
      sm: tokens.radii.sm,
      md: tokens.radii.md,
      lg: tokens.radii.lg,
      xl: tokens.radii.xl,
    },
  }
}

function formValuesToTokens(values: ThemeFormValues, base: ThemeTokens): ThemeTokens {
  return {
    ...base,
    colors: {
      ...base.colors,
      brand: { ...base.colors.brand, ...values.colors.brand },
      semantic: { ...base.colors.semantic, ...values.colors.semantic },
      surface: { ...base.colors.surface, ...values.colors.surface },
      sidebar: { ...base.colors.sidebar, ...values.colors.sidebar },
      chart: { ...base.colors.chart, ...values.colors.chart },
    },
    typography: {
      ...base.typography,
      size: { ...base.typography.size, ...values.typographySize },
    },
    radii: {
      ...base.radii,
      ...values.radii,
    },
  }
}

const appOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Driver', value: 'driver' },
  { label: 'Rider', value: 'rider' },
]

const schemeOptions = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
]

export const ThemeSettingsPage: React.FC = () => {
  const { user } = useAuthStore()
  const canWrite = hasPermission(user, 'settings:write')
  const { success, error } = useToast()
  const { data: themes = [], isLoading, isError } = useThemes()
  const updateTheme = useUpdateTheme()

  const defaults = useMemo(
    () => tokensToFormValues('admin', 'light', createDefaultBundle('admin').theme.light.tokens),
    [],
  )

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<ThemeFormValues>({
    resolver: zodResolver(themeFormSchema),
    defaultValues: defaults,
  })

  const app = useWatch({ control, name: 'app' }) ?? 'admin'
  const colorScheme = useWatch({ control, name: 'colorScheme' }) ?? 'light'
  const draftColors = useWatch({ control, name: 'colors' })
  const draftRadii = useWatch({ control, name: 'radii' })
  const draftType = useWatch({ control, name: 'typographySize' })

  useEffect(() => {
    if (isLoading) return
    const record = findThemeRecord(themes, app, colorScheme)
    const tokens = resolveThemeTokens(record, app, colorScheme)
    reset(tokensToFormValues(app, colorScheme, tokens))
  }, [app, colorScheme, themes, isLoading, reset])

  const onSubmit = (values: ThemeFormValues) => {
    const base = resolveThemeTokens(
      findThemeRecord(themes, values.app, values.colorScheme),
      values.app,
      values.colorScheme,
    )
    const tokens = formValuesToTokens(values, base)
    updateTheme.mutate(buildUpdateThemeBody(values.app, values.colorScheme, tokens), {
      onSuccess: () => success('Theme saved', `${values.app} ${values.colorScheme} tokens updated.`),
      onError: (err) =>
        error('Save failed', err instanceof Error ? err.message : 'Could not save theme'),
    })
  }

  if (isLoading) {
    return <p className="py-8 text-sm text-slate-500">Loading themes…</p>
  }

  if (isError) {
    return <p className="py-8 text-sm text-rose-600">Failed to load themes.</p>
  }

  return (
    <div className="space-y-4 text-left">
      <PublishBar app={app} colorScheme={colorScheme} />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/40"
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

        {draftColors && draftRadii && draftType ? (
          <ThemePreview
            draft={{ colors: draftColors, radii: draftRadii, typographySize: draftType }}
          />
        ) : null}

        <TokenGroupSection title="Brand colors" description="Primary brand palette">
          <ColorTokenField control={control} name="colors.brand.primary" label="Primary" />
          <ColorTokenField control={control} name="colors.brand.primaryHover" label="Primary hover" />
          <ColorTokenField control={control} name="colors.brand.primaryActive" label="Primary active" />
          <ColorTokenField control={control} name="colors.brand.onPrimary" label="On primary" />
          <ColorTokenField control={control} name="colors.brand.primaryLight" label="Primary light" />
        </TokenGroupSection>

        <TokenGroupSection title="Semantic colors">
          <ColorTokenField control={control} name="colors.semantic.success" label="Success" />
          <ColorTokenField control={control} name="colors.semantic.successSurface" label="Success surface" />
          <ColorTokenField control={control} name="colors.semantic.warning" label="Warning" />
          <ColorTokenField control={control} name="colors.semantic.warningSurface" label="Warning surface" />
          <ColorTokenField control={control} name="colors.semantic.danger" label="Danger" />
          <ColorTokenField control={control} name="colors.semantic.dangerSurface" label="Danger surface" />
          <ColorTokenField control={control} name="colors.semantic.info" label="Info" />
          <ColorTokenField control={control} name="colors.semantic.infoSurface" label="Info surface" />
        </TokenGroupSection>

        <TokenGroupSection title="Surface colors">
          <ColorTokenField control={control} name="colors.surface.background" label="Background" />
          <ColorTokenField control={control} name="colors.surface.foreground" label="Foreground" />
          <ColorTokenField control={control} name="colors.surface.card" label="Card" />
          <ColorTokenField control={control} name="colors.surface.muted" label="Muted" />
          <ColorTokenField control={control} name="colors.surface.mutedForeground" label="Muted foreground" />
          <ColorTokenField control={control} name="colors.surface.accent" label="Accent" />
          <ColorTokenField control={control} name="colors.surface.accentForeground" label="Accent foreground" />
          <ColorTokenField control={control} name="colors.surface.border" label="Border" />
          <ColorTokenField control={control} name="colors.surface.input" label="Input" />
          <ColorTokenField control={control} name="colors.surface.ring" label="Ring" />
          <ColorTokenField control={control} name="colors.surface.popover" label="Popover" />
          <ColorTokenField control={control} name="colors.surface.popoverForeground" label="Popover foreground" />
        </TokenGroupSection>

        <TokenGroupSection title="Sidebar colors">
          <ColorTokenField control={control} name="colors.sidebar.background" label="Background" />
          <ColorTokenField control={control} name="colors.sidebar.foreground" label="Foreground" />
          <ColorTokenField control={control} name="colors.sidebar.primary" label="Primary" />
          <ColorTokenField control={control} name="colors.sidebar.primaryForeground" label="Primary foreground" />
          <ColorTokenField control={control} name="colors.sidebar.accent" label="Accent" />
          <ColorTokenField control={control} name="colors.sidebar.accentForeground" label="Accent foreground" />
          <ColorTokenField control={control} name="colors.sidebar.border" label="Border" />
          <ColorTokenField control={control} name="colors.sidebar.ring" label="Ring" />
        </TokenGroupSection>

        <TokenGroupSection title="Chart colors">
          <ColorTokenField control={control} name="colors.chart.chart1" label="Chart 1" />
          <ColorTokenField control={control} name="colors.chart.chart2" label="Chart 2" />
          <ColorTokenField control={control} name="colors.chart.chart3" label="Chart 3" />
          <ColorTokenField control={control} name="colors.chart.chart4" label="Chart 4" />
          <ColorTokenField control={control} name="colors.chart.chart5" label="Chart 5" />
        </TokenGroupSection>

        <TokenGroupSection title="Typography sizes (px)" description="Font size scale">
          {(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const).map((key) => (
            <Input
              key={key}
              type="number"
              label={key}
              {...register(`typographySize.${key}`)}
            />
          ))}
        </TokenGroupSection>

        <TokenGroupSection title="Radii (px)">
          {(['sm', 'md', 'lg', 'xl'] as const).map((key) => (
            <Input key={key} type="number" label={key} {...register(`radii.${key}`)} />
          ))}
        </TokenGroupSection>

        <div className="flex justify-end border-t border-slate-200 pt-3 dark:border-slate-700">
          <Button
            type="submit"
            className="gap-1.5 text-xs"
            disabled={!canWrite || updateTheme.isPending || !isDirty}
            loading={updateTheme.isPending}
            icon={<Save className="h-3.5 w-3.5" />}
          >
            Save theme
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ThemeSettingsPage
