export const COVER_RATIO = 0.625;

export const COVER_BASE_WIDTH = 125;

export const getCoverFormat = (multiplier: number) => ({
  width: COVER_BASE_WIDTH * multiplier,
  height: (COVER_BASE_WIDTH / COVER_RATIO) * multiplier,
});

const CLOUDINARY_CLOUDNAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

export const getCoverURLForSize = (size: number, coverImageId: string) => {
  if (/^(https?|file):\/\//.test(coverImageId)) {
    return coverImageId;
  }
  const baseURL = `https://res.cloudinary.com/${CLOUDINARY_CLOUDNAME}`;
  const { width, height } = getCoverFormat(size);
  const transformation = `c_fill,w_${width},h_${height}`;
  return `${baseURL}/${transformation}/${coverImageId}`;
};

export const getMostAdaptedCoverSizeForWidth = (width: number) =>
  Math.ceil(width / COVER_BASE_WIDTH);
