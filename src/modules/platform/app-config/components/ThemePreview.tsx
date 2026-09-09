import React from 'react'
import type { ThemeFormValues } from '../schemas'

interface ThemePreviewProps {
  draft: Pick<ThemeFormValues, 'colors' | 'radii' | 'typographySize'>
}

/**
 * Live preview using inline styles from draft tokens — never touches live CSS vars,
 * so the admin chrome stays safe while editing.
 */
export const ThemePreview: React.FC<ThemePreviewProps> = ({ draft }) => {
  const { colors, radii, typographySize } = draft
  const radius = `${radii.md}px`
  const fontSize = `${typographySize.md}px`

  return (
    <div
      className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
      style={{ backgroundColor: colors.surface.background, color: colors.surface.foreground }}
    >
      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Live preview (draft only)
      </p>
      <div className="space-y-3">
        <div
          style={{
            backgroundColor: colors.surface.card,
            border: `1px solid ${colors.surface.border}`,
            borderRadius: `${radii.lg}px`,
            padding: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <p style={{ fontSize: `${typographySize.lg}px`, fontWeight: 700, marginBottom: 8 }}>
            Sample card
          </p>
          <p style={{ fontSize, color: colors.surface.mutedForeground, marginBottom: 12 }}>
            Preview uses draft tokens with inline styles — editor chrome is unchanged.
          </p>
          <input
            readOnly
            value="Sample input"
            style={{
              width: '100%',
              height: 36,
              borderRadius: radius,
              border: `1px solid ${colors.surface.input}`,
              backgroundColor: colors.surface.card,
              color: colors.surface.foreground,
              padding: '0 12px',
              fontSize,
              marginBottom: 12,
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              style={{
                height: 36,
                padding: '0 14px',
                borderRadius: radius,
                border: 'none',
                backgroundColor: colors.brand.primary,
                color: colors.brand.onPrimary,
                fontSize,
                fontWeight: 600,
              }}
            >
              Primary
            </button>
            <button
              type="button"
              style={{
                height: 36,
                padding: '0 14px',
                borderRadius: radius,
                border: `1px solid ${colors.surface.border}`,
                backgroundColor: colors.surface.muted,
                color: colors.surface.foreground,
                fontSize,
                fontWeight: 600,
              }}
            >
              Secondary
            </button>
            <button
              type="button"
              style={{
                height: 36,
                padding: '0 14px',
                borderRadius: radius,
                border: 'none',
                backgroundColor: colors.semantic.danger,
                color: '#FFFFFF',
                fontSize,
                fontWeight: 600,
              }}
            >
              Danger
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['chart1', 'chart2', 'chart3', 'chart4', 'chart5'] as const).map((key) => (
            <span
              key={key}
              className="inline-flex h-6 items-center rounded-full px-2 text-[10px] font-semibold text-white"
              style={{ backgroundColor: colors.chart[key] }}
            >
              {key}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
