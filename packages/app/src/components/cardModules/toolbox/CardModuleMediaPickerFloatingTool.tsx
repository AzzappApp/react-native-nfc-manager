import { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { ScreenModal } from '#components/NativeRouter';
import useToggle from '#hooks/useToggle';
import IconButton from '#ui/IconButton';
import CardModuleMediaPicker from '../tool/CardModuleMediaPicker';
import type { CardModuleMedia } from '../cardModuleEditorType';

type CardModuleMediaPickerFloatingToolProps = {
  cardModuleMedias: CardModuleMedia[];
  maxMedia: number;
  maxVideo: number;
  onUpdateMedia: (medias: CardModuleMedia[]) => void;
};

const CardModuleMediaPickerFloatingTool = ({
  cardModuleMedias,
  maxMedia,
  maxVideo,
  onUpdateMedia,
}: CardModuleMediaPickerFloatingToolProps) => {
  const [showImagePicker, toggleShowImage] = useToggle();

  const onMediasPicked = useCallback(
    (cardModuleMedia: CardModuleMedia[]) => {
      onUpdateMedia(cardModuleMedia);
      toggleShowImage();
    },
    [onUpdateMedia, toggleShowImage],
  );

  return (
    <>
      <IconButton
        icon="add"
        size={35}
        style={styles.iconButton}
        iconStyle={styles.iconTint}
        onPress={toggleShowImage}
      />
      <ScreenModal
        visible={showImagePicker}
        animationType="slide"
        onRequestDismiss={toggleShowImage}
      >
        {showImagePicker && (
          <CardModuleMediaPicker
            initialMedias={cardModuleMedias}
            onFinished={onMediasPicked}
            onClose={toggleShowImage}
            maxMedia={maxMedia}
            maxVideo={maxVideo}
          />
        )}
      </ScreenModal>
    </>
  );
};

export default CardModuleMediaPickerFloatingTool;

const styles = StyleSheet.create({
  iconTint: {
    tintColor: 'white',
  },
  iconButton: {
    position: 'absolute',
    right: 20,
    top: 15,
    padding: 0,
    backgroundColor: 'black',
    borderRadius: 10,
  },
});
