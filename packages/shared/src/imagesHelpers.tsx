import getRuntimeEnvironment from './getRuntimeEnvironment';

export const CLOUDINARY_CLOUDNAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
export const CLOUDINARY_BASE_URL = `https://${process.env.NEXT_PUBLIC_CLOUDINARY_SECURE_DISTRIBUTION ?? 'res.cloudinary.com'}/${CLOUDINARY_CLOUDNAME}`;

export const DEFAULT_VIDEO_PERCENTAGE_THUMBNAIL = 17;

/**
 * Helpers used to create an asset url from a cloudinary id without any transformation
 *
 * @param id the id of the cloudinary file
 * @returns
 */
export const getCloudinaryAssetURL = (
  id: string,
  kind: 'image' | 'raw' | 'video',
) => {
  assetNotRN('getCloudinaryAssetURL');
  return `${CLOUDINARY_BASE_URL}/${kind}/upload/${id}`;
};

/**
 * Helpers used to create an image url from a cloudinary id
 *
 * @param id the id of the cloudinary file
 * @returns
 */
export const getImageURL = (id: string) => {
  assetNotRN('getImageURL');
  return assembleCloudinaryUrl(id, 'image', resizeTransforms());
};

export type UrLForSizeParam = {
  id: string;
  width?: number | null;
  height?: number | null;
  radius?: number | null;
  pixelRatio?: number | null;
  pregeneratedSizes?: number[] | null;
  format?: string | null;
  previewPositionPercentage?: number | null;
  path?: string | null;
};

/**
 * Helpers used to create cloudinary url for an image given cloudinary id and size parameters
 *
 * @param id the id of the cloudinary file
 * @param width the desired image width
 * @param height the desired height
 * @param radius the desired radius percent
 * @param pixelRatio the desired pixeld density - default 1
 * @returns the url of a transformed image
 */

export const getImageURLForSize = ({
  id,
  width,
  height,
  radius,
  pixelRatio = 1,
  pregeneratedSizes,
  format,
}: UrLForSizeParam) => {
  assetNotRN('getImageURLForSize');
  const transforms = resizeTransforms(
    width,
    height,
    radius,
    pixelRatio,
    pregeneratedSizes,
  );
  return assembleCloudinaryUrl(id, 'image', transforms, format ?? 'avif');
};

/**
 * Helpers used to create a video url from a cloudinary id
 *
 * @param id the id of the cloudinary file
 * @returns
 */
export const getVideoURL = (id: string, path?: string) => {
  assetNotRN('getVideoURL');
  return assembleCloudinaryUrl(
    id,
    'video',
    resizeTransforms(),
    'mp4',
    undefined,
    path,
  );
};

/**
 * Helpers used to create a video url from a cloudinary id and size parameters
 *
 * @param id the id of the cloudinary file
 * @param width the desired image width
 * @param height the desired height
 * @param pixelRatio the desired pixel density - default 1
 * @returns the url of a transformed video
 */
export const getVideoUrlForSize = ({
  id,
  width,
  height,
  radius,
  pixelRatio = 1,
  pregeneratedSizes,
  format,
  path,
}: UrLForSizeParam) => {
  assetNotRN('getVideoUrlForSize');
  const transforms = resizeTransforms(
    width,
    height,
    radius,
    pixelRatio,
    pregeneratedSizes,
  );
  return assembleCloudinaryUrl(
    id,
    'video',
    transforms,
    format ?? 'mp4',
    undefined,
    path,
  );
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
export const getVideoThumbnailURL = ({
  id,
  width,
  height,
  radius,
  pixelRatio = 1,
  pregeneratedSizes,
  previewPositionPercentage,
}: UrLForSizeParam) => {
  assetNotRN('getVideoThumbnailURL');
  const transforms = resizeTransforms(
    width,
    height,
    radius,
    pixelRatio,
    pregeneratedSizes,
  );
  return assembleCloudinaryUrl(
    id,
    'video',
    transforms,
    'avif',
    previewPositionPercentage,
  );
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
  radius?: number | null,
  pixelRatio?: number | null,
  pregeneratedSizes?: number[] | null,
) => {
  pixelRatio = pixelRatio ?? 1;
  const result: string[] = [];
  if (radius != null) {
    result.push(`r_${radius}`);
  }

  if (width == null) {
    return result.join(',');
  }
  width = Math.ceil(width * pixelRatio);
  if (pregeneratedSizes) {
    const index = pregeneratedSizes.findIndex(size => size >= width);
    if (index === -1) {
      if (height != null) {
        const aspectRatio = Math.round((width * 1000) / height) / 1000;
        result.push(`c_fill`);
        result.push(`ar_${aspectRatio}`);
        return result.join(',');
      }
      return result.join(',');
    }
    result.push(`c_limit`);
    result.push(`w_${pregeneratedSizes[index]}`);
    return result.join(',');
  }
  if (height != null) {
    height = Math.ceil(height * pixelRatio);
    result.push(`c_fill`);
    result.push(`w_${width}`);
    result.push(`h_${height}`);
    return result.join(',');
  } else {
    result.push(`c_limit`);
    result.push(`w_${width}`);
    return result.join(',');
  }
};

/**
 * Create a database id from a media id
 */
export const encodeMediaId = (mediaId: string, kind: string) => {
  return `${kind.charAt(0)}_${mediaId}`;
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
  format?: string,
  videoPercentage?: number | null,
  path?: string | null,
) => {
  // prettier-ignore
  return `${CLOUDINARY_BASE_URL}/${kind}/upload${videoPercentage ? `/so_${videoPercentage}p`: ''}${transforms ? `/${transforms}`: ''}${format ? `/f_${format}`: ''}/q_auto:best/${path? `${path}/` : ''}${id}`;
};
