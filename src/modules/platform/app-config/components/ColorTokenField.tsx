import React from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Input } from '@/shared/components/ui/Input'
import { cn } from '@/shared/utils'

interface ColorTokenFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
  className?: string
}

export function ColorTokenField<T extends FieldValues>({
  control,
  name,
  label,
  className,
}: ColorTokenFieldProps<T>): React.ReactElement {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value = typeof field.value === 'string' ? field.value : '#000000'
        const pickerValue = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#000000'
        return (
          <div className={cn('space-y-1.5', className)}>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {label}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={pickerValue}
                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                className="h-9 w-10 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900"
                aria-label={`${label} color picker`}
              />
              <Input
                value={value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                className="font-mono text-xs"
              />
            </div>
          </div>
        )
      }}
    />
  )
}
