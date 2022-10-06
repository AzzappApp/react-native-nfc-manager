import { requireNativeComponent, NativeModules } from 'react-native';
import type { ImageEditionParameters } from './helpers';
import type React from 'react';
import type { ViewProps } from 'react-native';

export type EditableImageProps = Omit<ViewProps, 'children'> & {
  source?: {
    uri?: string | null;
    kind?: 'image' | 'video' | null;
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
