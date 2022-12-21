import { Image, NativeModules, Platform } from 'react-native';
const { AZPMediaHelper } = NativeModules;

export const getImageSize = (uri: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      error => reject(error),
    );
  });

export const getVideoSize: (
  uri: string,
) => Promise<{ width: number; height: number }> = AZPMediaHelper.getVideoSize;

export const getPHAssetPath: (uri: string) => Promise<string | null> =
  Platform.select({
    ios: AZPMediaHelper.getPHAssetPath,
    default: () => Promise.resolve(null),
  });

export const getFilePathFromURI = (uri: string) =>
  uri.replace(/^file:\/\//g, '');

export type CropData = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};
export type ImageOrientation = 'DOWN' | 'LEFT' | 'RIGHT' | 'UP';

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

type ExportOptions = {
  uri: string;
  size: { width: number; height: number };
  parameters?: ImageEditionParameters;
  format?: 'JPEG' | 'PNG';
  filters?: string[];
  quality?: number;
};

export const exportImage = (options: ExportOptions): Promise<string> => {
  const {
    uri,
    size,
    parameters = {},
    filters = [],
    format = 'JPEG',
    quality = 1,
  } = options;
  return AZPMediaHelper.exportImage(
    uri,
    parameters,
    filters,
    format,
    quality,
    size,
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
