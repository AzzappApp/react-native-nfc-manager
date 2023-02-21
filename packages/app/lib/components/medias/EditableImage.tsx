import { requireNativeComponent } from 'react-native';
import Animated from 'react-native-reanimated';
import withCropMode from './withCropMode';
import type { EditableImageProps } from './mediasTypes';

const EditableImage: React.ComponentClass<EditableImageProps> =
  requireNativeComponent('AZPEditableImage');

export default EditableImage;

export const AnimatedEditableImage =
  Animated.createAnimatedComponent(EditableImage);

export const EditableImageWithCropMode = withCropMode(AnimatedEditableImage);
