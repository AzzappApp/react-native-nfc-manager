import { createClient } from 'pexels';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import type { Photo } from 'pexels';

let pexelsClient: ReturnType<typeof createClient> | null;

export const getPexelsClient = () => {
  if (!pexelsClient) {
    pexelsClient = createClient(process.env.PEXELS_API_KEY!);
  }
  return pexelsClient;
};

export type PexelsSearchResult<T> = {
  data: T[];
  count: number | null;
};

export const searchPexelsPhotos = async (
  query: string | null,
  locale: string | null,
  offset: number,
  limit: number,
): Promise<PexelsSearchResult<Photo>> => {
  const page = 1 + Math.floor(offset / limit);
  if (!query) {
    const result = await getPexelsClient().photos.curated({
      page,
      per_page: limit,
    });
    if ('error' in result) {
      throw new Error(result.error);
    }
    return {
      data: result.photos,
      count: null,
    };
  } else {
    const result = await getPexelsClient().photos.search({
      locale: getPexelsLocale(locale),
      query,
      page,
      per_page: limit,
    });
    if ('error' in result) {
      throw new Error(result.error);
    }
    return {
      data: result.photos,
      count: result.total_results,
    };
  }
};

export const searchPexelsVideos = async (
  query: string | null,
  locale: string | null,
  offset: number,
  limit: number,
) => {
  const page = 1 + Math.floor(offset / limit);
  if (!query) {
    const result = await getPexelsClient().videos.popular({
      page,
      per_page: limit,
    });
    if ('error' in result) {
      throw new Error(result.error);
    }
    return {
      data: result.videos,
      count: null,
    };
  } else {
    const result = await getPexelsClient().videos.search({
      locale: getPexelsLocale(locale),
      query,
      page,
      per_page: limit,
    });
    if ('error' in result) {
      throw new Error(result.error);
    }
    return {
      data: result.videos,
      count: result.total_results,
    };
  }
};

const getPexelsLocale = (locale: string | null) => {
  locale = locale ?? DEFAULT_LOCALE;
  if (SUPPORTED_PEXELS_LOCALES.includes(locale)) {
    return locale;
  }
  const localeLang = locale.split('-')[0];
  return (
    SUPPORTED_PEXELS_LOCALES.find(l => l.startsWith(localeLang)) ??
    DEFAULT_LOCALE
  );
};

const SUPPORTED_PEXELS_LOCALES = [
  'en-US',
  'pt-BR',
  'es-ES',
  'ca-ES',
  'de-DE',
  'it-IT',
  'fr-FR',
  'sv-SE',
  'id-ID',
  'pl-PL',
  'ja-JP',
  'zh-TW',
  'zh-CN',
  'ko-KR',
  'th-TH',
  'nl-NL',
  'hu-HU',
  'vi-VN',
  'cs-CZ',
  'da-DK',
  'fi-FI',
  'uk-UA',
  'el-GR',
  'ro-RO',
  'nb-NO',
  'sk-SK',
  'tr-TR',
  'ru-RU',
];
