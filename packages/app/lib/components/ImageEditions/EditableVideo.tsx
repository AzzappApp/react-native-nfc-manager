import { requireNativeComponent, NativeModules } from 'react-native';
import type { ImageEditionParameters } from './EditableImage';
import type React from 'react';
import type { ViewProps } from 'react-native';

export type CropData = {
  originX: number;
  originY: number;
  width: number;
  height: number;
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
  return NativeModules.AZPEditableVideoManager.exportVideo(
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
