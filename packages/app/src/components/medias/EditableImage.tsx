import { requireNativeComponent } from 'react-native';
import Animated from 'react-native-reanimated';
import withCropMode from './withCropMode';
import type { EditableImageProps } from './mediasTypes';
/**
 * A native component that allows to render and image or a video frame on GPU,
 * and to apply some transformations on it.
 */
const EditableImage: React.ComponentClass<EditableImageProps> =
  requireNativeComponent('AZPEditableImage');

export default EditableImage;

/**
 * Reanimated version of EditableImage
 */
export const AnimatedEditableImage =
  Animated.createAnimatedComponent(EditableImage);

/**
 * Reanimated version of EditableImage with cropEditionMode
 * by setting the cropEditionMode prop to true a grid will be displayed
 * and touch events will be handled to allow the user to crop the image
 */
export const EditableImageWithCropMode = withCropMode(AnimatedEditableImage);
