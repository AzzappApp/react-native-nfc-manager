import { compressToEncodedURIComponent } from 'lz-string';
import { isDefined } from './isDefined';
import type { Geolocation } from './geolocationHelpers';
/**
 * Builds a user URL from a user name.
 */
export function buildUserUrl(
  userName?: string | null,
  base: string = process.env.NEXT_PUBLIC_URL ?? 'https://www.azzapp.com/',
) {
  if (userName) {
    return `${base}${userName}`;
  }
  return `${base}`; //maybe we should return empty string here
}

/**
 * Builds a user URL from a user name.
 */
export function buildReadableUserUrl(
  userName?: string | null,
  base: string = process.env.NEXT_PUBLIC_URL ?? 'https://www.azzapp.com/',
) {
  if (!userName) {
    return 'azzapp.com/';
  }
  return buildUserUrl(userName, base).replace(base, 'azzapp.com/');
}

/**
 * Builds a post URL from a user name and post.
 */
export function buildPostUrl(userName: string, postId: string) {
  return `${buildUserUrl(userName)}/post/${postId}`;
}

/**
 *
 * @param userName is the webCard userName
 * @returns the url for invitation (redirect to store when relevant)
 */
export function buildInviteUrl(userName: string) {
  return `${buildUserUrl(userName)}/invite`;
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

  return `${buildUserUrl(userName)}?c=${compressedData}`;
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

  return `${buildUserUrl(userName)}?k=${dataWithKey}`;
}

export function buildEmailSignatureGenerationUrlWithKey(
  userName: string,
  serializedKey: string,
  signature: string,
) {
  const compressedData = compressToEncodedURIComponent(
    JSON.stringify([serializedKey, signature]),
  );

  return `${buildUserUrl(userName)}/emailsignature?k=${compressedData}`;
}

export function buildEmailSignatureGenerationUrl(
  userName: string,
  serializedEmail: string,
  signature: string,
) {
  const compressedData = compressToEncodedURIComponent(
    JSON.stringify([serializedEmail, signature]),
  );

  return `${buildUserUrl(userName)}/emailsignature?e=${compressedData}`;
}

export const AZZAPP_SERVER_HEADER = 'azzapp-server-auth';
