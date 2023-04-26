import { useEffect, useState } from 'react';
import { Image, NativeModules, Platform } from 'react-native';

/**
 * Returns the size of an image.
 * @see https://reactnative.dev/docs/image#getsizes
 * @param uri The URI of the image.
 * @returns A promise that resolves with the size of the image.
 */
export const getImageSize = (uri: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      error => reject(error),
    );
  });

const { AZPMediaHelper } = NativeModules;

/**
 * Returns the size of a video.
 * @param uri The URI of the video.
 * @returns A promise that resolves with the size of the video.
 */
export const getVideoSize: (
  uri: string,
) => Promise<{ width: number; height: number }> = AZPMediaHelper.getVideoSize;

/**
 * Returns the real uri of a PHAsset.
 * @ios Only.
 * @param uri The uri of the PHAsset.
 */
export const getPHAssetPath: (uri: string) => Promise<string | null> =
  Platform.select({
    ios: AZPMediaHelper.getPHAssetPath,
    default: () => {
      throw new Error('getPHAssetPath is only available on iOS');
    },
  });

/**
 * Computes a mask for an image based on selfie segmentation.
 *
 * @param uri The URI of the image.
 * @returns A promise that resolves with the URI of the mask.
 */
export const segmentImage: (uri: string) => Promise<string | null> =
  AZPMediaHelper.segmentImage;

let availableFonts: string[] = [];

/**
 * Returns a list of available fonts on the device.
 * @returns A list of available fonts on the device.
 */
export const useAvailableFonts = () => {
  const [fonts, setFonts] = useState(availableFonts);
  useEffect(() => {
    if (availableFonts.length === 0) {
      AZPMediaHelper.getAvailableFonts((fonts: string[]) => {
        availableFonts = fonts;
        setFonts(fonts);
      });
    }
  }, []);
  return fonts;
};

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
