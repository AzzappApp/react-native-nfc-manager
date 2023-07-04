export function buildUserUrl(userName: string) {
  return `${process.env.NEXT_PUBLIC_URL}${userName}`;
}
