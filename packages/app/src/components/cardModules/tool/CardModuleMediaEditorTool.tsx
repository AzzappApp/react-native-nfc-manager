import { memo, useCallback } from 'react';
import { useIntl } from 'react-intl';
import ImagePicker, { EditImageStep } from '#components/ImagePicker';
import { ScreenModal } from '#components/NativeRouter';
import ToolBoxSection from '#components/Toolbar/ToolBoxSection';
import useBoolean from '#hooks/useBoolean';
import {
  CARD_MEDIA_VIDEO_DEFAULT_DURATION,
  type CardModuleMedia,
} from '../cardModuleEditorType';
import type { ImagePickerResult } from '#components/ImagePicker';

type CardModuleMediaEditorToolProps = {
  cardModuleMedia: CardModuleMedia;
  onFinish: (media: CardModuleMedia) => void;
};
const CardModuleMediaEditorTool = ({
  cardModuleMedia,
  onFinish,
}: CardModuleMediaEditorToolProps) => {
  const [modalShown, showModal, hideModal] = useBoolean(false);
  const { media } = cardModuleMedia;
  const cropData = media?.editionParameters?.cropData;
  const mediaAspectRatio = cropData
    ? cropData.width / cropData.height
    : media
      ? media.width / media.height
      : 1;

  const intl = useIntl();

  const onFinished = useCallback(
    ({ filter, editionParameters, timeRange, duration }: ImagePickerResult) => {
      //update the media through props drilling

      const updatedMedia =
        media.kind === 'video'
          ? {
              ...media,
              filter,
              editionParameters,
              timeRange: timeRange ?? media.timeRange,
              duration: duration ?? media.duration,
            }
          : {
              ...media,
              filter,
              editionParameters,
            };

      onFinish({
        ...cardModuleMedia,
        media: updatedMedia,
      });
      hideModal();
    },
    [onFinish, cardModuleMedia, media, hideModal],
  );

  return (
    <>
      <ToolBoxSection
        icon="filters"
        label={intl.formatMessage({
          defaultMessage: 'Effects',
          description: 'Cover Edition Overlay Tool Button- Effect',
        })}
        onPress={showModal}
      />
      {media != null && (
        <ScreenModal
          visible={modalShown}
          animationType="slide"
          onRequestDismiss={hideModal}
        >
          {modalShown && (
            <ImagePicker
              initialData={
                media
                  ? {
                      editionParameters: media.editionParameters,
                      filter: media.filter,
                      media,
                      timeRange:
                        media.kind === 'video' ? media.timeRange : undefined,
                    }
                  : null
              }
              //disabling cropper, if is a bad tool, and the cropData are still no good when displaying landspae image in portrait ratio.... works only if displaying an image in a container with same ratio.
              additionalData={{ excludedParams: ['cropData'] }}
              forceAspectRatio={mediaAspectRatio}
              steps={[EditImageStep]}
              onCancel={hideModal}
              onFinished={onFinished}
              maxVideoDuration={CARD_MEDIA_VIDEO_DEFAULT_DURATION}
            />
          )}
        </ScreenModal>
      )}
    </>
  );
};

export default memo(CardModuleMediaEditorTool);
