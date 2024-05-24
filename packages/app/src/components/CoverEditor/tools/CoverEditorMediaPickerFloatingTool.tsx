import { useCallback } from 'react';
import ScreenModal from '#components/ScreenModal';
import useToggle from '#hooks/useToggle';
import IconButton from '#ui/IconButton';
import CoverEditorMediaPicker from '../../CoverEditor/CoverEditorMediaPicker';
import { CoverEditorActionType } from '../coverEditorActions';
import { useCoverEditorContext } from '../CoverEditorContext';
import type { Media } from '#components/ImagePicker/imagePickerTypes';

type Props = {
  count: number;
};

const CoverEditorMediaPickerFloatingTool = ({ count }: Props) => {
  const [showImagePicker, toggleShowImage] = useToggle();
  const { dispatch } = useCoverEditorContext();

  const onMediasPicked = useCallback(
    (medias: Media[]) => {
      dispatch({
        type: CoverEditorActionType.UpdateMedias,
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
      <ScreenModal visible={showImagePicker} animationType="slide">
        <CoverEditorMediaPicker
          kind={'mixed'}
          onFinished={onMediasPicked}
          onCancel={toggleShowImage}
          maxMediaCount={count}
        />
      </ScreenModal>
    </>
  );
};

export default CoverEditorMediaPickerFloatingTool;
