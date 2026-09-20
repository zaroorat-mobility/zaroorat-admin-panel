import React, { useMemo } from 'react'
import { Input } from '@/shared/components/ui/Input'

export interface TranslationGridProps {
  keys: string[]
  locales: string[]
  values: Record<string, Record<string, string>>
  onChange: (key: string, locale: string, value: string) => void
  search?: string
  disabled?: boolean
}

export const TranslationGrid: React.FC<TranslationGridProps> = ({
  keys,
  locales,
  values,
  onChange,
  search = '',
  disabled = false,
}) => {
  const filteredKeys = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return keys
    return keys.filter((key) => {
      if (key.toLowerCase().includes(q)) return true
      return locales.some((locale) => (values[key]?.[locale] ?? '').toLowerCase().includes(q))
    })
  }, [keys, locales, search, values])

  if (filteredKeys.length === 0) {
    return <p className="py-6 text-sm text-slate-500">No translation keys match your search.</p>
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="min-w-full border-collapse text-left text-xs">
        <thead className="bg-slate-50 dark:bg-slate-800/80">
          <tr>
            <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2 font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Key
            </th>
            {locales.map((locale) => (
              <th
                key={locale}
                className="min-w-[180px] px-3 py-2 font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
              >
                {locale}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredKeys.map((key) => (
            <tr key={key} className="border-t border-slate-100 dark:border-slate-800">
              <td className="sticky left-0 z-10 bg-white px-3 py-2 font-mono text-[11px] text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {key}
              </td>
              {locales.map((locale) => (
                <td key={`${key}-${locale}`} className="px-2 py-1.5">
                  <Input
                    value={values[key]?.[locale] ?? ''}
                    disabled={disabled}
                    onChange={(e) => onChange(key, locale, e.target.value)}
                    className="h-8 text-xs"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
