import { useIntl } from 'react-intl';
import { COVER_MAX_MEDIA_DURATION } from '@azzapp/shared/coverHelpers';
import ImagePicker, { EditImageStep } from '#components/ImagePicker';
import ScreenModal from '#components/ScreenModal';
import useToggle from '#hooks/useToggle';
import {
  useCoverEditorActiveMedia,
  useCoverEditorContext,
} from '../../CoverEditorContext';
import ToolBoxSection from '../ui/ToolBoxSection';
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

  const onFinished = (result: ImagePickerResult) => {
    dispatch({
      type: 'UPDATE_MEDIA_EDITION_PARAMETERS',
      payload: result.editionParameters,
    });
    toggleScreenModal();
  };

  return (
    <>
      <ToolBoxSection
        icon="settings"
        label={intl.formatMessage({
          defaultMessage: 'Adjust',
          description: 'Cover Edition Overlay Tool Button - Adjust',
        })}
        onPress={toggleScreenModal}
      />
      {activeMedia != null && (
        <ScreenModal visible={show} animationType="slide">
          <ImagePicker
            initialData={activeMedia}
            additionalData={{ selectedTab: 'edit', showTabs: false }}
            kind={editionMode === 'overlay' ? 'image' : 'mixed'}
            forceAspectRatio={mediaAspectRatio}
            steps={[EditImageStep]}
            onCancel={toggleScreenModal}
            onFinished={onFinished}
            maxVideoDuration={COVER_MAX_MEDIA_DURATION}
          />
        </ScreenModal>
      )}
    </>
  );
};

export default CoverEditorAdjustTool;
