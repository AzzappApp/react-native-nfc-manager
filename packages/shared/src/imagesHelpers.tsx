import getRuntimeEnvironment from './getRuntimeEnvironment';

const CLOUDINARY_CLOUDNAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUDNAME}`;

/**
 * Helpers used to create an asset url from a cloudinary id without any transformation
 *
 * @param id the id of the cloudinary file
 * @returns
 */
export const getCloudinaryAssetURL = (id: string, kind: 'image' | 'video') => {
  assetNotRN('getCloudinaryAssetURL');
  const ext = kind === 'video' ? '.mp4' : '';
  return `${CLOUDINARY_BASE_URL}/${kind}/upload/${id}${ext}`;
};

/**
 * Helpers used to create an image url from a cloudinary id
 *
 * @param id the id of the cloudinary file
 * @returns
 */
export const getImageURL = (id: string) => {
  assetNotRN('getImageURL');
  return assembleCloudinaryUrl(decodeMediaId(id), 'image', resizeTransforms());
};

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
  pregeneratedSizes?: number[] | null,
) => {
  assetNotRN('getImageURLForSize');
  id = decodeMediaId(id);
  const transforms = resizeTransforms(
    width,
    height,
    pixelRatio,
    pregeneratedSizes,
  );
  return assembleCloudinaryUrl(id, 'image', transforms);
};

/**
 * Helpers used to create a video url from a cloudinary id
 *
 * @param id the id of the cloudinary file
 * @returns
 */
export const getVideoURL = (id: string) => {
  assetNotRN('getVideoURL');
  return assembleCloudinaryUrl(
    decodeMediaId(id),
    'video',
    resizeTransforms(),
    'mp4',
  );
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
  pixelRatio?: number | null,
  pregeneratedSizes?: number[] | null,
) => {
  assetNotRN('getVideoUrlForSize');
  id = decodeMediaId(id);
  const transforms = resizeTransforms(
    width,
    height,
    pixelRatio,
    pregeneratedSizes,
  );
  return assembleCloudinaryUrl(id, 'video', transforms, 'mp4');
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
  pregeneratedSizes?: number[] | null,
) => {
  assetNotRN('getVideoThumbnailURL');
  id = decodeMediaId(id);
  const transforms = resizeTransforms(
    width,
    height,
    pixelRatio,
    pregeneratedSizes,
  );
  return assembleCloudinaryUrl(id, 'video', transforms, 'jpg');
};

/**
 * Extract the media id from a database id
 */
export const decodeMediaId = (dbId: string) => {
  const segments = dbId.split(':');
  return segments[segments.length - 1];
};

/**
 * Compute the cloudinary transformations for a given width height and pixel ratio
 *
 * @param width the desired image width
 * @param height the desired height
 * @param pixelRatio the desired pixeld density - default 1
 * @param pregeneratedSizes a set of pregenerated sizes to use for the transformation
 */
export const resizeTransforms = (
  width?: number | null,
  height?: number | null,
  pixelRatio?: number | null,
  pregeneratedSizes?: number[] | null,
) => {
  pixelRatio = pixelRatio ?? 1;
  if (width == null) {
    return `q_auto:best`;
  }
  width = Math.ceil(width * pixelRatio);
  if (pregeneratedSizes) {
    const index = pregeneratedSizes.findIndex(size => size >= width!);
    if (index === -1) {
      if (height != null) {
        const aspectRatio = Math.round((width * 1000) / height) / 1000;
        return `c_fill,q_auto:best,ar_${aspectRatio}`;
      }
      return `q_auto:best`;
    }
    return `q_auto:best,w_${pregeneratedSizes[index]}`;
  }
  if (height != null) {
    return `c_fill,q_auto:best,w_${width},h_${height}`;
  } else {
    return `q_auto:best,w_${width}`;
  }
};

/**
 * Create a database id from a media id
 */
export const encodeMediaId = (mediaId: string, kind: 'image' | 'video') => {
  return `${kind === 'video' ? 'v' : 'i'}:${mediaId}`;
};

const assetNotRN = (funcName: string) => {
  if (
    process.env.NODE_ENV !== 'production' &&
    getRuntimeEnvironment() === 'react-native'
  ) {
    throw new Error(`${funcName} is not supported on react-native`);
  }
};

const assembleCloudinaryUrl = (
  id: string,
  kind: 'image' | 'video',
  transforms: string,
  extention?: string,
) => {
  // prettier-ignore
  return `${CLOUDINARY_BASE_URL}/${kind}/upload/${transforms}/${id}${extention?`.${extention}`:''}`;
};
