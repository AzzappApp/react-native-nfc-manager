import { useCallback } from 'react';
import { getMaxAllowedVideosPerCover } from '#components/CoverEditor/coverEditorHelpers';
import { ScreenModal } from '#components/NativeRouter';
import useToggle from '#hooks/useToggle';
import IconButton from '#ui/IconButton';
import { useCoverEditorContext } from '../../CoverEditorContext';
import CoverEditorMediaPicker from '../../CoverEditorMediaPicker';
import type { Media } from '#helpers/mediaHelpers';

type Props = {
  durations: number[] | null;
  durationsFixed?: boolean;
};

const CoverEditorMediaPickerFloatingTool = ({
  durations,
  durationsFixed = false,
}: Props) => {
  const [showImagePicker, toggleShowImage] = useToggle();
  const { dispatch, coverEditorState: cover } = useCoverEditorContext();

  const onMediasPicked = useCallback(
    (medias: Media[]) => {
      dispatch({
        type: 'UPDATE_MEDIAS',
        payload: medias,
      });
      toggleShowImage();
    },
    [dispatch, toggleShowImage],
  );

  return (
    <>
      <IconButton
        icon="add"
        size={35}
        style={{
          position: 'absolute',
          right: 20,
          top: 15,
          padding: 0,
          backgroundColor: 'black',
          borderRadius: 10,
        }}
        iconStyle={{
          tintColor: 'white',
        }}
        onPress={toggleShowImage}
      />
      <ScreenModal
        visible={showImagePicker}
        animationType="slide"
        onRequestDismiss={toggleShowImage}
      >
        {showImagePicker && (
          <CoverEditorMediaPicker
            initialMedias={cover.medias.map(({ media }) => media)}
            onFinished={onMediasPicked}
            durations={durations}
            durationsFixed={durationsFixed}
            maxSelectableVideos={getMaxAllowedVideosPerCover(!!cover.lottie)}
            onClose={toggleShowImage}
          />
        )}
      </ScreenModal>
    </>
  );
};

export default CoverEditorMediaPickerFloatingTool;
