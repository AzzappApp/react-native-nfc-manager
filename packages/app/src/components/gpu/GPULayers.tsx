import { Children, useMemo } from 'react';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';

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

export type EditionParameters = {
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
  vignetting?: number | null;
  pitch?: number | null;
  roll?: number | null;
  yaw?: number | null;
  cropData?: CropData | null;
  orientation?: ImageOrientation | null;
};

export type Blending = 'multiply' | 'none';

export type GPULayerBase = {
  parameters?: EditionParameters | null;
  filters?: string[] | null;
  blending?: Blending | null;
  maskUri?: string | null;
  backgroundColor?: string | null;
  tintColor?: string | null;
};

export type ImageLayer = GPULayerBase & {
  kind: 'image';
  uri: string;
};

export type VideoLayer = GPULayerBase & {
  kind: 'video';
  uri: string;
  startTime?: number | null;
  duration?: number | null;
};

export type VideoFrameLayer = GPULayerBase & {
  kind: 'videoFrame';
  uri: string;
  time?: number | null;
};

export type GPULayer = ImageLayer | VideoFrameLayer | VideoLayer;

export type ImageProps = GPULayerBase & { uri: string };

export const Image = (_props: ImageProps): JSX.Element => {
  throw new Error('Image should not be used outside of GPU view components');
};

export type VideoProps = GPULayerBase & {
  uri: string;
  startTime?: number | null;
  duration?: number | null;
};

export const Video = (_props: VideoProps): JSX.Element => {
  throw new Error('Video should not be used outside of GPU view components');
};

export type VideoFrameProps = GPULayerBase & {
  uri: string;
  time?: number | null;
};

export const VideoFrame = (_props: VideoFrameProps): JSX.Element => {
  throw new Error(
    'VideoFrame should not be used outside of GPU view components',
  );
};

export const extractLayer = (child: unknown): GPULayer | null => {
  if (child != null && typeof child === 'object') {
    if ('type' in child && 'props' in child) {
      switch (child.type) {
        case Image: {
          const props = child.props as ImageProps;
          return {
            kind: 'image',
            ...props,
          };
        }
        case Video: {
          const props = child.props as VideoProps;
          return {
            kind: 'video',
            ...props,
          };
        }
        case VideoFrame: {
          const props = child.props as VideoFrameProps;
          return {
            kind: 'videoFrame',
            ...props,
          };
        }
        default:
          throw new Error(
            `Unsupported type in GPU view children ${child.type}`,
          );
      }
    } else {
      throw new Error(
        `Unsupported object in GPU view children ${JSON.stringify(child)}`,
      );
    }
  }
  return null;
};

export const useChildrenLayers = (children: React.ReactNode) =>
  useMemo<GPULayer[]>(
    () => convertToNonNullArray(Children.map(children, extractLayer) ?? []),
    [children],
  );

export const getNextOrientation = (
  orientation?: string | null,
): ImageOrientation => {
  switch (orientation) {
    case 'LEFT':
      return 'UP';
    case 'DOWN':
      return 'LEFT';
    case 'RIGHT':
      return 'DOWN';
    case 'UP':
    default:
      return 'RIGHT';
  }
};
