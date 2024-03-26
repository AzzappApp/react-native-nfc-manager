export const SUPPORTED_LOCALES: Array<
  | 'da'
  | 'de'
  | 'en-GB'
  | 'en-US'
  | 'es'
  | 'fr'
  | 'it'
  | 'nl'
  | 'no'
  | 'pt-BR'
  | 'pt-PT'
  | 'sv'
>;
export const DEFAULT_LOCALE: 'en-US';

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(string: unknown): string is Locale;
