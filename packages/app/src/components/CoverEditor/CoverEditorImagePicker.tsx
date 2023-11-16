import {
  COVER_MAX_VIDEO_DURATTION,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import ImagePicker, {
  ImagePickerCardMediaWrapper,
  SelectImageStepWithFrontCameraByDefault,
  VideoTimeRangeStep,
} from '#components/ImagePicker';
import type { ImagePickerProps } from '#components/ImagePicker/ImagePicker';

const CoverEditiorImagePicker = (
  props: Omit<
    ImagePickerProps,
    'forceAspectRatio' | 'maxVideoDuration' | 'steps' | 'TopPanelWrapper'
  >,
) => (
  <ImagePicker
    forceAspectRatio={COVER_RATIO}
    maxVideoDuration={COVER_MAX_VIDEO_DURATTION}
    steps={[SelectImageStepWithFrontCameraByDefault, VideoTimeRangeStep]}
    TopPanelWrapper={ImagePickerCardMediaWrapper}
    {...props}
  />
);

export default CoverEditiorImagePicker;
