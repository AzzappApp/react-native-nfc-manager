export const getMediaFileKind = (media: File) =>
  media.type === 'application/json'
    ? 'lottie'
    : media.type === 'image/svg+xml'
      ? 'svg'
      : 'png';
