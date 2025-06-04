import countries from 'i18n-iso-countries';
import type { ApiResolver } from '../types';

const locales = [
  'af',
  'am',
  'ar',
  'az',
  'be',
  'bg',
  'bn',
  'bs',
  'ca',
  'cs',
  'cy',
  'da',
  'de',
  'el',
  'en',
  'es',
  'et',
  'fa',
  'fi',
  'fr',
  'ga',
  'gl',
  'gu',
  'he',
  'hi',
  'hr',
  'hu',
  'hy',
  'id',
  'is',
  'it',
  'ja',
  'ka',
  'kk',
  'km',
  'ko',
  'ky',
  'lt',
  'lv',
  'mk',
  'ml',
  'mn',
  'mr',
  'ms',
  'mt',
  'nb',
  'nl',
  'nn',
  'no',
  'pa',
  'pl',
  'ps',
  'pt',
  'ro',
  'ru',
  'si',
  'sk',
  'sl',
  'sq',
  'sr',
  'sv',
  'ta',
  'te',
  'th',
  'tk',
  'tr',
  'uk',
  'ur',
  'uz',
  'vi',
  'zh',
];

const normalizeString = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // accents
    .replace(/[^a-zA-Z]/g, '') // only letters
    .toLowerCase();

const normalizedNameToCode: Record<string, string> = {};

for (const lang of locales) {
  const names = countries.getNames(lang, { select: 'official' });
  for (const [code, name] of Object.entries(names)) {
    const norm = normalizeString(name);
    if (!normalizedNameToCode[norm]) {
      normalizedNameToCode[norm] = code;
    }
  }
}

// Ajoute quelques alias typiques
const manualAliases: Record<string, string> = {
  // 🇺🇸
  usa: 'US',
  us: 'US',
  'u.s.a.': 'US',
  'u.s.': 'US',
  etatsunis: 'US',
  étatsunis: 'US',
  'etats-unis': 'US',
  'états-unis': 'US',
  unitedstates: 'US',
  america: 'US',
  amerique: 'US',
  amérique: 'US',

  // 🇬🇧
  uk: 'GB',
  'u.k.': 'GB',
  greatbritain: 'GB',
  britain: 'GB',

  // 🇰🇷
  southkorea: 'KR',
  coréedusud: 'KR',
  coreedusud: 'KR',

  // 🇦🇪
  uae: 'AE',
  emirats: 'AE',
  emiratsarabesunis: 'AE',

  // 🇿🇦
  southafrica: 'ZA',
  afriquedusud: 'ZA',
};

Object.assign(normalizedNameToCode, manualAliases);

const normalizeCountry = (input: string): string | null => {
  const norm = normalizeString(input);
  return normalizedNameToCode[norm] || null;
};

export const countryCode: ApiResolver = {
  name: 'country',
  priority: 1,
  provides: {
    profile: ['countryCode'],
  },
  dependsOn: 'profile.country',
  run: async data => {
    if (!data.profile?.country) {
      return {
        error: { message: 'No country found' },
      };
    }

    const countryCode = normalizeCountry(data.profile.country);
    if (countryCode) {
      return {
        data: {
          profile: {
            countryCode,
          },
        },
      };
    } else {
      return {
        error: {
          message: `Country code not found for ${data.profile.country}`,
        },
      };
    }
  },
};
