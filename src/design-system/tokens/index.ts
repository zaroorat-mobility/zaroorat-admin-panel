export * from './types';
export * from './defaults';
export * from './components';
export { stringsEn } from './strings/en';
export type { TranslationKey } from './strings/en';
export { stringsHi } from './strings/hi';
export { stringsUr } from './strings/ur';

import type { AppConfigBundle, AppFontSpec, AppLocaleSpec } from './types';
import { lightTokens, darkTokens } from './defaults';
import { defaultComponents } from './components';
import { stringsEn } from './strings/en';

export const defaultFonts: AppFontSpec[] = [
  {
    family: 'Inter',
    weight: '400',
    style: 'normal',
    source: 'bundled',
    url: null,
    isActive: true,
  },
  {
    family: 'Inter',
    weight: '500',
    style: 'normal',
    source: 'bundled',
    url: null,
    isActive: true,
  },
  {
    family: 'Inter',
    weight: '600',
    style: 'normal',
    source: 'bundled',
    url: null,
    isActive: true,
  },
  {
    family: 'Inter',
    weight: '700',
    style: 'normal',
    source: 'bundled',
    url: null,
    isActive: true,
  },
];

export const defaultLocales: AppLocaleSpec[] = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    isRtl: false,
    isActive: true,
    isDefault: true,
    sortOrder: 0,
  },
  {
    code: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    isRtl: false,
    isActive: true,
    isDefault: false,
    sortOrder: 1,
  },
  {
    code: 'ur',
    label: 'Urdu',
    nativeLabel: 'اردو',
    isRtl: true,
    isActive: true,
    isDefault: false,
    sortOrder: 2,
  },
];

export function createDefaultBundle(
  app: AppConfigBundle['app'] = 'driver',
  locale = 'en',
): AppConfigBundle {
  return {
    version: 1,
    app,
    locale,
    theme: {
      light: { tokens: lightTokens, components: defaultComponents },
      dark: { tokens: darkTokens, components: defaultComponents },
    },
    fonts: defaultFonts,
    locales: defaultLocales,
    strings: { ...stringsEn },
    featureFlags: {},
  };
}
