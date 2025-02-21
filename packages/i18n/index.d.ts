export const SUPPORTED_LOCALES: Array<'en-US' | 'fr'>;

// disabled for now
// Array<
//   | 'da'
//   | 'de'
//   | 'en-GB'
//   | 'en-US'
//   | 'es'
//   | 'fr'
//   | 'it'
//   | 'nl'
//   | 'no'
//   | 'pt-BR'
//   | 'pt-PT'
//   | 'sv'
// >;
export const DEFAULT_LOCALE: Locale = 'en-US';

export const TRANSLATION_TARGETS = ['app', 'web', 'entity'] as const;
export const APP_TARGET = 'app';
export const WEB_TARGET = 'web';

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(string: unknown): string is Locale;

export function guessLocale(string?: string | null): Locale;
