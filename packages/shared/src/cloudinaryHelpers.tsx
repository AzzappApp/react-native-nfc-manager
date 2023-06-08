import { fetchJSON } from './networkHelpers';

const CLOUDINARY_CLOUDNAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET!;

const CLOUDINARY_VIDEO_PATH = 'video/upload';
const CLOUDINARY_IMAGE_PATH = 'image/upload';

const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUDNAME}`;
const CLOUDINARY_AUTHORIZATION = btoa(
  `${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`,
);

export type CloudinaryResource = {
  asset_id: string;
  public_id: string;
  format: string;
  version: number;
  resource_type: 'image' | 'video';
  type: 'upload';
  created_at: string;
  bytes: number;
  width: number;
  height: number;
  folder: '';
  url: string;
  secure_url: string;
};

type ResourceResult = {
  resources: CloudinaryResource[];
};

/**
 * Get the media info from cloudinary.
 *
 * > :warning: cloudinary does not support retrieving more than 100 resources at once, pagination is handled by this function.
 *
 * @param medias The medias to get the info from.
 * @returns The media info.
 */
export const getMediaInfoByPublicIds = async (
  medias: Array<{ publicId: string; kind: 'image' | 'video' }>,
) => {
  const videosIds = medias
    .filter(media => media.kind === 'video')
    .map(media => media.publicId);
  const imagesIds = medias
    .filter(media => media.kind === 'image')
    .map(media => media.publicId);

  if (videosIds.length === 0 && imagesIds.length === 0) {
    return [];
  }
  let videoPromise: Promise<ResourceResult> | null = null;
  if (videosIds.length > 0) {
    const videoAPIURL = `${CLOUDINARY_API_URL}/resources/${CLOUDINARY_VIDEO_PATH}`;
    const params = new URLSearchParams();
    videosIds.forEach(id => params.append('public_ids[]', id));
    videoPromise = fetchJSON<ResourceResult>(
      `${videoAPIURL}?${params.toString()}`,
      {
        headers: {
          Authorization: `Basic ${CLOUDINARY_AUTHORIZATION}`,
        },
      },
    );
  }
  let imagePromise: Promise<ResourceResult> | null = null;
  if (imagesIds.length > 0) {
    const imageAPIURL = `${CLOUDINARY_API_URL}/resources/${CLOUDINARY_IMAGE_PATH}`;
    const params = new URLSearchParams();
    imagesIds.forEach(id => params.append('public_ids[]', id));
    imagePromise = fetchJSON<ResourceResult>(
      `${imageAPIURL}?${params.toString()}`,
      {
        headers: {
          Authorization: `Basic ${CLOUDINARY_AUTHORIZATION}`,
        },
      },
    );
  }
  const [videoResult, imageResult] = await Promise.all([
    videoPromise,
    imagePromise,
  ]);

  const resultMap = new Map<string, CloudinaryResource>();
  if (videoResult) {
    videoResult.resources.forEach(resource =>
      resultMap.set(resource.public_id, resource),
    );
  }
  if (imageResult) {
    imageResult.resources.forEach(resource =>
      resultMap.set(resource.public_id, resource),
    );
  }
  return medias.map(media => resultMap.get(media.publicId));
};

type DeleteResourceResult = {
  deleted: {
    [publicId: string]: 'deleted'; // TODO check if it's always deleted
  };
  partial: boolean;
};

/**
 * Delete the media from cloudinary.
 * > :warning: pagination is not handled by this function.
 *
 * @param medias The medias to delete.
 */
export const deleteMediaByPublicIds = async (
  medias: Array<{ publicId: string; kind: 'image' | 'video' }>,
) => {
  const videosIds = medias
    .filter(media => media.kind === 'video')
    .map(media => media.publicId);
  const imagesIds = medias
    .filter(media => media.kind === 'image')
    .map(media => media.publicId);

  if (videosIds.length === 0 && imagesIds.length === 0) {
    return [];
  }
  let videoPromise: Promise<DeleteResourceResult> | null = null;
  if (videosIds.length > 0) {
    const videoAPIURL = `${CLOUDINARY_API_URL}/resources/${CLOUDINARY_VIDEO_PATH}`;
    const params = new URLSearchParams();
    videosIds.forEach(id => params.append('public_ids[]', id));
    videoPromise = fetchJSON<DeleteResourceResult>(
      `${videoAPIURL}?${params.toString()}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${CLOUDINARY_AUTHORIZATION}`,
        },
      },
    );
  }

  let imagePromise: Promise<DeleteResourceResult> | null = null;
  if (imagesIds.length > 0) {
    const imageAPIURL = `${CLOUDINARY_API_URL}/resources/${CLOUDINARY_IMAGE_PATH}`;
    const params = new URLSearchParams();
    imagesIds.forEach(id => params.append('public_ids[]', id));
    imagePromise = fetchJSON<DeleteResourceResult>(
      `${imageAPIURL}?${params.toString()}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${CLOUDINARY_AUTHORIZATION}`,
        },
      },
    );
  }

  // TODO manage cursor and partial deletion
  await Promise.all([videoPromise, imagePromise]);
};
