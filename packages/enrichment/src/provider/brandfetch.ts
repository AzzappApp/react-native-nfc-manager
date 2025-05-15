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

export const downloadMediaFromBrand = async (
  brand: string,
  website?: string | null,
) => {
  try {
    if (website) {
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
        // check if we can directly use the domain
        const logo = await fetch(
          `https://cdn.brandfetch.io/${hostname}/icon?c=${env.BRANDFETCH_CLIENT_ID}`,
        );
        if (logo.ok) {
          const type = logo.headers.get('content-type') || '';
          if (type.includes('image')) {
            const buffer = await logo.blob();
            const result = await uploadMedia(buffer);
            return result;
          }
        }
      }
    }

    const logos = await getLogos(brand, 'webp');

    if (logos.length > 0) {
      const logo = logos[0];
      const response = await fetch(logo.uri);
      const buffer = await response.blob();

      return uploadMedia(buffer);
    }
  } catch (error) {
    console.error('Error downloading media from Brandfetch:', error);
  }
  return null;
};
