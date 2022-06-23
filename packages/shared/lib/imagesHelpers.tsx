export const COVER_RATIO = 0.625;

export const COVER_BASE_WIDTH = 125;

const CLOUDINARY_CLOUDNAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUDNAME}`;

export const getImageURLForSize = (
  coverImageId: string,
  pixelRatio: number,
  width: number,
  ratio?: number,
) => {
  width = width * pixelRatio;
  let transformation: string;
  if (ratio != null) {
    transformation = `c_fill,w_${width},h_${width / ratio}`;
  } else {
    transformation = `w_${width}`;
  }
  return `${CLOUDINARY_BASE_URL}/${transformation}/${coverImageId}`;
};

export const getVideoUrlForSize = (
  videoImageId: string,
  _width?: number,
  _pixelRatio?: number,
  _ratio?: number,
) => {
  return `${CLOUDINARY_BASE_URL}/video/upload/${videoImageId}.mp4`;
};
