import type { ThemeTokens } from '@/design-system/tokens'

function setVar(el: HTMLElement, name: string, value: string | number): void {
  el.style.setProperty(name, typeof value === 'number' ? String(value) : value)
}

/**
 * Maps ThemeTokens onto the CSS custom properties defined in `src/styles/theme.css`.
 */
export function applyCssVariables(
  tokens: ThemeTokens,
  target: HTMLElement = document.documentElement,
): void {
  const { colors, radii } = tokens
  const { brand, semantic, surface, sidebar, chart } = colors

  setVar(target, '--primary', brand.primary)
  setVar(target, '--primary-hover', brand.primaryHover)
  setVar(target, '--primary-active', brand.primaryActive)
  setVar(target, '--primary-foreground', brand.onPrimary)

  setVar(target, '--background', surface.background)
  setVar(target, '--foreground', surface.foreground)
  setVar(target, '--card', surface.card)
  setVar(target, '--card-foreground', surface.foreground)
  setVar(target, '--popover', surface.popover)
  setVar(target, '--popover-foreground', surface.popoverForeground)

  setVar(target, '--secondary', surface.muted)
  setVar(target, '--secondary-foreground', surface.foreground)
  setVar(target, '--muted', surface.muted)
  setVar(target, '--muted-foreground', surface.mutedForeground)
  setVar(target, '--accent', surface.accent)
  setVar(target, '--accent-foreground', surface.accentForeground)

  setVar(target, '--destructive', semantic.danger)
  setVar(target, '--destructive-foreground', brand.onPrimary)

  setVar(target, '--border', surface.border)
  setVar(target, '--input', surface.input)
  setVar(target, '--input-background', surface.background)
  setVar(target, '--ring', surface.ring)

  setVar(target, '--chart-1', chart.chart1)
  setVar(target, '--chart-2', chart.chart2)
  setVar(target, '--chart-3', chart.chart3)
  setVar(target, '--chart-4', chart.chart4)
  setVar(target, '--chart-5', chart.chart5)

  setVar(target, '--radius', `${radii.lg}px`)

  setVar(target, '--sidebar', sidebar.background)
  setVar(target, '--sidebar-foreground', sidebar.foreground)
  setVar(target, '--sidebar-primary', sidebar.primary)
  setVar(target, '--sidebar-primary-foreground', sidebar.primaryForeground)
  setVar(target, '--sidebar-accent', sidebar.accent)
  setVar(target, '--sidebar-accent-foreground', sidebar.accentForeground)
  setVar(target, '--sidebar-border', sidebar.border)
  setVar(target, '--sidebar-ring', sidebar.ring)

  setVar(target, '--color-table-header-bg', brand.primary)
  setVar(target, '--color-table-header-border', brand.primaryActive)
  setVar(target, '--color-table-header-text', brand.onPrimary)
}
