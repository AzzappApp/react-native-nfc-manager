import getRuntimeEnvironment from './getRuntimeEnvironment';

//const CLOUDINARY_CLOUDNAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/azzapp`;

/**
 * Helpers used to create cloudinary url for an image given cloudinary id and size parameters
 *
 * @param id the id of the cloudinary file
 * @param width the desired image width
 * @param height the desired height
 * @param pixelRatio the desired pixeld density - default 1
 * @returns the url of a transformed image
 */
export const getImageURLForSize = (
  id: string,
  width?: number | null,
  height?: number | null,
  pixelRatio: number | null = 1,
) => {
  if (
    process.env.NODE_ENV !== 'production' &&
    getRuntimeEnvironment() === 'react-native'
  ) {
    throw new Error('getImageURLForSize is not supported on react-native');
  }
  id = decodeMediaId(id);
  if (!width) {
    return `${CLOUDINARY_BASE_URL}/image/upload/${id}`;
  }
  const transforms = resizeTransforms(
    Math.floor(width),
    height ? Math.floor(height) : null,
    pixelRatio ?? 1,
  );
  return `${CLOUDINARY_BASE_URL}/image/upload/${transforms}/${id}`;
};

/**
 * Helpers used to create an image url from a cloudinary id
 *
 * @param id the id of the cloudinary file
 * @returns
 */
export const getImageURL = (id: string) => {
  if (
    process.env.NODE_ENV !== 'production' &&
    getRuntimeEnvironment() === 'react-native'
  ) {
    throw new Error('getImageURL is not supported on react-native');
  }
  id = decodeMediaId(id);
  return `${CLOUDINARY_BASE_URL}/image/upload/${id}`;
};

/**
 * Helpers used to create a video url from a cloudinary id
 *
 * @param id the id of the cloudinary file
 * @returns
 */
export const getVideoURL = (id: string) => {
  if (
    process.env.NODE_ENV !== 'production' &&
    getRuntimeEnvironment() === 'react-native'
  ) {
    throw new Error('getImageURL is not supported on react-native');
  }
  id = decodeMediaId(id);
  return `${CLOUDINARY_BASE_URL}/video/upload/${id}`;
};

/**
 * Helpers used to create a video url from a cloudinary id and size parameters
 *
 * @param id the id of the cloudinary file
 * @param width the desired image width
 * @param height the desired height
 * @param pixelRatio the desired pixeld density - default 1
 * @returns the url of a transformed video
 */
export const getVideoUrlForSize = (
  id: string,
  width?: number | null,
  height?: number | null,
  pixelRatio: number | null = 1,
) => {
  if (
    process.env.NODE_ENV !== 'production' &&
    getRuntimeEnvironment() === 'react-native'
  ) {
    throw new Error('getVideoUrlForSize is not supported on react-native');
  }
  id = decodeMediaId(id);
  if (!width) {
    return `${CLOUDINARY_BASE_URL}/video/upload/${id}.mp4`;
  }
  const transforms = resizeTransforms(width, height, pixelRatio ?? 1);
  return `${CLOUDINARY_BASE_URL}/video/upload/${transforms}/${id}.mp4`;
};

/**
 * Helpers used to create a video thumbnail url from a cloudinary id and size parameters
 *
 * @param id the public id of the cloudinary file
 * @param width the desired image width
 * @param pixelRatio the desired pixeld density - default 1
 * @param aspectRatio the desired height
 * @returns the url of a transformed imate
 */
export const getVideoThumbnailURL = (
  id: string,
  width?: number | null,
  height?: number | null,
  pixelRatio: number | null = 1,
) => {
  if (
    process.env.NODE_ENV !== 'production' &&
    getRuntimeEnvironment() === 'react-native'
  ) {
    throw new Error('getVideoThumbnailURL is not supported on react-native');
  }
  id = decodeMediaId(id);
  if (!width) {
    return `${CLOUDINARY_BASE_URL}/video/upload/${id}.jpg`;
  }
  const transforms = resizeTransforms(width, height, pixelRatio ?? 1);
  return `${CLOUDINARY_BASE_URL}/video/upload/${transforms}/${id}.jpg`;
};

/**
 * Compute the cloudinary transformations for a given width height and pixel ratio
 */
const resizeTransforms = (
  width: number,
  height?: number | null,
  pixelRatio = 1,
) => {
  width = Math.round(width * pixelRatio);
  if (height != null) {
    return `c_fill,q_auto:best,w_${width},h_${height}`;
  } else {
    return `q_auto:best,w_${width}`;
  }
};

/**
 * Extract the media id from a database id
 */
export const decodeMediaId = (dbId: string) => {
  const segments = dbId.split(':');
  return segments[segments.length - 1];
};

/**
 * Create a database id from a media id
 */
export const encodeMediaId = (mediaId: string, kind: 'image' | 'video') => {
  return `${kind === 'video' ? 'v' : 'i'}:${mediaId}`;
};
