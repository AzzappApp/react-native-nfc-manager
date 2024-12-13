import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import {
  extractLottieInfoMemoized,
  getMediaWithLocalFile,
} from '#components/CoverEditor/coverEditorHelpers';
import ImagePicker, { EditImageStep } from '#components/ImagePicker';
import { ScreenModal } from '#components/NativeRouter';
import useToggle from '#hooks/useToggle';
import ToolBoxSection from '../../../Toolbar/ToolBoxSection';
import {
  useCoverEditorActiveMedia,
  useCoverEditorContext,
  useCoverEditorEditContext,
} from '../../CoverEditorContext';
import type { EditionParameters } from '#helpers/mediaEditions';

const CoverEditorCropTool = () => {
  const intl = useIntl();
  const [show, toggleScreenModal] = useToggle(false);

  const { lottie, selectedItemIndex, localFilenames } = useCoverEditorContext();
  const dispatch = useCoverEditorEditContext();

  const asset =
    selectedItemIndex != null
      ? extractLottieInfoMemoized(lottie)?.assetsInfos[selectedItemIndex]
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
        <ScreenModal
          visible={show}
          animationType="slide"
          onRequestDismiss={toggleScreenModal}
        >
          {show && (
            <ImagePicker
              initialData={{
                editionParameters: activeMedia.editionParameters,
                filter: activeMedia.filter,
                media: getMediaWithLocalFile(activeMedia, localFilenames),
                timeRange:
                  activeMedia.kind === 'video'
                    ? activeMedia.timeRange
                    : undefined,
              }}
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
