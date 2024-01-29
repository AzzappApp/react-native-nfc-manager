import { Children, useMemo } from 'react';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { typedEntries } from '@azzapp/shared/objectHelpers';
import {
  editionParametersTransforms,
  type CropData,
  type EditionParameters,
  type ImageOrientation,
} from './EditionParameters';

export type Blending = 'multiply' | 'none';

export type GPULayerBase = {
  parameters?: EditionParameters | null;
  blending?: Blending | null;
  maskUri?: string | null;
  lutFilterUri?: string | null;
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

export const transformParameters = (layers: GPULayer[]) => {
  if (!layers) return layers;

  return layers.map(layer => ({
    ...layer,
    parameters: layer.parameters
      ? typedEntries(layer.parameters).reduce((acc, [key, value]) => {
          const transform = editionParametersTransforms[key];
          if (value != null && transform != null) {
            // @ts-expect-error no mapped type in TS
            acc[key] = transform(value);
          } else {
            // @ts-expect-error no mapped type in TS
            acc[key] = value;
          }
          return acc;
        }, {} as EditionParameters)
      : null,
  }));
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
      return 'DOWN';
    case 'DOWN':
      return 'RIGHT';
    case 'RIGHT':
      return 'UP';
    case 'UP':
    default:
      return 'LEFT';
  }
};

const LAYOUT_PARAMETERS = ['cropData', 'orientation', 'roll', 'pitch', 'yaw'];

export const extractLayoutParameters = (
  parameters: EditionParameters | null | undefined,
): [
  layoutParameters: EditionParameters,
  otherParameters: EditionParameters,
] => {
  const layoutParameters: EditionParameters = {};
  const otherParameters: EditionParameters = {};
  if (!parameters) {
    return [layoutParameters, otherParameters];
  }
  typedEntries(parameters).forEach(([key, value]) => {
    if (LAYOUT_PARAMETERS.includes(key)) {
      layoutParameters[key] = value as any;
    } else {
      otherParameters[key] = value as any;
    }
  });
  return [layoutParameters, otherParameters];
};

export const cropDataForAspectRatio = (
  mediaWidth: number,
  mediaHeight: number,
  aspectRatio: number,
): CropData => {
  if (mediaWidth / mediaHeight > aspectRatio) {
    return {
      originX: (mediaWidth - mediaHeight * aspectRatio) / 2,
      originY: 0,
      height: mediaHeight,
      width: mediaHeight * aspectRatio,
    };
  } else {
    return {
      originX: 0,
      originY: (mediaHeight - mediaWidth / aspectRatio) / 2,
      height: mediaWidth / aspectRatio,
      width: mediaWidth,
    };
  }
};
