import { View } from 'react-native';
import type { EditableImageProps } from './mediasTypes';

const EditableVideo = (props: EditableImageProps) => {
  console.error('EditableVideo is not implemented yet on web');

  return <View style={props.style} />;
};

export default EditableVideo;

export const AnimatedEditableVideo = EditableVideo;

export const EditableVideoWithCropMode = EditableVideo;
