/**
 * Builds a user URL from a user name.
 */
export function buildUserUrl(userName: string) {
  return `${process.env.NEXT_PUBLIC_URL}${userName}`;
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
  const c = encodeURIComponent(serializedContactCard);
  const s = encodeURIComponent(signature);

  return `${buildUserUrl(userName)}?c=${c}&s=${s}`;
}
