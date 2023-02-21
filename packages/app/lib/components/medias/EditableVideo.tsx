import { requireNativeComponent } from 'react-native';
import Animated from 'react-native-reanimated';
import withCropMode from './withCropMode';
import type { EditableVideoProps } from './mediasTypes';

const EditableVideo: React.ComponentClass<EditableVideoProps> =
  requireNativeComponent('AZPEditableVideo');

export default EditableVideo;

export const AnimatedEditableVideo =
  Animated.createAnimatedComponent(EditableVideo);

export const EditableVideoWithCropMode = withCropMode(AnimatedEditableVideo);
