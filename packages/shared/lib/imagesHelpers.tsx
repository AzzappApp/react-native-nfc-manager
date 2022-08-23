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
  width = Math.round(width * pixelRatio);
  if (ratio != null) {
    const height = Math.round(width / ratio);
    return `c_fill,q_auto:eco,w_${width},h_${height}`;
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
