import { compressToEncodedURIComponent } from 'lz-string';
/**
 * Builds a user URL from a user name.
 */
export function buildUserUrl(
  userName: string,
  base: string = process.env.NEXT_PUBLIC_URL ?? 'https://www.azzapp.com/',
) {
  return `${base}${userName}`;
}

/**
 * Builds a post URL from a user name and post.
 */
export function buildPostUrl(userName: string, postId: string) {
  return `${process.env.NEXT_PUBLIC_URL}${userName}/${postId}`;
}

/**
 * Builds a user URL from a user name and a serialized contact card.
 * this url will be used to share the contact card
 */
export function buildUserUrlWithContactCard(
  userName: string,
  serializedContactCard: string,
  signature: string,
) {
  const compressedData = compressToEncodedURIComponent(
    JSON.stringify([serializedContactCard, signature]),
  );

  return `${buildUserUrl(userName)}?c=${compressedData}`;
}
