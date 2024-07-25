import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import {
  COVER_MAX_MEDIA_DURATION,
  COVER_MIN_MEDIA_DURATION,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import {
  extractLottieInfoMemoized,
  getLottieMediasDurations,
  getMaxAllowedVideosPerCover,
} from '#components/CoverEditor/coverEditorHelpers';
import ImagePicker, { SelectImageStep } from '#components/ImagePicker';
import { ScreenModal } from '#components/NativeRouter';
import useToggle from '#hooks/useToggle';
import {
  useCoverEditorActiveMedia,
  useCoverEditorContext,
  useCoverEditorOverlayLayer,
} from '../../CoverEditorContext';
import ToolBoxSection from '../ui/ToolBoxSection';
import type { MediaAnimations } from '#components/CoverEditor/coverDrawer/mediaAnimations';
import type { MediaInfo } from '#components/CoverEditor/coverEditorTypes';
import type { ImagePickerResult } from '#components/ImagePicker';

const CoverEditorMediaReplace = () => {
  const intl = useIntl();
  const [show, toggleScreenModal] = useToggle(false);
  const {
    coverEditorState: { lottie, selectedItemIndex, editionMode, medias },
    dispatch,
  } = useCoverEditorContext();

  const durations = useMemo(() => {
    const lottieInfo = extractLottieInfoMemoized(lottie);
    if (!lottieInfo) return null;

    return getLottieMediasDurations(lottieInfo);
  }, [lottie]);

  const asset =
    selectedItemIndex != null && editionMode === 'mediaEdit'
      ? extractLottieInfoMemoized(lottie)?.assetsInfos[selectedItemIndex]
      : null;

  const duration =
    durations && selectedItemIndex !== null
      ? durations[selectedItemIndex]
      : null;

  const activeMedia = useCoverEditorActiveMedia();

  const cropData = activeMedia?.editionParameters?.cropData;
  const mediaAspectRatio = cropData
    ? cropData.width / cropData.height
    : asset
      ? asset.width / asset.height
      : COVER_RATIO;

  const overlay = useCoverEditorOverlayLayer();

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
      const animation = (overlay ? overlay.animation : null) as MediaAnimations;

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
        animation,
      };
    }
    dispatch({
      type: 'UPDATE_ACTIVE_MEDIA',
      payload: mediaInfo,
    });

    toggleScreenModal();
  };

  const disableVideoSelection =
    activeMedia?.media.kind === 'video'
      ? false
      : !(
          getMaxAllowedVideosPerCover(!!lottie) >
          medias.filter(m => m.media.kind === 'video').length
        );

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
              kind={
                editionMode === 'overlay' || disableVideoSelection
                  ? 'image'
                  : 'mixed'
              }
              forceAspectRatio={mediaAspectRatio}
              steps={[SelectImageStep]}
              onCancel={toggleScreenModal}
              onFinished={onFinished}
              maxVideoDuration={duration ?? COVER_MAX_MEDIA_DURATION}
              minVideoDuration={duration ?? COVER_MIN_MEDIA_DURATION}
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
