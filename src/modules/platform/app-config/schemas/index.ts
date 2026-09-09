import { z } from 'zod'

const hexColor = z
  .string()
  .min(4)
  .max(32)
  .regex(/^(#|rgba?\(|hsla?\(|transparent|var\()/i, 'Enter a valid color')

export const appClientSchema = z.enum(['driver', 'rider', 'admin'])
export const colorSchemeSchema = z.enum(['light', 'dark'])

export const themeFormSchema = z.object({
  app: appClientSchema,
  colorScheme: colorSchemeSchema,
  colors: z.object({
    brand: z.object({
      primary: hexColor,
      primaryHover: hexColor,
      primaryActive: hexColor,
      onPrimary: hexColor,
      primaryLight: hexColor,
    }),
    semantic: z.object({
      success: hexColor,
      successSurface: hexColor,
      warning: hexColor,
      warningSurface: hexColor,
      danger: hexColor,
      dangerSurface: hexColor,
      info: hexColor,
      infoSurface: hexColor,
    }),
    surface: z.object({
      background: hexColor,
      card: hexColor,
      muted: hexColor,
      mutedForeground: hexColor,
      accent: hexColor,
      accentForeground: hexColor,
      border: hexColor,
      input: hexColor,
      ring: hexColor,
      popover: hexColor,
      popoverForeground: hexColor,
      foreground: hexColor,
    }),
    sidebar: z.object({
      background: hexColor,
      foreground: hexColor,
      primary: hexColor,
      primaryForeground: hexColor,
      accent: hexColor,
      accentForeground: hexColor,
      border: hexColor,
      ring: hexColor,
    }),
    chart: z.object({
      chart1: hexColor,
      chart2: hexColor,
      chart3: hexColor,
      chart4: hexColor,
      chart5: hexColor,
    }),
  }),
  typographySize: z.object({
    xs: z.coerce.number().min(8).max(48),
    sm: z.coerce.number().min(8).max(48),
    md: z.coerce.number().min(8).max(48),
    lg: z.coerce.number().min(8).max(64),
    xl: z.coerce.number().min(8).max(72),
    '2xl': z.coerce.number().min(8).max(96),
    '3xl': z.coerce.number().min(8).max(120),
  }),
  radii: z.object({
    sm: z.coerce.number().min(0).max(64),
    md: z.coerce.number().min(0).max(64),
    lg: z.coerce.number().min(0).max(64),
    xl: z.coerce.number().min(0).max(96),
  }),
})

export type ThemeFormValues = z.infer<typeof themeFormSchema>

const optionalHex = z.union([hexColor, z.literal('')]).optional()

const buttonVariantSchema = z.object({
  background: hexColor,
  backgroundHover: optionalHex,
  backgroundActive: optionalHex,
  backgroundDisabled: optionalHex,
  text: hexColor,
  textDisabled: optionalHex,
  border: optionalHex,
  borderRadius: z.coerce.number().min(0).max(64),
  height: z.coerce.number().min(24).max(80),
  fontSize: z.coerce.number().min(10).max(32),
  fontWeight: z.string().min(1).max(20),
})

export const componentsFormSchema = z.object({
  app: appClientSchema,
  colorScheme: colorSchemeSchema,
  button: z.object({
    primary: buttonVariantSchema,
    secondary: buttonVariantSchema,
    outline: buttonVariantSchema,
    ghost: buttonVariantSchema,
    danger: buttonVariantSchema,
    success: buttonVariantSchema,
  }),
})

export type ComponentsFormValues = z.infer<typeof componentsFormSchema>

export const fontItemSchema = z.object({
  family: z.string().min(1).max(120),
  weight: z.string().min(1).max(40),
  style: z.enum(['normal', 'italic']),
  source: z.enum(['bundled', 'google', 'remote']),
  url: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  isActive: z.boolean(),
})

export const fontsFormSchema = z.object({
  app: appClientSchema,
  fonts: z.array(fontItemSchema).min(1),
})

export type FontsFormValues = z.infer<typeof fontsFormSchema>

export const localeItemSchema = z.object({
  code: z.string().min(2).max(10),
  label: z.string().min(1).max(80),
  nativeLabel: z.string().min(1).max(80),
  isRtl: z.boolean(),
  isActive: z.boolean(),
  isDefault: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(999),
})

export const localesFormSchema = z.object({
  locales: z.array(localeItemSchema).min(1),
})

export type LocalesFormValues = z.infer<typeof localesFormSchema>

export const translationsFormSchema = z.object({
  app: appClientSchema,
  entries: z.record(z.string(), z.record(z.string(), z.string())),
})

export type TranslationsFormValues = z.infer<typeof translationsFormSchema>
