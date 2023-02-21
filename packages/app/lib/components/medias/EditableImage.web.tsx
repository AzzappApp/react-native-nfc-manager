import { View } from 'react-native';
import type { EditableImageProps } from './mediasTypes';

const EditableImage = (props: EditableImageProps) => {
  console.error('EditableImage is not implemented yet on web');

  return <View style={props.style} />;
};

export default EditableImage;

export const AnimatedEditableImage = EditableImage;

export const EditableImageWithCropMode = EditableImage;
