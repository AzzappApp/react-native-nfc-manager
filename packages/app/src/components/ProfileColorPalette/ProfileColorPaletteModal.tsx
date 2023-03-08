import { useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetModal from '#ui/BottomSheetModal';
import ProfileColorPalette from './ProfileColorPalette';
import type { ProfileColorPaletteProps } from './ProfileColorPalette';

type ProfileColorPaletteModalProps = ProfileColorPaletteProps & {
  title: string;
  visible: boolean;
  height: number;
  onRequestClose: () => void;
  validationButtonLabel: string;
};

const ProfileColorPaletteModal = ({
  title,
  visible,
  onChangeColor,
  onRequestClose,
  selectedColor,
  height,
  validationButtonLabel,
  ...props
}: ProfileColorPaletteModalProps) => {
  const colorRef = useRef(selectedColor);
  const [disableSave, setDisableSave] = useState(false);
  const onCancel = () => {
    onChangeColor(colorRef.current);
    onRequestClose();
  };

  const { bottom } = useSafeAreaInsets();

  return (
    <BottomSheetModal
      visible={visible}
      onValidate={onRequestClose}
      onCancel={onCancel}
      title={title}
      height={height}
      validationButtonLabel={validationButtonLabel}
      validationButtonDisabled={disableSave}
    >
      <ProfileColorPalette
        height={height}
        onChangeColor={onChangeColor}
        selectedColor={selectedColor}
        {...props}
        style={{ marginBottom: bottom }}
        setEditMode={setDisableSave}
      />
    </BottomSheetModal>
  );
};

export default ProfileColorPaletteModal;
