import { useIntl } from 'react-intl';
import { COVER_MAX_MEDIA_DURATION } from '@azzapp/shared/coverHelpers';
import { mediaInfoIsImage } from '#components/CoverEditor/coverEditorHelpers';
import ImagePicker, { EditImageStep } from '#components/ImagePicker';
import ScreenModal from '#components/ScreenModal';
import useToggle from '#hooks/useToggle';
import { useCoverEditorContext } from '../../CoverEditorContext';
import ToolBoxSection from '../ui/ToolBoxSection';
import type { ImagePickerResult } from '#components/ImagePicker';

const CoverEditorCutTool = () => {
  const intl = useIntl();
  const [show, toggleScreenModal] = useToggle(false);
  const {
    coverEditorState: { editionMode, medias, selectedItemIndex },
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
        <ScreenModal visible={show} animationType="slide">
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
              maxVideoDuration={COVER_MAX_MEDIA_DURATION}
            />
          )}
        </ScreenModal>
      )}
    </>
  );
};

export default CoverEditorCutTool;
