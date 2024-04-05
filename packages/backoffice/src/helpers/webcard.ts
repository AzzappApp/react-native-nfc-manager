export const getWebcardCoverUri = (
  name: string,
  updatedAt: string,
  width: number,
  height: number,
) =>
  `${process.env.NEXT_PUBLIC_API_ENDPOINT}/cover/${name}?width=${width}&height=${height}&updatedAt=${updatedAt}`;
