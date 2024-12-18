import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { Alert } from 'react-native';
import { COVER_MAX_MEDIA_DURATION } from '@azzapp/shared/coverHelpers';
import { getMediaWithLocalFile } from '#components/CoverEditor/coverEditorHelpers';
import ImagePicker, { EditImageStep } from '#components/ImagePicker';
import { ScreenModal } from '#components/NativeRouter';
import useToggle from '#hooks/useToggle';
import {
  useCoverEditorActiveMedia,
  useCoverEditorContext,
  useCoverEditorEditContext,
} from '../../CoverEditorContext';
import ToolBoxSection from '../ui/ToolBoxSection';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { EditionParameters } from '#helpers/mediaEditions';

const CoverEditorAdjustTool = () => {
  const intl = useIntl();
  const [show, toggleScreenModal] = useToggle(false);
  const { editionMode, medias, localFilenames } = useCoverEditorContext();
  const dispatch = useCoverEditorEditContext();

  const activeMedia = useCoverEditorActiveMedia();
  const cropData = activeMedia?.editionParameters?.cropData;
  const mediaAspectRatio = cropData
    ? cropData.width / cropData.height
    : activeMedia
      ? activeMedia.width / activeMedia.height
      : 1;

  const applyToActiveMedia = useCallback(
    (editionParam: EditionParameters) => {
      dispatch({
        type: 'UPDATE_MEDIA_EDITION_PARAMETERS',
        payload: editionParam,
      });
      toggleScreenModal();
    },
    [dispatch, toggleScreenModal],
  );

  const onFinished = useCallback(
    (result: ImagePickerResult) => {
      if (editionMode !== 'media' && editionMode !== 'mediaEdit') {
        applyToActiveMedia(result.editionParameters);
        return;
      }
      if (medias.length === 1) {
        applyToActiveMedia(result.editionParameters);
        return;
      }
      Alert.alert(
        intl.formatMessage({
          defaultMessage: 'Apply to all medias ?',
          description: 'Title of the alert to apply a adjust to all medias',
        }),
        intl.formatMessage({
          defaultMessage:
            'Do you want to apply thoses edition parameters to all medias ?',
          description:
            'Description of the alert to apply a adjust settings to all medias',
        }),
        [
          {
            text: intl.formatMessage({
              defaultMessage: 'No',
              description: 'Button to not apply the filter to all medias',
            }),
            onPress: () => {
              applyToActiveMedia(result.editionParameters);
            },
          },
          {
            text: intl.formatMessage({
              defaultMessage: 'Yes',
              description: 'Button to apply the filter to all medias',
            }),
            onPress: () => {
              dispatch({
                type: 'UPDATE_ALL_MEDIA_EDITION_PARAMETERS',
                payload: result.editionParameters,
              });
              toggleScreenModal();
            },
            isPreferred: true,
          },
        ],
      );
    },
    [
      applyToActiveMedia,
      dispatch,
      editionMode,
      intl,
      medias.length,
      toggleScreenModal,
    ],
  );

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
        <ScreenModal
          visible={show}
          animationType="slide"
          onRequestDismiss={toggleScreenModal}
        >
          {show && (
            <ImagePicker
              initialData={{
                media: getMediaWithLocalFile(activeMedia, localFilenames),
                editionParameters: activeMedia.editionParameters,
                filter: activeMedia.filter,
                timeRange:
                  activeMedia.kind === 'video'
                    ? activeMedia.timeRange
                    : undefined,
              }}
              additionalData={{ selectedTab: 'edit', showTabs: false }}
              kind={editionMode === 'overlay' ? 'image' : 'mixed'}
              forceAspectRatio={mediaAspectRatio}
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

export default CoverEditorAdjustTool;
