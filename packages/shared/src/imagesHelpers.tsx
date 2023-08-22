import getRuntimeEnvironment from './getRuntimeEnvironment';

//const CLOUDINARY_CLOUDNAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/azzapp`;

/**
 * Helpers used to create cloudinary URL for image given size parameters
 *
 * @param id the id of the cloudinary file
 * @param width the desired image width
 * @param height the desired height
 * @param pixelRatio the desired pixeld density - default 1
 * @returns the url of a transformed imate
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
 * Helpers used to create cloudinary URL for image
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
  return `${CLOUDINARY_BASE_URL}/image/upload/${id}`;
};

/**
 * Helpers used to create cloudinary URL for a video
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
  return `${CLOUDINARY_BASE_URL}/video/upload/${id}`;
};

/**
 * Helpers used to create cloudinary url for video given size parameters
 *
 * @param id the id of the cloudinary file
 * @param width the desired image width
 * @param height the desired height
 * @param pixelRatio the desired pixeld density - default 1
 * @returns the url of a transformed imate
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
  if (!width) {
    return `${CLOUDINARY_BASE_URL}/video/upload/${id}.mp4`;
  }
  const transforms = resizeTransforms(width, height, pixelRatio ?? 1);
  return `${CLOUDINARY_BASE_URL}/video/upload/${transforms}/${id}.mp4`;
};

/**
 * Helpers used to create cloudinary thumbnail url for video given size parameters
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
  if (!width) {
    return `${CLOUDINARY_BASE_URL}/video/upload/${id}.jpg`;
  }
  const transforms = resizeTransforms(width, height, pixelRatio ?? 1);
  return `${CLOUDINARY_BASE_URL}/video/upload/${transforms}/${id}.jpg`;
};

const resizeTransforms = (
  width: number,
  height?: number | null,
  pixelRatio = 1,
) => {
  width = Math.round(width * pixelRatio);
  if (height != null) {
    return `c_fill,q_auto:eco,w_${width},h_${height}`;
  } else {
    return `q_auto:eco,w_${width}`;
  }
};

/**
 * Returns the media id from a cloudinary url
 * @param url the cloudinary url
 * @returns the media id
 */
export const getMediaIDFromURL = (url: string) => {
  const segments = url.split('/');
  return segments[segments.length - 1].split('.')[0];
};
