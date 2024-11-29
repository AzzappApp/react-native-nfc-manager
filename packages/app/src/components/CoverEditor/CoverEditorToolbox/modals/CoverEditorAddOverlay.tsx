import {
  useCoverEditorContext,
  useCoverEditorEditContext,
} from '#components/CoverEditor/CoverEditorContext';
import CoverEditorMediaPicker from '#components/CoverEditor/CoverEditorMediaPicker';
import { ScreenModal } from '#components/NativeRouter';
import type { SourceMedia } from '#helpers/mediaHelpers';

type Props = {
  open: boolean;
  onClose: () => void;
};

const CoverEditorAddOverlay = ({ open, onClose }: Props) => {
  const coverEditorState = useCoverEditorContext();
  const dispatch = useCoverEditorEditContext();

  const onFinish = (medias: SourceMedia[]) => {
    if (medias.length > 0) {
      const media = medias[0];
      if (media.kind === 'image') {
        dispatch({
          type: 'ADD_OVERLAY_LAYER',
          payload: media,
        });
      }
    }
    onClose();
  };

  return (
    <ScreenModal
      visible={open}
      animationType="slide"
      onRequestDismiss={onClose}
    >
      {open && (
        <CoverEditorMediaPicker
          initialMedias={null}
          multiSelection={false}
          durationsFixed={!!coverEditorState.lottie}
          maxSelectableVideos={0}
          allowVideo={false}
          onFinished={onFinish}
          onClose={onClose}
          durations={null}
        />
      )}
    </ScreenModal>
  );
};

export default CoverEditorAddOverlay;
