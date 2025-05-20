import { compressToEncodedURIComponent } from 'lz-string';
import env from './env';
import { isDefined } from './isDefined';
import type { Geolocation } from './geolocationHelpers';

export const AZZAPP_URL_WEBSITE = env.NEXT_PUBLIC_AZZAPP_WEBSITE;

export function buildWebUrl(path?: string | null) {
  let base = env.NEXT_PUBLIC_URL;
  if (base.endsWith('/')) {
    base = base.slice(0, -1);
  }

  if (path) {
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  }
  return `${base}`; //maybe we should return empty string here
}

/**
 * Builds a post URL from a user name and post.
 */
export function buildPostUrl(userName: string, postId: string) {
  return `${buildWebUrl(userName)}/post/${postId}`;
}

/**
 *
 * @param userName is the webCard userName
 * @returns the url for invitation (redirect to store when relevant)
 */
export function buildInviteUrl(userName: string) {
  return `${buildWebUrl(userName)}/invite`;
}

/**
 * Builds a user URL from a user name and a serialized contact card.
 * this url will be used to share the contact card
 */
export function buildUserUrlWithContactCard(
  userName: string,
  serializedContactCard: string,
  signature: string,
  geolocation?: {
    location?: {
      latitude: number;
      longitude: number;
    } | null;
    address?: {
      city?: string | null;
      country?: string | null;
      subregion?: string | null;
      region?: string | null;
    } | null;
  } | null,
) {
  const compressedData = compressToEncodedURIComponent(
    JSON.stringify(
      [serializedContactCard, signature, geolocation].filter(isDefined),
    ),
  );

  return `${buildWebUrl(userName)}?c=${compressedData}`;
}

export const deserializeGeolocation = (
  geolocation?: [
    number | null,
    number | null,
    string | null,
    string | null,
    string | null,
    string | null,
  ],
): Geolocation | null => {
  return geolocation
    ? {
        location:
          geolocation[0] && geolocation[1]
            ? {
                latitude: geolocation[0],
                longitude: geolocation[1],
              }
            : null,
        address: {
          city: geolocation[2],
          subregion: geolocation[3],
          region: geolocation[4],
          country: geolocation[5],
        },
      }
    : null;
};

/**
 *
 * @param userName is the webCard userName
 * @param key is the
 * @returns the url to share the contact card
 */
export function buildUserUrlWithKey({
  userName,
  contactCardAccessId,
  key,
  geolocation,
}: {
  userName: string;
  contactCardAccessId?: string;
  key: string;
  geolocation?: Geolocation | null;
}) {
  const geolocationTrimmed = geolocation
    ? [
        geolocation.location?.latitude,
        geolocation.location?.longitude,
        geolocation.address?.city,
        geolocation.address?.subregion,
        geolocation.address?.region,
        geolocation.address?.country,
      ]
    : undefined;

  const dataWithKey = compressToEncodedURIComponent(
    JSON.stringify([contactCardAccessId, key, geolocationTrimmed]),
  );

  return `${buildWebUrl(userName)}?k=${dataWithKey}`;
}

export function buildEmailSignatureGenerationUrlWithKey(
  userName: string,
  serializedKey: string,
  signature: string,
) {
  const compressedData = compressToEncodedURIComponent(
    JSON.stringify([serializedKey, signature]),
  );

  return `${buildWebUrl(userName)}/emailsignature?k=${compressedData}`;
}

export function buildEmailSignatureGenerationUrl(
  userName: string,
  serializedEmail: string,
  signature: string,
) {
  const compressedData = compressToEncodedURIComponent(
    JSON.stringify([serializedEmail, signature]),
  );

  return `${buildWebUrl(userName)}/emailsignature?e=${compressedData}`;
}

export const AZZAPP_SERVER_HEADER = 'azzapp-server-auth';
