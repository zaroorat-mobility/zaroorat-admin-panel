import React, { useMemo, useState } from 'react'
import { Search, X, Check } from 'lucide-react'
import { cn } from '@/shared/utils'

export type MultiCheckOption = {
  value: string
  label: string
  hint?: string
}

type MultiCheckPickerProps = {
  label: string
  options: MultiCheckOption[]
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  emptyHint?: string
  className?: string
}

export const MultiCheckPicker: React.FC<MultiCheckPickerProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Search…',
  emptyHint = 'None selected = all',
  className,
}) => {
  const [query, setQuery] = useState('')
  const selected = new Set(value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q) ||
        (o.hint?.toLowerCase().includes(q) ?? false),
    )
  }, [options, query])

  const toggle = (id: string) => {
    if (selected.has(id)) onChange(value.filter((v) => v !== id))
    else onChange([...value, id])
  }

  const selectAllFiltered = () => {
    const next = new Set(value)
    for (const o of filtered) next.add(o.value)
    onChange(Array.from(next))
  }

  const clearAll = () => onChange([])

  const selectedOptions = options.filter((o) => selected.has(o.value))

  return (
    <div className={cn('space-y-2 text-sm', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{label}</span>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            className="text-primary hover:underline disabled:opacity-40"
            disabled={filtered.length === 0}
            onClick={selectAllFiltered}
          >
            Select {query.trim() ? 'filtered' : 'all'}
          </button>
          <span className="text-muted-foreground">·</span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground hover:underline disabled:opacity-40"
            disabled={value.length === 0}
            onClick={clearAll}
          >
            Clear
          </button>
        </div>
      </div>

      {selectedOptions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => toggle(o.value)}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium hover:bg-primary/15"
              title="Remove"
            >
              {o.label}
              <X className="h-3 w-3 opacity-70" />
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{emptyHint}</p>
      )}

      <div className="rounded-lg border border-border bg-slate-50/80 dark:bg-slate-950 overflow-hidden">
        <div className="flex items-center gap-2 px-2.5 py-2 border-b border-border bg-white dark:bg-slate-900">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
          {query ? (
            <button type="button" onClick={() => setQuery('')} className="text-muted-foreground p-0.5">
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <ul className="max-h-44 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <li className="px-3 py-4 text-xs text-center text-muted-foreground">No matches</li>
          ) : (
            filtered.map((o) => {
              const checked = selected.has(o.value)
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => toggle(o.value)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white dark:hover:bg-slate-900 transition-colors',
                      checked && 'bg-primary/5',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                        checked
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-white dark:bg-slate-900',
                      )}
                    >
                      {checked ? <Check className="h-3 w-3" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium truncate">{o.label}</span>
                      {o.hint ? (
                        <span className="block text-[10px] text-muted-foreground truncate">{o.hint}</span>
                      ) : null}
                    </span>
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </div>

      <p className="text-[10px] text-muted-foreground">
        {value.length} selected
        {options.length ? ` of ${options.length}` : ''}
      </p>
    </div>
  )
}
