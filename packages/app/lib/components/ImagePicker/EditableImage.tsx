import { requireNativeComponent } from 'react-native';
import type { ImageEditionParameters } from './mediaHelpers';
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
