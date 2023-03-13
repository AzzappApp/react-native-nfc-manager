import { requireNativeComponent } from 'react-native';
import Animated from 'react-native-reanimated';
import withCropMode from './withCropMode';
import type { EditableVideoProps } from './mediasTypes';

/**
 * A native component that allows to a video on GPU and to apply some transformations on it.
 */
const EditableVideo: React.ComponentClass<EditableVideoProps> =
  requireNativeComponent('AZPEditableVideo');

export default EditableVideo;

/**
 * Reanimated version of EditableVideo
 */
export const AnimatedEditableVideo =
  Animated.createAnimatedComponent(EditableVideo);

/**
 * Reanimated version of EditableVideo with cropEditionMode
 * by setting the cropEditionMode prop to true a grid will be displayed
 * and touch events will be handled to allow the user to crop the video
 */
export const EditableVideoWithCropMode = withCropMode(AnimatedEditableVideo);
