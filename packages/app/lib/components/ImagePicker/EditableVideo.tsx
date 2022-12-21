import { requireNativeComponent } from 'react-native';
import type { ImageEditionParameters } from './mediaHelpers';
import type React from 'react';
import type { ViewProps } from 'react-native';

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
