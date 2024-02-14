import ImageSize from 'react-native-image-size';

/**
 * Returns the size of an image.
 * @see https://reactnative.dev/docs/image#getsizes
 * @param uri The URI of the image.
 * @returns A promise that resolves with the size of the image.
 */
export const getImageSize = (uri: string) => ImageSize.getSize(uri);

/**
 * Format a number to a 2 digit string.
 */
export const display2digit = (n: number) => (n >= 10 ? `${n}` : `0${n}`);

/**
 * format a time in seconds to a string in the form of hh:mm:ss or mm:ss if the time is less than an hour.
 * @param timeInSeconds The time in seconds to format.
 * @returns A string in the form of hh:mm:ss or mm:ss if the time is less than an hour.
 */
export const formatVideoTime = (timeInSeconds = 0) => {
  const seconds = Math.floor(timeInSeconds);
  let minutes = Math.floor(timeInSeconds / 60);
  const hours = Math.floor(minutes / 60);
  minutes = minutes % 60;
  if (hours) {
    return `${display2digit(hours)}:${display2digit(minutes)}:${display2digit(
      seconds,
    )}`;
  }
  return `${display2digit(minutes)}:${display2digit(seconds)}`;
};

/**
 * It takes a width and height, and returns a new width and height that are scaled down to fit within a
 * maximum dimension
 * @param {number} width - The width of the image
 * @param {number} height - The height of the image
 * @param {number} maxDimension - The maximum width or height of the image.
 * @returns An object with two properties, width and height.
 */
export const downScaleImage = (
  width: number,
  height: number,
  maxDimension: number,
) => {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }
  const ratio = maxDimension / Math.max(width, height);
  return {
    width: width * ratio,
    height: height * ratio,
  };
};

export const isPNG = (uri: string) => uri.toLowerCase().endsWith('.png');
