import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import ImagePicker, { EditImageStep } from '#components/ImagePicker';
import ScreenModal from '#components/ScreenModal';
import useToggle from '#hooks/useToggle';
import {
  useCoverEditorActiveMedia,
  useCoverEditorContext,
} from '../../CoverEditorContext';
import ToolBoxSection from '../ui/ToolBoxSection';
import type { EditionParameters } from '#helpers/mediaEditions';

const CoverEditorCropTool = () => {
  const intl = useIntl();
  const [show, toggleScreenModal] = useToggle(false);
  const {
    coverEditorState: { template, selectedItemIndex },
    dispatch,
  } = useCoverEditorContext();

  const asset =
    selectedItemIndex != null
      ? template?.lottieInfo.assetsInfos[selectedItemIndex]
      : null;
  const activeMedia = useCoverEditorActiveMedia();

  const cropData = activeMedia?.editionParameters?.cropData;
  const mediaAspectRatio = cropData
    ? cropData.width / cropData.height
    : asset
      ? asset.width / asset.height
      : COVER_RATIO;

  const onOverlayCropSave = useCallback(
    (editionParam: EditionParameters) => {
      dispatch({
        type: 'UPDATE_MEDIA_EDITION_PARAMETERS',
        payload: editionParam,
      });
      toggleScreenModal();
    },
    [dispatch, toggleScreenModal],
  );

  return (
    <>
      <ToolBoxSection
        icon="crop"
        label={intl.formatMessage({
          defaultMessage: 'Crop',
          description: 'Cover Edition Crop Tool Button - Crop',
        })}
        onPress={toggleScreenModal}
      />
      {activeMedia != null && (
        <ScreenModal visible={show} animationType="slide">
          {show && (
            <ImagePicker
              initialData={activeMedia}
              additionalData={{
                selectedParameter: 'cropData',
                selectedTab: 'edit',
                showTabs: false,
                onEditionSave: onOverlayCropSave,
                onEditionCancel: toggleScreenModal,
              }}
              forceAspectRatio={mediaAspectRatio}
              steps={[EditImageStep]}
              onCancel={toggleScreenModal}
            />
          )}
        </ScreenModal>
      )}
    </>
  );
};

export default CoverEditorCropTool;
