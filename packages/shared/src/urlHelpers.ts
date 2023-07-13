export function buildUserUrl(userName: string) {
  return `${process.env.NEXT_PUBLIC_URL}${userName}`;
}

export function buildUserUrlWithContactCard(
  userName: string,
  serializedContactCard: string,
  signature: string,
) {
  return `${buildUserUrl(userName)}?c=${encodeURIComponent(
    serializedContactCard,
  )}&s=${encodeURIComponent(signature)}`;
}
