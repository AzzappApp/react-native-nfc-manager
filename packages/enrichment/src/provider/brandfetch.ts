import * as Sentry from '@sentry/nextjs';
import { createId } from '@azzapp/data';
import { encodeMediaId } from '@azzapp/service/mediaServices/imageHelpers';
import env from '../env';
import { uploadMedia } from '../media';

type BrandFetchResult = {
  brandId: string;
  icon: string;
  qualityScore: string;
};

export const getLogos = async (
  brand: string,
  format: 'png' | 'webp' = 'png',
) => {
  const response = await fetch(
    `https://api.brandfetch.io/v2/search/${encodeURI(brand)}?c=${env.BRANDFETCH_CLIENT_ID}`,
    {
      method: 'GET',
    },
  );

  if (response.ok) {
    const data = (await response.json()) as BrandFetchResult[];

    return data
      .map(result => {
        return {
          id: result.brandId,
          uri: updateUrl(result.icon, format),
          score: parseFloat(result.qualityScore),
        };
      })
      .sort((a, b) => b.score - a.score);
  } else {
    if (response.status === 404) {
      return [];
    }
    throw new Error(`Error fetching logo of ${brand}: ${response.statusText}`);
  }
};

const updateUrl = (url: string, format: 'png' | 'webp'): string => {
  // Replace 'webp' with 'png'
  let updatedUrl = url.replace('webp', format);

  // Replace 'w/128' with default sizes
  updatedUrl = updatedUrl.replace(/\/w\/\d+/g, '').replace(/\/h\/\d+/g, '');

  return updatedUrl;
};

export const downloadMediaFromBrand = (website: string) => {
  try {
    let hostname;
    try {
      const url = new URL(website);
      hostname = url.hostname;
    } catch {
      try {
        const url = new URL(`http://${website}`);
        hostname = url.hostname;
      } catch {
        hostname = null;
      }
    }

    if (hostname) {
      const mediaId = encodeMediaId(createId(), 'image');

      return {
        mediaId,
        promise: uploadLogo(mediaId, hostname),
      };
    }
  } catch (error) {
    console.error('Error downloading media from Brandfetch:', error);
  }
  return null;
};

export const uploadLogo = async (mediaId: string, hostname: string) => {
  const logo = await fetch(
    `https://cdn.brandfetch.io/${hostname}/fallback/404/icon?c=${env.BRANDFETCH_CLIENT_ID}`,
    {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36', // Set a user agent to avoid potential blocking by the server, it's unfair but they should protect it better
      },
    },
  );

  if (logo.ok) {
    const type = logo.headers.get('content-type') || '';
    if (type.includes('image')) {
      const buffer = await logo.blob();
      return uploadMedia(buffer, mediaId);
    }
    Sentry.captureMessage(
      `Error fetching logo of ${hostname}: invalid content type ${type}, response ${logo.status}:  ${logo.statusText}`,
    );

    return null;
  }

  if (logo.status !== 404) {
    Sentry.captureMessage(
      `Error fetching logo of
     ${hostname}: response ${logo.status}:  ${logo.statusText}`,
    );
  }

  return null;
};
