import { useIntl } from 'react-intl';
import {
  MAX_ALLOWED_VIDEOS_BY_COVER,
  useLottieMediaDurations,
} from '#components/CoverEditor/coverEditorHelpers';
import CoverEditorMediaPicker from '#components/CoverEditor/CoverEditorMediaPicker';
import { ScreenModal } from '#components/NativeRouter';
import useToggle from '#hooks/useToggle';
import ToolBoxSection from '../../../Toolbar/ToolBoxSection';
import {
  useCoverEditorActiveMedia,
  useCoverEditorContext,
  useCoverEditorEditContext,
} from '../../CoverEditorContext';
import type { SourceMedia } from '#helpers/mediaHelpers';

const CoverEditorMediaReplace = () => {
  const intl = useIntl();
  const [show, toggleScreenModal] = useToggle(false);

  const { lottie, editionMode, medias } = useCoverEditorContext();
  const dispatch = useCoverEditorEditContext();

  const durations = useLottieMediaDurations(lottie);
  const activeMedia = useCoverEditorActiveMedia();

  const onFinished = (medias: SourceMedia[]) => {
    const media = medias[0];
    dispatch({
      type: 'UPDATE_ACTIVE_MEDIA',
      payload: media,
    });
    toggleScreenModal();
  };

  const disableVideoSelection =
    activeMedia?.kind === 'video'
      ? false
      : !(
          MAX_ALLOWED_VIDEOS_BY_COVER >
          medias.filter(media => media.kind === 'video').length
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
              initialMedias={[activeMedia]}
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
