const CLOUDINARY_CLOUDNAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUDNAME}`;

const getTransformationsFor = (
  width: number,
  pixelRatio: number,
  aspectRatio?: number,
) => {
  width = Math.round(width * pixelRatio);
  if (aspectRatio != null) {
    const height = Math.round(width / aspectRatio);
    return `c_fill,q_auto:eco,w_${width},h_${height}`;
  } else {
    return `q_auto:eco,w_${width}`;
  }
};

export const getImageURLForSize = (
  resourceId: string,
  width: number,
  pixelRatio = 1,
  aspectRatio?: number,
) => {
  const transforms = getTransformationsFor(width, pixelRatio, aspectRatio);
  return `${CLOUDINARY_BASE_URL}/image/upload/${transforms}/${resourceId}`;
};

export const getVideoUrlForSize = (
  resourceId: string,
  width: number,
  pixelRatio = 1,
  aspectRatio?: number,
) => {
  const transforms = getTransformationsFor(width, pixelRatio, aspectRatio);
  return `${CLOUDINARY_BASE_URL}/video/upload/${transforms}/${resourceId}.mp4`;
};

export const getVideoThumbnailURL = (
  resourceId: string,
  width: number,
  pixelRatio = 1,
  aspectRatio?: number,
) => {
  const transforms = getTransformationsFor(width, pixelRatio, aspectRatio);
  return `${CLOUDINARY_BASE_URL}/video/upload/${transforms}/${resourceId}.jpg`;
};
