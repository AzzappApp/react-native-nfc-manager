import { buildWebUrl } from '@azzapp/shared/urlHelpers';
import type { Metadata } from 'next';
import type { OpenGraphType } from 'next/dist/lib/metadata/types/opengraph-types';

export type SocialMetas = {
  canonical?: string | null;
  description: string;
  ogImage?: string;
  schema?: string;
  title: string;
  type?: OpenGraphType;
  url: string;
  other?: Metadata;
};
export function getMetaData({
  url: path,
  ogImage,
  title,
  description,
  canonical,
  type,
  other,
}: SocialMetas): Metadata {
  const basePath = buildWebUrl();
  const url = path.startsWith('http')
    ? path
    : `${basePath}${stripPreSlash(path)}`;

  return {
    ...other,
    metadataBase: new URL(basePath),
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    title,
    description,
    alternates: {
      //TODO: maybe we can use azzapp as alternate when user is using is own domain
      canonical: canonical ?? url,
      languages: {},
      ...other?.alternates,
    },
    openGraph: {
      title,
      description,
      type: type ?? 'website',
      url,
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      ...other?.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
      ...other?.twitter,
    },
  };
}
function stripPreSlash(value: string): string {
  return value ? value.replace(/^\/+/g, '') : value;
}
