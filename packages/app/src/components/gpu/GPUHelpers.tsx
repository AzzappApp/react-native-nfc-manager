import { processColor, NativeModules } from 'react-native';
import type { GPULayer } from '#components/gpu/GPULayers';

const GPUHelpers = NativeModules.AZPGPUHelpers;

// TODO don't know why jest can't mock this
// if (!GPUHelpers) {
//   throw new Error('Failed to bridge GPUHelpers');
// }

export type ExportImageOptions = {
  format?: 'auto' | 'jpg' | 'png';
  quality?: number;
  size: { width: number; height: number };
};

export const exportLayersToImage = (
  options: ExportImageOptions & {
    layers: GPULayer[];
    backgroundColor?: string;
  },
): Promise<string> => {
  const {
    layers,
    format = 'jpg',
    quality = 90,
    size,
    backgroundColor = 'transparent',
  } = options;
  return GPUHelpers.exportLayersToImage(
    layers,
    processColor(backgroundColor),
    format,
    quality,
    size,
  );
};

export type ExportVideoOptions = {
  size: { width: number; height: number };
  bitRate?: number;
  removeSound?: boolean;
};

export const exportLayersToVideo = (
  options: ExportVideoOptions & {
    layers: GPULayer[];
    backgroundColor?: string;
  },
): Promise<string> => {
  const {
    layers,
    size,
    bitRate = 10000000,
    removeSound = false,
    backgroundColor = '#000',
  } = options;
  return GPUHelpers.exportLayersToVideo(
    layers,
    processColor(backgroundColor),
    size,
    bitRate,
    removeSound,
  );
};
