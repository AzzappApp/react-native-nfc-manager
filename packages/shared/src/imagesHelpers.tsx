import getRuntimeEnvironment from './getRuntimeEnvironment';

const CLOUDINARY_CLOUDNAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
export const CLOUDINARY_BASE_URL = `https://${process.env.NEXT_PUBLIC_CLOUDINARY_SECURE_DISTRIBUTION ?? 'res.cloudinary.com'}/${CLOUDINARY_CLOUDNAME}`;

/**
 * Helpers used to create an asset url from a cloudinary id without any transformation
 *
 * @param id the id of the cloudinary file
 * @returns
 */
export const getCloudinaryAssetURL = (
  id: string,
  kind: 'image' | 'raw' | 'video',
  extension?: 'jpg' | 'mp4' | 'png' | 'svg' | 'webp',
) => {
  assetNotRN('getCloudinaryAssetURL');
  const ext = extension ? `.${extension}` : '';
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
  return assembleCloudinaryUrl(id, 'image', resizeTransforms());
};

export type UrLForSizeParam = {
  id: string;
  width?: number | null;
  height?: number | null;
  pixelRatio?: number | null;
  pregeneratedSizes?: number[] | null;
  extension?: string | null;
  videoDurationPercentage?: number | null;
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
export const getImageURLForSize = ({
  id,
  width,
  height,
  pixelRatio = 1,
  pregeneratedSizes,
  extension,
}: UrLForSizeParam) => {
  assetNotRN('getImageURLForSize');
  const transforms = resizeTransforms(
    width,
    height,
    pixelRatio,
    pregeneratedSizes,
  );
  return assembleCloudinaryUrl(id, 'image', transforms, extension ?? 'webp');
};

/**
 * Helpers used to create a video url from a cloudinary id
 *
 * @param id the id of the cloudinary file
 * @returns
 */
export const getVideoURL = (id: string) => {
  assetNotRN('getVideoURL');
  return assembleCloudinaryUrl(id, 'video', resizeTransforms(), 'mp4');
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
export const getVideoUrlForSize = ({
  id,
  width,
  height,
  pixelRatio = 1,
  pregeneratedSizes,
  extension,
  streaming = false,
}: UrLForSizeParam & { streaming?: boolean }) => {
  assetNotRN('getVideoUrlForSize');
  if (streaming) {
    return assembleCloudinaryUrl(id, 'video', 'sp_auto', extension ?? 'm3u8');
  }
  const transforms = resizeTransforms(
    width,
    height,
    pixelRatio,
    pregeneratedSizes,
  );
  return assembleCloudinaryUrl(id, 'video', transforms, extension ?? 'mp4');
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
  pixelRatio = 1,
  pregeneratedSizes,
  videoDurationPercentage,
}: UrLForSizeParam) => {
  assetNotRN('getVideoThumbnailURL');
  const transforms = resizeTransforms(
    width,
    height,
    pixelRatio,
    pregeneratedSizes,
    videoDurationPercentage,
  );
  return assembleCloudinaryUrl(id, 'video', transforms, 'webp');
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
  videoDurationPercentage?: number | null,
) => {
  pixelRatio = pixelRatio ?? 1;
  let result = `q_auto:best`;

  if (videoDurationPercentage) {
    result += `,so_${videoDurationPercentage}p`;
  }

  if (width == null) {
    return result;
  }
  width = Math.ceil(width * pixelRatio);
  if (pregeneratedSizes) {
    const index = pregeneratedSizes.findIndex(size => size >= width!);
    if (index === -1) {
      if (height != null) {
        const aspectRatio = Math.round((width * 1000) / height) / 1000;
        return `c_fill,${result},ar_${aspectRatio}`;
      }
      return result;
    }
    return `${result},w_${pregeneratedSizes[index]}`;
  }
  if (height != null) {
    return `c_fill,${result},w_${width},h_${height}`;
  } else {
    return `${result},w_${width}`;
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
  extension?: string,
) => {
  // prettier-ignore
  return `${CLOUDINARY_BASE_URL}/${kind}/upload/${transforms}/${id}${extension ? `.${extension}` : ''}`;
};
