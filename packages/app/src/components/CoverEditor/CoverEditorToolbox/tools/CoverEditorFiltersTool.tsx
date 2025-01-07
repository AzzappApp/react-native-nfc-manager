import { memo, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { Alert } from 'react-native';
import { COVER_MAX_MEDIA_DURATION } from '@azzapp/shared/coverHelpers';

import { getMediaWithLocalFile } from '#components/CoverEditor/coverEditorHelpers';
import ImagePicker, { EditImageStep } from '#components/ImagePicker';
import { ScreenModal } from '#components/NativeRouter';
import useToggle from '#hooks/useToggle';
import ToolBoxSection from '../../../Toolbar/ToolBoxSection';
import {
  useCoverEditorContext,
  useCoverEditorActiveMedia,
  useCoverEditorEditContext,
} from '../../CoverEditorContext';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { Filter } from '@azzapp/shared/filtersHelper';

const CoverEditorFiltersTool = () => {
  const [show, toggleScreenModal] = useToggle(false);
  const mediaInfo = useCoverEditorActiveMedia();
  const { editionMode, medias, localFilenames } = useCoverEditorContext();
  const dispatch = useCoverEditorEditContext();
  const activeMedia = useCoverEditorActiveMedia();
  const cropData = activeMedia?.editionParameters?.cropData;
  const mediaAspectRatio = cropData
    ? cropData.width / cropData.height
    : activeMedia
      ? activeMedia.width / activeMedia.height
      : 1;

  const intl = useIntl();

  const applyToAllMedias = useCallback(
    (filter: Filter | null) => {
      dispatch({
        type: 'UPDATE_ALL_MEDIA_FILTER',
        payload: filter,
      });
      toggleScreenModal();
    },
    [dispatch, toggleScreenModal],
  );

  const applyToActiveMedia = useCallback(
    (filter: Filter | null) => {
      dispatch({
        type: 'UPDATE_MEDIA_FILTER',
        payload: filter,
      });
      toggleScreenModal();
    },
    [dispatch, toggleScreenModal],
  );

  const onFinished = useCallback(
    ({ filter }: ImagePickerResult) => {
      if (editionMode !== 'media' && editionMode !== 'mediaEdit') {
        applyToActiveMedia(filter);
        return;
      }
      if (medias.length === 1) {
        applyToActiveMedia(filter);
        return;
      }
      Alert.alert(
        intl.formatMessage({
          defaultMessage: 'Apply to all medias ?',
          description: 'Title of the alert to apply a filter to all medias',
        }),
        intl.formatMessage({
          defaultMessage: 'Do you want to apply this filter to all medias ?',
          description:
            'Description of the alert to apply a filter to all medias',
        }),
        [
          {
            text: intl.formatMessage({
              defaultMessage: 'No',
              description: 'Button to not apply the filter to all medias',
            }),
            onPress: () => {
              applyToActiveMedia(filter);
            },
          },
          {
            text: intl.formatMessage({
              defaultMessage: 'Yes',
              description: 'Button to apply the filter to all medias',
            }),
            onPress: () => {
              applyToAllMedias(filter);
            },
            isPreferred: true,
          },
        ],
      );
    },
    [applyToActiveMedia, applyToAllMedias, editionMode, intl, medias.length],
  );

  return (
    <>
      <ToolBoxSection
        icon="filters"
        label={intl.formatMessage({
          defaultMessage: 'Effects',
          description: 'Cover Edition Overlay Tool Button- Effect',
        })}
        onPress={toggleScreenModal}
      />
      {mediaInfo != null && (
        <ScreenModal
          visible={show}
          animationType="slide"
          onRequestDismiss={toggleScreenModal}
        >
          {show && (
            <ImagePicker
              initialData={
                activeMedia
                  ? {
                      editionParameters: activeMedia.editionParameters,
                      filter: activeMedia.filter,
                      media: getMediaWithLocalFile(activeMedia, localFilenames),
                      timeRange:
                        activeMedia.kind === 'video'
                          ? activeMedia.timeRange
                          : undefined,
                    }
                  : null
              }
              additionalData={{ selectedTab: 'filter', showTabs: false }}
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

export default memo(CoverEditorFiltersTool);
