import { useIntl } from 'react-intl';
import {
  COVER_MAX_MEDIA_DURATION,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import { extractLottieInfoMemoized } from '#components/CoverEditor/coverEditorHelpers';
import ImagePicker, { SelectImageStep } from '#components/ImagePicker';
import { ScreenModal } from '#components/NativeRouter';
import useToggle from '#hooks/useToggle';
import {
  useCoverEditorActiveMedia,
  useCoverEditorContext,
} from '../../CoverEditorContext';
import ToolBoxSection from '../ui/ToolBoxSection';
import type { MediaInfo } from '#components/CoverEditor/coverEditorTypes';
import type { ImagePickerResult } from '#components/ImagePicker';

const CoverEditorMediaReplace = () => {
  const intl = useIntl();
  const [show, toggleScreenModal] = useToggle(false);
  const {
    coverEditorState: { lottie, selectedItemIndex, editionMode },
    dispatch,
  } = useCoverEditorContext();

  const asset =
    selectedItemIndex != null && editionMode === 'mediaEdit'
      ? extractLottieInfoMemoized(lottie)?.assetsInfos[selectedItemIndex]
      : null;
  const activeMedia = useCoverEditorActiveMedia();

  const cropData = activeMedia?.editionParameters?.cropData;
  const mediaAspectRatio = cropData
    ? cropData.width / cropData.height
    : asset
      ? asset.width / asset.height
      : COVER_RATIO;

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
        <ScreenModal
          visible={show}
          animationType="slide"
          onRequestDismiss={toggleScreenModal}
        >
          {show && (
            <ImagePicker
              initialData={{
                ...activeMedia,
                filter: null,
              }}
              kind={editionMode === 'overlay' ? 'image' : 'mixed'}
              forceAspectRatio={mediaAspectRatio}
              steps={[SelectImageStep]}
              onCancel={toggleScreenModal}
              onFinished={onFinished}
              maxVideoDuration={COVER_MAX_MEDIA_DURATION}
              additionalData={{
                hideTabs: true,
              }}
            />
          )}
        </ScreenModal>
      )}
    </>
  );
};

export default CoverEditorMediaReplace;
