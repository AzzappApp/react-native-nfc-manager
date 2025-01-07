import { compressToEncodedURIComponent } from 'lz-string';
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
) {
  const compressedData = compressToEncodedURIComponent(
    JSON.stringify([serializedContactCard, signature]),
  );

  return `${buildUserUrl(userName)}?c=${compressedData}`;
}

export function buildEmailSignatureGenerationUrl(
  userName: string,
  serializedEmail: string,
  signature: string,
  serializedContactCard: string,
  signatureContactCard: string,
) {
  const compressedData = compressToEncodedURIComponent(
    JSON.stringify([serializedEmail, signature]),
  );

  const compressedContactCardData = compressToEncodedURIComponent(
    JSON.stringify([serializedContactCard, signatureContactCard]),
  );

  return `${buildUserUrl(userName)}/emailsignature?e=${compressedData}&c=${compressedContactCardData}`;
}

export const AZZAPP_SERVER_HEADER = 'azzapp-server-auth';
