import { useCoverEditorContext } from '#components/CoverEditor/CoverEditorContext';
import ImagePicker, { SelectImageStep } from '#components/ImagePicker';
import ScreenModal from '#components/ScreenModal';
import type { ImagePickerResult } from '#components/ImagePicker';

type Props = {
  open: boolean;
  onClose: () => void;
};

const CoverEditorAddOverlay = ({ open, onClose }: Props) => {
  const { dispatch } = useCoverEditorContext();

  const onFinish = (param: ImagePickerResult) => {
    dispatch({
      type: 'ADD_OVERLAY_LAYER',
      payload: {
        uri: param.uri,
        width: param.width,
        height: param.height,
        kind: 'image',
      },
    });

    onClose();
  };

  return (
    <ScreenModal visible={open} animationType="slide">
      <ImagePicker
        kind="image"
        steps={[SelectImageStep]}
        onFinished={onFinish}
        onCancel={onClose}
      />
    </ScreenModal>
  );
};

export default CoverEditorAddOverlay;
