import { useEffect, useState } from 'react';
import { NativeModules, Platform } from 'react-native';

const { AZPMediaHelpers } = NativeModules;

if (!AZPMediaHelpers) {
  throw new Error('Failed to bridge AZPMediaHelpers');
}

/**
 * Returns the size of a video.
 * @param uri The URI of the video.
 * @returns A promise that resolves with the size of the video.
 */
export const getVideoSize: (
  uri: string,
) => Promise<{ width: number; height: number }> = AZPMediaHelpers.getVideoSize;

/**
 * Returns the real uri of a PHAsset.
 * @ios Only.
 * @param uri The uri of the PHAsset.
 */
export const getPHAssetPath: (uri: string) => Promise<string | null> =
  Platform.select({
    ios: AZPMediaHelpers.getPHAssetPath,
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
  AZPMediaHelpers.segmentImage;

let availableFonts: string[] = [];

/**
 * Returns a list of available fonts on the device.
 * @returns A list of available fonts on the device.
 */
export const useAvailableFonts = () => {
  const [fonts, setFonts] = useState(availableFonts);
  useEffect(() => {
    if (availableFonts.length === 0) {
      AZPMediaHelpers.getAvailableFonts((fonts: string[]) => {
        availableFonts = fonts;
        setFonts(fonts);
      });
    }
  }, []);
  return fonts;
};
