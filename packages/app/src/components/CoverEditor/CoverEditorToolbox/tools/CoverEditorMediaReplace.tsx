import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import {
  extractLottieInfoMemoized,
  getLottieMediasDurations,
  getMaxAllowedVideosPerCover,
} from '#components/CoverEditor/coverEditorHelpers';
import CoverEditorMediaPicker from '#components/CoverEditor/CoverEditorMediaPicker';

import { ScreenModal } from '#components/NativeRouter';
import useToggle from '#hooks/useToggle';
import {
  useCoverEditorActiveMedia,
  useCoverEditorContext,
} from '../../CoverEditorContext';
import ToolBoxSection from '../ui/ToolBoxSection';
import type { Media } from '#helpers/mediaHelpers';

const CoverEditorMediaReplace = () => {
  const intl = useIntl();
  const [show, toggleScreenModal] = useToggle(false);
  const {
    coverEditorState: { lottie, editionMode, medias },
    dispatch,
  } = useCoverEditorContext();

  const durations = useMemo(() => {
    const lottieInfo = extractLottieInfoMemoized(lottie);
    if (!lottieInfo) return null;

    return getLottieMediasDurations(lottieInfo);
  }, [lottie]);

  const activeMedia = useCoverEditorActiveMedia();

  const onFinished = (medias: Media[]) => {
    const media = medias[0];
    dispatch({
      type: 'UPDATE_ACTIVE_MEDIA',
      payload: media,
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
            <CoverEditorMediaPicker
              initialMedias={null}
              durations={durations}
              maxSelectableVideos={
                editionMode === 'overlay' || disableVideoSelection ? 0 : 1
              }
              multiSelection={false}
              allowVideo={editionMode !== 'overlay'}
              durationsFixed={!!lottie}
              onFinished={onFinished}
              onClose={toggleScreenModal}
            />
          )}
        </ScreenModal>
      )}
    </>
  );
};

export default CoverEditorMediaReplace;
