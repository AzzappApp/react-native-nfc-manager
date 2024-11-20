import { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { maximumCoverFromScratch } from '#components/CoverEditor/CoverEditor';
import { getMaxAllowedVideosPerCover } from '#components/CoverEditor/coverEditorHelpers';
import { ScreenModal } from '#components/NativeRouter';
import useBoolean from '#hooks/useBoolean';
import IconButton from '#ui/IconButton';
import { useCoverEditorContext } from '../../CoverEditorContext';
import CoverEditorMediaPicker from '../../CoverEditorMediaPicker';
import type { SourceMedia } from '#helpers/mediaHelpers';

type Props = {
  durations: number[] | null;
  durationsFixed?: boolean;
};

const CoverEditorMediaPickerFloatingTool = ({
  durations,
  durationsFixed = false,
}: Props) => {
  const [imagePickerVisible, showImagePicker, hideImagePicker] = useBoolean();
  const { dispatch, coverEditorState: cover } = useCoverEditorContext();

  const onMediasPicked = useCallback(
    (medias: SourceMedia[]) => {
      dispatch({
        type: 'UPDATE_MEDIAS',
        payload: medias,
      });
      hideImagePicker();
    },
    [dispatch, hideImagePicker],
  );

  const initialMedia = useMemo(() => {
    if (cover.lottie) return cover.medias;
    else {
      return [
        ...cover.medias,
        ...new Array(maximumCoverFromScratch - cover.medias.length).fill(null),
      ];
    }
  }, [cover.lottie, cover.medias]);

  return (
    <>
      <IconButton
        icon="add"
        size={35}
        style={styles.iconContainer}
        iconStyle={styles.icon}
        onPress={showImagePicker}
      />
      <ScreenModal
        visible={imagePickerVisible}
        animationType="slide"
        onRequestDismiss={hideImagePicker}
      >
        {imagePickerVisible && (
          <CoverEditorMediaPicker
            initialMedias={initialMedia}
            onFinished={onMediasPicked}
            durations={durations}
            durationsFixed={durationsFixed}
            maxSelectableVideos={getMaxAllowedVideosPerCover(!!cover.lottie)}
            onClose={hideImagePicker}
          />
        )}
      </ScreenModal>
    </>
  );
};
const styles = StyleSheet.create({
  icon: {
    tintColor: 'white',
  },
  iconContainer: {
    position: 'absolute',
    right: 20,
    top: 15,
    padding: 0,
    backgroundColor: 'black',
    borderRadius: 10,
  },
});
export default CoverEditorMediaPickerFloatingTool;
