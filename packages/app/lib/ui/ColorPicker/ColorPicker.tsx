import BottomSheetModal from '../BottomSheetModal';
import ColorChooser from './ColorChooser';
import type { ColorChooserProps } from './ColorChooser';

type ColorPickerProps = ColorChooserProps & {
  title: string;
  visible: boolean;
  height: number;
  onRequestClose: () => void;
};

const ColorPicker = ({
  title,
  visible,
  onRequestClose,
  height,
  ...props
}: ColorPickerProps) => (
  <BottomSheetModal
    visible={visible}
    onRequestClose={onRequestClose}
    title={title}
    height={height}
  >
    <ColorChooser {...props} />
  </BottomSheetModal>
);

export default ColorPicker;
