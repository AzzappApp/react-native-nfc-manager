import { useIntl } from 'react-intl';
import {
  COVER_MAX_MEDIA_DURATION,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import ImagePicker, { SelectImageStep } from '#components/ImagePicker';
import ScreenModal from '#components/ScreenModal';
import useToggle from '#hooks/useToggle';
import {
  useCoverEditorActiveMedia,
  useCoverEditorContext,
} from '../../CoverEditorContext';
import ToolBoxSection from '../ui/ToolBoxSection';
import type { MediaInfo } from '#components/CoverEditor/coverEditorTypes';
import type { ImagePickerResult } from '#components/ImagePicker';

const CoverEditorAdjustTool = () => {
  const intl = useIntl();
  const [show, toggleScreenModal] = useToggle(false);
  const {
    coverEditorState: { editionMode },
    dispatch,
  } = useCoverEditorContext();

  const activeMedia = useCoverEditorActiveMedia();
  const cropData = activeMedia?.editionParameters?.cropData;
  const media = activeMedia?.media;
  const mediaAspectRatio = cropData
    ? cropData.width / cropData.height
    : media
      ? media.width / media.height
      : 1;

  const onFinished = ({
    kind,
    uri,
    editionParameters,
    filter,
    rotation,
    height,
    width,
    timeRange,
    duration,
    galleryUri,
  }: ImagePickerResult) => {
    let mediaInfo: MediaInfo;
    if (kind === 'video') {
      mediaInfo = {
        media: {
          kind: 'video',
          uri,
          width,
          height,
          rotation,
          duration: duration!,
          galleryUri,
        },
        editionParameters,
        filter,
        timeRange: timeRange!,
      };
    } else {
      mediaInfo = {
        media: {
          kind: 'image',
          uri,
          width,
          height,
          galleryUri,
        },
        editionParameters,
        filter,
        duration: COVER_MAX_MEDIA_DURATION,
        animation: null,
      };
    }
    dispatch({
      type: 'UPDATE_ACTIVE_MEDIA',
      payload: mediaInfo,
    });

    toggleScreenModal();
  };

  return (
    <>
      <ToolBoxSection
        icon="refresh"
        label={intl.formatMessage({
          defaultMessage: 'Replace',
          description: 'Cover Edition Overlay Tool Button- Replace',
        })}
        onPress={toggleScreenModal}
      />
      {activeMedia != null && (
        <ScreenModal visible={show} animationType="slide">
          {show && (
            <ImagePicker
              initialData={activeMedia}
              kind={editionMode === 'overlay' ? 'image' : 'mixed'}
              forceAspectRatio={
                editionMode === 'overlay' ? mediaAspectRatio : COVER_RATIO
              }
              steps={[SelectImageStep]}
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

export default CoverEditorAdjustTool;
