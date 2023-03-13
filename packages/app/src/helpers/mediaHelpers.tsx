import { useEffect, useState } from 'react';
import { Image, NativeModules, Platform, processColor } from 'react-native';

type MediaBase = {
  /**
   * The URI of the media in the device photo library.
   * might be a ph-asset:// uri on iOS
   */
  galleryUri?: string;
  /**
   * The URI of the media.
   */
  uri: string;
  /**
   * The width of the media.
   */
  width: number;
  /**
   * The height of the media.
   */
  height: number;
};

/**
 * a local image
 */
export type MediaImage = MediaBase & { kind: 'image' };

/**
 * a local video
 */
export type MediaVideo = MediaBase & {
  kind: 'video';
  duration: number;
};

/**
 * a local media
 */
export type Media = MediaImage | MediaVideo;

/**
 * A time range
 */
export type TimeRange = {
  /**
   * The start time of the time range in seconds
   */
  startTime: number;
  /**
   * The duration of the time range in seconds
   */
  duration: number;
};

/**
 * Crop informations for an image or video
 */
export type CropData = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

/**
 * The orientation of an image or video
 */
export type ImageOrientation = 'DOWN' | 'LEFT' | 'RIGHT' | 'UP';

/**
 * The edition parameters to apply to an image or video
 */
export type ImageEditionParameters = {
  brightness?: number | null;
  contrast?: number | null;
  highlights?: number | null;
  saturation?: number | null;
  shadow?: number | null;
  sharpness?: number | null;
  structure?: number | null;
  temperature?: number | null;
  tint?: number | null;
  vibrance?: number | null;
  vigneting?: number | null;
  pitch?: number | null;
  roll?: number | null;
  yaw?: number | null;
  cropData?: CropData | null;
  orientation?: ImageOrientation;
};

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

type ExportImageOptions = {
  /**
   * The URI of the image to export.
   */
  uri: string;
  /**
   * the desired size of the exported image.
   */
  size: { width: number; height: number };
  /**
   * The parameters to apply to the image.
   */
  parameters?: ImageEditionParameters;
  /**
   * The format of the exported image.
   */
  format?: 'JPEG' | 'PNG';
  /**
   * The filters to apply to the image.
   */
  filters?: string[] | null;
  /**
   * The quality of the exported image. 0 to 1.
   * only applies to JPEG.
   */
  quality?: number;
  /**
   * The URI of the mask to apply to the image.
   */
  maskUri?: string | null;
  /**
   * The background color of the exported image.
   */
  backgroundColor?: string | null;
  /**
   * The URI of the background image to apply to the exported image.
   */
  backgroundImageUri?: string | null;
  /**
   * The tint color to apply on the background image.
   */
  backgroundImageTintColor?: string | null;
  /**
   * If true blend the image with the background image.
   */
  backgroundMultiply?: boolean | null;
  /**
   * The URI of the foreground image to apply to the exported image.
   */
  foregroundImageUri?: string | null;
  /**
   * The tint color to apply on the foreground image.
   */
  foregroundImageTintColor?: string | null;
};

/**
 * Exports an image to a temporary file.
 * Apply filters, parameters, mask, background, etc.
 *
 * @param options The options to apply to the exported image.
 * @returns A promise that resolves with the URI of the exported image.
 */
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
  /**
   * The URI of the video to export.
   */
  uri: string;
  /**
   * The desired size of the exported video.
   */
  size: { width: number; height: number };
  /**
   * The desired bitrate of the exported video.
   */
  bitRate: number;
  /**
   * The parameters to apply to the video.
   */
  parameters?: ImageEditionParameters;
  /**
   * The filters to apply to the video.
   */
  filters?: string[];
  /**
   * The start of the selected video time range.
   */
  startTime?: number;
  /**
   * The duration of the selected video time range.
   */
  duration?: number;
  /**
   * If true remove the sound from the exported video.
   */
  removeSound?: boolean;
};

/**
 * Exports a video to a temporary file.
 * Apply filters, parameters, etc.
 * @param options The options to apply to the exported video.
 * @returns A promise that resolves with the URI of the exported video.
 */
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
