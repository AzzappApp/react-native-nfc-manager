import { useIntl } from 'react-intl';
import { View, useWindowDimensions } from 'react-native';
import {
  ImagePickerMediaRenderer,
  ImagePickerStep,
  useImagePickerState,
} from '#components/ImagePicker';
import VideoTimelineEditor from '#components/VideoTimelineEditor';

const CoverEditionVideoCropStep = () => {
  const intl = useIntl();
  const {
    maxVideoDuration,
    media,
    aspectRatio,
    editionParameters,
    onTimeRangeChange,
  } = useImagePickerState();

  const { width: windowWidth } = useWindowDimensions();

  if (media?.kind !== 'video') {
    return null;
  }
  return (
    <ImagePickerStep
      stepId={CoverEditionVideoCropStep.STEP_ID}
      topPanel={<ImagePickerMediaRenderer />}
      headerTitle={intl.formatMessage({
        defaultMessage: 'Adjust your video',
        description: 'Cover edition video crop step header title',
      })}
      bottomPanel={
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <VideoTimelineEditor
            video={media}
            editionParameters={editionParameters}
            aspectRatio={aspectRatio}
            maxDuration={maxVideoDuration}
            onChange={onTimeRangeChange}
            width={windowWidth - 20}
            imagesHeight={80}
            style={{ alignSelf: 'center' }}
          />
        </View>
      }
    />
  );
};

CoverEditionVideoCropStep.STEP_ID = 'VIDEO_CROP';
CoverEditionVideoCropStep.mediaKind = 'video' as const;

export default CoverEditionVideoCropStep;
