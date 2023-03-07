import { useEffect, useState } from 'react';
import { Image, NativeModules, Platform, processColor } from 'react-native';
import type { ImageEditionParameters } from '#types';

export const getImageSize = (uri: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      error => reject(error),
    );
  });

const { AZPMediaHelper } = NativeModules;

export const getVideoSize: (
  uri: string,
) => Promise<{ width: number; height: number }> = AZPMediaHelper.getVideoSize;

export const getPHAssetPath: (uri: string) => Promise<string | null> =
  Platform.select({
    ios: AZPMediaHelper.getPHAssetPath,
    default: () => Promise.resolve(null),
  });

export const segmentImage: (uri: string) => Promise<string | null> =
  AZPMediaHelper.segmentImage;

type ExportImageOptions = {
  uri: string;
  size: { width: number; height: number };
  parameters?: ImageEditionParameters;
  format?: 'JPEG' | 'PNG';
  filters?: string[] | null;
  quality?: number;
  maskUri?: string | null;
  backgroundColor?: string | null;
  backgroundImageUri?: string | null;
  backgroundImageTintColor?: string | null;
  backgroundMultiply?: boolean | null;
  foregroundImageUri?: string | null;
  foregroundImageTintColor?: string | null;
};

export const exportImage = (options: ExportImageOptions): Promise<string> => {
  const {
    uri,
    size,
    parameters = {},
    filters = [],
    format = 'JPEG',
    quality = 1,
    maskUri,
    backgroundColor = null,
    backgroundImageUri = null,
    backgroundImageTintColor = null,
    backgroundMultiply = false,
    foregroundImageUri = null,
    foregroundImageTintColor = null,
  } = options;
  return AZPMediaHelper.exportImage(
    uri,
    parameters,
    filters,
    format,
    quality,
    size,
    maskUri,
    backgroundColor ? processColor(backgroundColor) : null,
    backgroundImageUri,
    backgroundImageTintColor ? processColor(backgroundImageTintColor) : null,
    backgroundMultiply,
    foregroundImageUri,
    foregroundImageTintColor ? processColor(foregroundImageTintColor) : null,
  );
};

type ExportVideoOptions = {
  uri: string;
  size: { width: number; height: number };
  bitRate: number;
  parameters?: ImageEditionParameters;
  filters?: string[];
  startTime?: number;
  duration?: number;
  removeSound?: boolean;
};

export const exportVideo = (options: ExportVideoOptions): Promise<string> => {
  const {
    uri,
    size,
    bitRate,
    parameters = {},
    filters = [],
    startTime = 0,
    duration = 0,
    removeSound = true,
  } = options;
  return AZPMediaHelper.exportVideo(
    uri,
    parameters,
    filters,
    size,
    bitRate,
    startTime,
    duration,
    removeSound,
  );
};

let availableFonts: string[] = [];

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

export const display2digit = (n: number) => (n >= 10 ? `${n}` : `0${n}`);

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
export const calculImageSize = (
  width: number,
  height: number,
  maxDimension: number,
) => {
  const maxSize = Math.min(Math.max(height, width), maxDimension);
  const ratio = Math.min(maxSize / width, maxSize / height);
  return { width: Math.ceil(width * ratio), height: Math.ceil(height * ratio) };
};

export const isPNG = (uri: string) => uri.toLowerCase().endsWith('.png');
