import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import {
  COVER_IMAGE_DEFAULT_DURATION,
  COVER_VIDEO_DEFAULT_DURATION,
} from '@azzapp/shared/coverHelpers';
import {
  extractLottieInfoMemoized,
  getLottieMediasDurations,
  mediaInfoIsImage,
} from '#components/CoverEditor/coverEditorHelpers';
import ImagePicker, { EditImageStep } from '#components/ImagePicker';
import { ScreenModal } from '#components/NativeRouter';
import useToggle from '#hooks/useToggle';
import { useCoverEditorContext } from '../../CoverEditorContext';
import ToolBoxSection from '../ui/ToolBoxSection';
import type { ImagePickerResult } from '#components/ImagePicker';

const CoverEditorCutTool = () => {
  const intl = useIntl();
  const [show, toggleScreenModal] = useToggle(false);
  const {
    coverEditorState: { editionMode, medias, selectedItemIndex, lottie },
    dispatch,
  } = useCoverEditorContext();

  const mediaInfo =
    editionMode === 'mediaEdit' && selectedItemIndex != null
      ? medias[selectedItemIndex]
      : null;

  const onFinished = (result: ImagePickerResult) => {
    dispatch({
      type: 'UPDATE_CURRENT_VIDEO_TIME_RANGE',
      payload: result.timeRange!,
    });
    toggleScreenModal();
  };

  const cropData = mediaInfo?.editionParameters?.cropData;
  const aspectRatio = cropData ? cropData.width / cropData.height : undefined;

  const expectedDuration = useMemo(() => {
    const lottieInfo = extractLottieInfoMemoized(lottie);
    if (!lottieInfo) return null;
    const durations = getLottieMediasDurations(lottieInfo);
    if (selectedItemIndex == null || !durations) return null;
    return durations[selectedItemIndex] ?? null;
  }, [lottie, selectedItemIndex]);

  return (
    <>
      <ToolBoxSection
        icon="chrono"
        label={intl.formatMessage({
          defaultMessage: 'Cut',
          description: 'Cover Edition Media Tool Button - cut',
        })}
        onPress={toggleScreenModal}
      />
      {mediaInfo != null && !mediaInfoIsImage(mediaInfo) && (
        <ScreenModal
          visible={show}
          animationType="slide"
          onRequestDismiss={toggleScreenModal}
        >
          {show && (
            <ImagePicker
              initialData={{
                media: mediaInfo.media,
                timeRange: mediaInfo.timeRange,
                editionParameters: mediaInfo.editionParameters,
                filter: mediaInfo.filter,
              }}
              forceAspectRatio={aspectRatio}
              additionalData={{ selectedTab: 'timeRange', showTabs: false }}
              kind={editionMode === 'overlay' ? 'image' : 'mixed'}
              steps={[EditImageStep]}
              onCancel={toggleScreenModal}
              onFinished={onFinished}
              maxVideoDuration={
                expectedDuration ?? COVER_VIDEO_DEFAULT_DURATION
              }
              minVideoDuration={
                expectedDuration ?? COVER_IMAGE_DEFAULT_DURATION
              }
            />
          )}
        </ScreenModal>
      )}
    </>
  );
};

export default CoverEditorCutTool;
