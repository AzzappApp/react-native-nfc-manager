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

/**
 * Duplicates selected media items to fill all the designated slots in a media template.
 * This function ensures that the number of media items meets the required total number of slots
 * by duplicating existing media items cyclically until the total slot count is reached.
 *
 * @param totalSlots The total number of media slots that need to be filled in the template.
 * @param selectedMedias An array of media items (of generic type T) currently selected. These items can be of any type, typically strings, objects, etc.
 * @returns An array of media items of type T, where the number of items is equal to `totalSlots`. If the initial number of selected media items is less than `totalSlots`, it duplicates items from the `selectedMedias` cyclically to fill the gap.
 *
 * @example
 * Simple example:
 * ```ts
 * // Example of using duplicateMediaToFillSlots with strings as the media type.
 * const totalMediaSlots = 5;
 * const currentSelectedMedias = ['Media A', 'Media B', 'Media C'];
 * const finalMediaList = duplicateMediaToFillSlots<string>(totalMediaSlots, currentSelectedMedias);
 * console.log(finalMediaList); // Outputs: ['Media A', 'Media B', 'Media C', 'Media A', 'Media B']
 * ```
 */
export const duplicateMediaToFillSlots = <T>(
  totalSlots: number,
  selectedMedias: T[],
): T[] => {
  if (selectedMedias.length >= totalSlots) {
    return selectedMedias;
  }

  const filledMediaSlots: T[] = [...selectedMedias];

  while (filledMediaSlots.length < totalSlots) {
    // Add to the list the media to be duplicated.
    // The media to be duplicated is from the initial list of selected medias, cycling through them.
    filledMediaSlots.push(
      filledMediaSlots[filledMediaSlots.length % selectedMedias.length],
    );
  }

  return filledMediaSlots;
};
