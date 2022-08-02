export const COVER_RATIO = 0.625;

export const COVER_BASE_WIDTH = 125;

const CLOUDINARY_CLOUDNAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUDNAME}`;

export const getImageURLForSize = (
  resourceId: string,
  pixelRatio = 1,
  width?: number,
  ratio?: number,
) => {
  if (width == null) {
    return `${CLOUDINARY_BASE_URL}/video/upload/${resourceId}.mp4`;
  }
  width = width * pixelRatio;
  let transformation: string;
  if (ratio != null) {
    transformation = `c_fill,w_${width},h_${Math.ceil(width / ratio)}`;
  } else {
    transformation = `w_${width}`;
  }
  return `${CLOUDINARY_BASE_URL}/image/upload/${transformation}/${resourceId}`;
};

export const getVideoUrlForSize = (
  resourceId: string,
  pixelRatio = 1,
  width?: number,
  ratio?: number,
) => {
  if (width == null) {
    return `${CLOUDINARY_BASE_URL}/video/upload/${resourceId}.mp4`;
  }
  width = width * pixelRatio;
  let transformation: string;
  if (ratio != null) {
    transformation = `c_fill,w_${width},h_${width / ratio}`;
  } else {
    transformation = `w_${width}`;
  }
  return `${CLOUDINARY_BASE_URL}/video/upload/${transformation}/${resourceId}.mp4`;
};
