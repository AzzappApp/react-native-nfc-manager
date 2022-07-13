import { requireNativeComponent, NativeModules } from 'react-native';
import type React from 'react';
import type { ViewProps } from 'react-native';

export type CropData = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

export type ImageOrientation =
  | 'DOWN_MIRRORED'
  | 'DOWN'
  | 'LEFT_MIRRORED'
  | 'LEFT'
  | 'RIGHT_MIRRORED'
  | 'RIGHT'
  | 'UP_MIRRORED'
  | 'UP';

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

export type EditableVideoProps = Omit<ViewProps, 'children'> & {
  uri?: string | null;
  startTime?: number;
  duration?: number;
  editionParameters?: ImageEditionParameters;
  filters?: string[] | null;
  onLoad?: () => void;
};

const EditableVideo: React.ComponentType<EditableVideoProps> =
  requireNativeComponent('AZPEditableVideo');

export default EditableVideo;

type ExportVideoOptions = {
  uri: string;
  size: { width: number; height: number };
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
    parameters = {},
    filters = [],
    startTime = 0,
    duration = 0,
    removeSound = false,
  } = options;
  return NativeModules.AZPEditableVideoManager.exportVideo(
    uri,
    parameters,
    filters,
    size,
    startTime,
    duration,
    removeSound,
  );
};
