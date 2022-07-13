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

export type EditableImageProps = Omit<ViewProps, 'children'> & {
  source?: {
    uri?: string | null;
    kind?: 'picture' | 'video' | null;
    videoTime?: number;
  } | null;
  editionParameters?: ImageEditionParameters;
  filters?: string[] | null;
  onLoad?: () => void;
};

const EditableImage: React.ComponentType<EditableImageProps> =
  requireNativeComponent('AZPEditableImage');

export default EditableImage;

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
  return NativeModules.AZPEditableImageManager.exportImage(
    uri,
    parameters,
    filters,
    format,
    quality,
    size,
  );
};
