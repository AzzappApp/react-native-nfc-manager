const CLOUDINARY_CLOUDNAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUDNAME}`;

const getTransformationsFor = (
  pixelRatio: number,
  width?: number,
  ratio?: number,
) => {
  if (!width) {
    return `q_auto:eco`;
  }
  width = width * pixelRatio;
  if (ratio != null) {
    return `c_fill,q_auto:eco,w_${width},h_${Math.round(width / ratio)}`;
  } else {
    return `q_auto:eco,w_${width}`;
  }
};

export const getImageURLForSize = (
  resourceId: string,
  pixelRatio = 1,
  width?: number,
  ratio?: number,
) => {
  if (width == null) {
    return `${CLOUDINARY_BASE_URL}/video/upload/${resourceId}.mp4`;
  }
  const transforms = getTransformationsFor(pixelRatio, width, ratio);
  return `${CLOUDINARY_BASE_URL}/image/upload/${transforms}/${resourceId}`;
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
  const transforms = getTransformationsFor(pixelRatio, width, ratio);
  return `${CLOUDINARY_BASE_URL}/video/upload/${transforms}/${resourceId}.mp4`;
};
