import { processColor, NativeModules } from 'react-native';
import type { GPULayer } from './GPULayers';

const GPUImageViewManager = NativeModules.AZPGPUImageViewManager;
const GPUVideoViewManager = NativeModules.AZPGPUVideoViewManager;

if (!GPUImageViewManager) {
  throw new Error('Failed to bridge GPUImageViewManager');
}

if (!GPUVideoViewManager) {
  throw new Error('Failed to bridge GPUVideoViewManager');
}

export type ExportImageOptions = {
  format?: 'auto' | 'jpg' | 'png';
  quality?: number;
  size: { width: number; height: number };
};

export const exportViewImage = (
  node: number,
  options: ExportImageOptions,
): Promise<string> => {
  const { format = 'jpg', quality = 90, size } = options;
  return GPUImageViewManager.exportViewImage(node, format, quality, size);
};

export const exportImage = (
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
    backgroundColor = '#000',
  } = options;
  return GPUImageViewManager.exportLayers(
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

export const exportViewVideo = (
  node: number,
  options: ExportVideoOptions,
): Promise<string> => {
  const { size, bitRate = 10000000, removeSound = false } = options;
  return GPUVideoViewManager.exportViewVideo(node, size, bitRate, removeSound);
};

export const exportVideo = (
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
  return GPUVideoViewManager.exportLayers(
    layers,
    processColor(backgroundColor),
    size,
    bitRate,
    removeSound,
  );
};
